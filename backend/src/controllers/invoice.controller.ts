import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export class InvoiceController {
  private svc = new InvoiceService();

  // ── Billing Schedules ──────────────────────────────────────────────────
  getSchedules = async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.query.project_id);
      if (!projectId) return sendError(res, 'project_id is required', [], 400);
      const data = await this.svc.getSchedulesByProject(projectId);
      return sendSuccess(res, 'Billing schedules retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  generateSchedules = async (req: Request, res: Response) => {
    try {
      const { project_id, quotation_id, start_month, contract_period_months, total_amount } = req.body;
      if (!project_id || !quotation_id || !start_month || !contract_period_months || !total_amount) {
        return sendError(res, 'Missing required fields for generating billing schedules', [], 400);
      }
      const data = await this.svc.generateBillingSchedules(req.body);
      return sendSuccess(res, 'Billing schedules generated successfully', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Monthly Completed Work ───────────────────────────────────────────────
  getCompletedWork = async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.query.project_id);
      if (!projectId) return sendError(res, 'project_id is required', [], 400);
      const data = await this.svc.getCompletedWorkByProject(projectId);
      return sendSuccess(res, 'Completed work retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  submitCompletedWork = async (req: Request, res: Response) => {
    try {
      const { schedule_id, project_id, completion_percentage, approved_amount } = req.body;
      if (!schedule_id || !project_id || approved_amount === undefined) {
        return sendError(res, 'Missing required fields', [], 400);
      }
      const id = await this.svc.submitCompletedWork(req.body);
      return sendSuccess(res, 'Completed work submitted successfully', { completed_work_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Invoices ─────────────────────────────────────────────────────────────
  getInvoices = async (req: Request, res: Response) => {
    try {
      const projectId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const data = await this.svc.getInvoices(projectId);
      return sendSuccess(res, 'Invoices retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getInvoiceDetail = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getInvoiceById(id);
      if (!data) return sendError(res, 'Invoice not found', [], 404);
      return sendSuccess(res, 'Invoice retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  generateInvoice = async (req: Request, res: Response) => {
    try {
      const { customer_id, project_id, quotation_id, schedule_id, currency_id, items } = req.body;
      if (!customer_id || !project_id || !quotation_id || !schedule_id || !currency_id || !items || !Array.isArray(items)) {
        return sendError(res, 'Missing required fields to generate invoice or items is invalid', [], 400);
      }
      // Assuming req.user is set by auth middleware
      const userId = (req as any).user?.employee_id || 1;
      const data = await this.svc.generateInvoice({ ...req.body, created_by: userId });
      return sendSuccess(res, 'Invoice generated successfully', { invoice_id: data }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  approveInvoice = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.approveInvoice(id, userId);
      return sendSuccess(res, 'Invoice approved successfully');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Invoice Payments ───────────────────────────────────────────────────────
  getPayments = async (req: Request, res: Response) => {
    try {
      const invoiceId = Number(req.params.id);
      const data = await this.svc.getPaymentsByInvoice(invoiceId);
      return sendSuccess(res, 'Invoice payments retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  addPayment = async (req: Request, res: Response) => {
    try {
      const invoiceId = Number(req.params.id);
      const { payment_date, amount, payment_method, reference_number } = req.body;
      if (!payment_date || amount === undefined) {
        return sendError(res, 'Missing required fields (payment_date, amount)', [], 400);
      }
      const data = await this.svc.addPayment({
        invoice_id: invoiceId,
        payment_date,
        amount,
        payment_method,
        reference_number
      });
      return sendSuccess(res, 'Payment added successfully', { payment_id: data }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  downloadInvoicePDF = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const invoice = await this.svc.getInvoiceById(id);
      if (!invoice) return sendError(res, 'Invoice not found', [], 404);
      
      // Will pipe PDF directly to res
      generateInvoicePDF(invoice, res);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };
}
