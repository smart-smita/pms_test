import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { EmployeeRow } from '../types';

export class UserRepository {
  async findByEmployeeCode(code: string): Promise<EmployeeRow | null> {
    const cleanCode = code.trim();
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name 
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE LOWER(e.employee_code) = LOWER(?)`,
      [cleanCode]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findByEmail(email: string): Promise<EmployeeRow | null> {
    const cleanEmail = email.trim();
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name 
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE LOWER(e.email) = LOWER(?)`,
      [cleanEmail]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findById(id: number): Promise<EmployeeRow | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT e.*, r.role_name 
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE e.employee_id = ?`,
      [id]
    );
    return (rows[0] as EmployeeRow) || null;
  }

  async findAll(status?: string, role_id?: number, search?: string, managerId?: number, employeeId?: number): Promise<EmployeeRow[]> {
    let sql = `
      SELECT e.*, r.role_name 
      FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.is_deleted = 0
    `;
    const params: any[] = [];

    if (managerId) {
      sql += ` AND e.employee_id IN (SELECT employee_id FROM manager_employees WHERE manager_id = ?)`;
      params.push(managerId);
    }

    if (employeeId) {
      sql += ` AND e.employee_id = ?`;
      params.push(employeeId);
    }

    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (role_id) {
      sql += ` AND e.role_id = ?`;
      params.push(role_id);
    }
    if (search) {
      sql += ` AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY e.employee_id DESC`;

    const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
    return rows as EmployeeRow[];
  }

  async create(data: {
    employee_code: string;
    name: string;
    email: string;
    password_hash: string;
    role_id: number;
    hourly_rate: number;
    status: string;
  }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO employees (employee_code, name, email, password_hash, role_id, hourly_rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_code,
        data.name,
        data.email,
        data.password_hash,
        data.role_id,
        data.hourly_rate,
        data.status,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<EmployeeRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.password_hash !== undefined) { fields.push('password_hash = ?'); params.push(data.password_hash); }
    if (data.role_id !== undefined) { fields.push('role_id = ?'); params.push(data.role_id); }
    if (data.hourly_rate !== undefined) { fields.push('hourly_rate = ?'); params.push(data.hourly_rate); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE employees SET ${fields.join(', ')} WHERE employee_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async createPasswordResetToken(employee_id: number, token: string, expires_at: Date): Promise<void> {
    await dbPool.execute(
      `INSERT INTO password_reset_tokens (employee_id, token, expires_at) VALUES (?, ?, ?)`,
      [employee_id, token, expires_at]
    );
  }

  async findPasswordResetToken(token: string): Promise<any | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token]
    );
    return rows[0] || null;
  }

  async markTokenUsed(token_id: number): Promise<void> {
    await dbPool.execute(`UPDATE password_reset_tokens SET used = 1 WHERE token_id = ?`, [token_id]);
  }

  async softDelete(id: number, deleted_by: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE employees SET is_deleted = 1, deleted_at = NOW() WHERE employee_id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
