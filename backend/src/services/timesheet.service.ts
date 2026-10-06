import { TimesheetRepository, TimesheetRow } from '../repositories/timesheet.repository';
import { TaskRepository } from '../repositories/task.repository';
import { WbsRepository } from '../repositories/wbs.repository';

export class TimesheetService {
  private timesheetRepo = new TimesheetRepository();
  private taskRepo = new TaskRepository();
  private wbsRepo = new WbsRepository();

  async getTimesheets(projectId?: number, wbsId?: number, taskId?: number, employeeId?: number, startDate?: string, endDate?: string, managerId?: number): Promise<TimesheetRow[]> {
    return await this.timesheetRepo.findAll(projectId, wbsId, taskId, employeeId, startDate, endDate, managerId);
  }

  async getTimesheetById(id: number): Promise<TimesheetRow> {
    const ts = await this.timesheetRepo.findById(id);
    if (!ts) throw new Error('Timesheet entry not found');
    return ts;
  }

  async getTaskLogHistory(taskId: number) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    const logs = await this.timesheetRepo.findByTaskId(taskId);
    const totalLoggedHours = logs.reduce((sum, item) => sum + Number(item.working_hours || 0), 0);
    const plannedHours = Number(task.estimated_hours || 0);
    const remainingHours = Math.max(0, plannedHours - totalLoggedHours);

