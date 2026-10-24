import { Request, Response, NextFunction } from 'express';
import { SettingService } from '../services/setting.service';
import { sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware ensuring the current route's category (material or labour) is enabled.
 * By default, rejects mutation requests (POST, PUT, PATCH, DELETE) with HTTP 403 Forbidden
 * if the category is disabled, while preserving historical read access.
 */
export function requireWorkCategory(
  requiredCategory: 'material' | 'labour',
  options: { blockAll?: boolean } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeCategory = await SettingService.getWorkCategory();

      if (activeCategory !== 'both' && activeCategory !== requiredCategory) {
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
        if (options.blockAll || isMutation) {
          const categoryLabel = requiredCategory === 'material' ? 'Material' : 'Labour & Contractor';
          return sendError(
            res,
            `Operation blocked: ${categoryLabel} operations are disabled by global work category configuration (Current mode: '${activeCategory}').`,
            [],
            403
          );
        }
      }

      next();
    } catch (err: any) {
      console.error('requireWorkCategory error:', err);
      next(err);
    }
  };
}

/**
 * Middleware ensuring only Admin / Super Admin can perform the action.
 */
export function requireAdmin() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', [], 401);
    }
    if (req.user.role_name !== 'Admin' && req.user.role_name !== 'Super Admin') {
      return sendError(
        res,
        'Forbidden: Only administrators can view or modify global work category settings.',
        [],
        403
      );
    }
    next();
  };
}
