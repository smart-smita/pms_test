import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class PaymentController {
  private paymentService = new PaymentService();

  getLabourPayments = async (req: Request, res: Response) => {
    try {
      const { start_date, end_date, labour_id, project_id } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user && user.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const labourId = labour_id ? parseInt(labour_id as string, 10) : undefined;
      const data = await this.paymentService.getLabourPayments(
        start_date as string,
        end_date as string,
        labourId,
        projectId,
        managerId
      );
      return sendSuccess(res, 'Labour payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch labour payments', [], 500);
    }
  };

  getDailyPayments = async (req: Request, res: Response) => {
    try {
      const { start_date, end_date, project_id } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user && user.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const data = await this.paymentService.getDailyPayments(
        start_date as string,
        end_date as string,
        projectId,
        managerId
      );
      return sendSuccess(res, 'Daily labour payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch daily payments', [], 500);
    }
  };

  getProjectPayments = async (req: Request, res: Response) => {
    try {
      const { project_id } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user && user.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const data = await this.paymentService.getProjectPayments(projectId, managerId);
      return sendSuccess(res, 'Project labour payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch project payments', [], 500);
    }
  };

  getTaskPayments = async (req: Request, res: Response) => {
    try {
      const { project_id } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user && user.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const data = await this.paymentService.getTaskPayments(projectId, managerId);
      return sendSuccess(res, 'Task labour payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch task payments', [], 500);
    }
  };

  getWBSPayments = async (req: Request, res: Response) => {
    try {
      const { project_id } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user && user.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const data = await this.paymentService.getWBSPayments(projectId, managerId);
      return sendSuccess(res, 'WBS labour payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch WBS payments', [], 500);
    }
  };
}