    return {
      task: {
        task_id: task.task_id,
        task_name: task.task_name,
        project_id: task.project_id,
        project_name: task.project_name,
        wbs_id: task.wbs_id,
        wbs_name: task.wbs_name,
        estimated_hours: plannedHours,
        actual_hours: totalLoggedHours,
        status: task.status,
      },
      total_logged_hours: totalLoggedHours,
      remaining_hours: remainingHours,
      logs,
    };
  }

  async createTimesheet(data: {
    project_id?: number;
    wbs_id?: number | null;
    task_id?: number | null;
    task_name?: string | null;
    employee_id: number;
    log_date: string;
    working_hours: number;
    comment?: string | null;
  }): Promise<TimesheetRow> {
    if (!data.employee_id) throw new Error('Employee ID is required');
    if (!data.log_date) throw new Error('Log date is required');
    if (!data.working_hours || data.working_hours <= 0) throw new Error('Working hours is required and must be greater than 0');

    let finalTaskId: number | null = data.task_id ? Number(data.task_id) : null;
    let projectId = data.project_id;
    let wbsId = data.wbs_id;

    if (!finalTaskId) {
      if (!projectId) throw new Error('Project ID is required to log timesheet');

      let wbsName = 'General Work';
      let resolvedWbsId = wbsId || null;

      if (wbsId) {
        const resolvedWbs = await this.wbsRepo.resolveProjectWbs(projectId, wbsId);
        if (resolvedWbs) {
          resolvedWbsId = resolvedWbs.id;
          if (resolvedWbs.wbs_name) {
            wbsName = resolvedWbs.wbs_name;
          }
        }
      }

      // If no task_id, we either find by task_name or create a new one
      let existingTask = null;
      if (resolvedWbsId && data.task_name) {
        // Try to find if a task with this EXACT name exists in this WBS
        existingTask = await this.taskRepo.findByNameAndProjectWbs(projectId, resolvedWbsId, data.task_name);
      }

      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        // Create Task automatically
        finalTaskId = await this.taskRepo.create({
          project_id: projectId,
          wbs_id: resolvedWbsId || undefined,
          task_name: data.task_name || `${wbsName}`,
          description: `Auto-created task from timesheet log on ${data.log_date}`,
          required_worker_count: 1,
          estimated_hours: data.working_hours,
          start_date: data.log_date,
          start_time: '09:00:00',
          target_date: data.log_date,
          target_time: '18:00:00',
          status: 'in-progress',
        });
      }

      // Assign employee to task if not assigned
      const assignedEmps = await this.taskRepo.getAssignedEmployees(finalTaskId);
      if (!assignedEmps.some((e) => e.employee_id === data.employee_id)) {
        const existingEmpIds = assignedEmps.map((e) => e.employee_id);
        await this.taskRepo.assignWorkers(finalTaskId, [...existingEmpIds, data.employee_id], [], projectId, wbsId || undefined);
      }

      wbsId = resolvedWbsId;
    } else {
      const task = await this.taskRepo.findById(finalTaskId);
      if (!task) throw new Error('Selected task does not exist');
      if (!projectId) projectId = task.project_id;
      if (wbsId === undefined || wbsId === null) wbsId = task.wbs_id;

      // Assign employee to existing task if not already assigned
      const assignedEmps = await this.taskRepo.getAssignedEmployees(finalTaskId);
      if (!assignedEmps.some((e) => e.employee_id === data.employee_id)) {
        const existingEmpIds = assignedEmps.map((e) => e.employee_id);
        await this.taskRepo.assignWorkers(finalTaskId, [...existingEmpIds, data.employee_id], [], projectId, wbsId || undefined);
      }
    }

    const id = await this.timesheetRepo.create({
      project_id: projectId!,
      wbs_id: wbsId || null,
      task_id: finalTaskId,
      employee_id: data.employee_id,
      log_date: data.log_date,
      working_hours: data.working_hours,
      comment: data.comment,
    });

    return (await this.timesheetRepo.findById(id))!;
  }

  async createUnifiedLog(data: {
    project_id?: number;
    wbs_id?: number | null;
    task_id?: number | null;
    task_name?: string | null;
    employee_id?: number;
    labour_id?: number;
    material_id?: number;
    material_qty?: number;
    material_rate?: number;
    log_date: string;
    working_hours: number;
    comment?: string | null;
  }) {
    if (!data.employee_id && !data.labour_id) throw new Error('Employee or Labour ID is required');
    if (!data.log_date) throw new Error('Log date is required');
    if (!data.working_hours || data.working_hours <= 0) throw new Error('Working hours must be greater than 0');

    // Create the task using the existing createTimesheet helper logic but stripped down for task finding/creation
    let finalTaskId: number | null = data.task_id ? Number(data.task_id) : null;
    let projectId = data.project_id;
    let wbsId = data.wbs_id;

    if (!finalTaskId) {
      if (!projectId) throw new Error('Project ID is required to log timesheet');

      let wbsName = 'General Work';
      let resolvedWbsId = wbsId || null;

      if (wbsId) {
        const resolvedWbs = await this.wbsRepo.resolveProjectWbs(projectId, wbsId);
        if (resolvedWbs) {
          resolvedWbsId = resolvedWbs.id;
          if (resolvedWbs.wbs_name) wbsName = resolvedWbs.wbs_name;
        }
      }

      let existingTask = null;
      if (resolvedWbsId && data.task_name) {
        existingTask = await this.taskRepo.findByNameAndProjectWbs(projectId, resolvedWbsId, data.task_name);
      }

      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        finalTaskId = await this.taskRepo.create({
          project_id: projectId,
          wbs_id: resolvedWbsId || undefined,
          task_name: data.task_name || `${wbsName}`,
          description: `Auto-created task from timesheet log on ${data.log_date}`,
          required_worker_count: 1,
          estimated_hours: data.working_hours,
          start_date: data.log_date,
          start_time: '09:00:00',
          target_date: data.log_date,
          target_time: '18:00:00',
          status: 'in-progress',
        });
      }
      wbsId = resolvedWbsId;
    } else {
      const task = await this.taskRepo.findById(finalTaskId);
      if (!task) throw new Error('Selected task does not exist');
      if (!projectId) projectId = task.project_id;
      if (wbsId === undefined || wbsId === null) wbsId = task.wbs_id;
    }

    const assignedEmps = await this.taskRepo.getAssignedEmployees(finalTaskId);
    const existingEmpIds = assignedEmps.map((e) => e.employee_id);
    let newAssignees = [...existingEmpIds];
    
    if (data.employee_id && !existingEmpIds.includes(data.employee_id)) {
      newAssignees.push(data.employee_id);
    }
    
    // We should also assign labour if needed, but the current assignWorkers mainly handles employees.
    // For now we assign the employee if provided.
    if (newAssignees.length > existingEmpIds.length) {
      await this.taskRepo.assignWorkers(finalTaskId, newAssignees, [], projectId!, wbsId || undefined);
    }

    let timesheetId = null;
    let labourLogId = null;
    let materialLogId = null;

    if (data.employee_id) {
      timesheetId = await this.timesheetRepo.create({
        project_id: projectId!,
        wbs_id: wbsId || null,
        task_id: finalTaskId,
        employee_id: data.employee_id,
        log_date: data.log_date,
        working_hours: data.working_hours,
        comment: data.comment,
      });
    }

    const { dbPool } = require('../config/db');

    if (data.labour_id) {
      const query = `
        INSERT INTO labour_work_logs (project_id, wbs_id, task_id, labour_id, work_date, total_working_hours, rate, amount, work_description)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
      `;
      const [res] = await dbPool.execute(query, [
        projectId, wbsId || null, finalTaskId, data.labour_id, data.log_date, data.working_hours, data.comment || ''
      ]);
      labourLogId = (res as any).insertId;
    }

    if (data.material_id) {
      // First ensure project_materials linkage exists
      const [pmRows] = await dbPool.execute('SELECT id FROM project_materials WHERE project_id = ? AND wbs_id = ? AND material_id = ?', [projectId, wbsId || null, data.material_id]);
      let pmId = null;
      if ((pmRows as any[]).length > 0) {
        pmId = (pmRows as any)[0].id;
      } else {
        const [mRows] = await dbPool.execute('SELECT material_name, unit, rate FROM materials WHERE material_id = ?', [data.material_id]);
        if ((mRows as any[]).length > 0) {
          const m = (mRows as any)[0];
          const [pmRes] = await dbPool.execute(
            'INSERT INTO project_materials (project_id, wbs_id, material_id, material_name, unit, unit_rate, planned_quantity) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [projectId, wbsId || null, data.material_id, m.material_name, m.unit, m.rate]
          );
          pmId = (pmRes as any).insertId;
        }
      }

      if (pmId) {
        const qty = data.material_qty || 1;
        const rate = data.material_rate || 0;
        const cost = qty * rate;
        
        const query = `
          INSERT INTO project_material_logs (project_material_id, project_id, wbs_id, material_id, action_type, quantity, unit_rate, cost, log_date, notes)
          VALUES (?, ?, ?, ?, 'used', ?, ?, ?, ?, ?)
        `;
        const [res] = await dbPool.execute(query, [
          pmId, projectId, wbsId || null, data.material_id, qty, rate, cost, data.log_date, data.comment || ''
        ]);
        materialLogId = (res as any).insertId;
        
        // Also update project_materials used_quantity and actual_cost
        await dbPool.execute(`UPDATE project_materials SET used_quantity = used_quantity + ?, actual_cost = actual_cost + ?, remaining_quantity = GREATEST(0, (CASE WHEN received_quantity > 0 THEN received_quantity ELSE planned_quantity END) - (used_quantity + ?)), remaining_cost = remaining_quantity * unit_rate WHERE id = ?`, [qty, cost, qty, pmId]);
      }
    }

    return {
      task_id: finalTaskId,
      timesheet_id: timesheetId,
      labour_log_id: labourLogId,
      material_log_id: materialLogId
    };
  }

  async updateTimesheet(id: number, data: Partial<TimesheetRow>): Promise<TimesheetRow> {
    const ts = await this.timesheetRepo.findById(id);
    if (!ts) throw new Error('Timesheet entry not found');

    if (data.working_hours !== undefined && (data.working_hours <= 0 || isNaN(data.working_hours))) {
      throw new Error('Working hours must be a valid number greater than 0');
    }

    await this.timesheetRepo.update(id, data);
    return (await this.timesheetRepo.findById(id))!;
  }

  async deleteTimesheet(id: number): Promise<boolean> {
    const ts = await this.timesheetRepo.findById(id);
    if (!ts) throw new Error('Timesheet entry not found');
    return await this.timesheetRepo.delete(id);
  }
}
