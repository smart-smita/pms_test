import { TaskRepository } from '../repositories/task.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { WbsRepository } from '../repositories/wbs.repository';
import { dbPool } from '../config/db';

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

    // Normalize date fields
    if (data.end_date && !data.target_date) {
      data.target_date = data.end_date;
    }
    delete data.end_date;

    // Normalize planned_hours to estimated_hours
    if (data.planned_hours !== undefined && data.estimated_hours === undefined) {
      data.estimated_hours = data.planned_hours;
    }
    delete data.planned_hours;

    if (data.start_date === '') data.start_date = null;
    if (data.target_date === '') data.target_date = null;

    const assignedEmployeeIds = (data.assigned_employee_ids || []).map(Number).filter((id: number) => id > 0);
    let requiredCount = Number(data.required_worker_count || 1);
    if (assignedEmployeeIds.length > requiredCount) {
      // Auto-adjust instead of throwing error for better UX
      requiredCount = assignedEmployeeIds.length;
      data.required_worker_count = requiredCount;
    }
    const allocations = (data.allocations || []).filter((a: any) => a && Number(a.labour_id) > 0).map((a: any) => ({
      ...a,
      labour_id: Number(a.labour_id),
      amount: Number(a.amount) || 0
    }));
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
      for (const m of usedMaterials) {
        const matId = Number(m.material_id);
        const reqQty = Number(m.quantity || 0);
        if (matId > 0 && reqQty > 0) {
          const [storeRows]: any = await dbPool.query(
            `SELECT COALESCE(SUM(msb.on_hand_qty - msb.reserved_qty), 0) AS store_available 
             FROM material_store_balances msb 
             WHERE msb.material_id = ?`,
            [matId]
          );
          const storeAvail = Number(storeRows[0]?.store_available || 0);

          const [siteRows]: any = await dbPool.query(
            `SELECT COALESCE(SUM(quantity - consumed_quantity - returned_quantity), 0) AS site_available
             FROM material_issues 
             WHERE project_id = ? AND material_id = ?`,
            [data.project_id, matId]
          );
          const siteAvail = Number(siteRows[0]?.site_available || 0);
          const totalAvail = Math.max(storeAvail, siteAvail, storeAvail + siteAvail);

          if (totalAvail < reqQty) {
            const [matInfo]: any = await dbPool.query(`SELECT material_name, unit FROM materials WHERE material_id = ?`, [matId]);
            const matName = matInfo[0]?.material_name || m.material_name || `Material #${matId}`;
            const unit = matInfo[0]?.unit || m.unit || 'Nos';
            throw new Error(`Insufficient stock for "${matName}". Required: ${reqQty} ${unit}, Available: ${totalAvail} ${unit}`);
          }
        }
      }

      await this.taskRepo.saveTaskUsedMaterials(taskId, data.project_id, data.wbs_id || null, usedMaterials);

      const { ProcurementService } = await import('./procurement.service');
      const procSvc = new ProcurementService();
      for (const m of usedMaterials) {
        if (m.material_id && Number(m.quantity) > 0) {
          try {
            await procSvc.recordConsumption({
              project_id: data.project_id,
              wbs_id: data.wbs_id || 0,
              task_id: taskId,
              material_id: Number(m.material_id),
              quantity: Number(m.quantity),
              notes: m.notes,
              used_date: m.used_date,
              user_id: (data as any).created_by || 1,
            });
          } catch (e: any) {
            console.warn('Task material consumption note:', e.message);
          }
        }
      }
    }

    if (dependencies.length > 0) {
      await this.taskRepo.updateDependencies(taskId, dependencies);
    }

    if ((allocations && allocations.length > 0) || (usedMaterials && usedMaterials.length > 0)) {
      try {
        const { InvoiceService } = await import('./invoice.service');
        const invSvc = new InvoiceService();
        await invSvc.syncDraftInvoicesForProject(data.project_id, taskId);
      } catch (e) {
        console.error('Invoice auto-sync on task creation error:', e);
      }
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTask(id: number, data: any) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');

    // Normalize date fields
    if (data.end_date && !data.target_date) {
      data.target_date = data.end_date;
    }
    delete data.end_date;
    delete data.project_id;

    // Normalize planned_hours to estimated_hours
    if (data.planned_hours !== undefined && data.estimated_hours === undefined) {
      data.estimated_hours = data.planned_hours;
    }
    delete data.planned_hours;

    if (data.start_date === '') data.start_date = null;
    if (data.target_date === '') data.target_date = null;

    if (data.wbs_id === 0 || !data.wbs_id) {
      delete data.wbs_id;
    } else {
      const pw = await this.wbsRepo.findProjectWbsById(data.wbs_id);
      if (!pw) throw new Error('Selected WBS Discipline does not exist');
      if (pw.wbs_type === 'material') {
        throw new Error('Selected WBS Discipline is a Material WBS. Tasks can only be created under Labour WBS Disciplines.');
      }
    }

    const assignedEmployeeIds = Array.isArray(data.assigned_employee_ids)
      ? data.assigned_employee_ids.map(Number).filter((empId: number) => empId > 0)
      : data.assigned_employee_ids;

    if (assignedEmployeeIds !== undefined) {
      let requiredCount = Number(task.required_worker_count || data.required_worker_count || 1);
      if (assignedEmployeeIds.length > requiredCount) {
        // Auto-adjust instead of throwing error
        requiredCount = assignedEmployeeIds.length;
        data.required_worker_count = requiredCount;
      }
    }

    const allocations = Array.isArray(data.allocations)
      ? data.allocations.filter((a: any) => a && Number(a.labour_id) > 0).map((a: any) => ({
        ...a,
        labour_id: Number(a.labour_id),
        amount: Number(a.amount) || 0
      }))
      : data.allocations;

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

    const effectiveWbsId = data.wbs_id !== undefined ? data.wbs_id : task.wbs_id;
    if (assignedEmployeeIds !== undefined || allocations !== undefined) {
      await this.taskRepo.assignWorkers(id, assignedEmployeeIds || [], allocations || [], task.project_id, effectiveWbsId);
    }

    if (usedMaterials !== undefined && Array.isArray(usedMaterials)) {
      for (const m of usedMaterials) {
        const matId = Number(m.material_id);
        const reqQty = Number(m.quantity || 0);
        if (matId > 0 && reqQty > 0) {
          const [storeRows]: any = await dbPool.query(
            `SELECT COALESCE(SUM(msb.on_hand_qty - msb.reserved_qty), 0) AS store_available 
             FROM material_store_balances msb 
             WHERE msb.material_id = ?`,
            [matId]
          );
          const storeAvail = Number(storeRows[0]?.store_available || 0);

          const [siteRows]: any = await dbPool.query(
            `SELECT COALESCE(SUM(quantity - consumed_quantity - returned_quantity), 0) AS site_available
             FROM material_issues 
             WHERE project_id = ? AND material_id = ?`,
            [task.project_id, matId]
          );
          const siteAvail = Number(siteRows[0]?.site_available || 0);
          const totalAvail = Math.max(storeAvail, siteAvail, storeAvail + siteAvail);

          if (totalAvail < reqQty) {
            const [matInfo]: any = await dbPool.query(`SELECT material_name, unit FROM materials WHERE material_id = ?`, [matId]);
            const matName = matInfo[0]?.material_name || m.material_name || `Material #${matId}`;
            const unit = matInfo[0]?.unit || m.unit || 'Nos';
            throw new Error(`Insufficient stock for "${matName}". Required: ${reqQty} ${unit}, Available: ${totalAvail} ${unit}`);
          }
        }
      }

      await this.taskRepo.saveTaskUsedMaterials(id, task.project_id, effectiveWbsId || null, usedMaterials);

      const { ProcurementService } = await import('./procurement.service');
      const procSvc = new ProcurementService();
      for (const m of usedMaterials) {
        if (!m.id && m.material_id && Number(m.quantity) > 0) {
          try {
            await procSvc.recordConsumption({
              project_id: task.project_id,
              wbs_id: effectiveWbsId || 0,
              task_id: id,
              material_id: Number(m.material_id),
              quantity: Number(m.quantity),
              notes: m.notes,
              used_date: m.used_date,
              user_id: (data as any).updated_by || 1,
            });
          } catch (e: any) {
            console.warn('Task update material consumption note:', e.message);
          }
        }
      }
    }

    if (dependencies !== undefined) {
      await this.taskRepo.updateDependencies(id, dependencies);
    }

    // If target date changed, we recalculate dependents.
    if (data.target_date && oldTask && data.target_date !== oldTask.target_date) {
      await this.taskRepo.recalculateDependentTasks(id);
    }

    // Auto-sync or generate invoices when task labour allocations, materials, or status are modified
    try {
      const { InvoiceService } = await import('./invoice.service');
      const invSvc = new InvoiceService();
      if (data.status === 'completed' || task.status === 'completed') {
        await invSvc.autoGenerateInvoiceForCompletedTask(id, (data as any).updated_by);
      }
      if (allocations !== undefined || usedMaterials !== undefined) {
        await invSvc.syncDraftInvoicesForProject(task.project_id, id);
      }
    } catch (e) {
      console.error('Invoice auto-sync on task update error:', e);
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

    // Auto-generate invoice if task is already completed
    if (task.status === 'completed') {
      try {
        const { InvoiceService } = await import('./invoice.service');
        const invSvc = new InvoiceService();
        await invSvc.autoGenerateInvoiceForCompletedTask(taskId);
      } catch (e) {
        console.error('Invoice auto-generation on assignWorkers error:', e);
      }
    }

    return await this.taskRepo.findById(taskId);
  }

  async updateTaskStatus(id: number, status: string, userId?: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    await this.taskRepo.updateStatus(id, status);

    if (status === 'completed') {
      try {
        const { InvoiceService } = await import('./invoice.service');
        const invSvc = new InvoiceService();
        await invSvc.autoGenerateInvoiceForCompletedTask(id, userId);
      } catch (e) {
        console.error('Invoice auto-generation on task completion error:', e);
      }
    }

    return await this.taskRepo.findById(id);
  }

  async deleteTask(id: number, deletedBy: number) {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    return await this.taskRepo.softDelete(id, deletedBy);
  }
}
