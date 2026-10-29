import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { roundDecimal } from '../services/calculation.service';

export interface EquipmentRow {
  equipment_id: number;
  equipment_code: string;
  equipment_name: string;
  ownership_type: 'own' | 'rented';
  vendor_id: number | null;
  vendor_name?: string | null;
  internal_hourly_rate: number;
  rental_rate_unit: 'hour' | 'day' | 'month' | null;
  rental_rate: number;
  status: 'available' | 'deployed' | 'breakdown' | 'off_hired';
  created_at: string;
  updated_at: string;
}

export interface EquipmentUsageLogRow {
  log_id: number;
  equipment_id: number;
  equipment_code?: string;
  equipment_name?: string;
  project_id: number;
  project_name?: string;
  project_wbs_id: number;
  wbs_name?: string;
  task_id: number | null;
  task_name?: string | null;
  log_date: string;
  start_meter_hours: number;
  end_meter_hours: number;
  operational_hours: number;
  fuel_litres_consumed: number;
  charged_rate: number;
  total_cost: number;
  verified_by: number | null;
  verified_by_name?: string | null;
  remarks: string | null;
  created_at: string;
}

export class EquipmentRepository {
  async getAll(filters: { ownership_type?: string; status?: string; search?: string } = {}): Promise<EquipmentRow[]> {
    let sql = `
      SELECT 
        eq.*,
        v.vendor_name
      FROM equipment_master eq
      LEFT JOIN vendors v ON eq.vendor_id = v.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.ownership_type) {
      sql += ` AND eq.ownership_type = ?`;
      params.push(filters.ownership_type);
    }
    if (filters.status) {
      sql += ` AND eq.status = ?`;
      params.push(filters.status);
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (eq.equipment_code LIKE ? OR eq.equipment_name LIKE ?)`;
      params.push(q, q);
    }

