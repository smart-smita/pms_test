import { TaskRepository } from '../repositories/task.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { WbsRepository } from '../repositories/wbs.repository';

export class TaskService {
  private taskRepo = new TaskRepository();
  private projectRepo = new ProjectRepository();
  private wbsRepo = new WbsRepository();

  async getTasks(projectId?: number, employeeId?: number, status?: string, managerId?: number) {
    return await this.taskRepo.findAll(projectId, employeeId, status, managerId);
  }

  async getTaskById(id: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    return task;
  }

  async createTask(data: any) {
    const project = await this.projectRepo.findById(data.project_id);
    if (!project) throw new Error('Target project does not exist');

    if (data.wbs_id) {
      const pw = await this.wbsRepo.findProjectWbsById(data.wbs_id);
      if (!pw) throw new Error('Selected WBS Discipline does not exist');
      if (Number(pw.project_id) !== Number(data.project_id)) {
        throw new Error('Selected WBS Discipline does not belong to the selected Project');
      }
    }

    const assignedEmployeeIds = data.assigned_employee_ids || [];
    const assignedLabourIds = data.assigned_labour_ids || [];
    delete data.assigned_employee_ids;
    delete data.assigned_labour_ids;

    data.status = data.status || 'pending';

    const taskId = await this.taskRepo.create(data);

    if (assignedEmployeeIds.length > 0 || assignedLabourIds.length > 0) {
      await this.taskRepo.assignWorkers(taskId, assignedEmployeeIds, assignedLabourIds);
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTask(id: number, data: any) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');

    const assignedEmployeeIds = data.assigned_employee_ids;
    const assignedLabourIds = data.assigned_labour_ids;
    delete data.assigned_employee_ids;
    delete data.assigned_labour_ids;

    await this.taskRepo.update(id, data);

    if (assignedEmployeeIds !== undefined || assignedLabourIds !== undefined) {
      await this.taskRepo.assignWorkers(id, assignedEmployeeIds || [], assignedLabourIds || []);
    }

    return await this.taskRepo.findById(id);
  }

  async assignWorkersToTask(taskId: number, employeeIds: number[]) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    if (employeeIds.length > task.required_worker_count) {
      throw new Error(`Cannot assign ${employeeIds.length} workers. Task requires only ${task.required_worker_count}.`);
    }

    await this.taskRepo.assignWorkers(taskId, employeeIds);

    // Trigger Notification for each assigned employee
    const { NotificationService } = await import('./notification.service');
    const notificationService = new NotificationService();
    for (const empId of employeeIds) {
      await notificationService.createNotification(
        empId,
        'New Task Assigned',
        `You have been assigned to the task: ${task.task_name}.`,
        'info'
      );
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTaskStatus(id: number, status: string) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    await this.taskRepo.updateStatus(id, status);
    return await this.taskRepo.findById(id);
  }

  async deleteTask(id: number, deletedBy: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    return await this.taskRepo.softDelete(id, deletedBy);
  }
}
