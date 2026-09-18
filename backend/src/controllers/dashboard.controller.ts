import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class DashboardController {
  private dashboardService = new DashboardService();

  getMetrics = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const targetDate = req.query.date as string | undefined;
      const loggedInEmployeeId = user?.employee_id || user?.id || user?.userId;

      if (user && user.role_name === 'Employee') {
        const metrics = await this.dashboardService.getEmployeeDashboardMetrics(loggedInEmployeeId, targetDate);
        return sendSuccess(res, 'Employee dashboard metrics retrieved successfully', metrics);
      }

      let managerId = undefined;

      if (user && user.role_name === 'Manager') {
        managerId = loggedInEmployeeId;
      }

      const metrics = await this.dashboardService.getExecutiveDashboardMetrics(managerId, undefined, targetDate);
      return sendSuccess(res, 'Executive dashboard metrics retrieved successfully', metrics);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch dashboard metrics', [], 500);
    }
  };
}
