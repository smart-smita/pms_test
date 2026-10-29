import { SettingRepository } from '../repositories/setting.repository';
import { dbPool } from '../config/db';

export type WorkCategoryType = 'material' | 'labour' | 'both';

export class SettingService {
  private repo = new SettingRepository();
  private static cachedWorkCategory: WorkCategoryType | null = null;
  private static cacheExpiry: number = 0;

  /**
   * Fast static lookup with 5-second cache to avoid hitting MySQL on every HTTP request.
   */
  static async getWorkCategory(): Promise<WorkCategoryType> {
    const now = Date.now();
    if (this.cachedWorkCategory && now < this.cacheExpiry) {
      return this.cachedWorkCategory;
    }
    const repo = new SettingRepository();
    const val = await repo.getSetting('work_category');
    if (val === 'material' || val === 'labour' || val === 'both') {
      this.cachedWorkCategory = val;
    } else {
      this.cachedWorkCategory = 'both';
    }
    this.cacheExpiry = now + 5000;
    return this.cachedWorkCategory;
  }

  static clearCache() {
    this.cachedWorkCategory = null;
    this.cacheExpiry = 0;
  }

  async getWorkCategory(): Promise<WorkCategoryType> {
    return SettingService.getWorkCategory();
  }

  async updateWorkCategory(value: WorkCategoryType, userId?: number): Promise<void> {
    if (value !== 'material' && value !== 'labour' && value !== 'both') {
      throw new Error(`Invalid work category option: '${value}'. Valid options are 'material', 'labour', or 'both'.`);
    }

    const previousValue = await this.getWorkCategory();

    await this.repo.setSetting(
      'work_category',
      value,
      'project_configuration',
      'Global Work Category: material, labour, or both',
      userId
    );

    SettingService.clearCache();

    // Log to audit_logs
    try {
      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, created_at)
         VALUES (?, 'UPDATE_WORK_CATEGORY', 'settings', ?, NOW())`,
        [
          userId || null,
          `Global work category changed from '${previousValue}' to '${value}'`,
        ]
      );
    } catch (e) {
      // Non-fatal
    }
  }

  async getWorkCategoryImpact(target: WorkCategoryType) {
    return this.repo.getWorkCategoryImpact(target);
  }

  async getCompanyProfile(): Promise<Record<string, string>> {
    const [rows]: any = await dbPool.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_group = 'company_profile'`
    );
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.setting_key] = r.setting_value;
    }
    return result;
  }

  async updateCompanyProfile(data: Record<string, string>, userId?: number): Promise<Record<string, string>> {
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null) {
        await this.repo.setSetting(k, String(v), 'company_profile', `Company Profile: ${k}`, userId);
      }
    }
    return this.getCompanyProfile();
  }
}
