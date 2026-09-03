import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { AttendanceRow } from '../types';

export class AttendanceRepository {
  async findOpenCheckInByEmployee(employeeId: number): Promise<AttendanceRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM attendance_logs 
       WHERE employee_id = ? AND status = 'open' AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [employeeId]
    );
    return (rows[0] as AttendanceRow) || null;
  }

  async findById(id: number): Promise<AttendanceRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT 
        al.*,
        e.name AS employee_name,
        e.employee_code,
        e.hourly_rate,
        t.task_name,
        p.project_name
       FROM attendance_logs al
       JOIN employees e ON al.employee_id = e.employee_id
       LEFT JOIN tasks t ON al.task_id = t.task_id
       LEFT JOIN projects p ON t.project_id = p.project_id
       WHERE al.attendance_id = ? AND (al.is_deleted = 0 OR al.is_deleted IS NULL)`,
      [id]
    );
    if (!rows[0]) return null;
    const r: any = rows[0];
    const hrs = Number(r.total_working_hours || 0);
    const rate = Number(r.hourly_rate || 0);
    return {
      ...r,
      calculated_payment: Math.round(hrs * rate * 100) / 100,
    } as AttendanceRow;
  }

  async createCheckIn(data: {
    employee_id: number;
    task_id?: number;
    attendance_date: string;
    check_in_time: string;
    in_latitude?: number;
    in_longitude?: number;
    in_address?: string;
    in_distance_meters?: number;
    project_radius_meters?: number;
    in_status?: 'inside' | 'outside';
    status?: 'open' | 'outside_area';
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO attendance_logs 
       (employee_id, task_id, attendance_date, check_in_time, in_latitude, in_longitude, in_address, in_distance_meters, project_radius_meters, in_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.task_id || null,
        data.attendance_date,
        data.check_in_time,
        data.in_latitude || null,
        data.in_longitude || null,
        data.in_address || null,
        data.in_distance_meters || null,
        data.project_radius_meters || 500,
        data.in_status || 'inside',
        data.status || 'open',
      ]
    );
    return result.insertId;
  }

  async checkOut(data: {
    attendance_id: number;
    check_out_time: string;
    out_latitude?: number;
    out_longitude?: number;
    out_address?: string;
    out_distance_meters?: number;
    out_status?: 'inside' | 'outside';
    total_working_hours: number;
    status: 'completed' | 'missing_checkout' | 'outside_area';
  }): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE attendance_logs 
       SET check_out_time = ?, out_latitude = ?, out_longitude = ?, out_address = ?, out_distance_meters = ?, out_status = ?, total_working_hours = ?, status = ?
       WHERE attendance_id = ?`,
      [
        data.check_out_time,
        data.out_latitude || null,
        data.out_longitude || null,
        data.out_address || null,
        data.out_distance_meters || null,
        data.out_status || 'inside',
        data.total_working_hours,
        data.status,
        data.attendance_id,
      ]
    );
    return result.affectedRows > 0;
  }

  async update(id: number, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.task_id !== undefined) { fields.push('task_id = ?'); params.push(data.task_id || null); }
    if (data.attendance_date !== undefined) { fields.push('attendance_date = ?'); params.push(data.attendance_date); }
    if (data.check_in_time !== undefined) { fields.push('check_in_time = ?'); params.push(data.check_in_time); }
    if (data.check_out_time !== undefined) { fields.push('check_out_time = ?'); params.push(data.check_out_time); }
    if (data.in_address !== undefined) { fields.push('in_address = ?'); params.push(data.in_address); }
    if (data.out_address !== undefined) { fields.push('out_address = ?'); params.push(data.out_address); }
    if (data.total_working_hours !== undefined) { fields.push('total_working_hours = ?'); params.push(data.total_working_hours); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE attendance_logs SET ${fields.join(', ')} WHERE attendance_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDelete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE attendance_logs SET is_deleted = 1, deleted_at = NOW() WHERE attendance_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async findAll(filters: {
    employee_id?: number;
    manager_id?: number;
    task_id?: number;
    project_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<AttendanceRow[]> {
    let sql = `
      SELECT 
        al.*,
        e.name AS employee_name,
        e.employee_code,
        e.hourly_rate,
        t.task_name,
        p.project_name
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id
      LEFT JOIN tasks t ON al.task_id = t.task_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE (al.is_deleted = 0 OR al.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }

    if (filters.employee_id) {
      sql += ` AND al.employee_id = ?`;
      params.push(filters.employee_id);
    }
    if (filters.task_id) {
      sql += ` AND al.task_id = ?`;
      params.push(filters.task_id);
    }
    if (filters.project_id) {
      sql += ` AND t.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters.start_date) {
      sql += ` AND al.attendance_date >= ?`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ` AND al.attendance_date <= ?`;
      params.push(filters.end_date);
    }
    if (filters.status) {
      sql += ` AND al.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY al.check_in_time DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const hrs = Number(r.total_working_hours || 0);
      const rate = Number(r.hourly_rate || 0);
      return {
        ...r,
        calculated_payment: Math.round(hrs * rate * 100) / 100,
      } as AttendanceRow;
    });
  }

  async markMissingCheckouts(currentDate: string): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE attendance_logs 
       SET status = 'missing_checkout'
       WHERE status = 'open' AND attendance_date < ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [currentDate]
    );
    return result.affectedRows;
  }
}
