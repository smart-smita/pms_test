import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { createTaskSchema, updateTaskSchema, assignWorkersSchema } from '../validators/task.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class TaskController {
  private taskService = new TaskService();

  getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { project_id, employee_id, status, assigned_to_me } = req.query;
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      let empId = employee_id ? parseInt(employee_id as string, 10) : undefined;
      let managerId = undefined;

      if (req.user) {
        if (req.user.role_name === 'Manager') {
          managerId = req.user.employee_id;
        }
        if (req.user.role_name === 'Employee' || assigned_to_me === 'true') {
          empId = req.user.employee_id; // Scopes tasks to the currently logged in employee
        }
      }

      const tasks = await this.taskService.getTasks(projectId, empId, status as string, managerId);
      return sendSuccess(res, 'Tasks retrieved successfully', tasks);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch tasks', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const task = await this.taskService.getTaskById(id);
      return sendSuccess(res, 'Task retrieved successfully', task);
    } catch (error: any) {
      return sendError(res, error.message || 'Task not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const task = await this.taskService.createTask(parseResult.data);
      return sendSuccess(res, 'Task created successfully', task, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create task', [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.taskService.updateTask(id, parseResult.data);
      return sendSuccess(res, 'Task updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update task', [], 400);
    }
  };

  assignWorkers = async (req: Request, res: Response) => {
    const parseResult = assignWorkersSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.taskService.assignWorkersToTask(id, parseResult.data.employee_ids);
      return sendSuccess(res, 'Workers assigned successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to assign workers', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deletedBy = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const success = await this.taskService.deleteTask(id, deletedBy);
      if (success) {
        res.json({ success: true, message: 'Task deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Task not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
}
