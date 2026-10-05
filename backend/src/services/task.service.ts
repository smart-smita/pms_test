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

  async getDependencies(id: number) {
    return await this.taskRepo.getDependencies(id);
  }

  async getTaskAllocations(id: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    return await this.taskRepo.getTaskAllocations(id);
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
      if (pw.wbs_type === 'material') {
        throw new Error('Selected WBS Discipline is a Material WBS. Tasks can only be created under Labour WBS Disciplines.');
      }
    }

    // Check for duplicate task name under the same project and WBS
    if (data.task_name) {
      const existing = await this.taskRepo.findByNameAndProjectWbs(data.project_id, data.wbs_id, data.task_name);
      if (existing) {
        throw new Error(
          `A task named "${data.task_name}" already exists under this project/WBS (task_id: ${existing.task_id}). ` +
          `Use a unique name or update the existing task.`
        );
      }
    }

    const assignedEmployeeIds = data.assigned_employee_ids || [];
    const requiredCount = Number(data.required_worker_count || 1);
    if (assignedEmployeeIds.length > requiredCount) {
      throw new Error(
        `Cannot assign ${assignedEmployeeIds.length} employees to a task that requires only ${requiredCount} worker(s). ` +
        `Increase required_worker_count or reduce the assignment list.`
      );
    }
    const allocations = data.allocations || [];
    const dependencies = data.dependencies || [];
    const usedMaterials = data.used_materials || data.materials || [];
    delete data.assigned_employee_ids;
    delete data.assigned_labour_ids; // legacy
    delete data.allocations;
    delete data.dependencies;
    delete data.used_materials;
    delete data.materials;

    data.status = data.status || 'pending';

    const taskId = await this.taskRepo.create(data);

    if (assignedEmployeeIds.length > 0 || allocations.length > 0) {
      await this.taskRepo.assignWorkers(taskId, assignedEmployeeIds, allocations, data.project_id, data.wbs_id);
    }

    if (usedMaterials.length > 0) {
      await this.taskRepo.saveTaskUsedMaterials(taskId, data.project_id, data.wbs_id || null, usedMaterials);
    }

    if (dependencies.length > 0) {
      await this.taskRepo.updateDependencies(taskId, dependencies);
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTask(id: number, data: any) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');

    if (data.wbs_id) {
      const pw = await this.wbsRepo.findProjectWbsById(data.wbs_id);
      if (!pw) throw new Error('Selected WBS Discipline does not exist');
      if (pw.wbs_type === 'material') {
        throw new Error('Selected WBS Discipline is a Material WBS. Tasks can only be created under Labour WBS Disciplines.');
      }
    }

    const assignedEmployeeIds = data.assigned_employee_ids;
    if (assignedEmployeeIds !== undefined) {
      const requiredCount = Number(task.required_worker_count || data.required_worker_count || 1);
      if (assignedEmployeeIds.length > requiredCount) {
        throw new Error(
          `Cannot assign ${assignedEmployeeIds.length} employees to a task that requires only ${requiredCount} worker(s).`
        );
      }
    }
    const allocations = data.allocations;
    const dependencies = data.dependencies;
    const usedMaterials = data.used_materials || data.materials;
    delete data.assigned_employee_ids;
    delete data.assigned_labour_ids; // legacy
    delete data.allocations;
    delete data.dependencies;
    delete data.used_materials;
    delete data.materials;

    // Check if dates changed, if they did, we might need to recalculate dependents.
    const oldTask = await this.taskRepo.findById(id);

    await this.taskRepo.update(id, data);

    if (assignedEmployeeIds !== undefined || allocations !== undefined) {
      await this.taskRepo.assignWorkers(id, assignedEmployeeIds || [], allocations || [], task.project_id, task.wbs_id);
    }

    if (usedMaterials !== undefined) {
      await this.taskRepo.saveTaskUsedMaterials(id, task.project_id, task.wbs_id || null, usedMaterials);
    }

    if (dependencies !== undefined) {
      await this.taskRepo.updateDependencies(id, dependencies);
    }
    
    // If target date changed, we recalculate dependents.
    if (data.target_date && oldTask && data.target_date !== oldTask.target_date) {
      await this.taskRepo.recalculateDependentTasks(id);
    }

    return await this.taskRepo.findById(id);
  }

  async assignWorkersToTask(taskId: number, employeeIds: number[]) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    if (employeeIds.length > task.required_worker_count) {
      throw new Error(`Cannot assign ${employeeIds.length} workers. Task requires only ${task.required_worker_count}.`);
    }

    await this.taskRepo.assignWorkers(taskId, employeeIds, [], task.project_id, task.wbs_id);

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
