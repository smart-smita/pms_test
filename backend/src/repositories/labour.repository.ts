import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface LabourRow {
  labour_id: number;
  name: string;
  contact_number: string | null;
  aadhar_id: string | null;
  labour_type: 'contractor' | 'direct_labour';
  contractor_id?: number | null;
  contractor_name?: string | null;
  assigned_project_id?: number | null;
  assigned_project_name?: string | null;
  nationality_id?: number | null;
  nationality_name?: string | null;
  country_id?: number | null;
  country_name?: string | null;
  emreads_id?: string | null;
  email?: string | null;
  status?: 'active' | 'inactive';
  sub_worker_count?: number;
  created_at: string;
  updated_at?: string;
}

export class LabourRepository {
  async findAll(search?: string, labourType?: string, projectId?: number, countryId?: number): Promise<LabourRow[]> {
    let sql = `
      SELECT l.labour_id, l.name, l.contact_number, l.aadhar_id, l.labour_type, l.contractor_id,
             l.assigned_project_id, l.nationality_id, l.country_id, l.emreads_id, l.email,
             IFNULL(l.status, 'active') AS status, l.created_at, l.updated_at,
             c.name AS contractor_name,
             p.project_name AS assigned_project_name,
             n.nationality_name,
             co.country_name,
             (SELECT COUNT(*) FROM labours sub WHERE sub.contractor_id = l.labour_id) AS sub_worker_count
      FROM labours l
      LEFT JOIN labours c ON l.contractor_id = c.labour_id
      LEFT JOIN projects p ON l.assigned_project_id = p.project_id
      LEFT JOIN nationalities n ON l.nationality_id = n.nationality_id
      LEFT JOIN countries co ON l.country_id = co.country_id
      WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (l.name LIKE ? OR l.contact_number LIKE ? OR l.aadhar_id LIKE ? OR l.emreads_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (labourType) {
      sql += ` AND l.labour_type = ?`;
      params.push(labourType);
    }

    if (projectId) {
      sql += ` AND l.assigned_project_id = ?`;
      params.push(projectId);
    }

    if (countryId) {
      sql += ` AND l.country_id = ?`;
      params.push(countryId);
    }

    sql += ` ORDER BY l.labour_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as LabourRow[];
  }

  async findById(id: number): Promise<LabourRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT l.labour_id, l.name, l.contact_number, l.aadhar_id, l.labour_type, l.contractor_id,
              l.assigned_project_id, l.nationality_id, l.country_id, l.emreads_id, l.email,
              IFNULL(l.status, 'active') AS status, l.created_at, l.updated_at,
              c.name AS contractor_name,
              p.project_name AS assigned_project_name,
              n.nationality_name,
              co.country_name
       FROM labours l
       LEFT JOIN labours c ON l.contractor_id = c.labour_id
       LEFT JOIN projects p ON l.assigned_project_id = p.project_id
       LEFT JOIN nationalities n ON l.nationality_id = n.nationality_id
       LEFT JOIN countries co ON l.country_id = co.country_id
       WHERE l.labour_id = ? AND (l.is_deleted = 0 OR l.is_deleted IS NULL)`,
      [id]
    );
    return (rows[0] as LabourRow) || null;
  }

  async findByContact(contact: string, excludeId?: number): Promise<LabourRow | null> {
    if (!contact || !contact.trim()) return null;
    let sql = `SELECT * FROM labours WHERE contact_number = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: any[] = [contact.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async findByAadhar(aadhar: string, excludeId?: number): Promise<LabourRow | null> {
    if (!aadhar || !aadhar.trim()) return null;
    let sql = `SELECT * FROM labours WHERE aadhar_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: any[] = [aadhar.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async findByEmreads(emreadsId: string, excludeId?: number): Promise<LabourRow | null> {
    if (!emreadsId || !emreadsId.trim()) return null;
    let sql = `SELECT * FROM labours WHERE emreads_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: any[] = [emreadsId.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async findByName(name: string, excludeId?: number): Promise<LabourRow | null> {
    if (!name || !name.trim()) return null;
    let sql = `SELECT * FROM labours WHERE LOWER(name) = LOWER(?) AND (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: any[] = [name.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async create(data: {
    name: string;
    contact_number?: string | null;
    aadhar_id?: string | null;
    labour_type?: string;
    contractor_id?: number | null;
    assigned_project_id?: number | null;
    nationality_id?: number | null;
    country_id?: number | null;
    emreads_id?: string | null;
    email?: string | null;
    status?: string;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO labours
        (name, contact_number, aadhar_id, labour_type, contractor_id,
         assigned_project_id, nationality_id, country_id, emreads_id, email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.contact_number || null,
        data.aadhar_id || null,
        data.labour_type || 'direct_labour',
        data.contractor_id || null,
        data.assigned_project_id || null,
        data.nationality_id || null,
        data.country_id || null,
        data.emreads_id || null,
        data.email || null,
        data.status || 'active',
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: {
    name?: string;
    contact_number?: string | null;
    aadhar_id?: string | null;
    labour_type?: string;
    contractor_id?: number | null;
    assigned_project_id?: number | null;
    nationality_id?: number | null;
    country_id?: number | null;
    emreads_id?: string | null;
    email?: string | null;
    status?: string;
  }): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.contact_number !== undefined) { fields.push('contact_number = ?'); params.push(data.contact_number || null); }
    if (data.aadhar_id !== undefined) { fields.push('aadhar_id = ?'); params.push(data.aadhar_id || null); }
    if (data.labour_type !== undefined) { fields.push('labour_type = ?'); params.push(data.labour_type); }
    if (data.contractor_id !== undefined) { fields.push('contractor_id = ?'); params.push(data.contractor_id || null); }
    if (data.assigned_project_id !== undefined) { fields.push('assigned_project_id = ?'); params.push(data.assigned_project_id || null); }
    if (data.nationality_id !== undefined) { fields.push('nationality_id = ?'); params.push(data.nationality_id || null); }
    if (data.country_id !== undefined) { fields.push('country_id = ?'); params.push(data.country_id || null); }
    if (data.emreads_id !== undefined) { fields.push('emreads_id = ?'); params.push(data.emreads_id || null); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email || null); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labours SET ${fields.join(', ')} WHERE labour_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async getDependencies(id: number): Promise<{ attendanceCount: number; subWorkersCount: number }> {
    const [attRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM labour_work_logs WHERE labour_id = ?`,
      [id]
    );
    const [subRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM labours WHERE contractor_id = ?`,
      [id]
    );

    return {
      attendanceCount: Number(attRows[0]?.cnt || 0),
      subWorkersCount: Number(subRows[0]?.cnt || 0),
    };
  }

  async delete(id: number, force: boolean = false): Promise<boolean> {
    if (force) {
      await dbPool.query(`DELETE FROM labour_work_logs WHERE labour_id = ?`, [id]);
      await dbPool.query(`UPDATE labours SET contractor_id = NULL WHERE contractor_id = ?`, [id]);
    }
    const [result] = await dbPool.query<ResultSetHeader>(
      `DELETE FROM labours WHERE labour_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }


}
