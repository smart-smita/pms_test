import { Request, Response } from 'express';
import { CustomerPaymentScheduleRepository } from '../repositories/customerPaymentSchedule.repository';
import { CustomerReceiptVoucherRepository } from '../repositories/customerReceiptVoucher.repository';
import { ProjectCustomerRepository } from '../repositories/projectCustomer.repository';
import { dbPool } from '../config/db';

const schedRepo = new CustomerPaymentScheduleRepository();
const receiptRepo = new CustomerReceiptVoucherRepository();
const pcRepo = new ProjectCustomerRepository();

export class CustomerBillingController {
  // ── Payment Schedules ──────────────────────────────────────────────────
  async getSchedulesByProjectCustomer(req: Request, res: Response) {
    try {
      const pcId = parseInt(req.params.projectCustomerId, 10);
      const schedules = await schedRepo.getByProjectCustomerId(pcId);
      res.json({ success: true, data: schedules });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSchedulesByProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const schedules = await schedRepo.getByProjectId(projectId);
      res.json({ success: true, data: schedules });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async generateDefaultMilestones(req: Request, res: Response) {
    try {
      const pcId = parseInt(req.params.projectCustomerId, 10);
      const pc = await pcRepo.getById(pcId);
      if (!pc) return res.status(404).json({ success: false, message: 'Project customer allotment not found' });

      const av = Number(pc.agreement_value || 0);
      if (av <= 0) {
        return res.status(400).json({ success: false, message: 'Agreement value must be greater than 0 before generating milestones' });
      }

      await schedRepo.generateDefaultMilestones(pcId, av);
      const generated = await schedRepo.getByProjectCustomerId(pcId);
      res.status(201).json({ success: true, data: generated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── Receipt Vouchers ───────────────────────────────────────────────────
  async getReceiptsByInvoice(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params.invoiceId, 10);
      const receipts = await receiptRepo.getByInvoiceId(invoiceId);
      res.json({ success: true, data: receipts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getReceiptById(req: Request, res: Response) {
    try {
      const receiptId = parseInt(req.params.id, 10);
      const receipt = await receiptRepo.getById(receiptId);
      if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
      res.json({ success: true, data: receipt });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createReceiptVoucher(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params.invoiceId, 10);
      const {
        project_customer_id, receipt_date, payment_mode,
        instrument_reference, bank_name, amount_towards_av,
        amount_towards_gst, remarks, clearance_status
      } = req.body;

      if (!project_customer_id || !receipt_date || !payment_mode || !instrument_reference || !bank_name) {
        return res.status(400).json({
          success: false,
          message: 'project_customer_id, receipt_date, payment_mode, instrument_reference, bank_name are required'
        });
      }

      const userId = (req as any).user?.employee_id || null;

      const created = await receiptRepo.create({
        invoice_id: invoiceId,
        project_customer_id: Number(project_customer_id),
        receipt_date,
        payment_mode,
        instrument_reference,
        bank_name,
        amount_towards_av: Number(amount_towards_av || 0),
        amount_towards_gst: Number(amount_towards_gst || 0),
        authorised_signatory_id: userId,
        remarks,
        clearance_status
      });

      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── Statement of Account ───────────────────────────────────────────────
  async getStatementOfAccount(req: Request, res: Response) {
    try {
      const pcId = parseInt(req.params.projectCustomerId, 10);
      const statement = await receiptRepo.getCustomerStatementOfAccount(pcId);
      res.json({ success: true, data: statement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── TDS 194-IA Credit Recording ────────────────────────────────────────
  async addTdsCredit(req: Request, res: Response) {
    try {
      const { invoice_id, project_customer_id, tds_amount, challan_bsr_code, challan_date, form_16b_ack_no } = req.body;
      if (!invoice_id || !project_customer_id || !tds_amount) {
        return res.status(400).json({ success: false, message: 'invoice_id, project_customer_id, tds_amount are required' });
      }

      const [resHeader]: any = await dbPool.query(
        `INSERT INTO customer_tds_credits (
           invoice_id, project_customer_id, tds_amount, challan_bsr_code, challan_date, form_16b_ack_no, status
         ) VALUES (?, ?, ?, ?, ?, ?, 'claimed_by_customer')`,
        [invoice_id, project_customer_id, Number(tds_amount), challan_bsr_code || null, challan_date || null, form_16b_ack_no || null]
      );

      res.status(201).json({ success: true, id: resHeader.insertId, message: 'TDS credit logged successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
