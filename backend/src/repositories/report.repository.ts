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
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      params.push(filters.manager_id, filters.manager_id, filters.manager_id);
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
        '' AS description,
        COALESCE(pw.status, 'Active') AS status,
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
    sql += ` GROUP BY w.id, w.wbs_code, w.wbs_name, pw.status, p.project_name, p.project_code ORDER BY w.wbs_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 3. Employee Attendance Report 1 – Day Wise Hrs & Addresses
  async getEmployeeAttendanceReport1(filters: any): Promise<any[]> {
    const joinConditions: string[] = [
      `al.employee_id = e.employee_id`,
      `(al.is_deleted = 0 OR al.is_deleted IS NULL)`
    ];
    const whereParams: any[] = [];
    
    if (filters.start_date) { joinConditions.push(`al.attendance_date >= ?`); whereParams.push(filters.start_date); }
    if (filters.end_date) { joinConditions.push(`al.attendance_date <= ?`); whereParams.push(filters.end_date); }

    let sql = `
      SELECT 
        al.attendance_id,
        e.employee_id,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        e.employee_code,
        e.name AS employee_name,
        p.project_name,
        t.task_name,
        DATE_FORMAT(al.check_in_time, '%h:%i:%s %p') AS in_time,
        DATE_FORMAT(al.check_out_time, '%h:%i:%s %p') AS out_time,
        DATE_FORMAT(al.check_in_time, '%H:%i') AS in_time_short,
        DATE_FORMAT(al.check_out_time, '%H:%i') AS out_time_short,
        COALESCE(p.project_address, '') AS project_address,
        al.total_working_hours,
        al.status
      FROM employees e
      LEFT JOIN attendance_logs al ON ${joinConditions.join(' AND ')}
      LEFT JOIN tasks t ON al.task_id = t.task_id
      LEFT JOIN projects p ON p.project_id = COALESCE(t.project_id, e.assigned_project_id)
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;

    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; whereParams.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      whereParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { 
      sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; 
      whereParams.push(filters.project_id, filters.project_id); 
    }

    sql += ` ORDER BY al.attendance_date DESC, al.check_in_time DESC, e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, whereParams);

    // Fetch labour details independently based on task_assignments
    let labourSql = `
      SELECT 
        ta.employee_id,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        CONCAT('[', GROUP_CONCAT(
          JSON_OBJECT(
            'labour_name', l.name,
            'labour_type', l.labour_type,
            'amount', wl.amount,
            'payment_status', wl.payment_status
          )
        ), ']') AS labour_details
      FROM labour_work_logs wl
      JOIN labours l ON wl.labour_id = l.labour_id
      JOIN task_assignments ta ON wl.task_id = ta.task_id
      JOIN employees e ON ta.employee_id = e.employee_id
      WHERE (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
        AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const labourParams: any[] = [];
    if (filters.start_date) { labourSql += ` AND wl.work_date >= ?`; labourParams.push(filters.start_date); }
    if (filters.end_date) { labourSql += ` AND wl.work_date <= ?`; labourParams.push(filters.end_date); }
    if (filters.employee_id) { labourSql += ` AND ta.employee_id = ?`; labourParams.push(filters.employee_id); }
    if (filters.manager_id) {
      labourSql += ` AND (ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      labourParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) {
      labourSql += ` AND (wl.project_id = ? OR e.assigned_project_id = ?)`;
      labourParams.push(filters.project_id, filters.project_id);
    }
    labourSql += ` GROUP BY ta.employee_id, wl.work_date`;
    
    const [labourRows] = await dbPool.execute<RowDataPacket[]>(labourSql, labourParams);

    // Merge labour details into main rows
    const labourMap = new Map<string, string>();
    labourRows.forEach(lr => {
      labourMap.set(`${lr.employee_id}_${lr.attendance_date}`, lr.labour_details);
    });

    const existingDates = new Set<string>();
    rows.forEach(r => {
      if (r.attendance_date) {
        existingDates.add(`${r.employee_id}_${r.attendance_date}`);
        r.labour_details = labourMap.get(`${r.employee_id}_${r.attendance_date}`) || null;
      }
    });

    labourRows.forEach(lr => {
      const key = `${lr.employee_id}_${lr.attendance_date}`;
      if (!existingDates.has(key)) {
        const empBase = rows.find(r => r.employee_id === lr.employee_id);
        if (empBase) {
          rows.push({
            ...empBase,
            attendance_date: lr.attendance_date,
            in_time: null,
            out_time: null,
            in_time_short: null,
            out_time_short: null,
            total_working_hours: 0,
            status: null,
            labour_details: lr.labour_details
          });
        }
      }
    });

    return rows;
  }

  // 4. Employee Attendance Report 2 – Day Wise In/Out & Hours
  async getEmployeeAttendanceReport2(filters: any): Promise<any[]> {
    const joinConditions: string[] = [
      `al.employee_id = e.employee_id`,
      `(al.is_deleted = 0 OR al.is_deleted IS NULL)`
    ];
    const whereParams: any[] = [];
    
    if (filters.start_date) { joinConditions.push(`al.attendance_date >= ?`); whereParams.push(filters.start_date); }
    if (filters.end_date) { joinConditions.push(`al.attendance_date <= ?`); whereParams.push(filters.end_date); }

    let sql = `
      SELECT 
        al.attendance_id,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        e.employee_code,
        e.name AS employee_name,
        DATE_FORMAT(al.check_in_time, '%h:%i:%s %p') AS in_time,
        DATE_FORMAT(al.check_out_time, '%h:%i:%s %p') AS out_time,
        al.total_working_hours
      FROM employees e
      LEFT JOIN attendance_logs al ON ${joinConditions.join(' AND ')}
      LEFT JOIN tasks t ON al.task_id = t.task_id
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;

    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; whereParams.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      whereParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { 
      sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; 
      whereParams.push(filters.project_id, filters.project_id); 
    }

    sql += ` ORDER BY al.attendance_date DESC, e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, whereParams);
    return rows;
  }

  // 5. Employee Attendance Report 3 – Summary
  async getEmployeeAttendanceReport3(filters: any): Promise<any[]> {
    const joinConditions: string[] = [
      `al.employee_id = e.employee_id`,
      `(al.is_deleted = 0 OR al.is_deleted IS NULL)`
    ];
    const whereParams: any[] = [];
    
    if (filters.start_date) { joinConditions.push(`al.attendance_date >= ?`); whereParams.push(filters.start_date); }
    if (filters.end_date) { joinConditions.push(`al.attendance_date <= ?`); whereParams.push(filters.end_date); }

    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.name AS employee_name,
        COUNT(DISTINCT al.attendance_date) AS days_present,
        COALESCE(SUM(al.total_working_hours), 0) AS total_working_hours,
        ROUND(COALESCE(AVG(al.total_working_hours), 0), 2) AS avg_hours_per_day
      FROM employees e
      LEFT JOIN attendance_logs al ON ${joinConditions.join(' AND ')}
      LEFT JOIN tasks t ON al.task_id = t.task_id
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;

    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; whereParams.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      whereParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.project_id) { 
      sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; 
      whereParams.push(filters.project_id, filters.project_id); 
    }

    sql += ` GROUP BY e.employee_id, e.employee_code, e.name ORDER BY e.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, whereParams);
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
        c.name AS contractor_name,
        p.project_name,
        w.wbs_name,
        t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.in_address,
        wl.out_address,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS calculated_payment,
        wl.payment_status,
        wl.work_description AS comment
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
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.wbs_id) { sql += ` AND pw.wbs_id = ?`; params.push(filters.wbs_id); }
    if (filters.task_id) { sql += ` AND wl.task_id = ?`; params.push(filters.task_id); }
    if (filters.manager_id) {
      sql += ` AND (
        wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)
      )`;
      params.push(filters.manager_id, filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date ASC, l.name ASC`;
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
        l.labour_type,
        c.name AS contractor_name,
        p.project_name,
        w.wbs_name AS discipline_name,
        t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.in_address,
        wl.out_address,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS daily_pay_amount,
        wl.payment_status,
        wl.work_description AS comment
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
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.wbs_id) { sql += ` AND pw.wbs_id = ?`; params.push(filters.wbs_id); }
    if (filters.task_id) { sql += ` AND wl.task_id = ?`; params.push(filters.task_id); }
    if (filters.manager_id) {
      sql += ` AND (
        wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)
      )`;
      params.push(filters.manager_id, filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date ASC, l.name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 9. Labour Attendance Report 3 – Summary
  async getLabourAttendanceReport3(filters: any): Promise<any[]> {
    let sql = `
      SELECT 
        wl.work_log_id AS labour_attendance_id,
        l.labour_id,
        l.name AS labour_name,
        l.labour_type,
        c.name AS contractor_name,
        p.project_name,
        w.wbs_name AS discipline_name,
        t.task_name,
        DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS attendance_date,
        wl.in_time,
        wl.out_time,
        wl.in_address,
        wl.out_address,
        wl.total_working_hours,
        wl.rate_type,
        wl.rate,
        wl.amount AS total_payment,
        wl.payment_status,
        wl.work_description AS comment
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
    if (filters.project_id) { sql += ` AND wl.project_id = ?`; params.push(filters.project_id); }
    if (filters.wbs_id) { sql += ` AND pw.wbs_id = ?`; params.push(filters.wbs_id); }
    if (filters.task_id) { sql += ` AND wl.task_id = ?`; params.push(filters.task_id); }
    if (filters.manager_id) {
      sql += ` AND (
        wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)
      )`;
      params.push(filters.manager_id, filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date ASC, l.name ASC`;
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
        wl.in_address,
        wl.out_address,
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
      sql += ` AND (
        wl.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        wl.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)
      )`;
      params.push(filters.manager_id, filters.manager_id, filters.manager_id, filters.manager_id);
    }
    if (filters.start_date) { sql += ` AND wl.work_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND wl.work_date <= ?`; params.push(filters.end_date); }

    sql += ` ORDER BY wl.work_date DESC, wl.work_log_id DESC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  // 11. Employee Attendance Day Wise Report View 2 – Matrix (In/Out + Hrs per date)
  async getEmployeeAttendanceDayWiseReport2(filters: any): Promise<any[]> {
    const joinConditions: string[] = [
      `al.employee_id = e.employee_id`,
      `(al.is_deleted = 0 OR al.is_deleted IS NULL)`
    ];
    const whereParams: any[] = [];
    
    if (filters.start_date) { joinConditions.push(`al.attendance_date >= ?`); whereParams.push(filters.start_date); }
    if (filters.end_date) { joinConditions.push(`al.attendance_date <= ?`); whereParams.push(filters.end_date); }

    let sql = `
      SELECT 
        al.attendance_id,
        e.employee_id,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        e.employee_code,
        e.name AS employee_name,
        DATE_FORMAT(al.check_in_time, '%H:%i') AS in_time_short,
        DATE_FORMAT(al.check_out_time, '%H:%i') AS out_time_short,
        al.check_in_time,
        al.check_out_time,
        al.total_working_hours,
        al.status,
        COALESCE(p.project_address, '') AS project_address
      FROM employees e
      LEFT JOIN attendance_logs al ON ${joinConditions.join(' AND ')}
      LEFT JOIN tasks t ON al.task_id = t.task_id
      LEFT JOIN projects p ON p.project_id = COALESCE(t.project_id, e.assigned_project_id)
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;

    if (filters.employee_id) { sql += ` AND e.employee_id = ?`; whereParams.push(filters.employee_id); }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      whereParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }
    // We didn't have project filter here before, adding it for consistency
    if (filters.project_id) { 
      sql += ` AND (t.project_id = ? OR e.assigned_project_id = ?)`; 
      whereParams.push(filters.project_id, filters.project_id); 
    }

    sql += ` ORDER BY e.name ASC, al.attendance_date ASC, al.check_in_time ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, whereParams);
    return rows;
  }

  // 12. Employee Attendance Summary Matrix – All employees, per-date status for day-wise matrix view
  async getEmployeeAttendanceSummaryMatrix(filters: any): Promise<any[]> {
    // Build date range conditions as sub-query conditions inside the LEFT JOIN
    // so ALL employees appear even if they have no attendance in the date range
    const joinConditions: string[] = [
      `al.employee_id = e.employee_id`,
      `(al.is_deleted = 0 OR al.is_deleted IS NULL)`,
    ];
    const joinParams: any[] = [];

    if (filters.start_date) {
      joinConditions.push(`al.attendance_date >= ?`);
      joinParams.push(filters.start_date);
    }
    if (filters.end_date) {
      joinConditions.push(`al.attendance_date <= ?`);
      joinParams.push(filters.end_date);
    }

    let sql = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.name AS employee_name,
        DATE_FORMAT(al.attendance_date, '%Y-%m-%d') AS attendance_date,
        al.status,
        al.total_working_hours,
        DATE_FORMAT(al.check_in_time, '%H:%i') AS in_time_short,
        DATE_FORMAT(al.check_out_time, '%H:%i') AS out_time_short,
        COALESCE(p.project_address, '') AS project_address
      FROM employees e
      LEFT JOIN attendance_logs al ON ${joinConditions.join(' AND ')}
      LEFT JOIN tasks t ON al.task_id = t.task_id
      LEFT JOIN projects p ON p.project_id = COALESCE(t.project_id, e.assigned_project_id)
      WHERE (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;

    const whereParams: any[] = [...joinParams];

    if (filters.employee_id) {
      sql += ` AND e.employee_id = ?`;
      whereParams.push(filters.employee_id);
    }
    if (filters.manager_id) {
      sql += ` AND (e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?) OR e.reporting_to_id = ? OR e.employee_id = ?)`;
      whereParams.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }

    sql += ` ORDER BY e.name ASC, al.attendance_date ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, whereParams);
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
        t.estimated_hours AS planned_hours,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE task_id = t.task_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_hours,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
        t.required_worker_count,
        GROUP_CONCAT(DISTINCT e.name SEPARATOR ', ') AS assigned_employee_name,
        GROUP_CONCAT(DISTINCT l.name SEPARATOR ', ') AS assigned_labour_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
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
        t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)) OR
        t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)
      )`;
      params.push(managerId, managerId, managerId, managerId);
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

    return rows.map((r: any) => {
      const plannedHrs = Number(r.planned_hours || 0);
      const actualHrs = Number(r.actual_hours || 0);
      const remainingHrs = Math.max(plannedHrs - actualHrs, 0);
      const varianceHrs = actualHrs - plannedHrs;
      const compPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 10000) / 100, 100) : 0;

      return {
        ...r,
        planned_hours: Math.round(plannedHrs * 100) / 100,
        actual_hours: Math.round(actualHrs * 100) / 100,
        remaining_hours: Math.round(remainingHrs * 100) / 100,
        completion_percentage: compPct,
        variance: Math.round(varianceHrs * 100) / 100,
        actual_cost: Number(r.actual_cost || 0),
      };
    });
  }

  // 13. Project Budget Report
  async getProjectBudgetReport(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        p.budget_amount,
        COALESCE((SELECT SUM(budget_amount) FROM project_wbs WHERE project_id = p.project_id AND deleted_at IS NULL), 0) AS allocated_budget,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
        COALESCE((SELECT SUM(total_amount) FROM labour_payments WHERE project_id = p.project_id AND status = 'paid'), 0) AS paid_amount
      FROM projects p
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters?.project_id) { sql += ` AND p.project_id = ?`; params.push(filters.project_id); }
    sql += ` ORDER BY p.project_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const budget = Number(r.budget_amount || 0);
      const allocated = Number(r.allocated_budget || 0);
      const actualCost = Number(r.actual_cost || 0);
      const paid = Number(r.paid_amount || 0);
      const pending = Math.max(actualCost - paid, 0);
      const remainingBudget = budget - actualCost;
      const variance = budget - actualCost;

      return {
        ...r,
        budget_amount: budget,
        allocated_budget: allocated,
        actual_cost: actualCost,
        paid_amount: paid,
        pending_amount: pending,
        remaining_budget: remainingBudget,
        budget_variance: variance,
        is_exceeded: actualCost > budget,
      };
    });
  }

  // 14. Project Summary Report
  async getProjectSummaryReport(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        p.budget_amount,
        COUNT(DISTINCT pw.id) AS total_disciplines,
        COUNT(DISTINCT CASE WHEN pw.status = 'Completed' OR pw.status = 2 THEN pw.id END) AS completed_disciplines,
        COUNT(DISTINCT CASE WHEN pw.status = 'Active' OR pw.status = 1 THEN pw.id END) AS active_disciplines,
        COUNT(DISTINCT t.task_id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.task_id END) AS completed_tasks,
        COALESCE(SUM(t.estimated_hours), 0) AS total_planned_hours,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE project_id = p.project_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS total_actual_hours,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
        COALESCE((SELECT SUM(total_amount) FROM labour_payments WHERE project_id = p.project_id AND status = 'paid'), 0) AS paid_amount
      FROM projects p
      LEFT JOIN project_wbs pw ON p.project_id = pw.project_id AND pw.deleted_at IS NULL
      LEFT JOIN tasks t ON p.project_id = t.project_id AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters?.project_id) { sql += ` AND p.project_id = ?`; params.push(filters.project_id); }
    sql += ` GROUP BY p.project_id, p.project_name, p.project_code, p.budget_amount ORDER BY p.project_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const plannedHrs = Number(r.total_planned_hours || 0);
      const actualHrs = Number(r.total_actual_hours || 0);
      const remainingHrs = Math.max(plannedHrs - actualHrs, 0);
      const compPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 10000) / 100, 100) : 0;
      
      const budget = Number(r.budget_amount || 0);
      const actualCost = Number(r.actual_cost || 0);
      const paid = Number(r.paid_amount || 0);
      const pending = Math.max(actualCost - paid, 0);

      return {
        ...r,
        total_planned_hours: Math.round(plannedHrs * 100) / 100,
        total_actual_hours: Math.round(actualHrs * 100) / 100,
        total_remaining_hours: Math.round(remainingHrs * 100) / 100,
        completion_percentage: compPct,
        budget_amount: budget,
        actual_cost: actualCost,
        paid_amount: paid,
        pending_amount: pending,
      };
    });
  }

  // 15. Project Profit & Loss Report
  async getProjectProfitLossReport(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        c.customer_name,
        COALESCE((SELECT SUM(total_amount) FROM quotations WHERE project_id = p.project_id AND status='approved'), 0) AS contract_value,
        COALESCE((SELECT SUM(total_amount) FROM invoices WHERE project_id = p.project_id), 0) AS invoice_value,
        COALESCE((SELECT SUM(total_amount) FROM invoices WHERE project_id = p.project_id AND status IN ('paid', 'partially_paid')), 0) AS collected_value,
        COALESCE((SELECT SUM(budget_amount) FROM tasks WHERE project_id = p.project_id), 0) AS planned_cost,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_labour_cost,
        COALESCE((SELECT SUM(actual_cost) FROM material_logs WHERE project_id = p.project_id), 0) AS actual_material_cost
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters?.project_id) { sql += ` AND p.project_id = ?`; params.push(filters.project_id); }
    sql += ` ORDER BY p.project_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const revenue = Number(r.invoice_value || 0); // revenue is invoiced amount
      const actualCost = Number(r.actual_labour_cost || 0) + Number(r.actual_material_cost || 0);
      const profitLoss = revenue - actualCost;
      const profitMargin = revenue > 0 ? (profitLoss / revenue) * 100 : 0;

      return {
        ...r,
        contract_value: Number(r.contract_value),
        invoice_value: revenue,
        collected_value: Number(r.collected_value),
        planned_cost: Number(r.planned_cost),
        actual_labour_cost: Number(r.actual_labour_cost),
        actual_material_cost: Number(r.actual_material_cost),
        other_cost: 0,
        total_actual_cost: actualCost,
        profit_loss: profitLoss,
        profit_margin_percentage: Math.round(profitMargin * 100) / 100,
      };
    });
  }

  // 16. Planned vs Actual Report
  async getPlannedVsActualReport(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_name,
        w.wbs_name,
        t.task_name,
        t.estimated_hours AS planned_labour_hours,
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_labour_hours,
        t.budget_amount AS planned_labour_cost,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_labour_cost,
        COALESCE((SELECT SUM(planned_quantity) FROM material_planning WHERE task_id = t.task_id), 0) AS planned_material_quantity,
        COALESCE((SELECT SUM(quantity) FROM material_logs WHERE task_id = t.task_id), 0) AS actual_material_quantity,
        COALESCE((SELECT SUM(planned_cost) FROM material_planning WHERE task_id = t.task_id), 0) AS planned_material_cost,
        COALESCE((SELECT SUM(actual_cost) FROM material_logs WHERE task_id = t.task_id), 0) AS actual_material_cost
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id
      LEFT JOIN project_wbs w ON t.wbs_id = w.id
      WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL)
    `;
    const params: any[] = [];
    if (filters?.project_id) { sql += ` AND t.project_id = ?`; params.push(filters.project_id); }
    sql += ` ORDER BY p.project_name ASC, w.wbs_name ASC, t.task_name ASC`;
    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const plannedTotal = Number(r.planned_labour_cost || 0) + Number(r.planned_material_cost || 0);
      const actualTotal = Number(r.actual_labour_cost || 0) + Number(r.actual_material_cost || 0);

      return {
        ...r,
        hour_variance: Number(r.planned_labour_hours || 0) - Number(r.actual_labour_hours || 0),
        labour_cost_variance: Number(r.planned_labour_cost || 0) - Number(r.actual_labour_cost || 0),
        material_quantity_variance: Number(r.planned_material_quantity || 0) - Number(r.actual_material_quantity || 0),
        material_cost_variance: Number(r.planned_material_cost || 0) - Number(r.actual_material_cost || 0),
        planned_total_cost: plannedTotal,
        actual_total_cost: actualTotal,
        total_variance: plannedTotal - actualTotal,
      };
    });
  }
}
