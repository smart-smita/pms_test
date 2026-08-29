import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/apiResponse';
import { dbPool } from '../config/db';

export function requirePermission(moduleName: string, action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', [], 401);
      }

      // Super Admin bypass
      if (req.user.role_name === 'Admin' || req.user.role_name === 'SUPER_ADMIN' || req.user.role_name === 'System Administrator') {
        return next();
      }

      // Check DB for permission
      const [rows]: any = await dbPool.execute(
        `SELECT rp.id 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         JOIN roles r ON rp.role_id = r.id
         WHERE r.role_name = ? AND p.module = ? AND p.action = ?`,
        [req.user.role_name, moduleName, action]
      );

      if (rows.length === 0) {
        return sendError(res, `Forbidden: You do not have permission to ${action} ${moduleName}`, [], 403);
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Internal server error checking permissions', [], 500);
    }
  };
}
