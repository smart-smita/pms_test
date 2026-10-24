import { dbPool } from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface SystemSettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string;
  setting_group: string;
  description?: string;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export class SettingRepository {
  private async ensureTableExists(): Promise<void> {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
        setting_value TEXT NOT NULL,
        setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
        description VARCHAR(255) NULL,
        updated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async getSetting(key: string): Promise<string | null> {
    try {
      const [rows] = await dbPool.query<SystemSettingRow[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [key]
      );
      if (!rows || rows.length === 0) return null;
      return rows[0].setting_value;
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        await this.ensureTableExists();
        return null;
      }
      console.error('Error fetching setting:', err.message);
      return null;
    }
  }

  async setSetting(
    key: string,
    value: string,
    group: string = 'general',
    description?: string,
    updatedBy?: number
  ): Promise<void> {
    try {
      await dbPool.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_group, description, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           setting_value = VALUES(setting_value),
           setting_group = VALUES(setting_group),
           description = COALESCE(VALUES(description), description),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
        [key, value, group, description || null, updatedBy || null]
      );
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        await this.ensureTableExists();
        await dbPool.query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_group, description, updated_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value),
             setting_group = VALUES(setting_group),
             description = COALESCE(VALUES(description), description),
             updated_by = VALUES(updated_by),
             updated_at = CURRENT_TIMESTAMP`,
          [key, value, group, description || null, updatedBy || null]
        );
      } else {
        throw err;
      }
    }
  }

  async getWorkCategoryImpact(targetCategory: 'material' | 'labour' | 'both'): Promise<{
    target: string;
    laboursCount: number;
    pendingTimesheetsCount: number;
    unpaidLabourPaymentsCount: number;
    materialsCount: number;
    pendingPurchaseOrdersCount: number;
    pendingIndentsCount: number;
  }> {
    // 1. Labour stats
    let laboursCount = 0;
    let pendingTimesheetsCount = 0;
    let unpaidLabourPaymentsCount = 0;

    try {
      const [lRows]: any = await dbPool.query(`SELECT COUNT(*) as cnt FROM labours WHERE is_deleted = 0`);
      laboursCount = Number(lRows[0]?.cnt || 0);
    } catch {}

    try {
      const [tsRows]: any = await dbPool.query(`SELECT COUNT(*) as cnt FROM timesheets WHERE status = 'pending'`);
      pendingTimesheetsCount = Number(tsRows[0]?.cnt || 0);
    } catch {}

    try {
      const [lpRows]: any = await dbPool.query(`SELECT COUNT(*) as cnt FROM labour_payments WHERE status != 'paid'`);
      unpaidLabourPaymentsCount = Number(lpRows[0]?.cnt || 0);
    } catch {}

    // 2. Material stats
    let materialsCount = 0;
    let pendingPurchaseOrdersCount = 0;
    let pendingIndentsCount = 0;

    try {
      const [mRows]: any = await dbPool.query(`SELECT COUNT(*) as cnt FROM materials WHERE status = 'active'`);
      materialsCount = Number(mRows[0]?.cnt || 0);
    } catch {}

    try {
      const [poRows]: any = await dbPool.query(
        `SELECT COUNT(*) as cnt FROM purchase_orders WHERE status IN ('draft', 'pending_approval', 'issued', 'partially_received')`
      );
      pendingPurchaseOrdersCount = Number(poRows[0]?.cnt || 0);
    } catch {}

    try {
      const [miRows]: any = await dbPool.query(
        `SELECT COUNT(*) as cnt FROM material_indents WHERE status IN ('draft', 'submitted')`
      );
      pendingIndentsCount = Number(miRows[0]?.cnt || 0);
    } catch {}

    return {
      target: targetCategory,
      laboursCount,
      pendingTimesheetsCount,
      unpaidLabourPaymentsCount,
      materialsCount,
      pendingPurchaseOrdersCount,
      pendingIndentsCount,
    };
  }
}
