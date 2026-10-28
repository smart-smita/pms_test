import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';

export interface TermsTemplateItemDTO {
  item_id?: number;
  title: string;
  description: string;
  is_mandatory?: number | boolean;
  sort_order?: number;
  status?: number;
}

export interface CreateTermsTemplateDTO {
  template_name: string;
  description?: string | null;
  country_id?: number | null;
  project_type_id?: number | null;
  discipline_id?: number | null;
  terms_content?: string;
  items?: TermsTemplateItemDTO[];
  status?: number;
  version?: number;
  created_by?: number | null;
}

export class TermsTemplateRepository {
  static async getAll(filters: { country_id?: number; project_type_id?: number; discipline_id?: number; status?: number; all?: boolean } = {}) {
    let sql = `
      SELECT 
        tt.*,
        c.country_name,
        pt.type_name,
        d.discipline_name,
        e.name AS created_by_name,
        u.name AS updated_by_name
      FROM terms_templates tt
      LEFT JOIN countries c ON tt.country_id = c.country_id
      LEFT JOIN project_types pt ON tt.project_type_id = pt.type_id
      LEFT JOIN disciplines d ON tt.discipline_id = d.discipline_id
      LEFT JOIN employees e ON tt.created_by = e.employee_id
      LEFT JOIN employees u ON tt.updated_by = u.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!filters.all && filters.status === undefined) {
      sql += ` AND tt.status = 1`;
    } else if (filters.status !== undefined) {
      sql += ` AND tt.status = ?`;
      params.push(filters.status);
    }

    if (filters.country_id) {
      sql += ` AND (tt.country_id IS NULL OR tt.country_id = ?)`;
      params.push(filters.country_id);
    }
    if (filters.project_type_id) {
      sql += ` AND (tt.project_type_id IS NULL OR tt.project_type_id = ?)`;
      params.push(filters.project_type_id);
    }
    if (filters.discipline_id) {
      sql += ` AND (tt.discipline_id IS NULL OR tt.discipline_id = ?)`;
      params.push(filters.discipline_id);
    }

    sql += ` ORDER BY tt.template_name ASC`;
    const [rows]: any = await dbPool.query(sql, params);

    // Fetch items for each template
    for (const row of rows) {
      const [items]: any = await dbPool.query(
        `SELECT * FROM quotation_terms_template_items WHERE template_id = ? AND status = 1 ORDER BY sort_order ASC, item_id ASC`,
        [row.template_id]
      );
      row.items = items;
    }

    return rows;
  }

  static async getById(id: number) {
    const [rows]: any = await dbPool.query(
      `
      SELECT 
        tt.*,
        c.country_name,
        pt.type_name,
        d.discipline_name,
        e.name AS created_by_name,
        u.name AS updated_by_name
      FROM terms_templates tt
      LEFT JOIN countries c ON tt.country_id = c.country_id
      LEFT JOIN project_types pt ON tt.project_type_id = pt.type_id
      LEFT JOIN disciplines d ON tt.discipline_id = d.discipline_id
      LEFT JOIN employees e ON tt.created_by = e.employee_id
      LEFT JOIN employees u ON tt.updated_by = u.employee_id
      WHERE tt.template_id = ?
    `,
      [id]
    );

    if (rows.length > 0) {
      const template = rows[0];
      const [items]: any = await dbPool.query(
        `SELECT * FROM quotation_terms_template_items WHERE template_id = ? AND status = 1 ORDER BY sort_order ASC, item_id ASC`,
        [id]
      );
      template.items = items;
      return template;
    }

    return null;
  }

  static async findByName(templateName: string, excludeId?: number) {
    let sql = `SELECT * FROM terms_templates WHERE LOWER(TRIM(template_name)) = LOWER(TRIM(?))`;
    const params: any[] = [templateName];
    if (excludeId) {
      sql += ` AND template_id != ?`;
      params.push(excludeId);
    }
    const [rows]: any = await dbPool.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  static async create(data: CreateTermsTemplateDTO, userId?: number, ipAddress?: string) {
    const [result]: any = await dbPool.query(
      `
      INSERT INTO terms_templates (
        template_name, description, country_id, project_type_id, discipline_id,
        terms_content, status, version, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        data.template_name,
        data.description || null,
        data.country_id || null,
        data.project_type_id || null,
        data.discipline_id || null,
        data.terms_content || '',
        data.status !== undefined ? data.status : 1,
        data.version || 1,
        userId || data.created_by || null,
      ]
    );

    const id = result.insertId;

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await dbPool.query(
          `INSERT INTO quotation_terms_template_items (template_id, title, description, is_mandatory, sort_order, status) VALUES (?, ?, ?, ?, ?, 1)`,
          [id, item.title, item.description, item.is_mandatory ? 1 : 0, item.sort_order || 0]
        );
      }
    }

    await AuditService.log({
      user_id: userId,
      action: 'CREATE_TERMS_TEMPLATE',
      module: 'terms_templates',
      description: `Created Terms Template ${data.template_name} (ID: ${id})`,
      record_id: id,
      ip_address: ipAddress,
    });

    return this.getById(id);
  }

  static async update(id: number, data: Partial<CreateTermsTemplateDTO>, userId?: number, ipAddress?: string) {
    await dbPool.query(
      `
      UPDATE terms_templates SET
        template_name = COALESCE(?, template_name),
        description = ?,
        country_id = ?,
        project_type_id = ?,
        discipline_id = ?,
        terms_content = COALESCE(?, terms_content),
        status = COALESCE(?, status),
        version = version + 1,
        updated_by = ?
      WHERE template_id = ?
    `,
      [
        data.template_name,
        data.description !== undefined ? data.description : null,
        data.country_id !== undefined ? data.country_id : null,
        data.project_type_id !== undefined ? data.project_type_id : null,
        data.discipline_id !== undefined ? data.discipline_id : null,
        data.terms_content,
        data.status,
        userId || null,
        id,
      ]
    );

    if (data.items !== undefined) {
      await dbPool.query(`DELETE FROM quotation_terms_template_items WHERE template_id = ?`, [id]);
      if (data.items.length > 0) {
        for (const item of data.items) {
          await dbPool.query(
            `INSERT INTO quotation_terms_template_items (template_id, title, description, is_mandatory, sort_order, status) VALUES (?, ?, ?, ?, ?, 1)`,
            [id, item.title, item.description, item.is_mandatory ? 1 : 0, item.sort_order || 0]
          );
        }
      }
    }

    await AuditService.log({
      user_id: userId,
      action: 'UPDATE_TERMS_TEMPLATE',
      module: 'terms_templates',
      description: `Updated Terms Template ID ${id}`,
      record_id: id,
      ip_address: ipAddress,
    });

    return this.getById(id);
  }

  static async toggleStatus(id: number, status: number, userId?: number, ipAddress?: string) {
    await dbPool.query(`UPDATE terms_templates SET status = ?, updated_by = ? WHERE template_id = ?`, [status, userId || null, id]);
    return this.getById(id);
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    await dbPool.query(`DELETE FROM quotation_terms_template_items WHERE template_id = ?`, [id]);
    await dbPool.query(`DELETE FROM terms_templates WHERE template_id = ?`, [id]);

    await AuditService.log({
      user_id: userId,
      action: 'DELETE_TERMS_TEMPLATE',
      module: 'terms_templates',
      description: `Deleted Terms Template ID ${id}`,
      record_id: id,
      ip_address: ipAddress,
    });

    return true;
  }
}
