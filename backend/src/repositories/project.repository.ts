import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { ProjectRow } from '../types';

export class ProjectRepository {
  async findAll(status?: string, search?: string, managerId?: number, employeeId?: number): Promise<ProjectRow[]> {
    let sql = `
      SELECT 
        p.project_id, p.project_code, p.project_name, p.project_address, p.client_name, p.client_code,
        p.customer_id, cust.customer_name,
        p.project_type_id, pt.type_name AS project_type_name,
        p.emreads_id, p.contact_email, p.community_id, cm.community_name,
        p.nationality_id, n.nationality_name, p.country_id, co.country_name,
        p.latitude, p.longitude, p.radius_meters, p.project_date, p.status, p.note, p.budget_amount, p.created_at, p.updated_at, p.is_deleted,
        COALESCE(wbs_stats.total_wbs, 0) AS task_count,
        COALESCE(wbs_stats.completed_wbs, 0) AS completed_task_count,
        COALESCE(wbs_stats.total_planned_hours, 0) AS total_planned_hours,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE project_id = p.project_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS total_actual_hours,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
        COALESCE((SELECT SUM(total_amount) FROM labour_payments WHERE project_id = p.project_id AND status = 'paid'), 0) AS paid_amount
      FROM projects p
      LEFT JOIN customers     cust ON p.customer_id     = cust.customer_id
      LEFT JOIN project_types pt   ON p.project_type_id = pt.type_id
      LEFT JOIN countries     co   ON p.country_id      = co.country_id
      LEFT JOIN communities   cm   ON p.community_id    = cm.community_id
      LEFT JOIN nationalities n    ON p.nationality_id  = n.nationality_id
      LEFT JOIN (
        SELECT pw.project_id,
          COUNT(pw.id) AS total_wbs,
          SUM(pw.total_hours) AS total_planned_hours,
          SUM(CASE WHEN 
            GREATEST(
              COALESCE(pw.actual_hours, 0),
              (
                COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id)), 0) +
                COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0)
              )
            ) >= pw.total_hours AND pw.total_hours > 0
          THEN 1 ELSE 0 END) AS completed_wbs
        FROM project_wbs pw
        WHERE pw.deleted_at IS NULL
        GROUP BY pw.project_id
      ) wbs_stats ON p.project_id = wbs_stats.project_id
      WHERE p.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id = ?) OR
        p.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?) OR
        p.project_id IN (SELECT assigned_project_id FROM employees WHERE employee_id = ?) OR
        p.project_id IN (SELECT project_id FROM timesheets WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        p.project_id IN (SELECT project_id FROM timesheets WHERE employee_id = ?) OR
        (
          NOT EXISTS (SELECT 1 FROM manager_projects mp WHERE mp.manager_id = ?)
          AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.reporting_to_id = ? AND e2.assigned_project_id IS NOT NULL)
          AND NOT EXISTS (SELECT 1 FROM employees e3 WHERE e3.employee_id = ? AND e3.assigned_project_id IS NOT NULL)
        )
      )`;
      params.push(managerId, managerId, managerId, managerId, managerId, managerId, managerId, managerId, managerId, managerId, managerId);
    }
    
    if (employeeId) {
      sql += ` AND (
        p.project_id IN (SELECT t2.project_id FROM tasks t2 JOIN task_assignments ta ON t2.task_id = ta.task_id WHERE ta.employee_id = ?) OR
        p.project_id IN (SELECT assigned_project_id FROM employees WHERE employee_id = ? AND assigned_project_id IS NOT NULL) OR
        p.project_id IN (SELECT project_id FROM timesheets WHERE employee_id = ?) OR
        p.project_id IN (SELECT DISTINCT t3.project_id FROM tasks t3 JOIN attendance_logs al ON t3.task_id = al.task_id WHERE al.employee_id = ?) OR
        (
          NOT EXISTS (SELECT 1 FROM employees e WHERE e.employee_id = ? AND e.assigned_project_id IS NOT NULL)
          AND NOT EXISTS (SELECT 1 FROM task_assignments ta2 WHERE ta2.employee_id = ?)
          AND NOT EXISTS (SELECT 1 FROM attendance_logs al2 WHERE al2.employee_id = ?)
        )
      )`;
      params.push(employeeId, employeeId, employeeId, employeeId, employeeId, employeeId, employeeId);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (p.project_name LIKE ? OR p.project_code LIKE ? OR p.client_name LIKE ? OR cust.customer_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY p.project_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const taskCount = Number(r.task_count || 0);
      const completedCount = Number(r.completed_task_count || 0);
      const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
      
      const plannedHrs = Number(r.total_planned_hours || 0);
      const actualHrs = Number(r.total_actual_hours || 0);
      const remainingHrs = Math.max(plannedHrs - actualHrs, 0);
      const varianceHrs = actualHrs - plannedHrs;
      const compPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 10000) / 100, 100) : progress;
      