    sql += ` ORDER BY eq.equipment_code ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as EquipmentRow[];
  }

  async getById(id: number): Promise<EquipmentRow | null> {
    const sql = `
      SELECT 
        eq.*,
        v.vendor_name
      FROM equipment_master eq
      LEFT JOIN vendors v ON eq.vendor_id = v.vendor_id
      WHERE eq.equipment_id = ?
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [id]);
    if (rows.length === 0) return null;
    return rows[0] as EquipmentRow;
  }

  async create(data: {
    equipment_code: string;
    equipment_name: string;
    ownership_type: 'own' | 'rented';
    vendor_id?: number | null;
    internal_hourly_rate?: number;
    rental_rate_unit?: 'hour' | 'day' | 'month' | null;
    rental_rate?: number;
    status?: 'available' | 'deployed' | 'breakdown' | 'off_hired';
  }): Promise<EquipmentRow> {
    const sql = `
      INSERT INTO equipment_master (
        equipment_code, equipment_name, ownership_type, vendor_id,
        internal_hourly_rate, rental_rate_unit, rental_rate, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [res] = await dbPool.query<ResultSetHeader>(sql, [
      data.equipment_code,
      data.equipment_name,
      data.ownership_type,
      data.vendor_id || null,
      data.internal_hourly_rate || 0.00,
      data.rental_rate_unit || null,
      data.rental_rate || 0.00,
      data.status || 'available'
    ]);
    return (await this.getById(res.insertId))!;
  }

  async update(id: number, data: Partial<{
    equipment_name: string;
    ownership_type: 'own' | 'rented';
    vendor_id: number | null;
    internal_hourly_rate: number;
    rental_rate_unit: 'hour' | 'day' | 'month' | null;
    rental_rate: number;
    status: 'available' | 'deployed' | 'breakdown' | 'off_hired';
  }>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.equipment_name !== undefined) { fields.push('equipment_name = ?'); params.push(data.equipment_name); }
    if (data.ownership_type !== undefined) { fields.push('ownership_type = ?'); params.push(data.ownership_type); }
    if (data.vendor_id !== undefined) { fields.push('vendor_id = ?'); params.push(data.vendor_id); }
    if (data.internal_hourly_rate !== undefined) { fields.push('internal_hourly_rate = ?'); params.push(data.internal_hourly_rate); }
    if (data.rental_rate_unit !== undefined) { fields.push('rental_rate_unit = ?'); params.push(data.rental_rate_unit); }
    if (data.rental_rate !== undefined) { fields.push('rental_rate = ?'); params.push(data.rental_rate); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE equipment_master SET ${fields.join(', ')} WHERE equipment_id = ?`;
    const [res] = await dbPool.query<ResultSetHeader>(sql, params);
    return res.affectedRows > 0;
  }

  async logUsage(data: {
    equipment_id: number;
    project_id: number;
    project_wbs_id: number;
    task_id?: number | null;
    log_date: string;
    start_meter_hours: number;
    end_meter_hours: number;
    fuel_litres_consumed?: number;
    charged_rate?: number;
    verified_by?: number | null;
    remarks?: string | null;
  }): Promise<EquipmentUsageLogRow> {
    const startH = Number(data.start_meter_hours);
    const endH = Number(data.end_meter_hours);
    const opHours = Math.max(0, endH - startH);

    let rate = Number(data.charged_rate || 0);
    if (!rate || rate <= 0) {
      const eq = await this.getById(data.equipment_id);
      if (eq) {
        rate = eq.ownership_type === 'own' ? Number(eq.internal_hourly_rate || 0) : Number(eq.rental_rate || 0);
      }
    }
    const totalCost = roundDecimal(opHours * rate);

    const sql = `
      INSERT INTO equipment_usage_logs (
        equipment_id, project_id, project_wbs_id, task_id, log_date,
        start_meter_hours, end_meter_hours, fuel_litres_consumed,
        charged_rate, total_cost, verified_by, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [res] = await dbPool.query<ResultSetHeader>(sql, [
      data.equipment_id,
      data.project_id,
      data.project_wbs_id,
      data.task_id || null,
      data.log_date,
      startH,
      endH,
      data.fuel_litres_consumed || 0.00,
      rate,
      totalCost,
      data.verified_by || null,
      data.remarks || null
    ]);

    const logId = res.insertId;
    const [logRows] = await dbPool.query<RowDataPacket[]>(
      `
      SELECT 
        eul.*,
        ROUND(eul.end_meter_hours - eul.start_meter_hours, 2) AS operational_hours,
        eq.equipment_code,
        eq.equipment_name,
        p.project_name,
        w.wbs_name,
        t.task_name,
        e.name AS verified_by_name
      FROM equipment_usage_logs eul
      JOIN equipment_master eq ON eul.equipment_id = eq.equipment_id
      JOIN projects p ON eul.project_id = p.project_id
      JOIN project_wbs pw ON eul.project_wbs_id = pw.id
      JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON eul.task_id = t.task_id
      LEFT JOIN employees e ON eul.verified_by = e.employee_id
      WHERE eul.log_id = ?
    `,
      [logId]
    );

    const r = logRows[0] as any;
    return {
      ...r,
      start_meter_hours: Number(r.start_meter_hours),
      end_meter_hours: Number(r.end_meter_hours),
      operational_hours: Number(r.operational_hours),
      fuel_litres_consumed: Number(r.fuel_litres_consumed),
      charged_rate: Number(r.charged_rate),
      total_cost: Number(r.total_cost)
    } as EquipmentUsageLogRow;
  }

  async getUsageLogsByProject(projectId: number): Promise<EquipmentUsageLogRow[]> {
    const sql = `
      SELECT 
        eul.*,
        ROUND(eul.end_meter_hours - eul.start_meter_hours, 2) AS operational_hours,
        eq.equipment_code,
        eq.equipment_name,
        p.project_name,
        w.wbs_name,
        t.task_name,
        e.name AS verified_by_name
      FROM equipment_usage_logs eul
      JOIN equipment_master eq ON eul.equipment_id = eq.equipment_id
      JOIN projects p ON eul.project_id = p.project_id
      JOIN project_wbs pw ON eul.project_wbs_id = pw.id
      JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      LEFT JOIN tasks t ON eul.task_id = t.task_id
      LEFT JOIN employees e ON eul.verified_by = e.employee_id
      WHERE eul.project_id = ?
      ORDER BY eul.log_date DESC, eul.log_id DESC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [projectId]);
    return (rows as any[]).map(r => ({
      ...r,
      start_meter_hours: Number(r.start_meter_hours),
      end_meter_hours: Number(r.end_meter_hours),
      operational_hours: Number(r.operational_hours),
      fuel_litres_consumed: Number(r.fuel_litres_consumed),
      charged_rate: Number(r.charged_rate),
      total_cost: Number(r.total_cost)
    })) as EquipmentUsageLogRow[];
  }
}
