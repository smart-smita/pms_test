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
}
