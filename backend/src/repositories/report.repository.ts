import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class ReportRepository {
  // 1. Employee Details Report
  async getEmployeeDetailsReport(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.name AS employee_name,
        e.email,
        r.role_name,
        m.name AS manager_name,
        p.project_name AS assigned_project_name,
        w.wbs_name AS assigned_wbs_name,
        e.status,
        DATE_FORMAT(e.created_at, '%Y-%m-%d') AS joining_date
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.role_id
      LEFT JOIN employees m ON e.reporting_to_id = m.employee_id
      LEFT JOIN projects p ON e.assigned_project_id = p.project_id
      LEFT JOIN project_wbs pw ON e.assigned_wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.project_id) { sql += ` AND e.assigned_project_id = ?`; params.push(filters.project_id); }
    sql += ` ORDER BY e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 2. Discipline Details Report
  async getDisciplineDetailsReport(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        w.id,
        w.wbs_code,
        w.wbs_name,
        w.description,
        w.status,
        p.project_name,
        p.project_code,
        COUNT(DISTINCT pw.project_id) AS allocated_projects_count,
        COALESCE(SUM(pw.total_hours), 0) AS total_planned_hours
      FROM work_breakdown_structures w
      LEFT JOIN project_wbs pw ON w.id = pw.wbs_id AND pw.deleted_at IS NULL
      LEFT JOIN projects p ON pw.project_id = p.project_id AND p.is_deleted = 0
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.project_id) {
      sql += ` AND pw.project_id = ?`;
      params.push(filters.project_id);
    }
    sql += ` GROUP BY w.id, w.wbs_code, w.wbs_name, w.description, w.status, p.project_name, p.project_code ORDER BY w.wbs_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 3. Employee Attendance Report 1 – Day Wise Hrs & Addresses
  async getEmployeeAttendanceReport1(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        al.attendance_id,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        e.employee_code,
        e.name AS employee_name,
        p.project_name,
        t.task_name,
        DATE_FORMAT(al.check_in_time, '%h:%i:%s %p') AS in_time,
        DATE_FORMAT(al.check_out_time, '%h:%i:%s %p') AS out_time,
        al.in_address,
        al.out_address,
        al.total_working_hours,
        al.status
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id
      LEFT JOIN tasks t ON al.task_id = t.task_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE (al.is_deleted = 0 OR al.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.employee_id) { sql += ` AND al.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; params.push(filters.project_id, filters.project_id); }
    if (filters.start_date) { sql += ` AND al.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND al.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY al.attendance_date DESC, al.check_in_time DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 4. Employee Attendance Report 2 – Day Wise In/Out & Hours
  async getEmployeeAttendanceReport2(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        al.attendance_id,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        e.employee_code,
        e.name AS employee_name,
        DATE_FORMAT(al.check_in_time, '%h:%i:%s %p') AS in_time,
        DATE_FORMAT(al.check_out_time, '%h:%i:%s %p') AS out_time,
        al.total_working_hours
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id
      LEFT JOIN tasks t ON al.task_id = t.task_id
      WHERE (al.is_deleted = 0 OR al.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.employee_id) { sql += ` AND al.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; params.push(filters.project_id, filters.project_id); }
    if (filters.start_date) { sql += ` AND al.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND al.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY al.attendance_date DESC, e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 5. Employee Attendance Report 3 – Summary
  async getEmployeeAttendanceReport3(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.name AS employee_name,
        COUNT(DISTINCT al.attendance_date) AS days_present,
        COALESCE(SUM(al.total_working_hours), 0) AS total_working_hours,
        ROUND(COALESCE(AVG(al.total_working_hours), 0), 2) AS avg_hours_per_day
      FROM employees e
      LEFT JOIN attendance_logs al ON e.employee_id = al.employee_id AND (al.is_deleted = 0 OR al.is_deleted IS NULL)
      LEFT JOIN tasks t ON al.task_id = t.task_id
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; params.push(filters.project_id, filters.project_id); }
    if (filters.start_date) { sql += ` AND al.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND al.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` GROUP BY e.employee_id, e.employee_code, e.name ORDER BY e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 6. Labour Details Report
  async getLabourDetailsReport(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        l.labour_id,
        l.name AS labour_name,
        l.contact_number,
        l.aadhar_id,
        l.labour_type,
        c.name AS contractor_name,
        DATE_FORMAT(l.created_at, '%Y-%m-%d') AS created_date
      FROM labours l
      LEFT JOIN labours c ON l.contractor_id = c.labour_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND l.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.contractor_id) { sql += ` AND l.contractor_id = ?`; params.push(filters.contractor_id); }
    if (filters.project_id) { sql += ` AND l.labour_id IN (SELECT DISTINCT labour_id FROM labour_work_logs WHERE project_id = ? AND (is_deleted = 0 OR is_deleted IS NULL))`; params.push(filters.project_id); }
    sql += ` ORDER BY l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 7. Labour Attendance Report 1 – Day-Wise Work Logs
  async getLabourAttendanceReport1(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        wl.work_log_id AS labour_attendance_id,
        wl.labour_id,
        l.name AS labour_name,
        l.labour_type,
        p.project_name,
        w.wbs_name,
        t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS calculated_payment,
        wl.payment_status,
        wl.work_description AS comment
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN tasks t ON wl.task_id = t.task_id
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND wl.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.manager_id) {
      sql += ` AND (wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?))`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date DESC, wl.work_log_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 8. Labour Attendance Report 2 – Day-Wise In/Out & Hours
  async getLabourAttendanceReport2(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        wl.work_log_id AS labour_attendance_id,
        wl.labour_id,
        l.name AS labour_name,
        p.project_name,
        w.wbs_name AS discipline_name,
        t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS daily_pay_amount,
        wl.payment_status
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN tasks t ON wl.task_id = t.task_id
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND wl.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.manager_id) {
      sql += ` AND (wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?))`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date DESC, l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 9. Labour Attendance Report 3 – Summary
  async getLabourAttendanceReport3(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        l.labour_id,
        l.name AS labour_name,
        l.labour_type,
        p.project_name,
        w.wbs_name AS discipline_name,
        COUNT(DISTINCT wl.work_date) AS days_worked,
        COUNT(DISTINCT wl.work_log_id) AS total_work_logs,
        ROUND(COALESCE(SUM(wl.total_working_hours), 0), 2) AS total_hours,
        ROUND(COALESCE(SUM(wl.amount), 0), 2) AS total_payment
      FROM labours l
      LEFT JOIN labour_work_logs wl ON l.labour_id = wl.labour_id AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
      LEFT JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND l.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.manager_id) {
      sql += ` AND (wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?))`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` GROUP BY l.labour_id, l.name, l.labour_type, p.project_name, w.wbs_name ORDER BY l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 10. Labour Attendance Cost / Payment Report
  async getLabourCostPaymentReport(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        wl.work_log_id AS labour_attendance_id,
        l.name AS labour_name,
        l.labour_type,
        c.name AS contractor_name,
        p.project_name,
        t.task_name,
        w.wbs_name AS discipline_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS calculated_payment,
        wl.amount AS total_payment,
        wl.payment_status
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      LEFT JOIN labours c ON l.contractor_id = c.labour_id
      JOIN projects p ON wl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON wl.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      JOIN tasks t ON wl.task_id = t.task_id
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND wl.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.contractor_id) { sql += ` AND l.contractor_id = ?`; params.push(filters.contractor_id); }
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.manager_id) {
      sql += ` AND (wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR wl.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?))`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date DESC, wl.work_log_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectWorkReport(projectId?: number, managerId?: number, employeeId?: number, startDate?: string, endDate?: string): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        pw.id AS project_wbs_id,
        w.wbs_name,
        w.wbs_code,
        t.task_id,
        t.task_name,
        t.status AS task_status,
        t.estimated_hours,
        COALESCE(SUM(al.total_working_hours), 0) AS actual_hours,
        t.required_worker_count,
        GROUP_CONCAT(DISTINCT e.name SEPARATOR ', ') AS assigned_employee_name,
        GROUP_CONCAT(DISTINCT l.name SEPARATOR ', ') AS assigned_labour_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND (al.is_deleted = 0 OR al.is_deleted IS NULL)
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON ta.employee_id = e.employee_id AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
      LEFT JOIN labour_work_logs la ON t.task_id = la.task_id AND (la.is_deleted = 0 OR la.is_deleted IS NULL)
      LEFT JOIN labours l ON la.labour_id = l.labour_id
      WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      params.push(projectId);
    }

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR
        t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ? OR reporting_to_id = ?))
      )`;
      params.push(managerId, managerId, managerId);
    }

    if (employeeId) {
      sql += ` AND (
        t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?) OR
        t.task_id IN (SELECT task_id FROM attendance_logs WHERE employee_id = ?) OR
        t.task_id IN (SELECT task_id FROM timesheets WHERE employee_id = ?) OR
        (
          NOT EXISTS (SELECT 1 FROM task_assignments ta_chk WHERE ta_chk.employee_id = ?) AND
          p.project_id IN (SELECT assigned_project_id FROM employees WHERE employee_id = ?)
        )
      )`;
      params.push(employeeId, employeeId, employeeId, employeeId, employeeId);
    }

    if (startDate) {
      sql += ` AND (t.start_date >= ? OR t.created_at >= ?)`;
      params.push(startDate, startDate);
    }

    if (endDate) {
      sql += ` AND (t.target_date <= ? OR t.created_at <= ?)`;
      params.push(endDate, endDate);
    }

    sql += ` GROUP BY t.task_id, p.project_id, p.project_name, p.project_code, pw.id, w.wbs_name, w.wbs_code, t.task_name, t.status, t.estimated_hours, t.required_worker_count ORDER BY p.project_name ASC, w.wbs_name ASC, t.task_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }
}
