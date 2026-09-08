import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { ProjectRow } from '../types';

export class ProjectRepository {
  async findAll(status?: string, search?: string, managerId?: number, employeeId?: number): Promise<ProjectRow[]> {
    let sql = `
      SELECT 
        p.*,
        COUNT(t.task_id) AS task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_task_count
      FROM projects p
      LEFT JOIN tasks t ON p.project_id = t.project_id AND t.is_deleted = 0
      WHERE p.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?) OR 
        p.project_id IN (SELECT project_id FROM tasks WHERE task_id IN (SELECT task_id FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?))) OR
        p.project_id IN (SELECT assigned_project_id FROM employees WHERE reporting_to_id = ?) OR
        p.project_id IN (SELECT project_id FROM timesheets WHERE employee_id IN (SELECT employee_id FROM employees WHERE reporting_to_id = ?)) OR
        (
          NOT EXISTS (SELECT 1 FROM manager_projects mp WHERE mp.manager_id = ?)
          AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.reporting_to_id = ? AND e2.assigned_project_id IS NOT NULL)
        )
      )`;
      params.push(managerId, managerId, managerId, managerId, managerId, managerId);
    }
    
    if (employeeId) {
      sql += ` AND (
        p.project_id IN (SELECT t2.project_id FROM tasks t2 JOIN task_assignments ta ON t2.task_id = ta.task_id WHERE ta.employee_id = ?) OR
        p.project_id IN (SELECT assigned_project_id FROM employees WHERE employee_id = ? AND assigned_project_id IS NOT NULL) OR
        p.project_id IN (SELECT project_id FROM timesheets WHERE employee_id = ?) OR
        p.project_id IN (SELECT DISTINCT t3.project_id FROM tasks t3 JOIN attendance_logs al ON t3.task_id = al.task_id WHERE al.employee_id = ?) OR
        (
          NOT EXISTS (SELECT 1 FROM employees e WHERE e.employee_id = ? AND e.assigned_project_id IS NOT NULL)
          AND NOT EXISTS (SELECT 1 FROM task_assignments ta2 WHERE ta2.employee_id = ?)
          AND NOT EXISTS (SELECT 1 FROM attendance_logs al2 WHERE al2.employee_id = ?)
        )
      )`;
      params.push(employeeId, employeeId, employeeId, employeeId, employeeId, employeeId, employeeId);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (p.project_name LIKE ? OR p.project_code LIKE ? OR p.client_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` GROUP BY p.project_id ORDER BY p.project_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const taskCount = Number(r.task_count || 0);
      const completedCount = Number(r.completed_task_count || 0);
      const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
      return {
        ...r,
        progress_percentage: progress,
        task_count: taskCount,
        completed_task_count: completedCount,
      } as ProjectRow;
    });
  }

  async findById(id: number, managerId?: number, employeeId?: number): Promise<ProjectRow | null> {
    const projects = await this.findAll(undefined, undefined, managerId, employeeId);
    return projects.find(p => p.project_id === id) || null;
  }

  async findByCode(code: string): Promise<ProjectRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM projects WHERE project_code = ? AND is_deleted = 0`,
      [code]
    );
    return (rows[0] as ProjectRow) || null;
  }

  async create(data: {
    project_code: string;
    project_name: string;
    project_address?: string;
    client_name?: string;
    client_code?: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
    project_date?: string;
    status: string;
    note?: string;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO projects (project_code, project_name, project_address, client_name, client_code, latitude, longitude, radius_meters, project_date, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_code,
        data.project_name,
        data.project_address || null,
        data.client_name || null,
        data.client_code || null,
        data.latitude || null,
        data.longitude || null,
        data.radius_meters || 500,
        data.project_date || null,
        data.status,
        data.note || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<ProjectRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.project_name !== undefined) { fields.push('project_name = ?'); params.push(data.project_name); }
    if (data.project_address !== undefined) { fields.push('project_address = ?'); params.push(data.project_address); }
    if (data.client_name !== undefined) { fields.push('client_name = ?'); params.push(data.client_name); }
    if (data.client_code !== undefined) { fields.push('client_code = ?'); params.push(data.client_code); }
    if (data.latitude !== undefined) { fields.push('latitude = ?'); params.push(data.latitude); }
    if (data.longitude !== undefined) { fields.push('longitude = ?'); params.push(data.longitude); }
    if (data.radius_meters !== undefined) { fields.push('radius_meters = ?'); params.push(data.radius_meters); }
    if (data.project_date !== undefined) { fields.push('project_date = ?'); params.push(data.project_date); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE projects SET ${fields.join(', ')} WHERE project_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDelete(id: number, deleted_by: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE projects SET is_deleted = 1, deleted_at = NOW() WHERE project_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
