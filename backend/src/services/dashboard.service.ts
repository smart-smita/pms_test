import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export class DashboardService {
  async getExecutiveDashboardMetrics(managerId?: number, employeeId?: number) {
    const today = new Date().toISOString().split('T')[0];
    
    // Construct scope filters
    let empScope = '1=1';
    let prjScope = '1=1';
    let taskScope = '1=1';
    
    if (managerId) {
      empScope = `e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ${managerId})`;
      prjScope = `project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ${managerId})`;
      taskScope = `project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ${managerId})`;
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

    // 3. Today's worker cost calculation
    const [costRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(al.total_working_hours * e.hourly_rate), 0) AS total_cost_today
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.employee_id
      WHERE al.attendance_date = ? AND ${empScope}
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

    // 7. Live Attendance
    const [liveAttendanceRows] = await dbPool.execute<RowDataPacket[]>(`
      SELECT 
        e.name, 
        e.employee_code, 
        r.role_name,
        al.check_in_time, 
        p.project_name 
      FROM attendance_logs al 
      JOIN employees e ON al.employee_id = e.employee_id 
      JOIN roles r ON e.role_id = r.role_id
      LEFT JOIN tasks t ON al.task_id = t.task_id 
      LEFT JOIN projects p ON t.project_id = p.project_id 
      WHERE al.status = 'open' 
      ORDER BY al.check_in_time DESC 
      LIMIT 5
    `);

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
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
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
    };
  }
}
