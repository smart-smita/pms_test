import { TimesheetRepository, TimesheetRow } from '../repositories/timesheet.repository';
import { TaskRepository } from '../repositories/task.repository';

export class TimesheetService {
  private timesheetRepo = new TimesheetRepository();
  private taskRepo = new TaskRepository();

  async getTimesheets(projectId?: number, wbsId?: number, taskId?: number, employeeId?: number, startDate?: string, endDate?: string): Promise<TimesheetRow[]> {
    return await this.timesheetRepo.findAll(projectId, wbsId, taskId, employeeId, startDate, endDate);
  }

  async getTimesheetById(id: number): Promise<TimesheetRow> {
    const ts = await this.timesheetRepo.findById(id);
    if (!ts) throw new Error('Timesheet entry not found');
    return ts;
  }

  async createTimesheet(data: {
    project_id?: number;
    wbs_id?: number | null;
    task_id: number;
    employee_id: number;
    log_date: string;
    working_hours: number;
    comment?: string | null;
  }): Promise<TimesheetRow> {
    if (!data.task_id) throw new Error('Task is required');
    if (!data.employee_id) throw new Error('Employee ID is required');
    if (!data.log_date) throw new Error('Log date is required');
    if (data.working_hours <= 0 || data.working_hours > 24) throw new Error('Working hours must be between 0.1 and 24');

    const task = await this.taskRepo.findById(data.task_id);
    if (!task) throw new Error('Selected task does not exist');

    const projectId = data.project_id || task.project_id;
    const wbsId = data.wbs_id !== undefined ? data.wbs_id : task.wbs_id;

    const id = await this.timesheetRepo.create({
      project_id: projectId,
      wbs_id: wbsId,
      task_id: data.task_id,
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

    if (data.working_hours !== undefined && (data.working_hours <= 0 || data.working_hours > 24)) {
      throw new Error('Working hours must be between 0.1 and 24');
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
