import { Request, Response } from 'express';
import { LabourWorkLogService } from '../services/labourWorkLog.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class LabourWorkLogController {
  private service = new LabourWorkLogService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { project_id, wbs_id, task_id, labour_id, start_date, end_date, payment_status, work_status, search } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user?.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }

      const filters = {
        projectId: project_id ? parseInt(project_id as string, 10) : undefined,
        wbsId: wbs_id ? parseInt(wbs_id as string, 10) : undefined,
        taskId: task_id ? parseInt(task_id as string, 10) : undefined,
        labourId: labour_id ? parseInt(labour_id as string, 10) : undefined,
        startDate: start_date as string,
        endDate: end_date as string,
        paymentStatus: payment_status as string,
        workStatus: work_status as string,
        search: search as string,
        managerId,
      };

      const logs = await this.service.getWorkLogs(filters);
      return sendSuccess(res, 'Labour work logs retrieved successfully', logs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve labour work logs', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const log = await this.service.getWorkLogById(id);
      return sendSuccess(res, 'Labour work log retrieved successfully', log);
    } catch (error: any) {
      return sendError(res, error.message || 'Labour work log not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user?.id || user?.userId || user?.employee_id;
      const newLog = await this.service.createWorkLog({ ...req.body, created_by: userId });
      return sendSuccess(res, 'Labour work log created successfully', newLog, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create labour work log', [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      const userId = user?.id || user?.userId || user?.employee_id;
      const updated = await this.service.updateWorkLog(id, req.body, userId);
      return sendSuccess(res, 'Labour work log updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update labour work log', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.service.deleteWorkLog(id);
      return sendSuccess(res, 'Labour work log soft-deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete labour work log', [], 400);
    }
  };
}
