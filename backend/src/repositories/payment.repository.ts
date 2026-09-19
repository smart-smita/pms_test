import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class PaymentRepository {
  async getLabourPaymentSummary(startDate?: string, endDate?: string, labourId?: number, projectId?: number, managerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        l.labour_id,
        l.name AS labour_name,
        l.labour_type,
        l.contact_number,
        COUNT(DISTINCT wl.work_log_id) AS total_work_logs,
        COUNT(DISTINCT wl.work_date) AS days_worked,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_payment
      FROM labours l
      LEFT JOIN labour_work_logs wl ON l.labour_id = wl.labour_id AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (wl.project_id IS NULL OR wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?))`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (labourId) {
      sql += ` AND l.labour_id = ?`;
      params.push(labourId);
    }

    if (projectId) {
      sql += ` AND wl.project_id = ?`;
      params.push(projectId);
    }

    if (startDate && endDate) {
      sql += ` AND wl.work_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` GROUP BY l.labour_id ORDER BY total_payment DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getDailyPaymentSummary(startDate?: string, endDate?: string, projectId?: number, managerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        COUNT(DISTINCT wl.labour_id) AS total_workers,
        COUNT(DISTINCT wl.work_log_id) AS total_work_logs,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_payment
      FROM labour_work_logs wl
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?))`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (projectId) {
      sql += ` AND wl.project_id = ?`;
      params.push(projectId);
    }

    if (startDate && endDate) {
      sql += ` AND wl.work_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` GROUP BY wl.work_date ORDER BY wl.work_date DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectPaymentSummary(projectId?: number, managerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_code,
        p.project_name,
        COUNT(DISTINCT wl.labour_id) AS worker_count,
        COUNT(DISTINCT wl.work_log_id) AS total_work_logs,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_cost
      FROM projects p
      LEFT JOIN labour_work_logs wl ON p.project_id = wl.project_id AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
      WHERE p.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id = ?)
      )`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (projectId) {
      sql += ` AND p.project_id = ?`;
      params.push(projectId);
    }

    sql += ` GROUP BY p.project_id ORDER BY total_cost DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getTaskPaymentSummary(projectId?: number, managerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        t.task_id,
        t.task_name,
        p.project_name,
        w.wbs_name,
        t.estimated_hours,
        COUNT(DISTINCT wl.labour_id) AS worker_count,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS actual_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_cost
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN labour_work_logs wl ON t.task_id = wl.task_id AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id = ?)
      )`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      params.push(projectId);
    }

    sql += ` GROUP BY t.task_id ORDER BY total_cost DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getWBSPaymentSummary(projectId?: number, managerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        pw.id AS wbs_id,
        w.wbs_name,
        p.project_name,
        COUNT(DISTINCT wl.labour_id) AS worker_count,
        COUNT(DISTINCT wl.work_log_id) AS total_work_logs,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_cost
      FROM project_wbs pw
      JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN projects p ON pw.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN labour_work_logs wl ON pw.id = wl.wbs_id AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        p.project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id = ?)
      )`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (projectId) {
      sql += ` AND p.project_id = ?`;
      params.push(projectId);
    }

    sql += ` GROUP BY pw.id ORDER BY total_cost DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }
}