      const budgetAmt = Number(r.budget_amount || 0);
      const actualCostAmt = Number(r.actual_cost || 0);
      const paidAmt = Number(r.paid_amount || 0);
      const pendingAmt = Math.max(actualCostAmt - paidAmt, 0);
      const remainingBudgetAmt = budgetAmt - actualCostAmt;
      const budgetVarAmt = budgetAmt - actualCostAmt;

      return {
        ...r,
        progress_percentage: progress,
        task_count: taskCount,
        completed_task_count: completedCount,
        total_planned_hours: Math.round(plannedHrs * 100) / 100,
        total_actual_hours: Math.round(actualHrs * 100) / 100,
        total_remaining_hours: Math.round(remainingHrs * 100) / 100,
        completion_percentage: compPct,
        total_variance: Math.round(varianceHrs * 100) / 100,
        budget_amount: budgetAmt,
        actual_cost: actualCostAmt,
        paid_amount: paidAmt,
        pending_amount: pendingAmt,
        remaining_budget: remainingBudgetAmt,
        budget_variance: budgetVarAmt,
      } as ProjectRow;
    });
  }

  async findById(id: number, managerId?: number, employeeId?: number): Promise<ProjectRow | null> {
    const projects = await this.findAll(undefined, undefined, managerId, employeeId);
    return projects.find(p => p.project_id === id) || null;
  }

  async findByCode(code: string): Promise<ProjectRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM projects WHERE project_code = ? AND is_deleted = 0`,
      [code]
    );
    return (rows[0] as ProjectRow) || null;
  }

  async create(data: {
    project_code: string;
    project_name: string;
    customer_id?: number | null;
    project_type_id?: number | null;
    emreads_id?: string | null;
    contact_email?: string | null;
    community_id?: number | null;
    nationality_id?: number | null;
    country_id?: number | null;
    project_address?: string;
    client_name?: string;
    client_code?: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
    project_date?: string;
    status: string;
    note?: string;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO projects (
        project_code, project_name, customer_id, project_type_id, emreads_id, contact_email,
        community_id, nationality_id, country_id, project_address, client_name, client_code,
        latitude, longitude, radius_meters, project_date, status, note
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_code,
        data.project_name,
        data.customer_id || null,
        data.project_type_id || null,
        data.emreads_id || null,
        data.contact_email || null,
        data.community_id || null,
        data.nationality_id || null,
        data.country_id || null,
        data.project_address || null,
        data.client_name || null,
        data.client_code || null,
        data.latitude || null,
        data.longitude || null,
        data.radius_meters || 500,
        data.project_date || null,
        data.status,
        data.note || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<ProjectRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.project_name !== undefined) { fields.push('project_name = ?'); params.push(data.project_name); }
    if (data.customer_id !== undefined) { fields.push('customer_id = ?'); params.push(data.customer_id); }
    if (data.project_type_id !== undefined) { fields.push('project_type_id = ?'); params.push(data.project_type_id); }
    if (data.emreads_id !== undefined) { fields.push('emreads_id = ?'); params.push(data.emreads_id); }
    if (data.contact_email !== undefined) { fields.push('contact_email = ?'); params.push(data.contact_email); }
    if (data.community_id !== undefined) { fields.push('community_id = ?'); params.push(data.community_id); }
    if (data.nationality_id !== undefined) { fields.push('nationality_id = ?'); params.push(data.nationality_id); }
    if (data.country_id !== undefined) { fields.push('country_id = ?'); params.push(data.country_id); }
    if (data.project_address !== undefined) { fields.push('project_address = ?'); params.push(data.project_address); }
    if (data.client_name !== undefined) { fields.push('client_name = ?'); params.push(data.client_name); }
    if (data.client_code !== undefined) { fields.push('client_code = ?'); params.push(data.client_code); }
    if (data.latitude !== undefined) { fields.push('latitude = ?'); params.push(data.latitude); }
    if (data.longitude !== undefined) { fields.push('longitude = ?'); params.push(data.longitude); }
    if (data.radius_meters !== undefined) { fields.push('radius_meters = ?'); params.push(data.radius_meters); }
    if (data.project_date !== undefined) { fields.push('project_date = ?'); params.push(data.project_date); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE projects SET ${fields.join(', ')} WHERE project_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }


  async softDelete(id: number, deleted_by: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE projects SET is_deleted = 1, deleted_at = NOW() WHERE project_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async getProject360Details(projectId: number): Promise<any> {
    const project = await this.findById(projectId);
    if (!project) return null;

    // 1. Fetch Customer Details
    let customer = null;
    if (project.customer_id) {
      const [cRows]: any = await dbPool.query(
        `SELECT c.*, co.country_name, cm.community_name, n.nationality_name 
         FROM customers c 
         LEFT JOIN countries co ON c.country_id = co.country_id 
         LEFT JOIN communities cm ON c.community_id = cm.community_id 
         LEFT JOIN nationalities n ON c.nationality_id = n.nationality_id 
         WHERE c.customer_id = ?`,
        [project.customer_id]
      );
      if (cRows.length > 0) customer = cRows[0];
    }

    // 2. Fetch Latest Approved Quotation & Line Item Disciplines
    const [qRows]: any = await dbPool.query(
      `SELECT * FROM quotations WHERE project_id = ? AND is_deleted = 0 ORDER BY quotation_id DESC LIMIT 1`,
      [projectId]
    );
    let quotation: any = null;
    let quotationDisciplines: any[] = [];
    if (qRows.length > 0) {
      quotation = qRows[0];
      const [dRows]: any = await dbPool.query(
        `SELECT qd.*, d.discipline_code 
         FROM quotation_disciplines qd 
         JOIN disciplines d ON qd.discipline_id = d.discipline_id 
         WHERE qd.quotation_id = ? AND qd.status = 'active'`,
        [quotation.quotation_id]
      );
      quotationDisciplines = dRows;
      quotation.disciplines = quotationDisciplines;
    }

    // 3. Fetch Entity Documents (Project & Quotation documents)
    const [docRows]: any = await dbPool.query(
      `SELECT d.*, dt.type_name AS doc_type_name, DATEDIFF(d.expiry_date, CURRENT_DATE()) AS days_remaining 
       FROM entity_documents d 
       LEFT JOIN document_types dt ON d.doc_type_id = dt.doc_type_id 
       WHERE (d.entity_type = 'project' AND d.entity_id = ?) OR (d.entity_type = 'quotation' AND d.entity_id = ?) 
       ORDER BY d.document_id DESC`,
      [projectId, quotation ? quotation.quotation_id : 0]
    );

    // 4. Fetch Tasks & Work Status Summary
    const [taskRows]: any = await dbPool.query(
      `SELECT t.*, pw.wbs_name, pw.wbs_code 
       FROM tasks t 
       LEFT JOIN project_wbs pw ON t.wbs_id = pw.id 
       WHERE t.project_id = ? 
       ORDER BY t.task_id DESC`,
      [projectId]
    );

    // 5. Fetch Invoices & Payments
    const [invRows]: any = await dbPool.query(
      `SELECT i.*, cur.symbol AS currency_symbol, cur.currency_code 
       FROM invoices i 
       LEFT JOIN currencies cur ON i.currency_id = cur.currency_id 
       WHERE i.project_id = ? 
       ORDER BY i.invoice_id DESC`,
      [projectId]
    );

    const [pmtRows]: any = await dbPool.query(
      `SELECT ip.*, inv.invoice_number 
       FROM invoice_payments ip 
       JOIN invoices inv ON ip.invoice_id = inv.invoice_id 
       WHERE inv.project_id = ? 
       ORDER BY ip.payment_id DESC`,
      [projectId]
    );

    // 6. Fetch Site Surveys
    const [surveyRows]: any = await dbPool.query(
      `SELECT s.*, e.first_name, e.last_name, d.discipline_name 
       FROM site_surveys s 
       LEFT JOIN employees e ON s.inspector_employee_id = e.employee_id 
       LEFT JOIN disciplines d ON s.discipline_id = d.discipline_id 
       WHERE s.project_id = ? AND s.is_deleted = 0 
       ORDER BY s.survey_id DESC`,
      [projectId]
    );

    // Calculate Financial Aggregation
    const budgetAmount = Number(project.budget_amount || (quotation ? quotation.total_amount : 0));
    let totalInvoiced = 0;
    let totalPaid = 0;

    for (const inv of invRows) {
      totalInvoiced += Number(inv.total_amount || 0);
    }
    for (const pmt of pmtRows) {
      totalPaid += Number(pmt.amount || 0);
    }

    const balanceDue = Math.max(totalInvoiced - totalPaid, 0);

    return {
      project,
      customer,
      quotation,
      disciplines: quotationDisciplines,
      documents: docRows,
      tasks: taskRows,
      surveys: surveyRows,
      invoices: invRows,
      payments: pmtRows,
      financials: {
        budget_amount: budgetAmount,
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        balance_due: balanceDue,
      },
    };
  }
}
