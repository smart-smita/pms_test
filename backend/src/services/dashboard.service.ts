import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class DashboardService {
  async getExecutiveDashboardMetrics(managerId?: number, employeeId?: number, targetDate?: string) {
    const today = targetDate || new Date().toISOString().split('T')[0];
    
    // Construct scope filters
    let empScope = '1=1';
    let prjScope = '1=1';
    let taskScope = '1=1';
    
    if (managerId) {
      empScope = `(e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ${managerId}) OR e.reporting_to_id = ${managerId} OR e.employee_id = ${managerId})`;
      prjScope = `(
        project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ${managerId})
        OR project_id IN (
          SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id
          WHERE ta.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ${managerId})
          OR ta.employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ${managerId})
          OR ta.employee_id = ${managerId}
        )
        OR project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ${managerId})
        OR project_id IN (SELECT assigned_project_id FROM employees WHERE employee_id = ${managerId})
      )`;
      taskScope = `(
        project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ${managerId})
        OR task_id IN (
          SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ${managerId})
          OR employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ${managerId})
          OR employee_id = ${managerId}
        )
      )`;
    }
    
    if (employeeId) {
      empScope = `e.employee_id = ${employeeId}`;
      prjScope = `project_id IN (SELECT t.project_id FROM tasks t JOIN task_assignments ta ON t.task_id = ta.task_id WHERE ta.employee_id = ${employeeId})`;
      taskScope = `task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ${employeeId})`;
    }

    // 1. Employee metrics
    const [empRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(e.employee_id) AS total_employees,
        SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) AS active_employees
      FROM employees e
      WHERE ${empScope}
    `);

    // 2. Attendance metrics today
    const [attRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(DISTINCT a.employee_id) AS present_today,
        SUM(CASE WHEN a.status = 'open' THEN 1 ELSE 0 END) AS currently_checked_in,
        COALESCE(SUM(a.total_working_hours), 0) AS total_working_hours_today
      FROM attendance_logs a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.attendance_date = ? AND ${empScope}
    `, [today]);

    // 3. Today's worker cost calculation based on logged hours and employee hourly rate
    const [costRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(a.total_working_hours * COALESCE(e.hourly_rate, 0)), 0) AS total_cost_today
      FROM attendance_logs a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.attendance_date = ? AND ${empScope}
    `, [today]);

    // 4. Project metrics
    const [prjRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(project_id) AS total_projects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_projects
      FROM projects
      WHERE ${prjScope}
    `);

    // 5. Task metrics
    const [taskRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(task_id) AS total_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) AS delayed_tasks
      FROM tasks
      WHERE ${taskScope}
    `);

    // 6. Recent Tasks
    const [recentTasksRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        t.task_name, 
        p.project_name, 
        CASE t.status 
          WHEN 'completed' THEN 100 
          WHEN 'in-progress' THEN 50 
          ELSE 0 
        END AS progress_percentage,
        t.target_date AS due_date, 
        t.status 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.project_id 
      ORDER BY t.task_id DESC 
      LIMIT 5
    `);

    // 7. Live Attendance (Currently Open or Today's Latest Check-ins)
    const [liveAttendanceRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        e.name, 
        e.employee_code, 
        COALESCE(r.role_name, 'Employee') AS role_name,
        DATE_FORMAT(al.check_in_time, '%h:%i %p') AS check_in_time, 
        COALESCE(p.project_name, 'Site') AS project_name,
        al.status
      FROM attendance_logs al 
      JOIN employees e ON al.employee_id = e.employee_id 
      LEFT JOIN roles r ON e.role_id = r.role_id
      LEFT JOIN tasks t ON al.task_id = t.task_id 
      LEFT JOIN projects p ON t.project_id = p.project_id 
      WHERE (al.is_deleted = 0 OR al.is_deleted IS NULL) 
        AND al.attendance_date = ?
      ORDER BY 
        (CASE WHEN al.status = 'open' THEN 1 ELSE 2 END) ASC,
        al.check_in_time DESC 
      LIMIT 5
    `, [today]);

    const totalEmps = Number(empRows[0]?.total_employees || 0);
    const presentToday = Number(attRows[0]?.present_today || 0);
    const absentToday = Math.max(0, totalEmps - presentToday);
    const onLeave = 0; // Mocked for now
    const checkedInLive = Number(attRows[0]?.currently_checked_in || 0);
    const hoursToday = Number(attRows[0]?.total_working_hours_today || 0);
    const costToday = Number(costRows[0]?.total_cost_today || 0);

    const totalTasks = Number(taskRows[0]?.total_tasks || 0);
    const completedTasks = Number(taskRows[0]?.completed_tasks || 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 8. Generate 7-day historical chart data (Daily Working Hours)
    const project_progress_history = [];
    const baseDate = targetDate ? new Date(targetDate + 'T12:00:00Z') : new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const [historyRows] = await dbPool.execute<RowDataPacket[]>(`
        SELECT COALESCE(SUM(total_working_hours), 0) AS daily_hours
        FROM attendance_logs
        WHERE attendance_date = ?
      `, [formattedDate]);
      
      project_progress_history.push({
        date: shortDate,
        progress: Number(historyRows[0]?.daily_hours || 0)
      });
    }

    // 9. Task Hours Comparison (Plan vs Actual)
    const [taskHoursRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        t.task_id,
        t.task_name,
        t.start_date,
        t.target_date,
        COALESCE(t.estimated_hours, 0) AS plan_hours,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE task_id = t.task_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_hours,
        t.status
      FROM tasks t
      WHERE ${taskScope} AND t.is_deleted = 0
      ORDER BY t.start_date DESC, t.task_id DESC
      LIMIT 15
    `);

    return {
      employees: {
        total: totalEmps,
        active: Number(empRows[0]?.active_employees || 0),
        present_today: presentToday,
        absent_today: absentToday,
        on_leave: onLeave,
        checked_in_live: checkedInLive,
      },
      today_metrics: {
        working_hours: Math.round(hoursToday * 100) / 100,
        worker_cost: Math.round(costToday * 100) / 100,
      },
      projects: {
        total: Number(prjRows[0]?.total_projects || 0),
        active: Number(prjRows[0]?.active_projects || 0),
        completed: Number(prjRows[0]?.completed_projects || 0),
        overall_progress_percentage: overallProgress,
        history: project_progress_history,
      },
      tasks: {
        total: totalTasks,
        pending: Number(taskRows[0]?.pending_tasks || 0),
        in_progress: Number(taskRows[0]?.in_progress_tasks || 0),
        completed: completedTasks,
        delayed: Number(taskRows[0]?.delayed_tasks || 0),
      },
      recent_tasks: recentTasksRows,
      live_attendance: liveAttendanceRows,
      task_hours_comparison: taskHoursRows,
    };
  }

  async getEmployeeDashboardMetrics(employeeId: number, targetDate?: string) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = targetDate ? new Date(targetDate + 'T12:00:00Z') : new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // 1. Employee Info
    const [empRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT employee_id, employee_code, name, email FROM employees WHERE employee_id = ?`,
      [employeeId]
    );
    const emp = empRows[0] || {};

    // 2. Task metrics
    const [taskRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(t.task_id) AS total_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'delayed' THEN 1 ELSE 0 END) AS delayed_tasks
      FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE ta.employee_id = ?
    `, [employeeId]);

    // 3. Attendance metrics
    const [attSummaryRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(DISTINCT attendance_date) AS present_days,
        SUM(CASE WHEN attendance_date = ? AND status = 'open' THEN 1 ELSE 0 END) AS is_checked_in,
        SUM(CASE WHEN attendance_date = ? THEN total_working_hours ELSE 0 END) AS hours_today
      FROM attendance_logs
      WHERE employee_id = ? AND status != 'outside_area'
    `, [today, today, employeeId]);

    // Week hours (ending at targetDate)
    const [weekRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT COALESCE(SUM(total_working_hours), 0) AS hours_week
      FROM attendance_logs
      WHERE employee_id = ? AND attendance_date >= DATE_SUB(?, INTERVAL 7 DAY) AND attendance_date <= ?
    `, [employeeId, today, today]);

    // Month hours (for the month of targetDate)
    const [monthRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT COALESCE(SUM(total_working_hours), 0) AS hours_month
      FROM attendance_logs
      WHERE employee_id = ? AND MONTH(attendance_date) = MONTH(?) AND YEAR(attendance_date) = YEAR(?)
    `, [employeeId, today, today]);

    // 4. Assigned Projects
    const [prjRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT DISTINCT p.project_id, p.project_code, p.project_name, p.status
      FROM projects p
      JOIN tasks t ON p.project_id = t.project_id
      JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE ta.employee_id = ? AND p.is_deleted = 0
    `, [employeeId]);

    // 5. 7-Day History Chart
    const hoursHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const [hRows] = await dbPool.execute<RowDataPacket[]>(`
        SELECT COALESCE(SUM(total_working_hours), 0) AS daily_hours
        FROM attendance_logs
        WHERE employee_id = ? AND attendance_date = ?
      `, [employeeId, formattedDate]);

      hoursHistory.push({
        date: shortDate,
        hours: Number(hRows[0]?.daily_hours || 0)
      });
    }

    // 6. Task Hours Comparison (Plan vs Actual) for Employee
    const [taskHoursRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        t.task_id,
        t.task_name,
        t.start_date,
        t.target_date,
        COALESCE(t.estimated_hours, 0) AS plan_hours,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE task_id = t.task_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_hours,
        t.status
      FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE ta.employee_id = ? AND t.is_deleted = 0
      ORDER BY t.start_date DESC, t.task_id DESC
      LIMIT 15
    `, [employeeId]);

    // 7. My Activity / My Details Table
    const [activityRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        t.task_id,
        t.task_name,
        t.status AS task_status,
        t.required_worker_count,
        t.estimated_hours,
        t.start_date,
        t.start_time,
        t.target_date AS end_date,
        t.target_time AS end_time,
        p.project_name,
        w.wbs_name,
        COALESCE(SUM(al.total_working_hours), 0) AS logged_hours,
        (
          SELECT status FROM attendance_logs 
          WHERE employee_id = ta.employee_id AND task_id = t.task_id AND attendance_date <= ?
          ORDER BY check_in_time DESC LIMIT 1
        ) AS latest_attendance_status
      FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id AND al.employee_id = ta.employee_id AND al.attendance_date <= ?
      WHERE ta.employee_id = ?
      GROUP BY t.task_id
      ORDER BY t.task_id DESC
    `, [today, today, employeeId]);

    const totalTasks = Number(taskRows[0]?.total_tasks || 0);
    const completedTasks = Number(taskRows[0]?.completed_tasks || 0);
    const isCheckedIn = Number(attSummaryRows[0]?.is_checked_in || 0) > 0;

    return {
      role: 'Employee',
      employee: {
        id: emp.employee_id,
        code: emp.employee_code,
        name: emp.name,
        role_name: 'Employee',
      },
      my_tasks: {
        total: totalTasks,
        pending: Number(taskRows[0]?.pending_tasks || 0),
        in_progress: Number(taskRows[0]?.in_progress_tasks || 0),
        completed: completedTasks,
        delayed: Number(taskRows[0]?.delayed_tasks || 0),
      },
      my_attendance: {
        present_days: Number(attSummaryRows[0]?.present_days || 0),
        today_status: isCheckedIn ? 'Present / Checked-In' : 'Not Checked-In',
        is_checked_in: isCheckedIn,
        hours_today: Math.round(Number(attSummaryRows[0]?.hours_today || 0) * 100) / 100,
        hours_week: Math.round(Number(weekRows[0]?.hours_week || 0) * 100) / 100,
        hours_month: Math.round(Number(monthRows[0]?.hours_month || 0) * 100) / 100,
      },
      my_projects: {
        total: prjRows.length,
        list: prjRows,
      },
      charts: {
        hours_history: hoursHistory,
        task_hours_comparison: taskHoursRows,
      },
      my_activity_details: activityRows,
    };
  }
}
