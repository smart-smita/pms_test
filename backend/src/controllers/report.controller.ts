import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ReportController {
  private reportService = new ReportService();

  getAttendanceReport = async (req: Request, res: Response) => {
    try {
      const { employee_id, start_date, end_date } = req.query;
      const user = (req as any).user;
      let empId = employee_id ? parseInt(employee_id as string, 10) : undefined;

      if (user && user.role_name === 'Employee') {
        empId = user.employee_id || user.id || user.userId;
      }

      const filters = {
        employee_id: empId,
        start_date: start_date as string,
        end_date: end_date as string,
      };
      const data = await this.reportService.getAttendanceReport(filters);
      return sendSuccess(res, 'Attendance report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate attendance report', [], 500);
    }
  };

  getProjectReport = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let empId = undefined;

      if (user && user.role_name === 'Employee') {
        empId = user.employee_id || user.id || user.userId;
      }

      const data = await this.reportService.getProjectReport(empId);
      return sendSuccess(res, 'Project report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate project report', [], 500);
    }
  };

  getTaskReport = async (req: Request, res: Response) => {
    try {
      const { project_id, status } = req.query;
      const user = (req as any).user;
      let empId = undefined;

      if (user && user.role_name === 'Employee') {
        empId = user.employee_id || user.id || user.userId;
      }

      const filters = {
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        status: status as string,
        employee_id: empId,
      };
      const data = await this.reportService.getTaskReport(filters);
      return sendSuccess(res, 'Task report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate task report', [], 500);
    }
  };

  getPaymentReport = async (req: Request, res: Response) => {
    try {
      const { type, start_date, end_date } = req.query;
      const user = (req as any).user;
      let empId = undefined;

      if (user && user.role_name === 'Employee') {
        empId = user.employee_id || user.id || user.userId;
      }

      const reportType = (type as any) || 'employee';
      const data = await this.reportService.getPaymentReport(
        reportType,
        start_date as string,
        end_date as string,
        empId
      );
      return sendSuccess(res, 'Payment report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate payment report', [], 500);
    }
  };
}
