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

export interface LabourAttendanceRow {
  labour_attendance_id: number;
  labour_id: number;
  labour_name: string;
  labour_type: string;
  project_name?: string;
  wbs_name?: string;
  task_name?: string;
  attendance_date: string;
  daily_pay_amount: number;
  worker_count: number;
  comment?: string;
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
      `SELECT COUNT(*) AS cnt FROM labour_attendance WHERE labour_id = ?`,
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
      await dbPool.query(`DELETE FROM labour_attendance WHERE labour_id = ?`, [id]);
      await dbPool.query(`UPDATE labours SET contractor_id = NULL WHERE contractor_id = ?`, [id]);
    }
    const [result] = await dbPool.query<ResultSetHeader>(
      `DELETE FROM labours WHERE labour_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async checkDuplicateAttendance(labourId: number, taskId: number, attendanceDate: string): Promise<boolean> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT labour_attendance_id FROM labour_attendance WHERE labour_id = ? AND task_id = ? AND attendance_date = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [labourId, taskId, attendanceDate]
    );
    return rows.length > 0;
  }

  async findAttendance(projectId?: number, startDate?: string, endDate?: string, managerId?: number): Promise<LabourAttendanceRow[]> {
    let sql = `
      SELECT la.labour_attendance_id, la.labour_id, l.name AS labour_name, l.labour_type,
             p.project_name, w.wbs_name, t.task_name,
             DATE_FORMAT(la.attendance_date, '%Y-%m-%d') AS attendance_date,
             la.in_time, la.out_time, la.in_address, la.out_address, la.hourly_rate,
             la.daily_pay_amount, la.worker_count, la.calculated_payment, la.comment, la.created_at
      FROM labour_attendance la
      JOIN labours l ON la.labour_id = l.labour_id
      LEFT JOIN projects p ON la.project_id = p.project_id
      LEFT JOIN project_wbs pw ON la.wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON la.task_id = t.task_id
      WHERE (la.is_deleted = 0 OR la.is_deleted IS NULL)
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND la.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?)`;
      params.push(managerId);
    }

    if (projectId) {
      sql += ` AND la.project_id = ?`;
      params.push(projectId);
    }

    if (startDate) {
      sql += ` AND la.attendance_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND la.attendance_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY la.attendance_date DESC, la.labour_attendance_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as LabourAttendanceRow[];
  }

  async createAttendance(data: {
    labour_id: number;
    project_id?: number | null;
    wbs_id?: number | null;
    task_id?: number | null;
    attendance_date: string;
    in_time?: string | null;
    out_time?: string | null;
    in_address?: string | null;
    out_address?: string | null;
    hourly_rate?: number | null;
    daily_pay_amount: number;
    worker_count: number;
    calculated_payment?: number;
    comment?: string | null;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO labour_attendance (labour_id, project_id, wbs_id, task_id, attendance_date, in_time, out_time, in_address, out_address, hourly_rate, daily_pay_amount, worker_count, calculated_payment, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.labour_id,
        data.project_id || null,
        data.wbs_id || null,
        data.task_id || null,
        data.attendance_date,
        data.in_time || null,
        data.out_time || null,
        data.in_address || null,
        data.out_address || null,
        data.hourly_rate || null,
        data.daily_pay_amount || 0,
        data.worker_count || 1,
        data.calculated_payment || (data.daily_pay_amount * (data.worker_count || 1)),
        data.comment || null,
      ]
    );
    return result.insertId;
  }

  async updateAttendance(id: number, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.project_id !== undefined) { fields.push('project_id = ?'); params.push(data.project_id || null); }
    if (data.wbs_id !== undefined) { fields.push('wbs_id = ?'); params.push(data.wbs_id || null); }
    if (data.task_id !== undefined) { fields.push('task_id = ?'); params.push(data.task_id || null); }
    if (data.attendance_date !== undefined) { fields.push('attendance_date = ?'); params.push(data.attendance_date); }
    if (data.in_time !== undefined) { fields.push('in_time = ?'); params.push(data.in_time); }
    if (data.out_time !== undefined) { fields.push('out_time = ?'); params.push(data.out_time); }
    if (data.in_address !== undefined) { fields.push('in_address = ?'); params.push(data.in_address); }
    if (data.out_address !== undefined) { fields.push('out_address = ?'); params.push(data.out_address); }
    if (data.hourly_rate !== undefined) { fields.push('hourly_rate = ?'); params.push(data.hourly_rate); }
    if (data.daily_pay_amount !== undefined) { fields.push('daily_pay_amount = ?'); params.push(data.daily_pay_amount); }
    if (data.worker_count !== undefined) { fields.push('worker_count = ?'); params.push(data.worker_count); }
    if (data.calculated_payment !== undefined) { fields.push('calculated_payment = ?'); params.push(data.calculated_payment); }
    if (data.comment !== undefined) { fields.push('comment = ?'); params.push(data.comment); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labour_attendance SET ${fields.join(', ')} WHERE labour_attendance_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDeleteAttendance(id: number): Promise<boolean> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE labour_attendance SET is_deleted = 1, deleted_at = NOW() WHERE labour_attendance_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
