import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { roundDecimal } from '../services/calculation.service';
import { numberToIndianWords } from '../utils/numberToWords';

export interface CustomerReceiptVoucherRow {
  receipt_id: number;
  receipt_number: string;
  invoice_id: number;
  project_customer_id: number;
  receipt_date: string;
  payment_mode: 'cheque' | 'neft_rtgs' | 'upi' | 'demand_draft';
  instrument_reference: string;
  bank_name: string;
  amount_towards_av: number;
  amount_towards_gst: number;
  total_amount_received: number;
  amount_in_words: string;
  clearance_status: 'pending_clearance' | 'realised' | 'bounced';
  realisation_date: string | null;
  authorised_signatory_id: number | null;
  authorised_signatory_name?: string | null;
  remarks: string | null;
  created_at: string;
  customer_name?: string;
  unit_number?: string;
  invoice_number?: string;
}

export class CustomerReceiptVoucherRepository {
  private async getNextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP/${year}/`;
    const [rows]: any = await dbPool.query(
      `SELECT receipt_number FROM customer_receipt_vouchers WHERE receipt_number LIKE ? ORDER BY receipt_id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return `${prefix}001`;
    const lastNumStr = rows[0].receipt_number.replace(prefix, '');
    const nextNum = parseInt(lastNumStr, 10) + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  }

  async getById(receiptId: number): Promise<CustomerReceiptVoucherRow | null> {
    const sql = `
      SELECT 
        crv.*,
        pc.unit_number,
        c.customer_name,
        inv.invoice_number,
        e.name AS authorised_signatory_name
      FROM customer_receipt_vouchers crv
      JOIN project_customers pc ON crv.project_customer_id = pc.id
      JOIN customers c ON pc.customer_id = c.customer_id
      JOIN invoices inv ON crv.invoice_id = inv.invoice_id
      LEFT JOIN employees e ON crv.authorised_signatory_id = e.employee_id
      WHERE crv.receipt_id = ?
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [receiptId]);
    if (rows.length === 0) return null;
    return rows[0] as CustomerReceiptVoucherRow;
  }

  async getByInvoiceId(invoiceId: number): Promise<CustomerReceiptVoucherRow[]> {
    const sql = `
      SELECT crv.*, e.name AS authorised_signatory_name
      FROM customer_receipt_vouchers crv
      LEFT JOIN employees e ON crv.authorised_signatory_id = e.employee_id
      WHERE crv.invoice_id = ?
      ORDER BY crv.receipt_date DESC, crv.receipt_id DESC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [invoiceId]);
    return rows as CustomerReceiptVoucherRow[];
  }

  async getByProjectCustomerId(projectCustomerId: number): Promise<CustomerReceiptVoucherRow[]> {
    const sql = `
      SELECT 
        crv.*,
        inv.invoice_number,
        e.name AS authorised_signatory_name
      FROM customer_receipt_vouchers crv
      JOIN invoices inv ON crv.invoice_id = inv.invoice_id
      LEFT JOIN employees e ON crv.authorised_signatory_id = e.employee_id
      WHERE crv.project_customer_id = ?
      ORDER BY crv.receipt_date DESC, crv.receipt_id DESC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [projectCustomerId]);
    return rows as CustomerReceiptVoucherRow[];
  }

  async create(data: {
    invoice_id: number;
    project_customer_id: number;
    receipt_date: string;
    payment_mode: 'cheque' | 'neft_rtgs' | 'upi' | 'demand_draft';
    instrument_reference: string;
    bank_name: string;
    amount_towards_av: number;
    amount_towards_gst: number;
    authorised_signatory_id?: number | null;
    remarks?: string | null;
    clearance_status?: 'pending_clearance' | 'realised' | 'bounced';
  }): Promise<CustomerReceiptVoucherRow> {
    const av = Number(data.amount_towards_av || 0);
    const gst = Number(data.amount_towards_gst || 0);
    const total = roundDecimal(av + gst);
    const words = numberToIndianWords(total);
    const receiptNumber = await this.getNextReceiptNumber();
    const clearanceStatus = data.clearance_status || 'realised';
    const realisationDate = clearanceStatus === 'realised' ? data.receipt_date : null;

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [res] = await connection.query<ResultSetHeader>(
        `
        INSERT INTO customer_receipt_vouchers (
          receipt_number, invoice_id, project_customer_id, receipt_date,
          payment_mode, instrument_reference, bank_name, amount_towards_av,
          amount_towards_gst, total_amount_received, amount_in_words,
          clearance_status, realisation_date, authorised_signatory_id, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          receiptNumber,
          data.invoice_id,
          data.project_customer_id,
          data.receipt_date,
          data.payment_mode,
          data.instrument_reference,
          data.bank_name,
          av,
          gst,
          total,
          words,
          clearanceStatus,
          realisationDate,
          data.authorised_signatory_id || null,
          data.remarks || null
        ]
      );

      const receiptId = res.insertId;

      // Also record in generic invoice_payments for backward compatibility
      await connection.query(
        `
        INSERT INTO invoice_payments (
          invoice_id, payment_date, amount, payment_method, reference_number, status
        ) VALUES (?, ?, ?, ?, ?, 'completed')
      `,
        [data.invoice_id, data.receipt_date, total, data.payment_mode, data.instrument_reference]
      );

      // Check if invoice is fully paid
      const [invRows]: any = await connection.query(
        `SELECT total_amount FROM invoices WHERE invoice_id = ?`,
        [data.invoice_id]
      );
      if (invRows.length > 0) {
        const invTotal = Number(invRows[0].total_amount);
        const [sumRows]: any = await connection.query(
          `SELECT COALESCE(SUM(total_amount_received), 0) AS total_rec FROM customer_receipt_vouchers WHERE invoice_id = ? AND clearance_status = 'realised'`,
          [data.invoice_id]
        );
        const totalRealised = Number(sumRows[0].total_rec);
        const newStatus = totalRealised >= invTotal ? 'paid' : (totalRealised > 0 ? 'partially_paid' : 'sent');
        await connection.query(`UPDATE invoices SET status = ? WHERE invoice_id = ?`, [newStatus, data.invoice_id]);
      }

      await connection.commit();
      return (await this.getById(receiptId))!;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getCustomerStatementOfAccount(projectCustomerId: number) {
    const [pcRows]: any = await dbPool.query(
      `SELECT pc.*, p.project_name, p.project_code, c.customer_name, c.email, c.contact_number
       FROM project_customers pc
       JOIN projects p ON pc.project_id = p.project_id
       JOIN customers c ON pc.customer_id = c.customer_id
       WHERE pc.id = ?`,
      [projectCustomerId]
    );
    if (pcRows.length === 0) throw new Error('Customer project allotment not found');
    const pc = pcRows[0];

    // Invoices issued
    const [invoices]: any = await dbPool.query(
      `SELECT invoice_id, invoice_number, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status
       FROM invoices
       WHERE project_id = ? AND customer_id = ?
       ORDER BY invoice_date ASC`,
      [pc.project_id, pc.customer_id]
    );

    // Receipts realised
    const [receipts]: any = await dbPool.query(
      `SELECT receipt_id, receipt_number, receipt_date, payment_mode, instrument_reference, bank_name,
              amount_towards_av, amount_towards_gst, total_amount_received, clearance_status
       FROM customer_receipt_vouchers
       WHERE project_customer_id = ?
       ORDER BY receipt_date ASC`,
      [projectCustomerId]
    );

    // TDS credits
    const [tdsCredits]: any = await dbPool.query(
      `SELECT * FROM customer_tds_credits WHERE project_customer_id = ? ORDER BY created_at ASC`,
      [projectCustomerId]
    );

    const totalAgreementValue = Number(pc.agreement_value || 0);
    const totalBilled = invoices.reduce((acc: number, inv: any) => acc + Number(inv.total_amount || 0), 0);
    const totalCollectedAV = receipts
      .filter((r: any) => r.clearance_status === 'realised')
      .reduce((acc: number, r: any) => acc + Number(r.amount_towards_av || 0), 0);
    const totalCollectedGST = receipts
      .filter((r: any) => r.clearance_status === 'realised')
      .reduce((acc: number, r: any) => acc + Number(r.amount_towards_gst || 0), 0);
    const totalTdsCredits = tdsCredits
      .filter((t: any) => t.status !== 'rejected')
      .reduce((acc: number, t: any) => acc + Number(t.tds_amount || 0), 0);

    const grandTotalCollected = totalCollectedAV + totalCollectedGST + totalTdsCredits;
    const balanceReceivable = roundDecimal(totalBilled - grandTotalCollected);
    const percentagePaid = totalBilled > 0 ? roundDecimal((grandTotalCollected / totalBilled) * 100) : 0;

    return {
      customer: {
        id: pc.id,
        customer_name: pc.customer_name,
        email: pc.email,
        contact_number: pc.contact_number,
        project_name: pc.project_name,
        project_code: pc.project_code,
        unit_number: pc.unit_number,
        allocated_area_sqft: Number(pc.allocated_area_sqft),
        ownership_percentage: Number(pc.ownership_percentage),
        agreement_value: totalAgreementValue
      },
      summary: {
        total_agreement_value: totalAgreementValue,
        total_billed: roundDecimal(totalBilled),
        total_towards_av_received: roundDecimal(totalCollectedAV),
        total_towards_gst_received: roundDecimal(totalCollectedGST),
        total_tds_credit_received: roundDecimal(totalTdsCredits),
        grand_total_received: roundDecimal(grandTotalCollected),
        balance_outstanding: balanceReceivable,
        paid_percentage: percentagePaid
      },
      invoices,
      receipts,
      tds_credits: tdsCredits
    };
  }
}
