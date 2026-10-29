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
  project_name?: string;
  customer_name?: string;
  completed_work_id?: number;
  completion_percentage?: number;
  approved_amount?: number;
  work_status?: string;
  invoice_id?: number;
  invoice_number?: string;
  invoice_status?: string;
  paid_amount?: number;
}

export interface MonthlyCompletedWorkRow {
  completed_work_id: number;
  schedule_id: number;
  project_id: number;
  completion_percentage: number;
  approved_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by: number | null;
  original_invoice_id?: number | null;
  is_credit_note?: boolean | number;
  revision_number?: number;
  credit_note_reason?: string | null;
  billed_by?: number | null;
  created_at?: string;
  currency_code?: string;
  currency_symbol?: string;
}

export interface InvoiceRow {
  invoice_id: number;
  invoice_number: string;
  invoice_type?: 'combined' | 'labour' | 'material' | 'credit_note';
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  project_id: number;
  task_id?: number | null;
  project_name?: string;
  project_code?: string;
  project_address?: string;
  quotation_id?: number | null;
  quotation_code?: string;
  schedule_id?: number | null;
  billing_month?: string;
  survey_id?: number | null;
  currency_id: number;
  currency_code?: string;
  currency_symbol?: string;
  tax_id: number | null;
  tax_name?: string;
  tax_type?: string | null;
  tax_percentage?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  invoice_date: string;
  due_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_paid' | 'paid' | 'cancelled';
  original_invoice_id?: number | null;
  is_credit_note?: boolean | number;
  revision_number?: number;
  credit_note_reason?: string | null;
  billed_by?: number | null;
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
  cost_amount?: number;
  is_extra_work: boolean | number;
  item_type?: 'labour' | 'material' | 'other';
  project_wbs_id?: number | null;
  task_id?: number | null;
  quotation_wbs_material_id?: number | null;
  project_material_id?: number | null;
  consumption_log_id?: number | null;
  quantity?: number | null;
  rate?: number | null;
  cost_rate?: number;
  tax_percentage?: number;
  tax_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  wbs_name?: string;
  task_name?: string;
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
  async getSchedulesByProject(projectId?: number): Promise<BillingScheduleRow[]> {
    let sql = `SELECT bs.*, p.project_name, cust.customer_name,
                      mcw.completed_work_id, mcw.completion_percentage, mcw.approved_amount, mcw.status AS work_status,
                      inv.invoice_id, inv.invoice_number, inv.status AS invoice_status,
                      COALESCE(pmt.paid_amount, 0) AS paid_amount
               FROM billing_schedules bs
               LEFT JOIN projects p ON bs.project_id = p.project_id
               LEFT JOIN customers cust ON p.customer_id = cust.customer_id
               LEFT JOIN monthly_completed_work mcw ON bs.schedule_id = mcw.schedule_id
               LEFT JOIN invoices inv ON bs.schedule_id = inv.schedule_id
               LEFT JOIN (
                 SELECT invoice_id, SUM(amount) AS paid_amount 
                 FROM invoice_payments 
                 WHERE status = 'completed' 
                 GROUP BY invoice_id
               ) pmt ON inv.invoice_id = pmt.invoice_id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE bs.project_id = ?`;
      params.push(projectId);
    }
    sql += ` ORDER BY bs.billing_month ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as BillingScheduleRow[];
  }

  async getScheduleById(id: number): Promise<BillingScheduleRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT bs.*, c.currency_code, c.symbol AS currency_symbol 
       FROM billing_schedules bs
       LEFT JOIN projects p ON bs.project_id = p.project_id
       LEFT JOIN currencies c ON p.currency_id = c.currency_id
       WHERE bs.schedule_id = ?`,
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
  async getCompletedWorkByProject(projectId?: number): Promise<MonthlyCompletedWorkRow[]> {
    let sql = `SELECT mcw.*, bs.billing_month, p.project_name, cust.customer_name,
                      c.currency_code, c.symbol AS currency_symbol
               FROM monthly_completed_work mcw
               LEFT JOIN billing_schedules bs ON mcw.schedule_id = bs.schedule_id
               LEFT JOIN projects p ON mcw.project_id = p.project_id
               LEFT JOIN customers cust ON p.customer_id = cust.customer_id
               LEFT JOIN currencies c ON p.currency_id = c.currency_id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE mcw.project_id = ?`;
      params.push(projectId);
    }
    sql += ` ORDER BY mcw.schedule_id ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
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

  async approveCompletedWorkByScheduleId(scheduleId: number, approvedBy?: number): Promise<void> {
    if (approvedBy) {
      await dbPool.query(`UPDATE monthly_completed_work SET status = 'approved', approved_by = ? WHERE schedule_id = ? AND status != 'approved'`, [approvedBy, scheduleId]);
    } else {
      await dbPool.query(`UPDATE monthly_completed_work SET status = 'approved' WHERE schedule_id = ? AND status != 'approved'`, [scheduleId]);
    }
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  async getInvoices(projectId?: number): Promise<InvoiceRow[]> {
    let sql = `SELECT i.*, 
                      cust.customer_name, 
                      cust.email AS customer_email,
                      cust.contact_number AS customer_phone,
                      cust.address AS customer_address,
                      p.project_name, 
                      p.project_code,
                      p.project_address,
                      q.quotation_code, 
                      bs.billing_month, 
                      c.currency_code, 
                      c.symbol AS currency_symbol, 
                      t.tax_percentage, 
                      t.tax_name, 
                      s.survey_code, 
                      s.attached_report_path AS report_file_url,
                      COALESCE(pmt.paid_amount, 0) AS paid_amount
               FROM invoices i 
               LEFT JOIN customers cust ON i.customer_id = cust.customer_id
               LEFT JOIN projects p ON i.project_id = p.project_id
               LEFT JOIN quotations q ON i.quotation_id = q.quotation_id
               LEFT JOIN billing_schedules bs ON i.schedule_id = bs.schedule_id
               LEFT JOIN currencies c ON i.currency_id = c.currency_id
               LEFT JOIN taxes t ON i.tax_id = t.tax_id
               LEFT JOIN site_surveys s ON i.survey_id = s.survey_id
               LEFT JOIN (
                 SELECT invoice_id, SUM(amount) AS paid_amount 
                 FROM invoice_payments 
                 WHERE status = 'completed' 
                 GROUP BY invoice_id
               ) pmt ON i.invoice_id = pmt.invoice_id`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE i.project_id = ?`;
      params.push(projectId);
    }
    sql += ` ORDER BY i.invoice_date DESC, i.invoice_id DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as InvoiceRow[];
  }

  async getInvoiceById(id: number): Promise<InvoiceRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT i.*, 
              cust.customer_name, 
              cust.email AS customer_email,
              cust.contact_number AS customer_phone,
              cust.address AS customer_address,
              p.project_name, 
              p.project_code,
              p.project_address,
              q.quotation_code, 
              bs.billing_month, 
              c.currency_code, 
              c.symbol AS currency_symbol, 
              t.tax_percentage, 
              t.tax_name, 
              s.survey_code, 
              s.attached_report_path AS report_file_url,
              COALESCE(pmt.paid_amount, 0) AS paid_amount
       FROM invoices i 
       LEFT JOIN customers cust ON i.customer_id = cust.customer_id
       LEFT JOIN projects p ON i.project_id = p.project_id
       LEFT JOIN quotations q ON i.quotation_id = q.quotation_id
       LEFT JOIN billing_schedules bs ON i.schedule_id = bs.schedule_id
       LEFT JOIN currencies c ON i.currency_id = c.currency_id
       LEFT JOIN taxes t ON i.tax_id = t.tax_id 
       LEFT JOIN site_surveys s ON i.survey_id = s.survey_id
       LEFT JOIN (
         SELECT invoice_id, SUM(amount) AS paid_amount 
         FROM invoice_payments 
         WHERE status = 'completed' 
         GROUP BY invoice_id
       ) pmt ON i.invoice_id = pmt.invoice_id
       WHERE i.invoice_id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const invoice = rows[0] as InvoiceRow;

    const [itemRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT ii.*, d.discipline_name, t.task_name, pw.wbs_name 
       FROM invoice_items ii
       LEFT JOIN disciplines d ON ii.discipline_id = d.discipline_id
       LEFT JOIN tasks t ON ii.task_id = t.task_id
       LEFT JOIN project_wbs pw ON ii.project_wbs_id = pw.wbs_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.item_id ASC`,
      [id]
    );
    invoice.items = itemRows as InvoiceItemRow[];

    return invoice;
  }

  async findInvoiceByScheduleAndType(projectId: number, scheduleId: number, invoiceType?: string): Promise<InvoiceRow | null> {
    let sql = `SELECT * FROM invoices WHERE project_id = ? AND schedule_id = ? AND status != 'cancelled'`;
    const params: any[] = [projectId, scheduleId];
    if (invoiceType) {
      sql += ` AND invoice_type = ?`;
      params.push(invoiceType);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows.length > 0 ? (rows[0] as InvoiceRow) : null;
  }

  async findDraftInvoicesByProject(projectId: number): Promise<InvoiceRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM invoices WHERE project_id = ? AND status = 'draft'`,
      [projectId]
    );
    return rows as InvoiceRow[];
  }

  async createInvoice(data: Omit<InvoiceRow, 'invoice_id' | 'created_at'>): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO invoices (
        invoice_number, customer_id, project_id, quotation_id, schedule_id, survey_id,
        currency_id, tax_id, tax_type, cgst_amount, sgst_amount, igst_amount,
        invoice_date, due_date, subtotal_amount, tax_amount, total_amount, invoice_type, status, created_by, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.invoice_number, data.customer_id, data.project_id, data.quotation_id || null, data.schedule_id || null, data.survey_id || null,
        data.currency_id, data.tax_id || null, data.tax_type || null, data.cgst_amount || 0, data.sgst_amount || 0, data.igst_amount || 0,
        data.invoice_date, data.due_date, data.subtotal_amount, data.tax_amount, data.total_amount, data.invoice_type || 'combined', data.status, data.created_by || null, data.approved_by || null
      ]
    );
    return result.insertId;
  }

  async createInvoiceItems(invoiceId: number, items: InvoiceItemRow[]): Promise<void> {
    if (items.length === 0) return;

    // Check valid discipline IDs from disciplines table to avoid FK violations
    const [discRows] = await dbPool.query<RowDataPacket[]>('SELECT discipline_id FROM disciplines');
    const validDiscIds = new Set(discRows.map((r: any) => Number(r.discipline_id)));

    for (const item of items) {
      const discId = (item.discipline_id && validDiscIds.has(Number(item.discipline_id))) ? Number(item.discipline_id) : null;
      const [res]: any = await dbPool.query(
        `INSERT INTO invoice_items (
           invoice_id, discipline_id, description, amount, cost_amount, is_extra_work,
           item_type, project_wbs_id, task_id, quotation_wbs_material_id, project_material_id,
           consumption_log_id, quantity, rate, cost_rate, tax_percentage, tax_amount,
           cgst_amount, sgst_amount, igst_amount
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          discId,
          item.description,
          Number(item.amount || 0),
          Number(item.cost_amount || 0),
          item.is_extra_work ? 1 : 0,
          item.item_type || 'other',
          item.project_wbs_id || null,
          item.task_id || null,
          item.quotation_wbs_material_id || null,
          item.project_material_id || null,
          item.consumption_log_id || null,
          item.quantity !== undefined ? Number(item.quantity) : null,
          item.rate !== undefined ? Number(item.rate) : null,
          Number(item.cost_rate || 0),
          Number(item.tax_percentage || 0),
          Number(item.tax_amount || 0),
          Number(item.cgst_amount || 0),
          Number(item.sgst_amount || 0),
          Number(item.igst_amount || 0),
        ]
      );

      const itemId = res.insertId;

      // Maintain source traceability in invoice_item_sources
      if (item.consumption_log_id || item.item_type === 'material') {
        await dbPool.query(
          `INSERT INTO invoice_item_sources (
             invoice_id, invoice_item_id, source_type, consumption_log_id,
             project_material_id, quotation_wbs_material_id, project_wbs_id, task_id,
             billed_qty, billing_rate, billed_amount, cost_rate, cost_amount
           ) VALUES (?, ?, 'material_consumption', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            itemId,
            item.consumption_log_id || null,
            item.project_material_id || null,
            item.quotation_wbs_material_id || null,
            item.project_wbs_id || null,
            item.task_id || null,
            Number(item.quantity || 0),
            Number(item.rate || 0),
            Number(item.amount || 0),
            Number(item.cost_rate || 0),
            Number(item.cost_amount || 0),
          ]
        );
      }
    }
  }

  async deleteInvoiceItems(invoiceId: number): Promise<void> {
    await dbPool.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
  }

  async updateInvoiceAmounts(
    invoiceId: number,
    amounts: { subtotal_amount: number; tax_amount: number; cgst_amount: number; sgst_amount: number; igst_amount: number; total_amount: number }
  ): Promise<void> {
    await dbPool.query(
      `UPDATE invoices 
       SET subtotal_amount = ?, tax_amount = ?, cgst_amount = ?, sgst_amount = ?, igst_amount = ?, total_amount = ? 
       WHERE invoice_id = ?`,
      [amounts.subtotal_amount, amounts.tax_amount, amounts.cgst_amount, amounts.sgst_amount, amounts.igst_amount, amounts.total_amount, invoiceId]
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

  // ── Project Costs (Labour & Materials) for Invoice Auto-Generation ────────
  async getProjectCosts(projectId: number): Promise<{
    labour_items: any[];
    material_items: any[];
    total_labour_amount: number;
    total_material_amount: number;
    total_cost: number;
  }> {
    // Labour costs: direct FK link via pw.quotation_discipline_id
    const [labourRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         lwl.work_log_id,
         lwl.labour_id,
         COALESCE(l.name, 'Labour Worker') AS labour_name,
         COALESCE(l.labour_type, 'direct_labour') AS labour_type,
         lwl.wbs_id,
         COALESCE(pw.quotation_discipline_id, NULL) AS discipline_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         lwl.task_id,
         COALESCE(t.task_name, 'Task') AS task_name,
         DATE_FORMAT(lwl.work_date, '%Y-%m-%d') AS work_date,
         lwl.total_working_hours,
         lwl.rate,
         lwl.amount,
         lwl.payment_status,
         lwl.work_description
       FROM labour_work_logs lwl
       LEFT JOIN labours l ON lwl.labour_id = l.labour_id
       LEFT JOIN project_wbs pw ON lwl.wbs_id = pw.id
       LEFT JOIN tasks t ON lwl.task_id = t.task_id
       WHERE lwl.project_id = ? AND lwl.is_deleted = 0
       ORDER BY lwl.work_date ASC, lwl.work_log_id ASC`,
      [projectId]
    );

    // Also include employee timesheet work logs
    const [timesheetRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         ts.timesheet_id AS work_log_id,
         ts.employee_id AS labour_id,
         COALESCE(e.name, 'Employee Worker') AS labour_name,
         'direct_labour' AS labour_type,
         ts.wbs_id,
         COALESCE(pw.quotation_discipline_id, NULL) AS discipline_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         ts.task_id,
         COALESCE(t.task_name, 'Task') AS task_name,
         DATE_FORMAT(ts.log_date, '%Y-%m-%d') AS work_date,
         ts.working_hours AS total_working_hours,
         COALESCE(ts.rate_snapshot, e.hourly_rate, 0.00) AS rate,
         COALESCE(ts.cost, ROUND(ts.working_hours * COALESCE(ts.rate_snapshot, e.hourly_rate, 0.00), 2)) AS amount,
         'approved' AS payment_status,
         COALESCE(ts.comment, 'Employee Timesheet Work') AS work_description
       FROM timesheets ts
       LEFT JOIN employees e ON ts.employee_id = e.employee_id
       LEFT JOIN project_wbs pw ON (ts.wbs_id = pw.id OR (ts.wbs_id = pw.wbs_id AND pw.project_id = ts.project_id AND pw.deleted_at IS NULL))
       LEFT JOIN tasks t ON ts.task_id = t.task_id
       WHERE ts.project_id = ? AND (ts.is_deleted = 0 OR ts.is_deleted IS NULL)
       ORDER BY ts.log_date ASC, ts.timesheet_id ASC`,
      [projectId]
    );

    // Also include assigned workers on completed tasks who have no logged work log or timesheet yet
    const [assignedRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         ta.assignment_id AS work_log_id,
         ta.employee_id AS labour_id,
         COALESCE(e.name, 'Assigned Worker') AS labour_name,
         'direct_labour' AS labour_type,
         t.wbs_id,
         COALESCE(pw.quotation_discipline_id, NULL) AS discipline_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         t.task_id,
         COALESCE(t.task_name, 'Task') AS task_name,
         DATE_FORMAT(COALESCE(t.target_date, t.start_date, NOW()), '%Y-%m-%d') AS work_date,
         COALESCE(t.estimated_hours, 8.00) AS total_working_hours,
         COALESCE(e.hourly_rate, 50.00) AS rate,
         ROUND(COALESCE(t.estimated_hours, 8.00) * COALESCE(e.hourly_rate, 50.00), 2) AS amount,
         'assigned' AS payment_status,
         CONCAT('Assigned Work - ', t.task_name) AS work_description
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.task_id
       JOIN employees e ON ta.employee_id = e.employee_id
       LEFT JOIN project_wbs pw ON (t.wbs_id = pw.id OR (t.wbs_id = pw.wbs_id AND pw.project_id = t.project_id AND pw.deleted_at IS NULL))
       WHERE t.project_id = ? AND t.is_deleted = 0 AND t.status = 'completed'
         AND t.task_id NOT IN (SELECT DISTINCT task_id FROM timesheets WHERE task_id IS NOT NULL AND (is_deleted = 0 OR is_deleted IS NULL))
         AND t.task_id NOT IN (SELECT DISTINCT task_id FROM labour_work_logs WHERE task_id IS NOT NULL AND (is_deleted = 0 OR is_deleted IS NULL))`,
      [projectId]
    );

    const allLabourRows = [...(labourRows as any[]), ...(timesheetRows as any[]), ...(assignedRows as any[])];

    // 1. Primary Phase 6 Source: Unbilled material consumptions from stock_ledger
    // Quotation billing rate (from quotation_wbs_material or project_materials)
    // Procurement cost rate (snapshot from stock_ledger)
    let [materialRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         sl.ledger_id AS consumption_log_id,
         sl.task_id,
         COALESCE(t.task_name, 'Task Site Consumption') AS task_name,
         sl.wbs_id AS project_wbs_id,
         COALESCE(pw.quotation_discipline_id, NULL) AS discipline_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         sl.material_id,
         COALESCE(m.material_name, 'Material') AS material_name,
         (sl.qty_out - sl.billed_qty) AS quantity,
         COALESCE(m.unit, 'Nos') AS unit,
         COALESCE(qwm.rate, pm.unit_rate, m.billing_rate, m.rate, 0.00) AS rate,
         sl.rate AS cost_rate,
         ROUND((sl.qty_out - sl.billed_qty) * COALESCE(qwm.rate, pm.unit_rate, m.billing_rate, m.rate, 0.00), 2) AS amount,
         ROUND((sl.qty_out - sl.billed_qty) * sl.rate, 2) AS cost_amount,
         DATE_FORMAT(sl.txn_date, '%Y-%m-%d') AS used_date,
         sl.remarks AS notes,
         qwm.id AS quotation_wbs_material_id,
         pm.id AS project_material_id
       FROM stock_ledger sl
       JOIN materials m ON sl.material_id = m.material_id
       LEFT JOIN tasks t ON sl.task_id = t.task_id
       LEFT JOIN project_wbs pw ON sl.wbs_id = pw.id
       LEFT JOIN quotation_wbs_material qwm ON (pw.quotation_discipline_id = qwm.quotation_discipline_id AND qwm.material_id = sl.material_id)
       LEFT JOIN project_materials pm ON (pm.project_id = sl.project_id AND pm.wbs_id = sl.wbs_id AND pm.material_id = sl.material_id)
       WHERE sl.project_id = ? 
         AND sl.txn_type = 'consumption' 
         AND (sl.qty_out - sl.billed_qty) > 0
       ORDER BY sl.txn_date ASC, sl.ledger_id ASC`,
      [projectId]
    );

    // 2. Legacy fallback: material_issues if no stock ledger rows exist for older data
    if (materialRows.length === 0) {
      [materialRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT 
           NULL AS consumption_log_id,
           mi.task_id,
           COALESCE(t.task_name, 'Site Material Issue') AS task_name,
           mi.wbs_id AS project_wbs_id,
           COALESCE(pw.quotation_discipline_id, NULL) AS discipline_id,
           COALESCE(pw.wbs_name, 'General') AS wbs_name,
           mi.material_id,
           mi.material_name,
           (mi.quantity - mi.billed_quantity) AS quantity,
           mi.unit,
           mi.unit_rate AS rate,
           mi.unit_rate AS cost_rate,
           ROUND((mi.quantity - mi.billed_quantity) * mi.unit_rate, 2) AS amount,
           ROUND((mi.quantity - mi.billed_quantity) * mi.unit_rate, 2) AS cost_amount,
           DATE_FORMAT(mi.issue_date, '%Y-%m-%d') AS used_date,
           mi.remarks AS notes,
           NULL AS quotation_wbs_material_id,
           NULL AS project_material_id
         FROM material_issues mi
         LEFT JOIN tasks t ON mi.task_id = t.task_id
         LEFT JOIN project_wbs pw ON mi.wbs_id = pw.id
         WHERE mi.project_id = ? AND (mi.quantity - mi.billed_quantity) > 0
         ORDER BY mi.issue_date ASC, mi.issue_id ASC`,
        [projectId]
      );
    }

    const totalLabour = allLabourRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalMaterial = (materialRows as any[]).reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return {
      labour_items: allLabourRows,
      material_items: materialRows as any[],
      total_labour_amount: totalLabour,
      total_material_amount: totalMaterial,
      total_cost: totalLabour + totalMaterial
    };
  }

  // ── Source Links & Billed Qty Tracking ─────────────────────────────────
  async getInvoiceSources(invoiceId: number): Promise<any[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT iis.*, m.material_name, m.unit, t.task_name, pw.wbs_name
       FROM invoice_item_sources iis
       LEFT JOIN stock_ledger sl ON iis.consumption_log_id = sl.ledger_id
       LEFT JOIN materials m ON sl.material_id = m.material_id
       LEFT JOIN tasks t ON iis.task_id = t.task_id
       LEFT JOIN project_wbs pw ON iis.project_wbs_id = pw.id
       WHERE iis.invoice_id = ?`,
      [invoiceId]
    );
    return rows;
  }

  async markConsumptionBilled(consumptionLogId: number, qty: number): Promise<void> {
    await dbPool.query(
      `UPDATE stock_ledger 
       SET billed_qty = billed_qty + ? 
       WHERE ledger_id = ?`,
      [qty, consumptionLogId]
    );
  }

  async releaseConsumptionBilled(consumptionLogId: number, qty: number): Promise<void> {
    await dbPool.query(
      `UPDATE stock_ledger 
       SET billed_qty = GREATEST(0.00, billed_qty - ?) 
       WHERE ledger_id = ?`,
      [qty, consumptionLogId]
    );
  }
}
