import { Request, Response } from 'express';
import { LabourService } from '../services/labour.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class LabourController {
  private labourService = new LabourService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { search, labour_type } = req.query;
      const labours = await this.labourService.getLabours(search as string, labour_type as string);
      return sendSuccess(res, 'Labours retrieved successfully', labours);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve labours', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const labour = await this.labourService.getLabourById(id);
      return sendSuccess(res, 'Labour record retrieved successfully', labour);
    } catch (error: any) {
      return sendError(res, error.message || 'Labour record not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const newLabour = await this.labourService.createLabour(req.body);
      return sendSuccess(res, 'Labour record created successfully', newLabour, 201);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return sendError(res, error.message || 'Failed to create labour record', error.existingLabour ? [error.existingLabour] : [], statusCode);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.labourService.updateLabour(id, req.body);
      return sendSuccess(res, 'Labour record updated successfully', updated);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return sendError(res, error.message || 'Failed to update labour record', error.existingLabour ? [error.existingLabour] : [], statusCode);
    }
  };

  getDependencies = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deps = await this.labourService.getDependencies(id);
      return sendSuccess(res, 'Labour dependencies retrieved successfully', deps);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve dependencies', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const force = req.query.force === 'true';
      await this.labourService.deleteLabour(id, force);
      return sendSuccess(res, 'Labour record deleted successfully');
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return sendError(res, error.message || 'Failed to delete labour record', error.dependencies ? [error.dependencies] : [], statusCode);
    }
  };

  getAttendance = async (req: Request, res: Response) => {
    try {
      const { project_id, start_date, end_date } = req.query;
      const projectId = project_id ? parseInt(project_id as string, 10) : undefined;
      let managerId = undefined;
      const user = (req as any).user;
      if (user?.role_name === 'Manager') {
        managerId = user.employee_id || user.userId || user.id;
      }

      const attendanceLogs = await this.labourService.getLabourAttendance(
        projectId,
        start_date as string,
        end_date as string,
        managerId
      );
      return sendSuccess(res, 'Labour attendance logs retrieved successfully', attendanceLogs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve labour attendance logs', [], 500);
    }
  };

  createAttendance = async (req: Request, res: Response) => {
    try {
      const result = await this.labourService.createLabourAttendance(req.body);
      return sendSuccess(res, 'Labour attendance logged successfully', result, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to log labour attendance', [], 400);
    }
  };

  updateAttendance = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.labourService.updateLabourAttendance(id, req.body);
      return sendSuccess(res, 'Labour attendance updated successfully', result);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update labour attendance', [], 400);
    }
  };

  deleteAttendance = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.labourService.deleteLabourAttendance(id);
      return sendSuccess(res, 'Labour attendance soft-deleted successfully', result);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete labour attendance', [], 400);
    }
  };
}
