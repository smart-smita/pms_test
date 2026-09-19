import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface TimesheetRow {
  timesheet_id: number;
  project_id: number;
  project_name: string;
  wbs_id?: number | null;
  wbs_name?: string | null;
  task_id?: number | null;
  task_name?: string | null;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  log_date: string;
  working_hours: number;
  comment?: string | null;
  created_at: string;
}

export class TimesheetRepository {
  constructor() {
    this.ensureTimesheetColumns().catch(console.error);
  }

  private async ensureTimesheetColumns() {
    try {
      await dbPool.execute('ALTER TABLE timesheets MODIFY COLUMN task_id INT NULL DEFAULT NULL');
    } catch (e) {
      // Ignore if column is already nullable or table not ready
    }
    try {
      await dbPool.execute('ALTER TABLE timesheets ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0');
    } catch (e) {
      // Ignore if column exists
    }
    try {
      await dbPool.execute('ALTER TABLE timesheets ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL');
    } catch (e) {
      // Ignore if column exists
    }
  }

  async findAll(projectId?: number, wbsId?: number, taskId?: number, employeeId?: number, startDate?: string, endDate?: string, managerId?: number): Promise<TimesheetRow[]> {
    let sql = `
      SELECT ts.timesheet_id, ts.project_id, p.project_name,
             ts.wbs_id, COALESCE(w.wbs_name, w_direct.wbs_name, t_wbs.wbs_name) AS wbs_name,
             ts.task_id, t.task_name,
             ts.employee_id, e.name AS employee_name, e.employee_code,
             DATE_FORMAT(ts.log_date, '%Y-%m-%d') AS log_date,
             ts.working_hours, ts.comment, ts.created_at
      FROM timesheets ts
      JOIN projects p ON ts.project_id = p.project_id
      LEFT JOIN project_wbs pw ON (ts.wbs_id = pw.id OR (ts.wbs_id = pw.wbs_id AND pw.project_id = ts.project_id AND pw.deleted_at IS NULL))
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN work_breakdown_structures w_direct ON ts.wbs_id = w_direct.id
      LEFT JOIN tasks t ON ts.task_id = t.task_id
      LEFT JOIN project_wbs t_pw ON t.wbs_id = t_pw.id
      LEFT JOIN work_breakdown_structures t_wbs ON t_pw.wbs_id = t_wbs.id
      JOIN employees e ON ts.employee_id = e.employee_id
      WHERE (ts.is_deleted = 0 OR ts.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (ts.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR ts.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      params.push(managerId, managerId, managerId, managerId);
    }
    if (projectId) { sql += ` AND ts.project_id = ?`; params.push(projectId); }
    if (wbsId) { sql += ` AND ts.wbs_id = ?`; params.push(wbsId); }
    if (taskId) { sql += ` AND ts.task_id = ?`; params.push(taskId); }
    if (employeeId) { sql += ` AND ts.employee_id = ?`; params.push(employeeId); }
    if (startDate) { sql += ` AND ts.log_date >= ?`; params.push(startDate); }
    if (endDate) { sql += ` AND ts.log_date <= ?`; params.push(endDate); }

    sql += ` ORDER BY ts.log_date DESC, ts.timesheet_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows as TimesheetRow[];
  }

  async findByTaskId(taskId: number): Promise<TimesheetRow[]> {
    return this.findAll(undefined, undefined, taskId);
  }

  async findById(id: number): Promise<TimesheetRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT ts.timesheet_id, ts.project_id, p.project_name,
              ts.wbs_id, COALESCE(w.wbs_name, w_direct.wbs_name, t_wbs.wbs_name) AS wbs_name,
              ts.task_id, t.task_name,
              ts.employee_id, e.name AS employee_name, e.employee_code,
              DATE_FORMAT(ts.log_date, '%Y-%m-%d') AS log_date,
              ts.working_hours, ts.comment, ts.created_at
       FROM timesheets ts
       JOIN projects p ON ts.project_id = p.project_id
       LEFT JOIN project_wbs pw ON (ts.wbs_id = pw.id OR (ts.wbs_id = pw.wbs_id AND pw.project_id = ts.project_id AND pw.deleted_at IS NULL))
       LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       LEFT JOIN work_breakdown_structures w_direct ON ts.wbs_id = w_direct.id
       LEFT JOIN tasks t ON ts.task_id = t.task_id
       LEFT JOIN project_wbs t_pw ON t.wbs_id = t_pw.id
       LEFT JOIN work_breakdown_structures t_wbs ON t_pw.wbs_id = t_wbs.id
       JOIN employees e ON ts.employee_id = e.employee_id
       WHERE ts.timesheet_id = ?`,
      [id]
    );
    return (rows[0] as TimesheetRow) || null;
  }

  async create(data: {
    project_id: number;
    wbs_id?: number | null;
    task_id?: number | null;
    employee_id: number;
    log_date: string;
    working_hours: number;
    comment?: string | null;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO timesheets (project_id, wbs_id, task_id, employee_id, log_date, working_hours, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.wbs_id || null,
        data.task_id || null,
        data.employee_id,
        data.log_date,
        data.working_hours,
        data.comment || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<TimesheetRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.project_id !== undefined) { fields.push('project_id = ?'); params.push(data.project_id); }
    if (data.wbs_id !== undefined) { fields.push('wbs_id = ?'); params.push(data.wbs_id || null); }
    if (data.task_id !== undefined) { fields.push('task_id = ?'); params.push(data.task_id); }
    if (data.employee_id !== undefined) { fields.push('employee_id = ?'); params.push(data.employee_id); }
    if (data.log_date !== undefined) { fields.push('log_date = ?'); params.push(data.log_date); }
    if (data.working_hours !== undefined) { fields.push('working_hours = ?'); params.push(data.working_hours); }
    if (data.comment !== undefined) { fields.push('comment = ?'); params.push(data.comment || null); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE timesheets SET ${fields.join(', ')} WHERE timesheet_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM timesheets WHERE timesheet_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
