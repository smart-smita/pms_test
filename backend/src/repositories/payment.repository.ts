import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class PaymentRepository {
  async getEmployeePaymentSummary(startDate?: string, endDate?: string): Promise<any[]> {
    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.name AS employee_name,
        e.hourly_rate,
        COALESCE(SUM(al.total_working_hours), 0) AS total_hours,
        ROUND(COALESCE(SUM(al.total_working_hours * e.hourly_rate), 0), 2) AS total_payment,
        COUNT(DISTINCT al.attendance_date) AS days_worked
      FROM employees e
      LEFT JOIN attendance_logs al ON e.employee_id = al.employee_id AND al.status = 'completed'
      WHERE e.is_deleted = 0
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      sql += ` AND al.attendance_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` GROUP BY e.employee_id ORDER BY total_payment DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getDailyPaymentSummary(startDate?: string, endDate?: string): Promise<any[]> {
    let sql = `
      SELECT 
        al.attendance_date,
        COUNT(DISTINCT al.employee_id) AS total_workers,
        ROUND(COALESCE(SUM(al.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(al.total_working_hours * e.hourly_rate), 0), 2) AS total_payment
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id AND e.is_deleted = 0
      WHERE al.status = 'completed'
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      sql += ` AND al.attendance_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` GROUP BY al.attendance_date ORDER BY al.attendance_date DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectPaymentSummary(): Promise<any[]> {
    const sql = `
      SELECT 
        p.project_id,
        p.project_code,
        p.project_name,
        COUNT(DISTINCT al.employee_id) AS worker_count,
        ROUND(COALESCE(SUM(al.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(al.total_working_hours * e.hourly_rate), 0), 2) AS total_cost
      FROM projects p
      LEFT JOIN tasks t ON p.project_id = t.project_id AND t.is_deleted = 0
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND al.status = 'completed'
      LEFT JOIN employees e ON al.employee_id = e.employee_id AND e.is_deleted = 0
      WHERE p.is_deleted = 0
      GROUP BY p.project_id
      ORDER BY total_cost DESC
    `;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql);
    return rows;
  }

  async getTaskPaymentSummary(): Promise<any[]> {
    const sql = `
      SELECT 
        t.task_id,
        t.task_name,
        p.project_name,
        t.estimated_hours,
        ROUND(COALESCE(SUM(al.total_working_hours), 0), 2) AS actual_hours,
        ROUND(COALESCE(SUM(al.total_working_hours * e.hourly_rate), 0), 2) AS total_cost
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND al.status = 'completed'
      LEFT JOIN employees e ON al.employee_id = e.employee_id AND e.is_deleted = 0
      WHERE t.is_deleted = 0
      GROUP BY t.task_id
      ORDER BY total_cost DESC
    `;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql);
    return rows;
  }
}
