import { dbPool } from '../config/db';
import { Request } from 'express';

export interface AuditLogOptions {
  userId?: number | null;
  user_id?: number | null;
  module: string;
  action: string;
  description: string;
  recordId?: number | null;
  record_id?: number | null;
  ipAddress?: string | null;
  ip_address?: string | null;
}

export class AuditService {
  static async log(
    reqOrOptions: Request | AuditLogOptions,
    module?: string,
    action?: string,
    description?: string,
    recordId?: number
  ) {
    try {
      let userId: number | null = null;
      let act = '';
      let mod = '';
      let desc = '';
      let recId: number | null = null;
      let ip = 'unknown';

      if (reqOrOptions && typeof reqOrOptions === 'object' && ('module' in reqOrOptions || 'action' in reqOrOptions)) {
        const opts = reqOrOptions as AuditLogOptions;
        userId = opts.userId !== undefined ? opts.userId : (opts.user_id !== undefined ? opts.user_id : null);
        act = opts.action || '';
        mod = opts.module || '';
        desc = opts.description || '';
        recId = opts.recordId !== undefined ? opts.recordId : (opts.record_id !== undefined ? opts.record_id : null);
        ip = opts.ipAddress || opts.ip_address || 'unknown';
      } else {
        const req = reqOrOptions as Request;
        const user = (req as any)?.user;
        userId = user ? (user.employee_id || user.id) : null;
        ip = req?.ip || (req?.connection as any)?.remoteAddress || 'unknown';
        mod = module || '';
        act = action || '';
        desc = description || '';
        recId = recordId || null;
      }

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, record_id, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, act, mod, desc, recId, ip]
      );
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
