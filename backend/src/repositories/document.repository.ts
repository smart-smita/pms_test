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
  status: 'active' | 'expired' | 'archived';
  days_remaining?: number;
  uploaded_by: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
  updated_at: string;
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
       ORDER BY d.document_id DESC`,
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
         DATEDIFF(d.expiry_date, CURRENT_DATE()) AS days_remaining
       FROM entity_documents d
       JOIN document_types dt ON d.doc_type_id = dt.doc_type_id
       WHERE d.expiry_date IS NOT NULL
         AND d.status = 'active'
         AND DATEDIFF(d.expiry_date, CURRENT_DATE()) <= ?
       ORDER BY d.expiry_date ASC`,
      [daysThreshold]
    );
    return rows as EntityDocumentRow[];
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
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO entity_documents
         (entity_type, entity_id, doc_type_id, document_name, document_number,
          issue_date, expiry_date, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<EntityDocumentRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof EntityDocumentRow)[] = [
      'document_name', 'document_number', 'issue_date', 'expiry_date', 'file_path', 'status'
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
