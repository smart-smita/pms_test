import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface MeasurementUnitRow {
  unit_id: number;
  unit_code: string;
  unit_name: string;
  symbol: string;
  is_decimal_allowed: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export class MeasurementUnitRepository {
  async getAll(): Promise<MeasurementUnitRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM measurement_units ORDER BY status ASC, unit_name ASC`
    );
    return (rows as any[]).map(r => ({
      ...r,
      is_decimal_allowed: Boolean(r.is_decimal_allowed)
    })) as MeasurementUnitRow[];
  }

  async getById(id: number): Promise<MeasurementUnitRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM measurement_units WHERE unit_id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0] as any;
    return {
      ...r,
      is_decimal_allowed: Boolean(r.is_decimal_allowed)
    } as MeasurementUnitRow;
  }

  async create(data: {
    unit_code: string;
    unit_name: string;
    symbol: string;
    is_decimal_allowed?: boolean;
    status?: 'active' | 'inactive';
  }): Promise<MeasurementUnitRow> {
    const [res] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO measurement_units (unit_code, unit_name, symbol, is_decimal_allowed, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.unit_code.toUpperCase().trim(),
        data.unit_name.trim(),
        data.symbol.trim(),
        data.is_decimal_allowed !== undefined ? (data.is_decimal_allowed ? 1 : 0) : 1,
        data.status || 'active'
      ]
    );
    return (await this.getById(res.insertId))!;
  }

  async update(id: number, data: Partial<{
    unit_name: string;
    symbol: string;
    is_decimal_allowed: boolean;
    status: 'active' | 'inactive';
  }>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.unit_name !== undefined) { fields.push('unit_name = ?'); params.push(data.unit_name.trim()); }
    if (data.symbol !== undefined) { fields.push('symbol = ?'); params.push(data.symbol.trim()); }
    if (data.is_decimal_allowed !== undefined) { fields.push('is_decimal_allowed = ?'); params.push(data.is_decimal_allowed ? 1 : 0); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [res] = await dbPool.query<ResultSetHeader>(
      `UPDATE measurement_units SET ${fields.join(', ')} WHERE unit_id = ?`,
      params
    );
    return res.affectedRows > 0;
  }
}
