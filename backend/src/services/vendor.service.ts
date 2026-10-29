import { dbPool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuditService } from './audit.service';

export interface VendorData {
  vendor_id?: number;
  vendor_code: string;
  vendor_name: string;
  vendor_type: 'material' | 'equipment' | 'contractor' | 'general';
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  payment_terms_days?: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export class VendorService {
  async getAll(filters?: { vendor_type?: string; search?: string; status?: string }): Promise<VendorData[]> {
    let sql = `SELECT * FROM vendors WHERE (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: any[] = [];

    if (filters?.vendor_type) {
      sql += ` AND vendor_type = ?`;
      params.push(filters.vendor_type);
    }
    if (filters?.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters?.search) {
      sql += ` AND (vendor_name LIKE ? OR vendor_code LIKE ? OR contact_person LIKE ? OR gst_number LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY vendor_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as VendorData[];
  }

  async getById(id: number): Promise<VendorData | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM vendors WHERE vendor_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as VendorData;
  }

  async create(data: VendorData, userId: number, ipAddress?: string): Promise<VendorData> {
    if (!data.vendor_name?.trim()) throw new Error('vendor_name is required');
    if (!data.vendor_code?.trim()) throw new Error('vendor_code is required');

    // Duplicate check
    const [existing]: any = await dbPool.query(
      `SELECT vendor_id FROM vendors WHERE vendor_code = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [data.vendor_code.trim()]
    );
    if (existing.length > 0) {
      throw new Error(`Vendor code '${data.vendor_code}' is already registered`);
    }

    const sql = `
      INSERT INTO vendors (
        vendor_code, vendor_name, vendor_type, contact_person, email, phone,
        address, gst_number, pan_number, bank_name, account_number, ifsc_code,
        payment_terms_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [res] = await dbPool.query<ResultSetHeader>(sql, [
      data.vendor_code.trim(),
      data.vendor_name.trim(),
      data.vendor_type || 'material',
      data.contact_person?.trim() || null,
      data.email?.trim() || null,
      data.phone?.trim() || null,
      data.address?.trim() || null,
      data.gst_number?.trim() || null,
      data.pan_number?.trim() || null,
      data.bank_name?.trim() || null,
      data.account_number?.trim() || null,
      data.ifsc_code?.trim() || null,
      data.payment_terms_days ? Number(data.payment_terms_days) : 30,
      data.status || 'active'
    ]);

    const created = (await this.getById(res.insertId))!;

    await AuditService.log({
      user_id: userId,
      action: 'CREATE_VENDOR',
      module: 'vendors',
      description: `Created vendor '${created.vendor_name}' (${created.vendor_code}) - Type: ${created.vendor_type}`,
      record_id: created.vendor_id,
      new_value: created,
      ip_address: ipAddress
    });

    return created;
  }

  async update(id: number, data: Partial<VendorData>, userId: number, ipAddress?: string): Promise<VendorData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Vendor with ID ${id} not found`);

    const fields: string[] = [];
    const params: any[] = [];

    if (data.vendor_name !== undefined) { fields.push('vendor_name = ?'); params.push(data.vendor_name.trim()); }
    if (data.vendor_type !== undefined) { fields.push('vendor_type = ?'); params.push(data.vendor_type); }
    if (data.contact_person !== undefined) { fields.push('contact_person = ?'); params.push(data.contact_person?.trim() || null); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email?.trim() || null); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone?.trim() || null); }
    if (data.address !== undefined) { fields.push('address = ?'); params.push(data.address?.trim() || null); }
    if (data.gst_number !== undefined) { fields.push('gst_number = ?'); params.push(data.gst_number?.trim() || null); }
    if (data.pan_number !== undefined) { fields.push('pan_number = ?'); params.push(data.pan_number?.trim() || null); }
    if (data.bank_name !== undefined) { fields.push('bank_name = ?'); params.push(data.bank_name?.trim() || null); }
    if (data.account_number !== undefined) { fields.push('account_number = ?'); params.push(data.account_number?.trim() || null); }
    if (data.ifsc_code !== undefined) { fields.push('ifsc_code = ?'); params.push(data.ifsc_code?.trim() || null); }
    if (data.payment_terms_days !== undefined) { fields.push('payment_terms_days = ?'); params.push(Number(data.payment_terms_days)); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length > 0) {
      params.push(id);
      await dbPool.query(`UPDATE vendors SET ${fields.join(', ')} WHERE vendor_id = ?`, params);
    }

    const updated = (await this.getById(id))!;

    await AuditService.log({
      user_id: userId,
      action: 'UPDATE_VENDOR',
      module: 'vendors',
      description: `Updated vendor '${updated.vendor_name}' (${updated.vendor_code})`,
      record_id: id,
      old_value: existing,
      new_value: updated,
      ip_address: ipAddress
    });

    return updated;
  }

  async delete(id: number, userId: number, ipAddress?: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Vendor with ID ${id} not found`);

    // Guard: Check if linked to any purchase orders or invoices
    const [poRows]: any = await dbPool.query(`SELECT COUNT(*) as cnt FROM purchase_orders WHERE vendor_id = ?`, [id]);
    if (Number(poRows[0]?.cnt || 0) > 0) {
      throw new Error(`Cannot delete vendor '${existing.vendor_name}'. It is referenced by active Purchase Orders.`);
    }

    await dbPool.query(`UPDATE vendors SET is_deleted = 1, deleted_at = NOW() WHERE vendor_id = ?`, [id]);

    await AuditService.log({
      user_id: userId,
      action: 'DELETE_VENDOR',
      module: 'vendors',
      description: `Soft deleted vendor '${existing.vendor_name}' (${existing.vendor_code})`,
      record_id: id,
      old_value: existing,
      ip_address: ipAddress
    });

    return true;
  }
}
