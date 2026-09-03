import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { WorkBreakdownStructureRow, ProjectWBSRow } from '../types';

export class WbsRepository {
  async findAllMaster(): Promise<WorkBreakdownStructureRow[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM work_breakdown_structures WHERE deleted_at IS NULL ORDER BY wbs_name ASC`
    );
    return rows as WorkBreakdownStructureRow[];
  }

  async findMasterById(id: number): Promise<WorkBreakdownStructureRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM work_breakdown_structures WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return (rows[0] as WorkBreakdownStructureRow) || null;
  }

  async findMasterByCode(code: string): Promise<WorkBreakdownStructureRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM work_breakdown_structures WHERE wbs_code = ? AND deleted_at IS NULL`,
      [code]
    );
    return (rows[0] as WorkBreakdownStructureRow) || null;
  }

  async createMaster(data: { wbs_code: string; wbs_name: string; description?: string }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, description) VALUES (?, ?, ?)`,
      [data.wbs_code, data.wbs_name, data.description || null]
    );
    return result.insertId;
  }

  // --- Project WBS methods ---

  async findProjectWbsByProjectId(projectId: number): Promise<ProjectWBSRow[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT pw.*, w.wbs_code, w.wbs_name 
       FROM project_wbs pw
       JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       WHERE pw.project_id = ? AND pw.deleted_at IS NULL
       ORDER BY pw.id ASC`,
      [projectId]
    );
    return rows as ProjectWBSRow[];
  }

  async findProjectWbsById(id: number): Promise<ProjectWBSRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT pw.*, w.wbs_code, w.wbs_name 
       FROM project_wbs pw
       JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       WHERE pw.id = ? AND pw.deleted_at IS NULL`,
      [id]
    );
    return (rows[0] as ProjectWBSRow) || null;
  }

  async createProjectWbs(connection: any, data: {
    project_id: number;
    wbs_id: number;
    start_date?: string;
    end_date?: string;
    total_hours?: number;
    note?: string;
  }): Promise<number> {
    const db = connection || dbPool;
    const [result] = await db.execute(
      `INSERT INTO project_wbs (project_id, wbs_id, start_date, end_date, total_hours, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.wbs_id,
        data.start_date || null,
        data.end_date || null,
        data.total_hours || 0,
        data.note || null
      ]
    );
    return result.insertId;
  }

  async updateProjectWbs(connection: any, id: number, data: Partial<ProjectWBSRow>): Promise<boolean> {
    const db = connection || dbPool;
    const fields: string[] = [];
    const params: any[] = [];

    if (data.start_date !== undefined) { fields.push('start_date = ?'); params.push(data.start_date || null); }
    if (data.end_date !== undefined) { fields.push('end_date = ?'); params.push(data.end_date || null); }
    if (data.total_hours !== undefined) { fields.push('total_hours = ?'); params.push(data.total_hours); }
    if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note || null); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await db.execute(
      `UPDATE project_wbs SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async checkDependencies(projectWbsId: number) {
    const [taskRows]: any = await dbPool.execute(
      `SELECT COUNT(*) AS count FROM tasks WHERE wbs_id = ? AND is_deleted = 0`,
      [projectWbsId]
    );
    const [timesheetRows]: any = await dbPool.execute(
      `SELECT COUNT(*) AS count FROM timesheets WHERE wbs_id = ?`,
      [projectWbsId]
    );
    const [labourRows]: any = await dbPool.execute(
      `SELECT COUNT(*) AS count FROM labour_attendance WHERE wbs_id = ?`,
      [projectWbsId]
    );

    const taskCount = Number(taskRows[0]?.count || 0);
    const timesheetCount = Number(timesheetRows[0]?.count || 0);
    const labourAttendanceCount = Number(labourRows[0]?.count || 0);

    return {
      hasDependencies: taskCount > 0 || timesheetCount > 0 || labourAttendanceCount > 0,
      taskCount,
      timesheetCount,
      labourAttendanceCount,
    };
  }

  async softDeleteProjectWbs(connection: any, id: number, deleted_by: number): Promise<boolean> {
    const db = connection || dbPool;
    const [result] = await db.execute(
      `UPDATE project_wbs SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [deleted_by, id]
    );
    return result.affectedRows > 0;
  }
}
