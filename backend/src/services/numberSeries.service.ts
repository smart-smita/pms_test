import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface NumberSeriesRow {
  id: number;
  series_code: string;
  prefix: string;
  suffix: string | null;
  next_number: number;
  padding: number;
  fiscal_year_enabled: boolean;
  delimiter_char: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class NumberSeriesService {
  /**
   * Generates Indian Fiscal Year string (e.g., Apr 2026 - Mar 2027 => "2026-27")
   */
  private static getFiscalYearString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
    if (month >= 3) {
      const nextShortYear = (year + 1).toString().slice(-2);
      return `${year}-${nextShortYear}`;
    } else {
      const shortYear = year.toString().slice(-2);
      return `${year - 1}-${shortYear}`;
    }
  }

  /**
   * Atomically locks the series row with SELECT ... FOR UPDATE,
   * generates the sequential formatted code, increments counter, and commits.
   */
  static async getNextNumber(seriesCode: string): Promise<string> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM number_series WHERE series_code = ? FOR UPDATE`,
        [seriesCode]
      );

      let series: NumberSeriesRow;

      if (rows.length === 0) {
        // Create fallback series dynamically
        const prefix = seriesCode.slice(0, 4).toUpperCase();
        const [res] = await connection.query<ResultSetHeader>(
          `INSERT INTO number_series (series_code, prefix, next_number, padding, fiscal_year_enabled, delimiter_char, description)
           VALUES (?, ?, 1, 4, 1, '/', ?)`,
          [seriesCode, prefix, `${seriesCode} Dynamic Series`]
        );
        const [newRows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM number_series WHERE id = ? FOR UPDATE`,
          [res.insertId]
        );
        series = newRows[0] as NumberSeriesRow;
      } else {
        series = rows[0] as NumberSeriesRow;
      }

      const num = series.next_number;
      const paddedNum = num.toString().padStart(series.padding || 4, '0');
      const delim = series.delimiter_char || '/';

      let formattedNumber = `${series.prefix}${delim}`;
      if (series.fiscal_year_enabled) {
        formattedNumber += `${this.getFiscalYearString()}${delim}`;
      }
      formattedNumber += paddedNum;
      if (series.suffix) {
        formattedNumber += `${delim}${series.suffix}`;
      }

      // Increment counter
      await connection.query(
        `UPDATE number_series SET next_number = next_number + 1 WHERE id = ?`,
        [series.id]
      );

      await connection.commit();
      return formattedNumber;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getAllSeries(): Promise<NumberSeriesRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(`SELECT * FROM number_series ORDER BY series_code ASC`);
    return rows as NumberSeriesRow[];
  }

  static async updateSeries(id: number, data: Partial<{
    prefix: string;
    suffix: string | null;
    next_number: number;
    padding: number;
    fiscal_year_enabled: boolean;
    delimiter_char: string;
    description: string | null;
  }>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.prefix !== undefined) { fields.push('prefix = ?'); params.push(data.prefix); }
    if (data.suffix !== undefined) { fields.push('suffix = ?'); params.push(data.suffix); }
    if (data.next_number !== undefined) { fields.push('next_number = ?'); params.push(data.next_number); }
    if (data.padding !== undefined) { fields.push('padding = ?'); params.push(data.padding); }
    if (data.fiscal_year_enabled !== undefined) { fields.push('fiscal_year_enabled = ?'); params.push(data.fiscal_year_enabled ? 1 : 0); }
    if (data.delimiter_char !== undefined) { fields.push('delimiter_char = ?'); params.push(data.delimiter_char); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }

    if (fields.length === 0) return false;

    params.push(id);
    const [res] = await dbPool.query<ResultSetHeader>(
      `UPDATE number_series SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return res.affectedRows > 0;
  }
}
