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
  async getSetting(key: string): Promise<string | null> {
    const [rows] = await dbPool.query<SystemSettingRow[]>(
      `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
      [key]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0].setting_value;
  }

  async setSetting(
    key: string,
    value: string,
    group: string = 'general',
    description?: string,
    updatedBy?: number
  ): Promise<void> {
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
