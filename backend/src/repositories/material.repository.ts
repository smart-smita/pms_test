import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export class MaterialRepository {
  async findAll(): Promise<any[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(`SELECT * FROM materials ORDER BY material_id DESC`);
    return rows;
  }

  async findById(id: number): Promise<any | null> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(`SELECT * FROM materials WHERE material_id = ?`, [id]);
    return rows[0] || null;
  }

  async create(data: any): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO materials (material_name, category, unit, rate, status) VALUES (?, ?, ?, ?, ?)`,
      [data.material_name, data.category || null, data.unit || null, data.rate || 0, data.status || 'active']
    );
    return result.insertId;
  }

  async update(id: number, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.material_name !== undefined) { fields.push('material_name = ?'); params.push(data.material_name); }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (data.unit !== undefined) { fields.push('unit = ?'); params.push(data.unit); }
    if (data.rate !== undefined) { fields.push('rate = ?'); params.push(data.rate); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;
    params.push(id);

    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE materials SET ${fields.join(', ')} WHERE material_id = ?`, params
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(`DELETE FROM materials WHERE material_id = ?`, [id]);
    return result.affectedRows > 0;
  }
}
