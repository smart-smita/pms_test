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

      // Super Admin / Admin bypass
      if (req.user.role_name === 'Admin') {
        return next();
      }

      // Allow all authenticated users view access to personal modules
      if (action === 'view' && ['tasks', 'attendance', 'payments', 'reports', 'settings', 'support', 'profile', 'dashboard'].includes(moduleName)) {
        return next();
      }

      // Allow check-in and check-out
      if (moduleName === 'attendance' && action === 'create') {
        return next();
      }

      // Check DB for permission using correct column r.role_id
      const [rows]: any = await dbPool.execute(
        `SELECT rp.id 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         JOIN roles r ON rp.role_id = r.role_id
         WHERE r.role_name = ? AND p.module = ? AND p.action = ?`,
        [req.user.role_name, moduleName, action]
      );

      if (rows.length === 0) {
        return sendError(res, `Forbidden: You do not have permission to ${action} ${moduleName}`, [], 403);
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      if (action === 'view') {
        return next();
      }
      return sendError(res, 'Internal server error checking permissions', [], 500);
    }
  };
}
