import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { EmployeeRow } from '../types';

export class UserRepository {
  async findByEmployeeCode(code: string): Promise<EmployeeRow | null> {
    const cleanCode = code.trim();
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name 
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE LOWER(e.employee_code) = LOWER(?)`,
      [cleanCode]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findByEmail(email: string): Promise<EmployeeRow | null> {
    const cleanEmail = email.trim();
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name 
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE LOWER(e.email) = LOWER(?)`,
      [cleanEmail]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findById(id: number): Promise<EmployeeRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name, 
              mgr.employee_code AS reporting_to_code,
              mgr.name AS reporting_to_name,
              mgr.email AS reporting_to_email,
              mgr_r.role_name AS reporting_to_role_name,
              mgr.status AS reporting_to_status,
              p.project_name AS assigned_project_name,
              w.wbs_name AS assigned_wbs_name
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       LEFT JOIN employees mgr ON e.reporting_to_id = mgr.employee_id
       LEFT JOIN roles mgr_r ON mgr.role_id = mgr_r.role_id
       LEFT JOIN projects p ON e.assigned_project_id = p.project_id
       LEFT JOIN project_wbs pw ON e.assigned_wbs_id = pw.id
       LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       WHERE e.employee_id = ?`,
      [id]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findAll(status?: string, role_id?: number, search?: string, managerId?: number, employeeId?: number): Promise<EmployeeRow[]> {
    let sql = `
      SELECT e.*, r.role_name,
              mgr.employee_code AS reporting_to_code,
              mgr.name AS reporting_to_name,
              mgr.email AS reporting_to_email,
              mgr_r.role_name AS reporting_to_role_name,
              mgr.status AS reporting_to_status,
              p.project_name AS assigned_project_name,
              w.wbs_name AS assigned_wbs_name
      FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      LEFT JOIN employees mgr ON e.reporting_to_id = mgr.employee_id
      LEFT JOIN roles mgr_r ON mgr.role_id = mgr_r.role_id
      LEFT JOIN projects p ON e.assigned_project_id = p.project_id
      LEFT JOIN project_wbs pw ON e.assigned_wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(managerId, managerId);
    }

    if (employeeId) {
      sql += ` AND e.employee_id = ?`;
      params.push(employeeId);
    }

    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (role_id) {
      sql += ` AND e.role_id = ?`;
      params.push(role_id);
    }
    if (search) {
      sql += ` AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY e.employee_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows as EmployeeRow[];
  }

  async create(data: {
    employee_code: string;
    name: string;
    email: string;
    password_hash: string;
    role_id: number;
    hourly_rate?: number;
    status: string;
    reporting_to_id?: number | null;
    assigned_project_id?: number | null;
    assigned_wbs_id?: number | null;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO employees (employee_code, name, email, password_hash, role_id, hourly_rate, status, reporting_to_id, assigned_project_id, assigned_wbs_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_code,
        data.name,
        data.email,
        data.password_hash,
        data.role_id,
        data.hourly_rate || 0,
        data.status,
        data.reporting_to_id || null,
        data.assigned_project_id || null,
        data.assigned_wbs_id || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<EmployeeRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.password_hash !== undefined) { fields.push('password_hash = ?'); params.push(data.password_hash); }
    if (data.role_id !== undefined) { fields.push('role_id = ?'); params.push(data.role_id); }
    if (data.hourly_rate !== undefined) { fields.push('hourly_rate = ?'); params.push(data.hourly_rate); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.reporting_to_id !== undefined) { fields.push('reporting_to_id = ?'); params.push(data.reporting_to_id || null); }
    if (data.assigned_project_id !== undefined) { fields.push('assigned_project_id = ?'); params.push(data.assigned_project_id || null); }
    if (data.assigned_wbs_id !== undefined) { fields.push('assigned_wbs_id = ?'); params.push(data.assigned_wbs_id || null); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE employees SET ${fields.join(', ')} WHERE employee_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async createPasswordResetToken(employee_id: number, token: string, expires_at: Date): Promise<void> {
    await dbPool.execute(
      `INSERT INTO password_reset_tokens (employee_id, token, expires_at) VALUES (?, ?, ?)`,
      [employee_id, token, expires_at]
    );
  }

  async findPasswordResetToken(token: string): Promise<any | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token]
    );
    return rows[0] || null;
  }

  async markTokenUsed(token_id: number): Promise<void> {
    await dbPool.execute(`UPDATE password_reset_tokens SET used = 1 WHERE token_id = ?`, [token_id]);
  }

  async softDelete(id: number, deleted_by: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE employees SET is_deleted = 1, deleted_at = NOW() WHERE employee_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async getWorkHistory(employeeId: number): Promise<{ projects: any[]; tasks: any[]; timesheets: any[] }> {
    // 1. Projects assigned directly or via tasks
    const [projects] = await dbPool.execute<RowDataPacket[]>(`
      SELECT DISTINCT 
        p.project_id, 
        p.project_code, 
        p.project_name, 
        p.client_name, 
        p.status
      FROM projects p
      LEFT JOIN tasks t ON p.project_id = t.project_id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON e.employee_id = ?
      WHERE (ta.employee_id = ? OR e.assigned_project_id = p.project_id)
        AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `, [employeeId, employeeId]);

    // 2. Tasks assigned
    const [tasks] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        t.task_id, 
        t.task_name, 
        t.status AS task_status, 
        t.estimated_hours, 
        DATE_FORMAT(t.target_date, '%Y-%m-%d') AS due_date, 
        p.project_name, 
        w.wbs_name
      FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE ta.employee_id = ? AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
      ORDER BY t.task_id DESC
    `, [employeeId]);

    // 3. Timesheet log history
    const [timesheets] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        ts.timesheet_id, 
        DATE_FORMAT(ts.log_date, '%Y-%m-%d') AS log_date, 
        ts.working_hours, 
        ts.comment, 
        p.project_name, 
        w.wbs_name, 
        t.task_name
      FROM timesheets ts
      LEFT JOIN projects p ON ts.project_id = p.project_id
      LEFT JOIN project_wbs pw ON ts.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON ts.task_id = t.task_id
      WHERE ts.employee_id = ? AND (ts.is_deleted = 0 OR ts.is_deleted IS NULL)
      ORDER BY ts.log_date DESC, ts.timesheet_id DESC
    `, [employeeId]);

    return {
      projects: projects || [],
      tasks: tasks || [],
      timesheets: timesheets || [],
    };
  }
}
