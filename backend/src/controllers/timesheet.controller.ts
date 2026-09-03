import { Request, Response } from 'express';
import { TimesheetService } from '../services/timesheet.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class TimesheetController {
  private timesheetService = new TimesheetService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { project_id, wbs_id, task_id, employee_id, start_date, end_date } = req.query;
      const user = (req as any).user;
      let empId = employee_id ? parseInt(employee_id as string, 10) : undefined;

      if (user && user.role_name === 'Employee') {
        empId = user.employee_id || user.id;
      }

      const list = await this.timesheetService.getTimesheets(
        project_id ? parseInt(project_id as string, 10) : undefined,
        wbs_id ? parseInt(wbs_id as string, 10) : undefined,
        task_id ? parseInt(task_id as string, 10) : undefined,
        empId,
        start_date as string,
        end_date as string
      );
      return sendSuccess(res, 'Timesheets retrieved successfully', list);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve timesheets', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const ts = await this.timesheetService.getTimesheetById(id);
      return sendSuccess(res, 'Timesheet entry retrieved successfully', ts);
    } catch (error: any) {
      return sendError(res, error.message || 'Timesheet entry not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const payload = { ...req.body };
      if (!payload.employee_id && user) {
        payload.employee_id = user.employee_id || user.id;
      }

      const newTs = await this.timesheetService.createTimesheet(payload);
      return sendSuccess(res, 'Timesheet logged successfully', newTs, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to log timesheet', [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.timesheetService.updateTimesheet(id, req.body);
      return sendSuccess(res, 'Timesheet updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update timesheet', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.timesheetService.deleteTimesheet(id);
      return sendSuccess(res, 'Timesheet deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete timesheet', [], 400);
    }
  };
}
