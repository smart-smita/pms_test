import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { SettingService, WorkCategoryType } from '../services/setting.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class SettingController {
  private svc = new SettingService();

  getWorkCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const category = await this.svc.getWorkCategory();
      return sendSuccess(res, 'Work category retrieved successfully', {
        work_category: category,
        is_material_enabled: category === 'material' || category === 'both',
        is_labour_enabled: category === 'labour' || category === 'both',
      });
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  updateWorkCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { work_category } = req.body;
      if (!work_category) {
        return sendError(res, 'work_category is required', [], 400);
      }
      if (work_category !== 'material' && work_category !== 'labour' && work_category !== 'both') {
        return sendError(
          res,
          `Invalid work category: '${work_category}'. Must be 'material', 'labour', or 'both'.`,
          [],
          400
        );
      }

      const userId = req.user?.employee_id || 1;
      await this.svc.updateWorkCategory(work_category as WorkCategoryType, userId);

      return sendSuccess(res, `Global work category successfully updated to '${work_category}'`, {
        work_category,
        is_material_enabled: work_category === 'material' || work_category === 'both',
        is_labour_enabled: work_category === 'labour' || work_category === 'both',
      });
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  getWorkCategoryImpact = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const target = (req.query.target as WorkCategoryType) || 'material';
      if (target !== 'material' && target !== 'labour' && target !== 'both') {
        return sendError(res, 'Invalid target category', [], 400);
      }
      const impact = await this.svc.getWorkCategoryImpact(target);
      return sendSuccess(res, 'Work category impact calculated', impact);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getCompanyProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.svc.getCompanyProfile();
      return sendSuccess(res, 'Company profile retrieved successfully', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  updateCompanyProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.employee_id || 1;
      const data = await this.svc.updateCompanyProfile(req.body, userId);
      return sendSuccess(res, 'Company profile updated successfully', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };
}
