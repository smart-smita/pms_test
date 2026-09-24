import { Request, Response } from 'express';
import { LabourService } from '../services/labour.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class LabourController {
  private labourService = new LabourService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { search, labour_type, project_id, country_id } = req.query;
      const labours = await this.labourService.getLabours(
        search as string,
        labour_type as string,
        project_id ? Number(project_id) : undefined,
        country_id ? Number(country_id) : undefined
      );
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

  getDetails = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const details = await this.labourService.getLabourDetails(id);
      return sendSuccess(res, 'Labour profile details retrieved successfully', details);
    } catch (error: any) {
      return sendError(res, error.message || 'Labour details not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const uploadedBy = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const newLabour = await this.labourService.createLabour(req.body, uploadedBy, ipAddress);
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
}
