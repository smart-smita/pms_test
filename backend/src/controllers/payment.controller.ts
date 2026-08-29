import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class PaymentController {
  private paymentService = new PaymentService();

  getEmployeePayments = async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query;
      const data = await this.paymentService.getEmployeePayments(
        start_date as string,
        end_date as string
      );
      return sendSuccess(res, 'Employee payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch employee payments', [], 500);
    }
  };

  getDailyPayments = async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query;
      const data = await this.paymentService.getDailyPayments(
        start_date as string,
        end_date as string
      );
      return sendSuccess(res, 'Daily payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch daily payments', [], 500);
    }
  };

  getProjectPayments = async (req: Request, res: Response) => {
    try {
      const data = await this.paymentService.getProjectPayments();
      return sendSuccess(res, 'Project payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch project payments', [], 500);
    }
  };

  getTaskPayments = async (req: Request, res: Response) => {
    try {
      const data = await this.paymentService.getTaskPayments();
      return sendSuccess(res, 'Task payments retrieved successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch task payments', [], 500);
    }
  };
}
