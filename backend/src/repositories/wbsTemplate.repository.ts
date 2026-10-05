import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface WbsTemplateProjectTypeRow {
  id: number;
  template_id: number;
  project_type_id: number;
  project_type_name?: string;
  project_type_code?: string;
  sort_order: number;
  wbs_count?: number;
}

export interface WbsTemplateRow {
  id: number;
  template_code: string;
  template_name: string;
  description?: string;
  status: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  detail_count?: number;
  project_type_count?: number;
  project_type_names?: string;
  project_types?: WbsTemplateProjectTypeRow[];
  details?: WbsTemplateDetailRow[];
}

export interface WbsTemplateDetailRow {
  id: number;
  template_id: number;
  project_type_id: number;
  project_type_name?: string;
  parent_id: number | null;
  wbs_id: number | null;
  wbs_code?: string;
  wbs_name?: string;
  description?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export class WbsTemplateRepository {
  // -----------------------------------------------------------------------
  // Templates CRUD
  // -----------------------------------------------------------------------
  async findAll(filters: { project_type_id?: number; status?: number } = {}): Promise<WbsTemplateRow[]> {
    let sql = `
      SELECT t.id,
             t.template_code,
             t.template_name,
             t.description,
             t.status,
             t.created_by,
             t.created_at,
             t.updated_at,
             (SELECT COUNT(*) FROM wbs_template_details d WHERE d.template_id = t.id) AS detail_count,
             (SELECT COUNT(*) FROM wbs_template_project_types pt WHERE pt.template_id = t.id) AS project_type_count,
             (
               SELECT GROUP_CONCAT(DISTINCT ptt.type_name ORDER BY ptt.type_name SEPARATOR ', ')
               FROM wbs_template_project_types pt
               JOIN project_types ptt ON pt.project_type_id = ptt.type_id
               WHERE pt.template_id = t.id
             ) AS project_type_names
      FROM wbs_templates t
      WHERE t.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filters.project_type_id) {
      sql += ` AND EXISTS (
        SELECT 1 FROM wbs_template_project_types pt 
        WHERE pt.template_id = t.id AND pt.project_type_id = ?
      )`;
      params.push(filters.project_type_id);
    }
    if (filters.status !== undefined) {
      sql += ' AND t.status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY t.template_name ASC';

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    const templates = rows as WbsTemplateRow[];

    // Fetch project types for each template
    for (const t of templates) {
      t.project_types = await this.findTemplateProjectTypes(t.id);
    }

    return templates;
  }

  async findById(id: number): Promise<WbsTemplateRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT t.id,
              t.template_code,
              t.template_name,
              t.description,
              t.status,
              t.created_by,
              t.created_at,
              t.updated_at,
              (SELECT COUNT(*) FROM wbs_template_details d WHERE d.template_id = t.id) AS detail_count
       FROM wbs_templates t
       WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    );
    if (!rows.length) return null;
    const template = rows[0] as WbsTemplateRow;
    template.project_types = await this.findTemplateProjectTypes(id);
    template.details = await this.findDetails(id);
    return template;
  }

  async findByCode(code: string): Promise<WbsTemplateRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM wbs_templates WHERE template_code = ? AND deleted_at IS NULL`,
      [code]
    );
    return (rows[0] as WbsTemplateRow) || null;
  }

