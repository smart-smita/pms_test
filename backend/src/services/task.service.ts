import { TaskRepository } from '../repositories/task.repository';
import { ProjectRepository } from '../repositories/project.repository';

export class TaskService {
  private taskRepo = new TaskRepository();
  private projectRepo = new ProjectRepository();

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

    const assignedEmployeeIds = data.assigned_employee_ids || [];
    delete data.assigned_employee_ids;

    if (assignedEmployeeIds.length > (data.required_worker_count || 0)) {
      throw new Error(`Cannot assign ${assignedEmployeeIds.length} workers. Task requires only ${data.required_worker_count || 0}.`);
    }

    const taskId = await this.taskRepo.create(data);

    if (assignedEmployeeIds.length > 0) {
      await this.taskRepo.assignWorkers(taskId, assignedEmployeeIds);
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTask(id: number, data: any) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');

    const assignedEmployeeIds = data.assigned_employee_ids;
    delete data.assigned_employee_ids;

    if (assignedEmployeeIds !== undefined) {
      const requiredCount = data.required_worker_count !== undefined ? data.required_worker_count : task.required_worker_count;
      if (assignedEmployeeIds.length > requiredCount) {
        throw new Error(`Cannot assign ${assignedEmployeeIds.length} workers. Task requires only ${requiredCount}.`);
      }
    }

    await this.taskRepo.update(id, data);

    if (assignedEmployeeIds !== undefined) {
      await this.taskRepo.assignWorkers(id, assignedEmployeeIds);
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

  async deleteTask(id: number, deletedBy: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    return await this.taskRepo.softDelete(id, deletedBy);
  }
}
