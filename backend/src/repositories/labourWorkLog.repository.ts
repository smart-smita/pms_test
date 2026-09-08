import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface LabourWorkLogRow {
  work_log_id: number;
  labour_id: number;
  labour_name: string;
  labour_type: string;
  contact_number?: string | null;
  project_id: number;
  project_code?: string;
  project_name?: string;
  wbs_id?: number | null;
  wbs_code?: string;
  wbs_name?: string;
  task_id: number;
  task_code?: string;
  task_name?: string;
  work_date: string;
  in_time?: string | null;
  out_time?: string | null;
  total_working_hours: number;
  rate_type: 'hourly' | 'daily';
  rate: number;
  amount: number;
  work_description?: string | null;
  work_status: 'pending' | 'in_progress' | 'completed';
  payment_status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  created_by?: number | null;
  created_by_name?: string | null;
  updated_by?: number | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabourWorkLogFilters {
  projectId?: number;
  wbsId?: number;
  taskId?: number;
  labourId?: number;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  workStatus?: string;
  search?: string;
  managerId?: number;
}

export class LabourWorkLogRepository {
  async findAll(filters: LabourWorkLogFilters = {}): Promise<LabourWorkLogRow[]> {
    let sql = `
      SELECT 
        wl.work_log_id, wl.labour_id, l.name AS labour_name, l.labour_type, l.contact_number,
        wl.project_id, p.project_code, p.project_name,
        wl.wbs_id, pw.wbs_code, w.wbs_name,
        wl.task_id, t.task_code, t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS work_date,
        wl.in_time, wl.out_time,
        wl.total_working_hours, wl.rate_type, wl.rate, wl.amount,
        wl.work_description, wl.work_status, wl.payment_status,
        wl.created_by, u1.name AS created_by_name,
        wl.updated_by, u2.name AS updated_by_name,
        wl.created_at, wl.updated_at
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN tasks t ON wl.task_id = t.task_id
      LEFT JOIN users u1 ON wl.created_by = u1.id
      LEFT JOIN users u2 ON wl.updated_by = u2.id
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (filters.managerId) {
      sql += ` AND wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?)`;
      params.push(filters.managerId);
    }

    if (filters.projectId) {
      sql += ` AND wl.project_id = ?`;
      params.push(filters.projectId);
    }

    if (filters.wbsId) {
      sql += ` AND wl.wbs_id = ?`;
      params.push(filters.wbsId);
    }

    if (filters.taskId) {
      sql += ` AND wl.task_id = ?`;
      params.push(filters.taskId);
    }

    if (filters.labourId) {
      sql += ` AND wl.labour_id = ?`;
      params.push(filters.labourId);
    }

    if (filters.startDate) {
      sql += ` AND wl.work_date >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND wl.work_date <= ?`;
      params.push(filters.endDate);
    }

    if (filters.paymentStatus) {
      sql += ` AND wl.payment_status = ?`;
      params.push(filters.paymentStatus);
    }

    if (filters.workStatus) {
      sql += ` AND wl.work_status = ?`;
      params.push(filters.workStatus);
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      sql += ` AND (l.name LIKE ? OR p.project_name LIKE ? OR t.task_name LIKE ? OR wl.work_description LIKE ?)`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY wl.work_date DESC, wl.work_log_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as LabourWorkLogRow[];
  }

  async findById(id: number): Promise<LabourWorkLogRow | null> {
    const rows = await this.findAll();
    const [row] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
        wl.work_log_id, wl.labour_id, l.name AS labour_name, l.labour_type, l.contact_number,
        wl.project_id, p.project_code, p.project_name,
        wl.wbs_id, pw.wbs_code, w.wbs_name,
        wl.task_id, t.task_code, t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS work_date,
        wl.in_time, wl.out_time,
        wl.total_working_hours, wl.rate_type, wl.rate, wl.amount,
        wl.work_description, wl.work_status, wl.payment_status,
        wl.created_by, wl.updated_by, wl.created_at, wl.updated_at
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN tasks t ON wl.task_id = t.task_id
      WHERE wl.work_log_id = ? AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)`,
      [id]
    );
    return (row[0] as LabourWorkLogRow) || null;
  }

  async create(data: {
    labour_id: number;
    project_id: number;
    wbs_id?: number | null;
    task_id: number;
    work_date: string;
    in_time?: string | null;
    out_time?: string | null;
    total_working_hours: number;
    rate_type?: 'hourly' | 'daily';
    rate: number;
    amount: number;
    work_description?: string | null;
    work_status?: 'pending' | 'in_progress' | 'completed';
    payment_status?: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
    created_by?: number | null;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO labour_work_logs (
        labour_id, project_id, wbs_id, task_id, work_date, in_time, out_time,
        total_working_hours, rate_type, rate, amount, work_description,
        work_status, payment_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.labour_id,
        data.project_id,
        data.wbs_id || null,
        data.task_id,
        data.work_date,
        data.in_time || null,
        data.out_time || null,
        data.total_working_hours || 0,
        data.rate_type || 'hourly',
        data.rate || 0,
        data.amount || 0,
        data.work_description || null,
        data.work_status || 'completed',
        data.payment_status || 'pending',
        data.created_by || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<LabourWorkLogRow>, userId?: number): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.labour_id !== undefined) { fields.push('labour_id = ?'); params.push(data.labour_id); }
    if (data.project_id !== undefined) { fields.push('project_id = ?'); params.push(data.project_id); }
    if (data.wbs_id !== undefined) { fields.push('wbs_id = ?'); params.push(data.wbs_id || null); }
    if (data.task_id !== undefined) { fields.push('task_id = ?'); params.push(data.task_id); }
    if (data.work_date !== undefined) { fields.push('work_date = ?'); params.push(data.work_date); }
    if (data.in_time !== undefined) { fields.push('in_time = ?'); params.push(data.in_time || null); }
    if (data.out_time !== undefined) { fields.push('out_time = ?'); params.push(data.out_time || null); }
    if (data.total_working_hours !== undefined) { fields.push('total_working_hours = ?'); params.push(data.total_working_hours); }
    if (data.rate_type !== undefined) { fields.push('rate_type = ?'); params.push(data.rate_type); }
    if (data.rate !== undefined) { fields.push('rate = ?'); params.push(data.rate); }
    if (data.amount !== undefined) { fields.push('amount = ?'); params.push(data.amount); }
    if (data.work_description !== undefined) { fields.push('work_description = ?'); params.push(data.work_description || null); }
    if (data.work_status !== undefined) { fields.push('work_status = ?'); params.push(data.work_status); }
    if (data.payment_status !== undefined) { fields.push('payment_status = ?'); params.push(data.payment_status); }

    if (userId) {
      fields.push('updated_by = ?');
      params.push(userId);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labour_work_logs SET ${fields.join(', ')} WHERE work_log_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDelete(id: number): Promise<boolean> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labour_work_logs SET is_deleted = 1, deleted_at = NOW() WHERE work_log_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async updatePaymentStatus(workLogIds: number[], status: string): Promise<boolean> {
    if (!workLogIds || workLogIds.length === 0) return false;
    const placeholders = workLogIds.map(() => '?').join(',');
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labour_work_logs SET payment_status = ? WHERE work_log_id IN (${placeholders})`,
      [status, ...workLogIds]
    );
    return result.affectedRows > 0;
  }

  async checkOverlap(labourId: number, workDate: string, inTime: string, outTime: string, excludeWorkLogId?: number): Promise<LabourWorkLogRow | null> {
    let sql = `
      SELECT wl.*, t.task_name
      FROM labour_work_logs wl
      JOIN tasks t ON wl.task_id = t.task_id
      WHERE wl.labour_id = ?
        AND wl.work_date = ?
        AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
        AND wl.in_time IS NOT NULL
        AND wl.out_time IS NOT NULL
        AND (wl.in_time < ? AND wl.out_time > ?)
    `;
    const params: any[] = [labourId, workDate, outTime, inTime];
    if (excludeWorkLogId) {
      sql += ` AND wl.work_log_id != ?`;
      params.push(excludeWorkLogId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourWorkLogRow) || null;
  }
}