  async create(data: {
    template_code: string;
    template_name: string;
    description?: string;
    status?: number;
    created_by?: number;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO wbs_templates (template_code, template_name, description, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.template_code,
        data.template_name,
        data.description || null,
        data.status ?? 1,
        data.created_by || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<WbsTemplateRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.template_name !== undefined) { fields.push('template_name = ?'); params.push(data.template_name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description || null); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE wbs_templates SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDelete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE wbs_templates SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async generateCode(): Promise<string> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT template_code FROM wbs_templates WHERE template_code LIKE 'WBST-%'`
    );
    let maxNum = 0;
    for (const r of rows) {
      const match = (r.template_code as string)?.match(/WBST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    let candidateNum = maxNum + 1;
    while (true) {
      const candidateCode = `WBST-${String(candidateNum).padStart(4, '0')}`;
      const [exists]: any = await dbPool.execute(
        `SELECT id FROM wbs_templates WHERE template_code = ?`,
        [candidateCode]
      );
      if (exists.length === 0) {
        return candidateCode;
      }
      candidateNum++;
    }
  }

  // -----------------------------------------------------------------------
  // Template Project Types
  // -----------------------------------------------------------------------
  async findTemplateProjectTypes(templateId: number): Promise<WbsTemplateProjectTypeRow[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT wtpt.*,
              pt.type_name AS project_type_name,
              pt.type_code AS project_type_code,
              (SELECT COUNT(*) FROM wbs_template_details d WHERE d.template_id = wtpt.template_id AND d.project_type_id = wtpt.project_type_id) AS wbs_count
       FROM wbs_template_project_types wtpt
       JOIN project_types pt ON wtpt.project_type_id = pt.type_id
       WHERE wtpt.template_id = ?
       ORDER BY wtpt.sort_order ASC, wtpt.id ASC`,
      [templateId]
    );
    return rows as WbsTemplateProjectTypeRow[];
  }

  async setTemplateProjectTypes(templateId: number, projectTypeIds: number[]): Promise<void> {
    await dbPool.execute(`DELETE FROM wbs_template_project_types WHERE template_id = ?`, [templateId]);
    for (let i = 0; i < projectTypeIds.length; i++) {
      const ptId = projectTypeIds[i];
      if (!ptId) continue;
      await dbPool.execute(
        `INSERT IGNORE INTO wbs_template_project_types (template_id, project_type_id, sort_order) VALUES (?, ?, ?)`,
        [templateId, ptId, i]
      );
    }
  }

  // -----------------------------------------------------------------------
  // Template Details CRUD
  // -----------------------------------------------------------------------
  async findDetails(templateId: number, projectTypeId?: number): Promise<WbsTemplateDetailRow[]> {
    let sql = `
      SELECT d.*,
             pt.type_name AS project_type_name
      FROM wbs_template_details d
      LEFT JOIN project_types pt ON d.project_type_id = pt.type_id
      WHERE d.template_id = ?
    `;
    const params: any[] = [templateId];
    if (projectTypeId) {
      sql += ` AND d.project_type_id = ?`;
      params.push(projectTypeId);
    }
    sql += ` ORDER BY d.project_type_id ASC, d.sort_order ASC, d.id ASC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows as WbsTemplateDetailRow[];
  }

  async findDetailById(id: number): Promise<WbsTemplateDetailRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT d.*, pt.type_name AS project_type_name
       FROM wbs_template_details d
       LEFT JOIN project_types pt ON d.project_type_id = pt.type_id
       WHERE d.id = ?`,
      [id]
    );
    return (rows[0] as WbsTemplateDetailRow) || null;
  }

  async createDetail(data: {
    template_id: number;
    project_type_id: number;
    parent_id?: number | null;
    wbs_id?: number | null;
    wbs_name?: string;
    wbs_code?: string;
    description?: string;
    sort_order?: number;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO wbs_template_details
         (template_id, project_type_id, parent_id, wbs_id, wbs_name, wbs_code, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.template_id,
        data.project_type_id,
        data.parent_id || null,
        data.wbs_id || null,
        data.wbs_name || '',
        data.wbs_code || null,
        data.description || null,
        data.sort_order || 0,
      ]
    );
    return result.insertId;
  }

  async updateDetail(id: number, data: Partial<WbsTemplateDetailRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.project_type_id !== undefined) { fields.push('project_type_id = ?'); params.push(data.project_type_id); }
    if (data.parent_id !== undefined) { fields.push('parent_id = ?'); params.push(data.parent_id); }
    if (data.wbs_id !== undefined) { fields.push('wbs_id = ?'); params.push(data.wbs_id); }
    if (data.wbs_name !== undefined) { fields.push('wbs_name = ?'); params.push(data.wbs_name); }
    if (data.wbs_code !== undefined) { fields.push('wbs_code = ?'); params.push(data.wbs_code); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description || null); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(data.sort_order); }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE wbs_template_details SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async deleteDetail(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM wbs_template_details WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async deleteAllDetails(templateId: number): Promise<void> {
    await dbPool.execute(`DELETE FROM wbs_template_details WHERE template_id = ?`, [templateId]);
  }

  async duplicate(sourceId: number, createdBy?: number): Promise<number> {
    const source = await this.findById(sourceId);
    if (!source) throw new Error('Source WBS template not found');

    const projectTypes = await this.findTemplateProjectTypes(sourceId);
    const details = await this.findDetails(sourceId);
    const newCode = await this.generateCode();

    const newId = await this.create({
      template_code: newCode,
      template_name: `${source.template_name} (Copy)`,
      description: source.description || undefined,
      status: source.status,
      created_by: createdBy,
    });

    // Copy project types
    const ptIds = projectTypes.map(pt => pt.project_type_id);
    await this.setTemplateProjectTypes(newId, ptIds);

    // Copy details maintaining hierarchy
    const idMap = new Map<number, number>();
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const newParentId = d.parent_id ? idMap.get(d.parent_id) || null : null;
      const newDetailId = await this.createDetail({
        template_id: newId,
        project_type_id: d.project_type_id,
        parent_id: newParentId,
        wbs_id: d.wbs_id,
        wbs_name: d.wbs_name,
        wbs_code: d.wbs_code,
        description: d.description,
        sort_order: d.sort_order || i,
      });
      idMap.set(d.id, newDetailId);
    }

    return newId;
  }
}
