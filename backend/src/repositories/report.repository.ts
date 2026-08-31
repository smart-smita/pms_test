import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class ReportRepository {
  async getAttendanceReport(filters: {
    employee_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    let sql = `
      SELECT 
        al.attendance_id,
        al.attendance_date,
        e.employee_code,
        e.name AS employee_name,
        p.project_name,
        t.task_name,
        al.check_in_time,
        al.check_out_time,
        al.in_address,
        al.out_address,
        al.total_working_hours,
        al.status
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id AND e.is_deleted = 0
      LEFT JOIN tasks t ON al.task_id = t.task_id AND t.is_deleted = 0
      LEFT JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.employee_id) {
      sql += ` AND al.employee_id = ?`;
      params.push(filters.employee_id);
    }
    if (filters.start_date) {
      sql += ` AND al.attendance_date >= ?`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ` AND al.attendance_date <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY al.attendance_date DESC, al.check_in_time DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectReport(employeeId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_code,
        p.project_name,
        p.client_name,
        p.status AS project_status,
        COUNT(t.task_id) AS total_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'delayed' THEN 1 ELSE 0 END) AS delayed_tasks,
        COALESCE(SUM(t.estimated_hours), 0) AS total_estimated_hours,
        COALESCE(SUM(al.total_working_hours), 0) AS total_actual_hours
      FROM projects p
      LEFT JOIN tasks t ON p.project_id = t.project_id AND t.is_deleted = 0
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND al.status = 'completed'
      WHERE p.is_deleted = 0
    `;
    const params: any[] = [];

    if (employeeId) {
      sql += ` AND p.project_id IN (SELECT t2.project_id FROM tasks t2 JOIN task_assignments ta ON t2.task_id = ta.task_id WHERE ta.employee_id = ?)`;
      params.push(employeeId);
    }

    sql += ` GROUP BY p.project_id ORDER BY p.project_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const total = Number(r.total_tasks || 0);
      const completed = Number(r.completed_tasks || 0);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...r,
        progress_percentage: progress,
      };
    });
  }

  async getTaskReport(filters: { project_id?: number; status?: string; employee_id?: number }): Promise<any[]> {
    let sql = `
      SELECT 
        t.task_id,
        t.task_name,
        p.project_name,
        t.required_worker_count,
        COUNT(DISTINCT ta.employee_id) AS assigned_worker_count,
        t.estimated_hours,
        COALESCE(SUM(al.total_working_hours), 0) AS actual_hours,
        t.start_date,
        t.target_date,
        t.status AS task_status
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND al.status = 'completed'
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters.employee_id) {
      sql += ` AND t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)`;
      params.push(filters.employee_id);
    }
    if (filters.project_id) {
      sql += ` AND t.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters.status) {
      sql += ` AND t.status = ?`;
      params.push(filters.status);
    }

    sql += ` GROUP BY t.task_id ORDER BY t.task_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }
}
