import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class DashboardController {
  private dashboardService = new DashboardService();

  getMetrics = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;

      if (user) {
        if (user.role_name === 'Manager') managerId = user.id;
        if (user.role_name === 'Employee') employeeId = user.id;
      }

      const metrics = await this.dashboardService.getExecutiveDashboardMetrics(managerId, employeeId);
      return sendSuccess(res, 'Dashboard metrics retrieved successfully', metrics);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch dashboard metrics', [], 500);
    }
  };
}
