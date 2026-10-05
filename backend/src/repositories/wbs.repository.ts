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

  async findProjectWbsByProjectId(projectId: number, wbsType?: string): Promise<ProjectWBSRow[]> {
    let sql = `
      SELECT pw.*, 
             COALESCE(pw.wbs_code, w.wbs_code, 'WBS') AS wbs_code, 
             COALESCE(pw.wbs_name, w.wbs_name, 'WBS Item') AS wbs_name,
             COALESCE(pw.wbs_type, w.wbs_type, 'labour') AS wbs_type,
             COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) +
             COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS logged_actual_hours,
             COALESCE((SELECT SUM(cost) FROM timesheets WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) +
             COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost,
             COALESCE((SELECT SUM(actual_cost) FROM project_materials WHERE project_id = pw.project_id AND wbs_id = pw.id), 0) AS actual_material_cost,
             (
               SELECT MIN(work_date) FROM (
                 SELECT log_date AS work_date, project_id, wbs_id FROM timesheets WHERE (is_deleted = 0 OR is_deleted IS NULL)
                 UNION ALL
                 SELECT work_date, project_id, wbs_id FROM labour_work_logs WHERE is_deleted = 0 OR is_deleted IS NULL
               ) AS cd WHERE cd.project_id = pw.project_id AND (cd.wbs_id = pw.id OR cd.wbs_id = pw.wbs_id)
             ) AS computed_actual_start_date,
             (
               SELECT MAX(work_date) FROM (
                 SELECT log_date AS work_date, project_id, wbs_id FROM timesheets WHERE (is_deleted = 0 OR is_deleted IS NULL)
                 UNION ALL
                 SELECT work_date, project_id, wbs_id FROM labour_work_logs WHERE is_deleted = 0 OR is_deleted IS NULL
               ) AS cd WHERE cd.project_id = pw.project_id AND (cd.wbs_id = pw.id OR cd.wbs_id = pw.wbs_id)
             ) AS computed_actual_end_date
      FROM project_wbs pw
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE pw.project_id = ? AND pw.deleted_at IS NULL
    `;
    const params: any[] = [projectId];
    if (wbsType) {
      sql += ` AND (pw.wbs_type = ? OR (pw.wbs_type IS NULL AND w.wbs_type = ?))`;
      params.push(wbsType, wbsType);
    }
    sql += ` ORDER BY pw.id ASC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const isMat = r.wbs_type === 'material';
      const plannedHrs = isMat ? 0 : Number(r.total_hours || 0);
      const loggedHrs = Number(r.logged_actual_hours || 0);
      const storedHrs = Number(r.actual_hours || 0);
      const actualHrs = isMat ? 0 : Math.max(loggedHrs, storedHrs);
      const remainingHrs = isMat ? 0 : Math.max(plannedHrs - actualHrs, 0);
      const varianceHrs = isMat ? 0 : actualHrs - plannedHrs;
      const compPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 10000) / 100, 100) : 0;
      let statusStr = 'Active';
      if (actualHrs === 0 && !isMat) statusStr = 'Planned';
      else if (actualHrs >= plannedHrs && plannedHrs > 0 && !isMat) statusStr = 'Completed';
      else statusStr = 'Active';

      return {
        ...r,
        total_hours: plannedHrs,
        actual_hours: Math.round(actualHrs * 100) / 100,
        remaining_hours: Math.round(remainingHrs * 100) / 100,
        completion_percentage: compPct,
        variance: Math.round(varianceHrs * 100) / 100,
        actual_cost: Number(r.actual_cost || 0),
        actual_material_cost: Number(r.actual_material_cost || 0),
        actual_start_date: r.computed_actual_start_date || r.actual_start_date,
        actual_end_date: r.computed_actual_end_date || r.actual_end_date,
        status: statusStr,
      } as ProjectWBSRow;
    });
  }

  async findProjectWbsById(id: number): Promise<ProjectWBSRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT pw.*, 
              COALESCE(pw.wbs_code, w.wbs_code, 'WBS') AS wbs_code, 
              COALESCE(pw.wbs_name, w.wbs_name, 'WBS Item') AS wbs_name,
              COALESCE(pw.wbs_type, w.wbs_type, 'labour') AS wbs_type,
              COALESCE((SELECT SUM(working_hours) FROM timesheets WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id)), 0) +
              COALESCE((SELECT SUM(total_working_hours) FROM labour_work_logs WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS logged_actual_hours,
              COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = pw.project_id AND (wbs_id = pw.id OR wbs_id = pw.wbs_id) AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_cost
       FROM project_wbs pw
       LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       WHERE (pw.id = ? OR pw.wbs_id = ?) AND pw.deleted_at IS NULL
       ORDER BY pw.id ASC LIMIT 1`,
      [id, id]
    );
    if (!rows[0]) return null;
    const r: any = rows[0];
    const plannedHrs = Number(r.total_hours || 0);
    const loggedHrs = Number(r.logged_actual_hours || 0);
    const storedHrs = Number(r.actual_hours || 0);
    const actualHrs = Math.max(loggedHrs, storedHrs);
    const remainingHrs = Math.max(plannedHrs - actualHrs, 0);
    const varianceHrs = actualHrs - plannedHrs;
    const compPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 10000) / 100, 100) : 0;
    let statusStr = 'Active';
    if (actualHrs === 0) statusStr = 'Planned';
    else if (actualHrs >= plannedHrs && plannedHrs > 0) statusStr = 'Completed';
    else if (actualHrs > 0) statusStr = 'Active';

    return {
      ...r,
      total_hours: plannedHrs,
      actual_hours: Math.round(actualHrs * 100) / 100,
      remaining_hours: Math.round(remainingHrs * 100) / 100,
      completion_percentage: compPct,
      variance: Math.round(varianceHrs * 100) / 100,
      actual_cost: Number(r.actual_cost || 0),
      status: statusStr,
    } as ProjectWBSRow;
  }

  async resolveProjectWbs(projectId: number, wbsId: number): Promise<ProjectWBSRow | null> {
    const list = await this.findProjectWbsByProjectId(projectId);
    const found = list.find((item) => Number(item.id) === Number(wbsId) || Number(item.wbs_id) === Number(wbsId));
    if (found) return found;
    return this.findProjectWbsById(wbsId);
  }

  async createProjectWbs(connection: any, data: {
    project_id: number;
    wbs_id: number;
    wbs_type?: 'labour' | 'material';
    unit?: string;
    planned_quantity?: number;
    rate?: number;
    start_date?: string;
    end_date?: string;
    total_hours?: number;
    actual_start_date?: string;
    actual_end_date?: string;
    actual_hours?: number;
    budget_amount?: number;
    planned_labour_cost?: number;
    planned_material_cost?: number;
    quotation_discipline_id?: number | null;
    note?: string;
  }): Promise<number> {
    const db = connection || dbPool;
    const wbsType = data.wbs_type || 'labour';
    const isMaterial = wbsType === 'material';
    const plannedQty = Number(data.planned_quantity || (isMaterial ? 0 : data.total_hours || 0));
    const rate = Number(data.rate || 0);
    const budget = Number(data.budget_amount || (plannedQty * rate) || 0);
    const plannedLabCost = isMaterial ? 0 : Number(data.planned_labour_cost || budget);
    const plannedMatCost = isMaterial ? Number(data.planned_material_cost || budget) : 0;
    const totalHours = isMaterial ? 0 : Number(data.total_hours || plannedQty);

    const [result] = await db.execute(
      `INSERT INTO project_wbs (
         project_id, wbs_id, wbs_type, unit, planned_quantity, rate,
         start_date, end_date, total_hours, actual_start_date, actual_end_date, actual_hours,
         budget_amount, planned_labour_cost, planned_material_cost, quotation_discipline_id, note
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.wbs_id,
        wbsType,
        data.unit || (isMaterial ? 'Nos' : 'hours'),
        plannedQty,
        rate,
        data.start_date || null,
        data.end_date || null,
        totalHours,
        data.actual_start_date || null,
        data.actual_end_date || null,
        data.actual_hours || 0,
        budget,
        plannedLabCost,
        plannedMatCost,
        data.quotation_discipline_id || null,
        data.note || null
      ]
    );

    const pwId = result.insertId;

    // If it's a material WBS, initialize project_materials record
    if (isMaterial) {
      const [wbsMaster]: any = await db.execute(`SELECT wbs_name FROM work_breakdown_structures WHERE id = ?`, [data.wbs_id]);
      const matName = wbsMaster[0]?.wbs_name || 'Material Item';
      await db.execute(
        `INSERT INTO project_materials (
           project_id, wbs_id, material_name, unit, unit_rate,
           planned_quantity, received_quantity, used_quantity,
           remaining_quantity, extra_quantity,
           planned_cost, actual_cost, remaining_cost, notes
         ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 0, ?, 0, ?, ?)`,
        [
          data.project_id, pwId, matName, data.unit || 'Nos', rate,
          plannedQty, plannedQty, budget, budget, data.note || null
        ]
      );
    }

    // AUTOMATIC TASK CREATION
    // Automatically create a default task for the newly added WBS
    const [wbsMasterForTask]: any = await db.execute(`SELECT wbs_name, wbs_code FROM work_breakdown_structures WHERE id = ?`, [data.wbs_id]);
    const taskName = wbsMasterForTask[0]?.wbs_name || 'Default Task';
    const desc = data.note || `Auto-generated task for ${taskName}`;
    
    await db.execute(
      `INSERT INTO tasks (
        project_id, wbs_id, task_name, description, 
        estimated_hours, start_date, target_date, status, budget_amount,
        planned_labour_cost, planned_material_cost, progress_percentage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 0, NOW())`,
      [
        data.project_id,
        pwId, // link task to project_wbs id
        taskName,
        desc,
        totalHours,
        data.start_date || null,
        data.end_date || null,
        budget,
        plannedLabCost,
        plannedMatCost
      ]
    );

    return pwId;
  }

  async updateProjectWbs(connection: any, id: number, data: Partial<ProjectWBSRow>): Promise<boolean> {
    const db = connection || dbPool;
    const fields: string[] = [];
    const params: any[] = [];

    if (data.wbs_type !== undefined) { fields.push('wbs_type = ?'); params.push(data.wbs_type); }
    if (data.unit !== undefined) { fields.push('unit = ?'); params.push(data.unit || null); }
    if (data.planned_quantity !== undefined) { fields.push('planned_quantity = ?'); params.push(data.planned_quantity); }
    if (data.rate !== undefined) { fields.push('rate = ?'); params.push(data.rate); }
    if (data.budget_amount !== undefined) { fields.push('budget_amount = ?'); params.push(data.budget_amount); }
    if (data.planned_labour_cost !== undefined) { fields.push('planned_labour_cost = ?'); params.push(data.planned_labour_cost); }
    if (data.planned_material_cost !== undefined) { fields.push('planned_material_cost = ?'); params.push(data.planned_material_cost); }
    if (data.start_date !== undefined) { fields.push('start_date = ?'); params.push(data.start_date || null); }
    if (data.end_date !== undefined) { fields.push('end_date = ?'); params.push(data.end_date || null); }
    if (data.total_hours !== undefined) { fields.push('total_hours = ?'); params.push(data.total_hours); }
    if (data.actual_start_date !== undefined) { fields.push('actual_start_date = ?'); params.push(data.actual_start_date || null); }
    if (data.actual_end_date !== undefined) { fields.push('actual_end_date = ?'); params.push(data.actual_end_date || null); }
    if (data.actual_hours !== undefined) { fields.push('actual_hours = ?'); params.push(data.actual_hours || 0); }
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
      `SELECT COUNT(*) AS count FROM labour_work_logs WHERE wbs_id = ?`,
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
