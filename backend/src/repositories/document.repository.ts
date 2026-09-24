import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface EntityDocumentRow {
  document_id: number;
  entity_type: 'employee' | 'labour' | 'project' | 'quotation' | 'discipline';
  entity_id: number;
  doc_type_id: number;
  doc_type_code?: string;
  doc_type_name?: string;
  document_name: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'archived';
  is_current?: number;
  replaced_by_id?: number | null;
  notes?: string | null;
  days_remaining?: number;
  uploaded_by: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
  updated_at: string;

  // Additional joined fields
  person_name?: string;
  project_name?: string;
  country_name?: string;
  calculated_status?: string;
  assigned_project_id?: number | null;
  reporting_to_id?: number | null;
}

export class DocumentRepository {
  async findByEntity(entityType: string, entityId: number): Promise<EntityDocumentRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         d.*,
         dt.type_code AS doc_type_code,
         dt.type_name AS doc_type_name,
         e.name AS uploaded_by_name,
         CASE 
           WHEN d.expiry_date IS NOT NULL THEN DATEDIFF(d.expiry_date, CURRENT_DATE())
           ELSE NULL
         END AS days_remaining
       FROM entity_documents d
       LEFT JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
       LEFT JOIN employees e ON d.uploaded_by = e.employee_id
       WHERE d.entity_type = ? AND d.entity_id = ?
       ORDER BY d.is_current DESC, d.document_id DESC`,
      [entityType, entityId]
    );
    return rows as EntityDocumentRow[];
  }

  async findById(id: number): Promise<EntityDocumentRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         d.*,
         dt.type_code AS doc_type_code,
         dt.type_name AS doc_type_name,
         e.name AS uploaded_by_name,
         CASE 
           WHEN d.expiry_date IS NOT NULL THEN DATEDIFF(d.expiry_date, CURRENT_DATE())
           ELSE NULL
         END AS days_remaining
       FROM entity_documents d
       LEFT JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
       LEFT JOIN employees e ON d.uploaded_by = e.employee_id
       WHERE d.document_id = ?`,
      [id]
    );
    return (rows[0] as EntityDocumentRow) || null;
  }

  async findExpiringDocuments(daysThreshold = 10): Promise<EntityDocumentRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         d.*,
         dt.type_code AS doc_type_code,
         dt.type_name AS doc_type_name,
         DATEDIFF(d.expiry_date, CURRENT_DATE()) AS days_remaining,
         CASE
           WHEN d.entity_type = 'employee' THEN (SELECT name FROM employees WHERE employee_id = d.entity_id)
           WHEN d.entity_type = 'labour' THEN (SELECT name FROM labours WHERE labour_id = d.entity_id)
           WHEN d.entity_type = 'project' THEN (SELECT project_name FROM projects WHERE project_id = d.entity_id)
           ELSE ''
         END AS person_name,
         CASE
           WHEN d.entity_type = 'employee' THEN (SELECT assigned_project_id FROM employees WHERE employee_id = d.entity_id)
           WHEN d.entity_type = 'labour' THEN (SELECT assigned_project_id FROM labours WHERE labour_id = d.entity_id)
           ELSE NULL
         END AS assigned_project_id,
         CASE
           WHEN d.entity_type = 'employee' THEN (SELECT reporting_to_id FROM employees WHERE employee_id = d.entity_id)
           ELSE NULL
         END AS reporting_to_id
       FROM entity_documents d
       JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
       WHERE d.expiry_date IS NOT NULL
         AND d.status != 'archived'
         AND d.is_current = 1
         AND DATEDIFF(d.expiry_date, CURRENT_DATE()) <= ?
       ORDER BY d.expiry_date ASC`,
      [daysThreshold]
    );
    return rows as EntityDocumentRow[];
  }

  async findExpiryManagementList(filters: {
    entity_type?: string;
    doc_type_id?: number;
    country_id?: number;
    project_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<EntityDocumentRow[]> {
    let sql = `
      SELECT
        d.*,
        dt.type_code AS doc_type_code,
        dt.type_name AS doc_type_name,
        DATEDIFF(d.expiry_date, CURRENT_DATE()) AS days_remaining,
        CASE
          WHEN d.entity_type = 'employee' THEN emp.name
          WHEN d.entity_type = 'labour' THEN lab.name
          WHEN d.entity_type = 'project' THEN proj.project_name
          ELSE 'N/A'
        END AS person_name,
        CASE
          WHEN d.entity_type = 'employee' THEN emp.employee_code
          WHEN d.entity_type = 'labour' THEN CONCAT('LAB-', lab.labour_id)
          ELSE ''
        END AS person_code,
        CASE
          WHEN d.entity_type = 'employee' THEN p_emp.project_name
          WHEN d.entity_type = 'labour' THEN p_lab.project_name
          WHEN d.entity_type = 'project' THEN proj.project_name
          ELSE 'Unassigned'
        END AS project_name,
        CASE
          WHEN d.entity_type = 'employee' THEN c_emp.country_name
          WHEN d.entity_type = 'labour' THEN c_lab.country_name
          ELSE 'Global'
        END AS country_name
      FROM entity_documents d
      JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
      LEFT JOIN employees emp ON d.entity_type = 'employee' AND d.entity_id = emp.employee_id
      LEFT JOIN labours lab ON d.entity_type = 'labour' AND d.entity_id = lab.labour_id
      LEFT JOIN projects proj ON d.entity_type = 'project' AND d.entity_id = proj.project_id
      LEFT JOIN projects p_emp ON emp.assigned_project_id = p_emp.project_id
      LEFT JOIN projects p_lab ON lab.assigned_project_id = p_lab.project_id
      LEFT JOIN countries c_emp ON emp.country_id = c_emp.country_id
      LEFT JOIN countries c_lab ON lab.country_id = c_lab.country_id
      WHERE d.is_current = 1 AND d.status != 'archived' AND d.expiry_date IS NOT NULL
    `;
    const params: any[] = [];

    if (filters.entity_type && filters.entity_type !== 'all') {
      sql += ` AND d.entity_type = ?`;
      params.push(filters.entity_type);
    }

    if (filters.doc_type_id) {
      sql += ` AND d.doc_type_id = ?`;
      params.push(filters.doc_type_id);
    }

    if (filters.project_id) {
      sql += ` AND (emp.assigned_project_id = ? OR lab.assigned_project_id = ? OR proj.project_id = ?)`;
      params.push(filters.project_id, filters.project_id, filters.project_id);
    }

    if (filters.country_id) {
      sql += ` AND (emp.country_id = ? OR lab.country_id = ?)`;
      params.push(filters.country_id, filters.country_id);
    }

    if (filters.date_from) {
      sql += ` AND d.expiry_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ` AND d.expiry_date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.status) {
      const s = filters.status.toLowerCase();
      if (s === 'expired') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) <= 0`;
      } else if (s === '1') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 1`;
      } else if (s === '2') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 2`;
      } else if (s === '3') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 3`;
      } else if (s === '5') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 5`;
      } else if (s === '8') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 8`;
      } else if (s === '10') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) = 10`;
      } else if (s === 'active') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) > 10`;
      } else if (s === 'expiring_soon') {
        sql += ` AND DATEDIFF(d.expiry_date, CURRENT_DATE()) BETWEEN 0 AND 10`;
      }
    }

    sql += ` ORDER BY d.expiry_date ASC, d.document_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as EntityDocumentRow[];
  }

  async getExpiryDashboardCounts(): Promise<{
    visa_expiring_soon: number;
    documents_expiring_soon: number;
    expired_documents: number;
    contracts_expiring_soon: number;
  }> {
    const [rows]: any = await dbPool.query(`
      SELECT
        COUNT(CASE WHEN dt.type_code = 'VISA' AND DATEDIFF(d.expiry_date, CURRENT_DATE()) BETWEEN 0 AND 10 THEN 1 END) AS visa_expiring_soon,
        COUNT(CASE WHEN DATEDIFF(d.expiry_date, CURRENT_DATE()) BETWEEN 0 AND 10 THEN 1 END) AS documents_expiring_soon,
        COUNT(CASE WHEN DATEDIFF(d.expiry_date, CURRENT_DATE()) < 0 THEN 1 END) AS expired_documents,
        COUNT(CASE WHEN dt.type_code IN ('CONTRACT', 'LABOUR_CONTRACT') AND DATEDIFF(d.expiry_date, CURRENT_DATE()) BETWEEN 0 AND 10 THEN 1 END) AS contracts_expiring_soon
      FROM entity_documents d
      JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
      WHERE d.is_current = 1 AND d.status != 'archived' AND d.expiry_date IS NOT NULL
    `);

    return {
      visa_expiring_soon: Number(rows[0]?.visa_expiring_soon || 0),
      documents_expiring_soon: Number(rows[0]?.documents_expiring_soon || 0),
      expired_documents: Number(rows[0]?.expired_documents || 0),
      contracts_expiring_soon: Number(rows[0]?.contracts_expiring_soon || 0),
    };
  }

  async getNotificationHistory(entityType: string, entityId: number): Promise<any[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         log.id,
         log.document_id,
         log.days_before,
         log.sent_at,
         log.delivery_status,
         d.document_name,
         d.document_number,
         d.expiry_date,
         dt.type_name AS doc_type_name,
         u.name AS recipient_name,
         r.role_name AS recipient_role
       FROM expiry_notifications_log log
       JOIN entity_documents d ON log.document_id = d.document_id
       JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
       LEFT JOIN employees u ON log.recipient_user_id = u.employee_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE log.entity_type = ? AND log.entity_id = ?
       ORDER BY log.sent_at DESC`,
      [entityType, entityId]
    );
    return rows;
  }

  async create(data: {
    entity_type: string;
    entity_id: number;
    doc_type_id: number;
    document_name: string;
    document_number?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    file_path: string;
    file_size?: number;
    mime_type?: string | null;
    uploaded_by?: number | null;
    status?: 'active' | 'expiring_soon' | 'expired' | 'archived';
    is_current?: number;
    notes?: string | null;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO entity_documents
         (entity_type, entity_id, doc_type_id, document_name, document_number,
          issue_date, expiry_date, file_path, file_size, mime_type, uploaded_by, status, is_current, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.entity_type,
        data.entity_id,
        data.doc_type_id,
        data.document_name,
        data.document_number || null,
        data.issue_date || null,
        data.expiry_date || null,
        data.file_path,
        data.file_size || 0,
        data.mime_type || null,
        data.uploaded_by || null,
        data.status || 'active',
        data.is_current !== undefined ? data.is_current : 1,
        data.notes || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<EntityDocumentRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof EntityDocumentRow)[] = [
      'document_name', 'document_number', 'issue_date', 'expiry_date', 'file_path', 'status', 'is_current', 'replaced_by_id', 'notes'
    ];
    for (const key of editable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE entity_documents SET ${fields.join(', ')} WHERE document_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `DELETE FROM entity_documents WHERE document_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
