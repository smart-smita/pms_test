import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { AttendanceRow } from '../types';

export class AttendanceRepository {
  async findOpenCheckInByEmployee(employeeId: number): Promise<AttendanceRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM attendance_logs 
       WHERE employee_id = ? AND status = 'open'`,
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
       WHERE al.attendance_id = ?`,
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
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO attendance_logs 
       (employee_id, task_id, attendance_date, check_in_time, in_latitude, in_longitude, in_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        data.employee_id,
        data.task_id || null,
        data.attendance_date,
        data.check_in_time,
        data.in_latitude || null,
        data.in_longitude || null,
        data.in_address || null,
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
    total_working_hours: number;
    status: 'completed' | 'missing_checkout';
  }): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE attendance_logs 
       SET check_out_time = ?, out_latitude = ?, out_longitude = ?, out_address = ?, total_working_hours = ?, status = ?
       WHERE attendance_id = ?`,
      [
        data.check_out_time,
        data.out_latitude || null,
        data.out_longitude || null,
        data.out_address || null,
        data.total_working_hours,
        data.status,
        data.attendance_id,
      ]
    );
    return result.affectedRows > 0;
  }

  async findAll(filters: {
    employee_id?: number;
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
      WHERE 1=1
    `;
    const params: any[] = [];

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
       WHERE status = 'open' AND attendance_date < ?`,
      [currentDate]
    );
    return result.affectedRows;
  }
}
