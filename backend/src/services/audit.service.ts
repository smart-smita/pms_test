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
  oldValue?: any;
  old_value?: any;
  newValue?: any;
  new_value?: any;
}

export class AuditService {
  static async log(
    reqOrOptions: Request | AuditLogOptions,
    module?: string,
    action?: string,
    description?: string,
    recordId?: number,
    oldValue?: any,
    newValue?: any
  ) {
    try {
      let userId: number | null = null;
      let act = '';
      let mod = '';
      let desc = '';
      let recId: number | null = null;
      let ip = 'unknown';
      let oldVal: string | null = null;
      let newVal: string | null = null;

      if (reqOrOptions && typeof reqOrOptions === 'object' && ('module' in reqOrOptions || 'action' in reqOrOptions)) {
        const opts = reqOrOptions as AuditLogOptions;
        userId = opts.userId !== undefined ? opts.userId : (opts.user_id !== undefined ? opts.user_id : null);
        act = opts.action || '';
        mod = opts.module || '';
        desc = opts.description || '';
        recId = opts.recordId !== undefined ? opts.recordId : (opts.record_id !== undefined ? opts.record_id : null);
        ip = opts.ipAddress || opts.ip_address || 'unknown';
        const ov = opts.oldValue !== undefined ? opts.oldValue : opts.old_value;
        const nv = opts.newValue !== undefined ? opts.newValue : opts.new_value;
        oldVal = ov ? (typeof ov === 'string' ? ov : JSON.stringify(ov)) : null;
        newVal = nv ? (typeof nv === 'string' ? nv : JSON.stringify(nv)) : null;
      } else {
        const req = reqOrOptions as Request;
        const user = (req as any)?.user;
        userId = user ? (user.employee_id || user.id) : null;
        ip = req?.ip || (req?.connection as any)?.remoteAddress || 'unknown';
        mod = module || '';
        act = action || '';
        desc = description || '';
        recId = recordId || null;
        oldVal = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
        newVal = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;
      }

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, old_value, new_value, record_id, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, act, mod, desc, oldVal, newVal, recId, ip]
      );
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
