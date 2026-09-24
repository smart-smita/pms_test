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
        COALESCE(w.wbs_name, w_direct.wbs_name) AS wbs_name,
        COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE task_id = t.task_id), 0) +
        COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_hours,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE task_id = t.task_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
        COUNT(DISTINCT ta.employee_id) AS assigned_worker_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN project_wbs pw ON (t.wbs_id = pw.id OR (t.wbs_id = pw.wbs_id AND pw.project_id = t.project_id AND pw.deleted_at IS NULL))
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN work_breakdown_structures w_direct ON t.wbs_id = w_direct.id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        t.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) 
        OR t.task_id IN (
          SELECT task_id FROM task_assignments WHERE employee_id IN (
            SELECT employee_id FROM manager_employees WHERE manager_id = ?
          ) OR employee_id IN (
            SELECT employee_id FROM employees WHERE reporting_to_id = ?
          ) OR employee_id = ?
        )
      )`;
      params.push(managerId, managerId, managerId, managerId);
    }

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      params.push(projectId);
    }
    if (employeeId) {
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
      const remainingHrs = Math.max(estimatedHrs - actualHrs, 0);
      const varianceHrs = actualHrs - estimatedHrs;
      const compPct = estimatedHrs > 0 ? Math.min(Math.round((actualHrs / estimatedHrs) * 10000) / 100, 100) : 0;

      let allocStatus: 'Within Allocation' | 'Near Limit' | 'Hours Exceeded' = 'Within Allocation';
      if (actualHrs > estimatedHrs) {
        allocStatus = 'Hours Exceeded';
      } else if (actualHrs >= estimatedHrs * 0.85) {
        allocStatus = 'Near Limit';
      }

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
        remaining_hours: Math.round(remainingHrs * 100) / 100,
        variance: Math.round(varianceHrs * 100) / 100,
        completion_percentage: compPct,
        allocation_status: allocStatus,
        actual_cost: Number(r.actual_cost || 0),
        assigned_worker_count: assignedCount,
        is_understaffed: assignedCount < requiredCount,
        productivity_status: productivityStatus,
        assigned_employees: assignedEmployees,
        assigned_labours: await this.getAssignedLabours(r.task_id),
        dependencies: await this.getDependencies(r.task_id),
      } as unknown as TaskRow);
    }

    return tasks;
  }

  async findById(id: number): Promise<TaskRow | null> {
    const tasks = await this.findAll(undefined, undefined, undefined);
    return tasks.find((t) => t.task_id === id) || null;
  }

  async findByProjectAndWbs(projectId: number, wbsId: number): Promise<TaskRow | null> {
    const tasks = await this.findAll(projectId, undefined, undefined);
    return tasks.find((t) => Number(t.wbs_id) === Number(wbsId)) || null;
  }

  async findByNameAndProjectWbs(projectId: number, wbsId: number | null | undefined, taskName: string): Promise<TaskRow | null> {
    const tasks = await this.findAll(projectId, undefined, undefined);
    const normalizedTarget = taskName.trim().toLowerCase();
    return tasks.find((t) => {
      if (Number(t.project_id) !== Number(projectId)) return false;
      if (wbsId && Number(t.wbs_id) !== Number(wbsId)) return false;
      return t.task_name.trim().toLowerCase() === normalizedTarget;
    }) || null;
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

  async getTaskAllocations(taskId: number): Promise<any[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT wl.work_log_id, wl.labour_id, wl.work_date, wl.amount, wl.work_description, wl.payment_status, l.name as labour_name, l.labour_type
       FROM labour_work_logs wl
       JOIN labours l ON wl.labour_id = l.labour_id
       WHERE wl.task_id = ? AND (wl.is_deleted = 0 OR wl.is_deleted IS NULL)
       ORDER BY wl.work_date ASC`,
      [taskId]
    );
    return rows;
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
    task_address?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO tasks (project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, start_date, start_time, target_date, target_time, status, task_address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.task_address || null,
        data.latitude || null,
        data.longitude || null,
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
    if (data.task_address !== undefined) { fields.push('task_address = ?'); params.push(data.task_address || null); }
    if (data.latitude !== undefined) { fields.push('latitude = ?'); params.push(data.latitude || null); }
    if (data.longitude !== undefined) { fields.push('longitude = ?'); params.push(data.longitude || null); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE tasks SET ${fields.join(', ')} WHERE task_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async assignWorkers(taskId: number, employeeIds: number[], allocations: any[], projectId: number, wbsId?: number): Promise<void> {
    // Delete existing employee assignments
    await dbPool.execute(`DELETE FROM task_assignments WHERE task_id = ?`, [taskId]);
    
    // Legacy labour table cleanup (just in case)
    await dbPool.execute(`DELETE FROM task_labour_assignments WHERE task_id = ?`, [taskId]);

    if (employeeIds.length > 0) {
      const values = employeeIds.map((empId) => `(${taskId}, ${empId})`).join(', ');
      await dbPool.execute(`INSERT INTO task_assignments (task_id, employee_id) VALUES ${values}`);
    }

    // Days-wise Labour / Contractor allocations in labour_work_logs
    // Soft delete existing allocations that are not in the new list, or hard delete if they are just pending allocations?
    // Let's soft delete all 'pending' allocations for this task and recreate, 
    // OR soft delete only the ones missing from the payload.
    // It's safer to just delete and recreate pending allocations to keep it simple, OR update existing.
    
    // First, let's fetch all existing pending allocations for this task.
    // We shouldn't delete 'completed' or 'in_progress' work logs.
    const [existing] = await dbPool.execute<RowDataPacket[]>(
      `SELECT work_log_id FROM labour_work_logs WHERE task_id = ? AND work_status = 'pending' AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [taskId]
    );
    
    const existingIds = existing.map((r) => r.work_log_id);
    const newAllocationIds = allocations.map((a: any) => a.work_log_id).filter(Boolean);
    
    // IDs to delete
    const toDelete = existingIds.filter(id => !newAllocationIds.includes(id));
    if (toDelete.length > 0) {
      await dbPool.execute(
        `UPDATE labour_work_logs SET is_deleted = 1, deleted_at = NOW() WHERE work_log_id IN (${toDelete.join(',')})`
      );
    }

    // Fetch the task address and project address to derive the snapshot
    const [ptRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT t.task_address, t.latitude AS task_lat, t.longitude AS task_lng,
              p.project_address, p.latitude AS proj_lat, p.longitude AS proj_lng
       FROM projects p
       LEFT JOIN tasks t ON t.task_id = ?
       WHERE p.project_id = ?`,
      [taskId, projectId]
    );
    const loc = ptRows[0] || {};
    const useAddr = loc.task_address || loc.project_address || null;
    const useLat = loc.task_lat || loc.proj_lat || null;
    const useLng = loc.task_lng || loc.proj_lng || null;

    // Upsert allocations
    for (const alloc of allocations) {
      if (alloc.work_log_id) {
        // Update existing
        await dbPool.execute(
          `UPDATE labour_work_logs 
           SET labour_id = ?, work_date = ?, amount = ?, work_description = ?, payment_status = ?,
               in_address = ?, out_address = ?,
               in_latitude = ?, in_longitude = ?,
               out_latitude = ?, out_longitude = ?
           WHERE work_log_id = ? AND work_status = 'pending'`,
          [alloc.labour_id, alloc.work_date, alloc.amount || 0, alloc.work_description || null, alloc.payment_status || 'pending',
           useAddr, useAddr, useLat, useLng, useLat, useLng, alloc.work_log_id]
        );
      } else {
        // Insert new
        await dbPool.execute(
          `INSERT INTO labour_work_logs 
           (labour_id, project_id, wbs_id, task_id, work_date, amount, work_description, work_status, payment_status, total_working_hours, rate, in_address, out_address, in_latitude, in_longitude, out_latitude, out_longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
          [alloc.labour_id, projectId, wbsId || null, taskId, alloc.work_date, alloc.amount || 0, alloc.work_description || null, alloc.payment_status || 'pending',
           useAddr, useAddr, useLat, useLng, useLat, useLng]
        );
      }
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
    if (status === 'completed') {
      await dbPool.execute(`UPDATE tasks SET actual_end_date = CURRENT_DATE WHERE task_id = ?`, [id]);
      await this.recalculateDependentTasks(id);
    }
    return result.affectedRows > 0;
  }

  async getDependencies(taskId: number): Promise<any[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT d.*, t.task_name as predecessor_name 
       FROM task_dependencies d
       JOIN tasks t ON d.predecessor_task_id = t.task_id
       WHERE d.task_id = ?`,
      [taskId]
    );
    return rows;
  }

  async updateDependencies(taskId: number, dependencies: { predecessor_task_id: number; dependency_type: string; lag_days?: number }[]): Promise<void> {
    await dbPool.execute(`DELETE FROM task_dependencies WHERE task_id = ?`, [taskId]);
    
    if (dependencies && dependencies.length > 0) {
      for (const dep of dependencies) {
        await dbPool.execute(
          `INSERT INTO task_dependencies (task_id, predecessor_task_id, dependency_type, lag_days) VALUES (?, ?, ?, ?)`,
          [taskId, dep.predecessor_task_id, dep.dependency_type || 'FS', dep.lag_days || 0]
        );
      }
      await this.recalculateDependentTasks(dependencies[0].predecessor_task_id);
    }
  }

  async recalculateDependentTasks(taskId: number): Promise<void> {
    // 1. Get task details
    const [taskRows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM tasks WHERE task_id = ?`, [taskId]
    );
    if (taskRows.length === 0) return;
    const task = taskRows[0];
    
    // The reference date is actual_end_date if completed, otherwise target_date
    const refDateStr = task.actual_end_date || task.target_date;
    if (!refDateStr) return; // No date to base dependencies on
    
    const refDate = new Date(refDateStr);

    // 2. Find dependents
    const [dependents] = await dbPool.execute<RowDataPacket[]>(
      `SELECT d.*, t.target_date, t.start_date, t.estimated_hours, t.status 
       FROM task_dependencies d
       JOIN tasks t ON d.task_id = t.task_id
       WHERE d.predecessor_task_id = ? AND t.status != 'completed'`,
      [taskId]
    );

    // 3. Shift dependents
    for (const dep of dependents) {
      if (dep.dependency_type === 'FS') {
        const newStart = new Date(refDate);
        newStart.setDate(newStart.getDate() + (dep.lag_days || 0) + 1);
        
        // Calculate original duration
        let durationDays = 1;
        if (dep.start_date && dep.target_date) {
           const sd = new Date(dep.start_date);
           const td = new Date(dep.target_date);
           durationDays = Math.max(1, Math.round((td.getTime() - sd.getTime()) / (1000 * 3600 * 24)));
        }

        const newTarget = new Date(newStart);
        newTarget.setDate(newTarget.getDate() + durationDays);

        const newStartStr = newStart.toISOString().split('T')[0];
        const newTargetStr = newTarget.toISOString().split('T')[0];

        // Update if changed
        if (newStartStr !== (dep.start_date instanceof Date ? dep.start_date.toISOString().split('T')[0] : dep.start_date) || 
            newTargetStr !== (dep.target_date instanceof Date ? dep.target_date.toISOString().split('T')[0] : dep.target_date)) {
            
            await dbPool.execute(
              `UPDATE tasks SET start_date = ?, target_date = ? WHERE task_id = ?`,
              [newStartStr, newTargetStr, dep.task_id]
            );
            
            // Recurse
            await this.recalculateDependentTasks(dep.task_id);
        }
      }
    }
  }
}
