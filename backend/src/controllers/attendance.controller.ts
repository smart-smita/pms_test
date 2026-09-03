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
      let targetEmployeeId = req.user.employee_id;
      if (req.user.role_name === 'Admin' && parseResult.data.employee_id) {
        targetEmployeeId = parseResult.data.employee_id;
      }
      
      const record = await this.attendanceService.checkIn(targetEmployeeId, parseResult.data);
      const logId = record ? (record as any).log_id : null;
      await AuditService.log(req, 'attendance', 'check-in', 'GPS Check-In recorded', logId);
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
      const record = await this.attendanceService.checkOut(req.user.employee_id, parseResult.data, req.user.role_name);
      const logId = record ? (record as any).log_id : null;
      await AuditService.log(req, 'attendance', 'check-out', 'GPS Check-Out recorded', logId);
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
      let managerId = undefined;
      const userId = req.user?.employee_id || (req.user as any)?.userId || (req.user as any)?.id;

      if (req.user) {
        if (req.user.role_name === 'Employee') {
          empId = userId;
        }
        if (req.user.role_name === 'Manager') {
          managerId = userId;
        }
      }

      const filters = {
        employee_id: empId,
        manager_id: managerId,
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

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const record = await this.attendanceService.updateAttendance(id, req.body);
      return sendSuccess(res, 'Attendance record updated successfully', record);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update attendance record', [], 400);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.attendanceService.deleteAttendance(id);
      return sendSuccess(res, 'Attendance record soft-deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete attendance record', [], 400);
    }
  };
}
