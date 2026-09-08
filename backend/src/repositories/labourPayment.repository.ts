import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface LabourPaymentRow {
  payment_id: number;
  payment_code: string;
  labour_id: number;
  labour_name: string;
  labour_type: string;
  contact_number?: string | null;
  project_id?: number | null;
  project_name?: string | null;
  payment_date: string;
  total_hours: number;
  total_amount: number;
  payment_method: string;
  reference_number?: string | null;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  remarks?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  items?: any[];
}

export class LabourPaymentRepository {
  async findAll(filters: { labourId?: number; projectId?: number; status?: string; startDate?: string; endDate?: string; managerId?: number } = {}): Promise<LabourPaymentRow[]> {
    let sql = `
      SELECT 
        lp.payment_id, lp.payment_code, lp.labour_id, l.name AS labour_name, l.labour_type, l.contact_number,
        lp.project_id, p.project_name,
        DATE_FORMAT(lp.payment_date, '%Y-%m-%d') AS payment_date,
        lp.total_hours, lp.total_amount, lp.payment_method, lp.reference_number,
        lp.status, lp.remarks, lp.created_by, u.name AS created_by_name,
        lp.created_at, lp.updated_at
      FROM labour_payments lp
      JOIN labours l ON lp.labour_id = l.labour_id
      LEFT JOIN projects p ON lp.project_id = p.project_id
      LEFT JOIN employees u ON lp.created_by = u.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.managerId) {
      sql += ` AND (lp.project_id IS NULL OR lp.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?))`;
      params.push(filters.managerId);
    }

    if (filters.labourId) {
      sql += ` AND lp.labour_id = ?`;
      params.push(filters.labourId);
    }

    if (filters.projectId) {
      sql += ` AND lp.project_id = ?`;
      params.push(filters.projectId);
    }

    if (filters.status) {
      sql += ` AND lp.status = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ` AND lp.payment_date >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND lp.payment_date <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY lp.payment_date DESC, lp.payment_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as LabourPaymentRow[];
  }

  async findById(id: number): Promise<LabourPaymentRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
        lp.payment_id, lp.payment_code, lp.labour_id, l.name AS labour_name, l.labour_type, l.contact_number,
        lp.project_id, p.project_name,
        DATE_FORMAT(lp.payment_date, '%Y-%m-%d') AS payment_date,
        lp.total_hours, lp.total_amount, lp.payment_method, lp.reference_number,
        lp.status, lp.remarks, lp.created_by, u.name AS created_by_name,
        lp.created_at, lp.updated_at
      FROM labour_payments lp
      JOIN labours l ON lp.labour_id = l.labour_id
      LEFT JOIN projects p ON lp.project_id = p.project_id
      LEFT JOIN employees u ON lp.created_by = u.employee_id
      WHERE lp.payment_id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const payment = rows[0] as LabourPaymentRow;

    const [items] = await dbPool.query<RowDataPacket[]>(
      `SELECT lpi.id, lpi.work_log_id, lpi.amount,
              wl.work_date, wl.total_working_hours, wl.rate, wl.rate_type,
              t.task_name, p.project_name
       FROM labour_payment_items lpi
       JOIN labour_work_logs wl ON lpi.work_log_id = wl.work_log_id
       JOIN tasks t ON wl.task_id = t.task_id
       JOIN projects p ON wl.project_id = p.project_id
       WHERE lpi.payment_id = ?`,
      [id]
    );
    payment.items = items;
    return payment;
  }

  async create(data: {
    payment_code: string;
    labour_id: number;
    project_id?: number | null;
    payment_date: string;
    total_hours: number;
    total_amount: number;
    payment_method?: string;
    reference_number?: string | null;
    status?: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
    remarks?: string | null;
    created_by?: number | null;
    work_log_ids?: number[];
  }): Promise<number> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO labour_payments (
          payment_code, labour_id, project_id, payment_date, total_hours, total_amount,
          payment_method, reference_number, status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.payment_code,
          data.labour_id,
          data.project_id || null,
          data.payment_date,
          data.total_hours || 0,
          data.total_amount || 0,
          data.payment_method || 'cash',
          data.reference_number || null,
          data.status || 'pending',
          data.remarks || null,
          data.created_by || null,
        ]
      );
      const paymentId = result.insertId;

      if (data.work_log_ids && data.work_log_ids.length > 0) {
        for (const logId of data.work_log_ids) {
          await connection.query(
            `INSERT INTO labour_payment_items (payment_id, work_log_id, amount)
             SELECT ?, work_log_id, amount FROM labour_work_logs WHERE work_log_id = ?`,
            [paymentId, logId]
          );
        }

        const placeholders = data.work_log_ids.map(() => '?').join(',');
        await connection.query(
          `UPDATE labour_work_logs SET payment_status = ? WHERE work_log_id IN (${placeholders})`,
          [data.status || 'pending', ...data.work_log_ids]
        );
      }

      await connection.commit();
      return paymentId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled', remarks?: string): Promise<boolean> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE labour_payments SET status = ?, remarks = COALESCE(?, remarks) WHERE payment_id = ?`,
        [status, remarks || null, id]
      );

      if (result.affectedRows > 0) {
        await connection.query(
          `UPDATE labour_work_logs wl
           JOIN labour_payment_items lpi ON wl.work_log_id = lpi.work_log_id
           SET wl.payment_status = ?
           WHERE lpi.payment_id = ?`,
          [status, id]
        );
      }

      await connection.commit();
      return result.affectedRows > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
