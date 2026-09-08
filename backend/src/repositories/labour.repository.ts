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
  sub_worker_count?: number;
  created_at: string;
}



export class LabourRepository {
  async findAll(search?: string, labourType?: string): Promise<LabourRow[]> {
    let sql = `
      SELECT l.labour_id, l.name, l.contact_number, l.aadhar_id, l.labour_type, l.contractor_id, l.created_at,
             c.name AS contractor_name,
             (SELECT COUNT(*) FROM labours sub WHERE sub.contractor_id = l.labour_id) AS sub_worker_count
      FROM labours l
      LEFT JOIN labours c ON l.contractor_id = c.labour_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (l.name LIKE ? OR l.contact_number LIKE ? OR l.aadhar_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (labourType) {
      sql += ` AND l.labour_type = ?`;
      params.push(labourType);
    }

    sql += ` ORDER BY l.labour_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as LabourRow[];
  }

  async findById(id: number): Promise<LabourRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT l.labour_id, l.name, l.contact_number, l.aadhar_id, l.labour_type, l.contractor_id, l.created_at,
              c.name AS contractor_name
       FROM labours l
       LEFT JOIN labours c ON l.contractor_id = c.labour_id
       WHERE l.labour_id = ?`,
      [id]
    );
    return (rows[0] as LabourRow) || null;
  }

  async findByContact(contact: string, excludeId?: number): Promise<LabourRow | null> {
    if (!contact || !contact.trim()) return null;
    let sql = `SELECT * FROM labours WHERE contact_number = ?`;
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
    let sql = `SELECT * FROM labours WHERE aadhar_id = ?`;
    const params: any[] = [aadhar.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async findByName(name: string, excludeId?: number): Promise<LabourRow | null> {
    if (!name || !name.trim()) return null;
    let sql = `SELECT * FROM labours WHERE LOWER(name) = LOWER(?)`;
    const params: any[] = [name.trim()];
    if (excludeId) {
      sql += ` AND labour_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as LabourRow) || null;
  }

  async create(data: { name: string; contact_number?: string; aadhar_id?: string; labour_type?: string; contractor_id?: number | null }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO labours (name, contact_number, aadhar_id, labour_type, contractor_id) VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.contact_number || null, data.aadhar_id || null, data.labour_type || 'direct_labour', data.contractor_id || null]
    );
    return result.insertId;
  }

  async update(id: number, data: { name?: string; contact_number?: string; aadhar_id?: string; labour_type?: string; contractor_id?: number | null }): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.contact_number !== undefined) { fields.push('contact_number = ?'); params.push(data.contact_number || null); }
    if (data.aadhar_id !== undefined) { fields.push('aadhar_id = ?'); params.push(data.aadhar_id || null); }
    if (data.labour_type !== undefined) { fields.push('labour_type = ?'); params.push(data.labour_type); }
    if (data.contractor_id !== undefined) { fields.push('contractor_id = ?'); params.push(data.contractor_id || null); }

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
