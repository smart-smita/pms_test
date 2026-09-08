import { Request, Response } from 'express';
import { LabourPaymentService } from '../services/labourPayment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class LabourPaymentController {
  private service = new LabourPaymentService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { labour_id, project_id, status, start_date, end_date } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      if (user?.role_name === 'Manager') {
        managerId = user.id || user.userId || user.employee_id;
      }

      const filters = {
        labourId: labour_id ? parseInt(labour_id as string, 10) : undefined,
        projectId: project_id ? parseInt(project_id as string, 10) : undefined,
        status: status as string,
        startDate: start_date as string,
        endDate: end_date as string,
        managerId,
      };

      const payments = await this.service.getPayments(filters);
      return sendSuccess(res, 'Labour payments retrieved successfully', payments);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve labour payments', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const payment = await this.service.getPaymentById(id);
      return sendSuccess(res, 'Labour payment voucher retrieved successfully', payment);
    } catch (error: any) {
      return sendError(res, error.message || 'Labour payment voucher not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user?.id || user?.userId || user?.employee_id;
      const newPayment = await this.service.createPayment({ ...req.body, created_by: userId });
      return sendSuccess(res, 'Labour payment voucher generated successfully', newPayment, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create labour payment voucher', [], 400);
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, remarks } = req.body;
      const updated = await this.service.updateStatus(id, status, remarks);
      return sendSuccess(res, `Labour payment status updated to '${status}' successfully`, updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update payment status', [], 400);
    }
  };
}
