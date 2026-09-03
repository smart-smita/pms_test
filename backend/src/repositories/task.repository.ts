import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { TaskRow } from '../types';

export class TaskRepository {
  constructor() {
    this.ensureTaskTimeColumns().catch(console.error);
  }

  private async ensureTaskTimeColumns() {
    try {
      await dbPool.execute('ALTER TABLE tasks ADD COLUMN start_time TIME NULL AFTER start_date');
    } catch (e: any) {
      // Ignore if exists
    }
    try {
      await dbPool.execute('ALTER TABLE tasks ADD COLUMN target_time TIME NULL AFTER target_date');
    } catch (e: any) {
      // Ignore if exists
    }
  }

  async findAll(projectId?: number, employeeId?: number, status?: string, managerId?: number): Promise<TaskRow[]> {
    let sql = `
      SELECT 
        t.*,
        p.project_name,
        p.latitude AS project_latitude,
        p.longitude AS project_longitude,
        p.radius_meters AS project_radius_meters,
        w.wbs_name,
        COALESCE(SUM(al.total_working_hours), 0) AS actual_hours,
        COUNT(DISTINCT ta.employee_id) AS assigned_worker_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN project_wbs pw ON t.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN attendance_logs al ON t.task_id = al.task_id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND t.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?)`;
      params.push(managerId);
    }

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      params.push(projectId);
    }
    if (employeeId) {
      // In this DB, task_assignments points to employee_id, which is users.id or employees.id.
      // Wait, earlier I saw ta.user_id = ? but here it says ta.employee_id. Let's stick to employee_id.
      sql += ` AND t.task_id IN (SELECT task_id FROM task_assignments WHERE employee_id = ?)`;
      params.push(employeeId);
    }
    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY t.task_id ORDER BY t.task_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    // Fetch assigned workers for each task
    const tasks: TaskRow[] = [];
    for (const r of rows) {
      const assignedEmployees = await this.getAssignedEmployees(r.task_id);
      const assignedCount = Number(r.assigned_worker_count || 0);
      const requiredCount = Number(r.required_worker_count || 1);
      const estimatedHrs = Number(r.estimated_hours || 0);
      const actualHrs = Number(r.actual_hours || 0);

      let currentStatus = r.status;
      const today = new Date().toISOString().split('T')[0];

      if ((currentStatus === 'pending' || currentStatus === 'in-progress') && r.target_date && r.target_date < today) {
        currentStatus = 'delayed';
      }

      let productivityStatus: TaskRow['productivity_status'] = 'on-time';
      if (currentStatus === 'completed') {
        productivityStatus = actualHrs > estimatedHrs ? 'extra-hours-logged' : 'completed';
      } else {
        if (actualHrs > estimatedHrs) {
          productivityStatus = 'exceeding-estimate';
        } else if (currentStatus === 'delayed') {
          productivityStatus = 'delayed';
        }
      }

      tasks.push({
        ...r,
        status: currentStatus,
        actual_hours: Math.round(actualHrs * 100) / 100,
        assigned_worker_count: assignedCount,
        is_understaffed: assignedCount < requiredCount,
        productivity_status: productivityStatus,
        assigned_employees: assignedEmployees,
        assigned_labours: await this.getAssignedLabours(r.task_id),
      } as TaskRow);
    }

    return tasks;
  }

  async findById(id: number): Promise<TaskRow | null> {
    const tasks = await this.findAll(undefined, undefined, undefined);
    return tasks.find((t) => t.task_id === id) || null;
  }

  async getAssignedEmployees(taskId: number): Promise<{ employee_id: number; name: string; employee_code: string }[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.employee_id, e.name, e.employee_code
       FROM task_assignments ta
       JOIN employees e ON ta.employee_id = e.employee_id
       WHERE ta.task_id = ?`,
      [taskId]
    );
    return rows as { employee_id: number; name: string; employee_code: string }[];
  }

  async getAssignedLabours(taskId: number): Promise<{ labour_id: number; name: string; labour_type: string }[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT l.labour_id, l.name, l.labour_type
       FROM task_labour_assignments tla
       JOIN labours l ON tla.labour_id = l.labour_id
       WHERE tla.task_id = ?`,
      [taskId]
    );
    return rows as { labour_id: number; name: string; labour_type: string }[];
  }

  async create(data: {
    project_id: number;
    wbs_id?: number;
    task_name: string;
    description?: string;
    required_worker_count: number;
    estimated_hours: number;
    start_date?: string;
    start_time?: string;
    target_date?: string;
    target_time?: string;
    status: string;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO tasks (project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, start_date, start_time, target_date, target_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.wbs_id || null,
        data.task_name,
        data.description || null,
        data.required_worker_count,
        data.estimated_hours,
        data.start_date || null,
        data.start_time || null,
        data.target_date || null,
        data.target_time || null,
        data.status,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<TaskRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.wbs_id !== undefined) { fields.push('wbs_id = ?'); params.push(data.wbs_id || null); }
    if (data.task_name !== undefined) { fields.push('task_name = ?'); params.push(data.task_name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.required_worker_count !== undefined) { fields.push('required_worker_count = ?'); params.push(data.required_worker_count); }
    if (data.estimated_hours !== undefined) { fields.push('estimated_hours = ?'); params.push(data.estimated_hours); }
    if (data.start_date !== undefined) { fields.push('start_date = ?'); params.push(data.start_date); }
    if (data.start_time !== undefined) { fields.push('start_time = ?'); params.push(data.start_time); }
    if (data.target_date !== undefined) { fields.push('target_date = ?'); params.push(data.target_date); }
    if (data.target_time !== undefined) { fields.push('target_time = ?'); params.push(data.target_time); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE tasks SET ${fields.join(', ')} WHERE task_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async assignWorkers(taskId: number, employeeIds: number[], labourIds: number[] = []): Promise<void> {
    // Delete existing assignments for this task
    await dbPool.execute(`DELETE FROM task_assignments WHERE task_id = ?`, [taskId]);
    await dbPool.execute(`DELETE FROM task_labour_assignments WHERE task_id = ?`, [taskId]);

    if (employeeIds.length > 0) {
      const values = employeeIds.map((empId) => `(${taskId}, ${empId})`).join(', ');
      await dbPool.execute(`INSERT INTO task_assignments (task_id, employee_id) VALUES ${values}`);
    }

    if (labourIds.length > 0) {
      const labourValues = labourIds.map((labourId) => `(${taskId}, ${labourId})`).join(', ');
      await dbPool.execute(`INSERT INTO task_labour_assignments (task_id, labour_id) VALUES ${labourValues}`);
    }
  }

  async softDelete(id: number, deleted_by: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE tasks SET is_deleted = 1, deleted_at = NOW() WHERE task_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE tasks SET status = ? WHERE task_id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  }
}
