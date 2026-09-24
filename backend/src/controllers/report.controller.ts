import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ReportController {
  private reportService = new ReportService();

  private getRoleIds(req: Request) {
    const user = (req as any).user;
    let empId = undefined;
    let managerId = undefined;
    const userId = user?.employee_id || user?.userId || user?.id;

    if (user && user.role_name === 'Employee') {
      empId = userId;
    } else if (user && user.role_name === 'Manager') {
      managerId = userId;
    }
    return { empId, managerId };
  }

  getEmployeeDetailsReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getEmployeeDetailsReport(filters);
      return sendSuccess(res, 'Employee details report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate employee details report', [], 500);
    }
  };

  getDisciplineDetailsReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getDisciplineDetailsReport(filters);
      return sendSuccess(res, 'Discipline details report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate discipline details report', [], 500);
    }
  };

  getEmployeeAttendanceReport1 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId || (req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined), manager_id: managerId };
      const data = await this.reportService.getEmployeeAttendanceReport1(filters);
      return sendSuccess(res, 'Employee Attendance Report 1 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate employee attendance report 1', [], 500);
    }
  };

  getEmployeeAttendanceReport2 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId || (req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined), manager_id: managerId };
      const data = await this.reportService.getEmployeeAttendanceReport2(filters);
      return sendSuccess(res, 'Employee Attendance Report 2 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate employee attendance report 2', [], 500);
    }
  };

  getEmployeeAttendanceDayWiseReport2 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = {
        ...req.query,
        employee_id: empId || (req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined),
        manager_id: managerId,
      };
      const data = await this.reportService.getEmployeeAttendanceDayWiseReport2(filters);
      return sendSuccess(res, 'Employee Attendance Day Wise Report View 2 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate Employee Attendance Day Wise Report View 2', [], 500);
    }
  };

  getEmployeeAttendanceSummaryMatrix = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = {
        ...req.query,
        employee_id: empId || (req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined),
        manager_id: managerId,
      };
      const data = await this.reportService.getEmployeeAttendanceSummaryMatrix(filters);
      return sendSuccess(res, 'Employee Attendance Summary Matrix generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate attendance summary matrix', [], 500);
    }
  };

  getEmployeeAttendanceReport3 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId || (req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined), manager_id: managerId };
      const data = await this.reportService.getEmployeeAttendanceReport3(filters);
      return sendSuccess(res, 'Employee Attendance Report 3 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate employee attendance report 3', [], 500);
    }
  };

  getLabourDetailsReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getLabourDetailsReport(filters);
      return sendSuccess(res, 'Labour details report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate labour details report', [], 500);
    }
  };

  getLabourAttendanceReport1 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getLabourAttendanceReport1(filters);
      return sendSuccess(res, 'Labour Attendance Report 1 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate labour attendance report 1', [], 500);
    }
  };

  getLabourAttendanceReport2 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getLabourAttendanceReport2(filters);
      return sendSuccess(res, 'Labour Attendance Report 2 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate labour attendance report 2', [], 500);
    }
  };

  getLabourAttendanceReport3 = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getLabourAttendanceReport3(filters);
      return sendSuccess(res, 'Labour Attendance Report 3 generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate labour attendance report 3', [], 500);
    }
  };

  getLabourCostPaymentReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getLabourCostPaymentReport(filters);
      return sendSuccess(res, 'Labour Cost/Payment report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate labour cost/payment report', [], 500);
    }
  };

  getProjectWorkReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const { project_id, start_date, end_date } = req.query;
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      const startDate = start_date as string | undefined;
      const endDate = end_date as string | undefined;

      const data = await this.reportService.getProjectWorkReport(projectId, managerId, empId, startDate, endDate);
      return sendSuccess(res, 'Project work report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate project work report', [], 500);
    }
  };

  getProjectBudgetReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getProjectBudgetReport(filters);
      return sendSuccess(res, 'Project budget report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate project budget report', [], 500);
    }
  };

  getProjectSummaryReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getProjectSummaryReport(filters);
      return sendSuccess(res, 'Project summary report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate project summary report', [], 500);
    }
  };

  getProjectProfitLossReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getProjectProfitLossReport(filters);
      return sendSuccess(res, 'Project Profit/Loss report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate profit loss report', [], 500);
    }
  };

  getPlannedVsActualReport = async (req: Request, res: Response) => {
    try {
      const { empId, managerId } = this.getRoleIds(req);
      const filters = { ...req.query, employee_id: empId, manager_id: managerId };
      const data = await this.reportService.getPlannedVsActualReport(filters);
      return sendSuccess(res, 'Planned vs Actual report generated successfully', data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate planned vs actual report', [], 500);
    }
  };
}
