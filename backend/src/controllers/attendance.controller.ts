import { Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { checkInSchema, checkOutSchema } from '../validators/attendance.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import { AuditService } from '../services/audit.service';

export class AttendanceController {
  private attendanceService = new AttendanceService();

  checkIn = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return sendError(res, 'Authentication required', [], 401);

    const parseResult = checkInSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const record = await this.attendanceService.checkIn(req.user.employee_id, parseResult.data);
      await AuditService.log(req, 'attendance', 'check-in', 'GPS Check-In recorded', record.log_id);
      return sendSuccess(res, 'GPS Check-In recorded successfully', record, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Check-In failed', [], 400);
    }
  };

  checkOut = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return sendError(res, 'Authentication required', [], 401);

    const parseResult = checkOutSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const record = await this.attendanceService.checkOut(req.user.employee_id, parseResult.data);
      await AuditService.log(req, 'attendance', 'check-out', 'GPS Check-Out recorded', record.log_id);
      return sendSuccess(res, 'GPS Check-Out recorded successfully. Working hours updated.', record);
    } catch (error: any) {
      return sendError(res, error.message || 'Check-Out failed', [], 400);
    }
  };

  getActiveCheckIn = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return sendError(res, 'Authentication required', [], 401);

    try {
      const record = await this.attendanceService.getActiveCheckIn(req.user.employee_id);
      return sendSuccess(res, 'Active check-in status retrieved', record);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch active check-in', [], 500);
    }
  };

  getLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { employee_id, task_id, project_id, start_date, end_date, status } = req.query;

      let empId = employee_id ? parseInt(employee_id as string, 10) : undefined;
      if (req.user && req.user.role_name === 'Employee') {
        // Enforce employee only views their own logs unless admin/manager
        empId = req.user.employee_id;
      }

      const filters = {
        employee_id: empId,
        task_id: task_id ? parseInt(task_id as string, 10) : undefined,
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        start_date: start_date as string,
        end_date: end_date as string,
        status: status as string,
      };

      const logs = await this.attendanceService.getAttendanceLogs(filters);
      return sendSuccess(res, 'Attendance logs retrieved successfully', logs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch attendance logs', [], 500);
    }
  };
}
