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
        e.hourly_rate,
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
    sql += ` ORDER BY e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 2. Discipline Details Report
  async getDisciplineDetailsReport(): Promise<any[]> {
    const sql = `
      SELECT 
        w.id,
        w.wbs_code,
        w.wbs_name,
        w.description,
        w.status,
        COUNT(DISTINCT pw.project_id) AS allocated_projects_count,
        COALESCE(SUM(pw.total_hours), 0) AS total_planned_hours
      FROM work_breakdown_structures w
      LEFT JOIN project_wbs pw ON w.id = pw.wbs_id
      GROUP BY w.id, w.wbs_code, w.wbs_name, w.description, w.status
      ORDER BY w.wbs_name ASC
    `;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql);
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
    if (filters.project_id) { sql += ` AND t.project_id = ?`; params.push(filters.project_id); }
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
      WHERE (al.is_deleted = 0 OR al.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.employee_id) { sql += ` AND al.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
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
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; params.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ?)`;
      params.push(filters.manager_id, filters.manager_id);
    }
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
    sql += ` ORDER BY l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 7. Labour Attendance Report 1 – Day-Wise Hrs & Address
  async getLabourAttendanceReport1(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        la.labour_attendance_id,
        la.labour_id,
        l.name AS labour_name,
        l.labour_type,
        p.project_name,
        w.wbs_name,
        t.task_name,
        DATE_FORMAT(la.attendance_date, '%Y-%m-%d') AS attendance_date,
        la.in_time,
        la.out_time,
        la.in_address,
        la.out_address,
        la.worker_count,
        la.daily_pay_amount,
        COALESCE(la.calculated_payment, la.daily_pay_amount * la.worker_count) AS calculated_payment,
        la.comment
      FROM labour_attendance la
      JOIN labours l ON la.labour_id = l.labour_id
      LEFT JOIN projects p ON la.project_id = p.project_id
      LEFT JOIN project_wbs pw ON la.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON la.task_id = t.task_id
      WHERE (la.is_deleted = 0 OR la.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND la.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.project_id) { sql += ` AND la.project_id = ?`; params.push(filters.project_id); }
    if (filters.start_date) { sql += ` AND la.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND la.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY la.attendance_date DESC, la.labour_attendance_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 8. Labour Attendance Report 2 – Day-Wise In/Out & Hours
  async getLabourAttendanceReport2(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        la.labour_attendance_id,
        la.labour_id,
        l.name AS labour_name,
        DATE_FORMAT(la.attendance_date, '%Y-%m-%d') AS attendance_date,
        la.in_time,
        la.out_time,
        la.worker_count,
        la.daily_pay_amount
      FROM labour_attendance la
      JOIN labours l ON la.labour_id = l.labour_id
      WHERE (la.is_deleted = 0 OR la.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND la.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.start_date) { sql += ` AND la.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND la.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY la.attendance_date DESC, l.name ASC`;
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
        COUNT(DISTINCT la.attendance_date) AS days_worked,
        SUM(la.worker_count) AS total_worker_shifts,
        COALESCE(SUM(la.calculated_payment), SUM(la.daily_pay_amount * la.worker_count), 0) AS total_payment
      FROM labours l
      LEFT JOIN labour_attendance la ON l.labour_id = la.labour_id AND (la.is_deleted = 0 OR la.is_deleted IS NULL)
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND l.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.start_date) { sql += ` AND la.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND la.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` GROUP BY l.labour_id, l.name, l.labour_type ORDER BY l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 10. Labour Attendance Cost / Payment Report
  async getLabourCostPaymentReport(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        la.labour_attendance_id,
        l.name AS labour_name,
        l.labour_type,
        c.name AS contractor_name,
        p.project_name,
        t.task_name,
        w.wbs_name AS discipline_name,
        DATE_FORMAT(la.attendance_date, '%Y-%m-%d') AS attendance_date,
        la.in_time,
        la.out_time,
        la.worker_count,
        la.daily_pay_amount,
        COALESCE(la.hourly_rate, round(la.daily_pay_amount / 8, 2)) AS hourly_rate,
        COALESCE(la.calculated_payment, la.daily_pay_amount * la.worker_count) AS calculated_payment,
        (la.daily_pay_amount * la.worker_count) AS total_payment,
        'Processed' AS payment_status
      FROM labour_attendance la
      JOIN labours l ON la.labour_id = l.labour_id
      LEFT JOIN labours c ON l.contractor_id = c.labour_id
      LEFT JOIN projects p ON la.project_id = p.project_id
      LEFT JOIN project_wbs pw ON la.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON la.task_id = t.task_id
      WHERE (la.is_deleted = 0 OR la.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters.labour_id) { sql += ` AND la.labour_id = ?`; params.push(filters.labour_id); }
    if (filters.contractor_id) { sql += ` AND l.contractor_id = ?`; params.push(filters.contractor_id); }
    if (filters.project_id) { sql += ` AND la.project_id = ?`; params.push(filters.project_id); }
    if (filters.start_date) { sql += ` AND la.attendance_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND la.attendance_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY la.attendance_date DESC, la.labour_attendance_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectWorkReport(projectId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
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
      LEFT JOIN labour_attendance la ON t.task_id = la.task_id AND (la.is_deleted = 0 OR la.is_deleted IS NULL)
      LEFT JOIN labours l ON la.labour_id = l.labour_id
      WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      params.push(projectId);
    }

    sql += ` GROUP BY t.task_id, p.project_id, p.project_name, pw.id, w.wbs_name, w.wbs_code, t.task_name, t.status, t.estimated_hours, t.required_worker_count ORDER BY p.project_name ASC, w.wbs_name ASC, t.task_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }
}
