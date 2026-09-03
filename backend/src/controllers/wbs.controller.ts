import { Request, Response } from 'express';
import { WbsService } from '../services/wbs.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class WbsController {
  private wbsService = new WbsService();

  getMasterList = async (req: Request, res: Response) => {
    try {
      const list = await this.wbsService.getMasterWbsList();
      return sendSuccess(res, 'WBS Master List retrieved successfully', list);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch WBS master list', [], 500);
    }
  };

  getProjectWbs = async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const allocations = await this.wbsService.getProjectWbsAllocations(projectId);
      return sendSuccess(res, 'Project WBS allocations retrieved', allocations);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch project WBS', [], 500);
    }
  };

  addProjectWbs = async (req: Request, res: Response) => {
    try {
      const { project_id, wbs_id, start_date, end_date, total_hours, note } = req.body;
      if (!project_id || !wbs_id) {
        return sendError(res, 'project_id and wbs_id are required', [], 400);
      }
      const newAllocation = await this.wbsService.addProjectWbsAllocation({
        project_id: Number(project_id),
        wbs_id: Number(wbs_id),
        start_date,
        end_date,
        total_hours: total_hours ? Number(total_hours) : 0,
        note,
      });
      return sendSuccess(res, 'Project WBS discipline allocated successfully', newAllocation, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to allocate project WBS', [], 400);
    }
  };

  updateProjectWbs = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.wbsService.updateProjectWbsAllocation(id, req.body);
      return sendSuccess(res, 'Project WBS allocation updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update project WBS', [], 400);
    }
  };

  getDependencies = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deps = await this.wbsService.checkWbsDependencies(id);
      return sendSuccess(res, 'Dependencies retrieved', deps);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to check dependencies', [], 500);
    }
  };

  deleteProjectWbs = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      const force = req.query.force === 'true';
      await this.wbsService.deleteProjectWbsAllocation(id, user?.id || 1, force);
      return sendSuccess(res, 'Project WBS discipline removed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to remove project WBS discipline', [], 400);
    }
  };
}
