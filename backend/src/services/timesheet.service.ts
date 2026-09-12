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

      // Check if an active task ALREADY exists for this project and discipline
      let existingTask = null;
      if (resolvedWbsId) {
        existingTask = await this.taskRepo.findByProjectAndWbs(projectId, resolvedWbsId);
      }

      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        // Create Task automatically in Task Master for this discipline
        finalTaskId = await this.taskRepo.create({
          project_id: projectId,
          wbs_id: resolvedWbsId || undefined,
          task_name: `${wbsName}`,
          description: `Auto-created task for ${wbsName} from timesheet log on ${data.log_date}`,
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
