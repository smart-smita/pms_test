import { dbPool } from '../config/db';
import { Request } from 'express';

export class AuditService {
  static async log(req: Request, module: string, action: string, description: string, recordId?: number) {
    try {
      const user = (req as any).user;
      const userId = user ? user.id : null;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, record_id, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, action, module, description, recordId || null, ipAddress]
      );
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
