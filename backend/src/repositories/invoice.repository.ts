import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface BillingScheduleRow {
  schedule_id: number;
  project_id: number;
  quotation_id: number;
  billing_month: string; // YYYY-MM-DD
  expected_amount: number;
  status: 'pending' | 'completed_work_logged' | 'invoiced' | 'paid';
  created_at?: string;
}

export interface MonthlyCompletedWorkRow {
  completed_work_id: number;
  schedule_id: number;
  project_id: number;
  completion_percentage: number;
  approved_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by: number | null;
  created_at?: string;
}

export interface InvoiceRow {
  invoice_id: number;
  invoice_number: string;
  customer_id: number;
  project_id: number;
  quotation_id: number;
  schedule_id: number;
  survey_id?: number | null;
  currency_id: number;
  tax_id: number | null;
  invoice_date: string;
  due_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_paid' | 'paid' | 'cancelled';
  created_by: number | null;
  approved_by: number | null;
  created_at?: string;
  items?: InvoiceItemRow[];
}

export interface InvoiceItemRow {
  item_id?: number;
  invoice_id?: number;
  discipline_id?: number | null;
  discipline_name?: string;
  description: string;
  amount: number;
  is_extra_work: boolean | number;
}

export interface InvoicePaymentRow {
  payment_id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export class InvoiceRepository {
  // ── Billing Schedules ──────────────────────────────────────────────────
  async getSchedulesByProject(projectId: number): Promise<BillingScheduleRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM billing_schedules WHERE project_id = ? ORDER BY billing_month ASC`,
      [projectId]
    );
    return rows as BillingScheduleRow[];
  }

  async getScheduleById(id: number): Promise<BillingScheduleRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM billing_schedules WHERE schedule_id = ?`,
      [id]
    );
    return (rows[0] as BillingScheduleRow) || null;
  }

  async createSchedulesBatch(schedules: Omit<BillingScheduleRow, 'schedule_id' | 'status' | 'created_at'>[]): Promise<void> {
    if (schedules.length === 0) return;
    const values = schedules.map(s => [s.project_id, s.quotation_id, s.billing_month, s.expected_amount, 'pending']);
    await dbPool.query(
      `INSERT INTO billing_schedules (project_id, quotation_id, billing_month, expected_amount, status) VALUES ?`,
      [values]
    );
  }

  async updateScheduleStatus(id: number, status: BillingScheduleRow['status']): Promise<void> {
    await dbPool.query(`UPDATE billing_schedules SET status = ? WHERE schedule_id = ?`, [status, id]);
  }

  // ── Monthly Completed Work ───────────────────────────────────────────────
  async getCompletedWorkByProject(projectId: number): Promise<MonthlyCompletedWorkRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM monthly_completed_work WHERE project_id = ? ORDER BY schedule_id ASC`,
      [projectId]
    );
    return rows as MonthlyCompletedWorkRow[];
  }

  async createCompletedWork(data: Omit<MonthlyCompletedWorkRow, 'completed_work_id' | 'created_at' | 'status' | 'approved_by'>): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO monthly_completed_work (schedule_id, project_id, completion_percentage, approved_amount, status) VALUES (?, ?, ?, ?, 'draft')`,
      [data.schedule_id, data.project_id, data.completion_percentage, data.approved_amount]
    );
    return result.insertId;
  }

  async updateCompletedWorkStatus(id: number, status: string, approvedBy?: number): Promise<void> {
    if (approvedBy) {
      await dbPool.query(`UPDATE monthly_completed_work SET status = ?, approved_by = ? WHERE completed_work_id = ?`, [status, approvedBy, id]);
    } else {
      await dbPool.query(`UPDATE monthly_completed_work SET status = ? WHERE completed_work_id = ?`, [status, id]);
    }
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  async getInvoices(projectId?: number): Promise<InvoiceRow[]> {
    let sql = `SELECT i.*, c.currency_code, c.symbol, t.tax_percentage, s.survey_code, s.report_file_url 
               FROM invoices i 
               LEFT JOIN currencies c ON i.currency_id = c.currency_id
               LEFT JOIN taxes t ON i.tax_id = t.tax_id
               LEFT JOIN site_surveys s ON i.survey_id = s.survey_id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE i.project_id = ?`;
      params.push(projectId);
    }
    sql += ` ORDER BY i.invoice_date DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as InvoiceRow[];
  }

  async getInvoiceById(id: number): Promise<InvoiceRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT i.*, c.currency_code, c.symbol, t.tax_percentage, t.tax_name, s.survey_code, s.report_file_url 
       FROM invoices i 
       LEFT JOIN currencies c ON i.currency_id = c.currency_id
       LEFT JOIN taxes t ON i.tax_id = t.tax_id 
       LEFT JOIN site_surveys s ON i.survey_id = s.survey_id
       WHERE i.invoice_id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const invoice = rows[0] as InvoiceRow;

    const [itemRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT ii.*, d.discipline_name 
       FROM invoice_items ii
       LEFT JOIN disciplines d ON ii.discipline_id = d.discipline_id
       WHERE ii.invoice_id = ?`,
      [id]
    );
    invoice.items = itemRows as InvoiceItemRow[];

    return invoice;
  }

  async createInvoice(data: Omit<InvoiceRow, 'invoice_id' | 'created_at'>): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO invoices (
        invoice_number, customer_id, project_id, quotation_id, schedule_id, survey_id,
        currency_id, tax_id, invoice_date, due_date, subtotal_amount,
        tax_amount, total_amount, status, created_by, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.invoice_number, data.customer_id, data.project_id, data.quotation_id, data.schedule_id, data.survey_id || null,
        data.currency_id, data.tax_id || null, data.invoice_date, data.due_date, data.subtotal_amount,
        data.tax_amount, data.total_amount, data.status, data.created_by || null, data.approved_by || null
      ]
    );
    return result.insertId;
  }

  async createInvoiceItems(invoiceId: number, items: InvoiceItemRow[]): Promise<void> {
    if (items.length === 0) return;
    const values = items.map(item => [
      invoiceId,
      item.discipline_id || null,
      item.description,
      item.amount,
      item.is_extra_work ? 1 : 0
    ]);
    await dbPool.query(
      `INSERT INTO invoice_items (invoice_id, discipline_id, description, amount, is_extra_work) VALUES ?`,
      [values]
    );
  }

  async updateInvoiceStatus(id: number, status: string, approvedBy?: number): Promise<void> {
    if (approvedBy) {
      await dbPool.query(`UPDATE invoices SET status = ?, approved_by = ? WHERE invoice_id = ?`, [status, approvedBy, id]);
    } else {
      await dbPool.query(`UPDATE invoices SET status = ? WHERE invoice_id = ?`, [status, id]);
    }
  }

  // ── Invoice Payments ───────────────────────────────────────────────────────
  async getPaymentsByInvoice(invoiceId: number): Promise<InvoicePaymentRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC`,
      [invoiceId]
    );
    return rows as InvoicePaymentRow[];
  }

  async addPayment(data: Omit<InvoicePaymentRow, 'payment_id' | 'created_at'>): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.invoice_id, data.payment_date, data.amount, data.payment_method || null, data.reference_number || null, data.status]
    );
    return result.insertId;
  }
}
