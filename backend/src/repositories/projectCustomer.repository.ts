import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface ProjectCustomerRow {
  id: number;
  project_id: number;
  customer_id: number;
  customer_name: string;
  customer_code: string;
  email: string | null;
  contact_number: string | null;
  unit_number: string | null;
  allocated_area_sqft: number;
  ownership_percentage: number;
  split_rule: 'percentage' | 'area_ratio' | 'fixed_amount' | 'custom_wbs';
  agreement_value: number;
  is_primary_billing_contact: boolean;
  status: 'active' | 'transferred' | 'cancelled';
  transferred_to_id?: number | null;
  transferred_at?: string | null;
  transfer_reason?: string | null;
  created_at: string;
  updated_at: string;
  co_applicants?: CoApplicantRow[];
}

export interface CoApplicantRow {
  id: number;
  project_customer_id: number;
  co_applicant_name: string;
  pan_number: string | null;
  aadhar_number: string | null;
  contact_number: string | null;
  email: string | null;
  relationship: string | null;
  created_at: string;
}

export class ProjectCustomerRepository {
  async getByProjectId(projectId: number): Promise<ProjectCustomerRow[]> {
    const sql = `
      SELECT 
        pc.*,
        c.customer_name,
        c.customer_code,
        c.email,
        c.contact_number
      FROM project_customers pc
      JOIN customers c ON pc.customer_id = c.customer_id
      WHERE pc.project_id = ?
      ORDER BY pc.is_primary_billing_contact DESC, pc.id ASC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [projectId]);
    const list = rows as ProjectCustomerRow[];

    if (list.length === 0) return [];

    const pcIds = list.map(item => item.id);
    const placeholders = pcIds.map(() => '?').join(',');
    const [coAppRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM customer_co_applicants WHERE project_customer_id IN (${placeholders}) ORDER BY id ASC`,
      pcIds
    );

    const coAppMap: { [pcId: number]: CoApplicantRow[] } = {};
    for (const ca of coAppRows as CoApplicantRow[]) {
      if (!coAppMap[ca.project_customer_id]) coAppMap[ca.project_customer_id] = [];
      coAppMap[ca.project_customer_id].push(ca);
    }

    return list.map(pc => ({
      ...pc,
      is_primary_billing_contact: Boolean(pc.is_primary_billing_contact),
      co_applicants: coAppMap[pc.id] || []
    }));
  }

  async getById(id: number): Promise<ProjectCustomerRow | null> {
    const sql = `
      SELECT 
        pc.*,
        c.customer_name,
        c.customer_code,
        c.email,
        c.contact_number
      FROM project_customers pc
      JOIN customers c ON pc.customer_id = c.customer_id
      WHERE pc.id = ?
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [id]);
    if (rows.length === 0) return null;

    const row = rows[0] as ProjectCustomerRow;
    const [coAppRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM customer_co_applicants WHERE project_customer_id = ? ORDER BY id ASC`,
      [id]
    );

    return {
      ...row,
      is_primary_billing_contact: Boolean(row.is_primary_billing_contact),
      co_applicants: coAppRows as CoApplicantRow[]
    };
  }

  async create(data: {
    project_id: number;
    customer_id: number;
    unit_number?: string | null;
    allocated_area_sqft?: number;
    ownership_percentage?: number;
    split_rule?: 'percentage' | 'area_ratio' | 'fixed_amount' | 'custom_wbs';
    agreement_value?: number;
    is_primary_billing_contact?: boolean;
  }): Promise<number> {
    const sql = `
      INSERT INTO project_customers (
        project_id, customer_id, unit_number, allocated_area_sqft,
        ownership_percentage, split_rule, agreement_value, is_primary_billing_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [res] = await dbPool.query<ResultSetHeader>(sql, [
      data.project_id,
      data.customer_id,
      data.unit_number || null,
      data.allocated_area_sqft || 0.00,
      data.ownership_percentage !== undefined ? data.ownership_percentage : 100.00,
      data.split_rule || 'percentage',
      data.agreement_value || 0.00,
      data.is_primary_billing_contact !== undefined ? (data.is_primary_billing_contact ? 1 : 0) : 1
    ]);
    return res.insertId;
  }

  async update(id: number, data: Partial<{
    unit_number: string | null;
    allocated_area_sqft: number;
    ownership_percentage: number;
    split_rule: 'percentage' | 'area_ratio' | 'fixed_amount' | 'custom_wbs';
    agreement_value: number;
    is_primary_billing_contact: boolean;
    status: 'active' | 'transferred' | 'cancelled';
  }>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.unit_number !== undefined) { fields.push('unit_number = ?'); params.push(data.unit_number); }
    if (data.allocated_area_sqft !== undefined) { fields.push('allocated_area_sqft = ?'); params.push(data.allocated_area_sqft); }
    if (data.ownership_percentage !== undefined) { fields.push('ownership_percentage = ?'); params.push(data.ownership_percentage); }
    if (data.split_rule !== undefined) { fields.push('split_rule = ?'); params.push(data.split_rule); }
    if (data.agreement_value !== undefined) { fields.push('agreement_value = ?'); params.push(data.agreement_value); }
    if (data.is_primary_billing_contact !== undefined) { fields.push('is_primary_billing_contact = ?'); params.push(data.is_primary_billing_contact ? 1 : 0); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE project_customers SET ${fields.join(', ')} WHERE id = ?`;
    const [res] = await dbPool.query<ResultSetHeader>(sql, params);
    return res.affectedRows > 0;
  }

  async addCoApplicant(data: {
    project_customer_id: number;
    co_applicant_name: string;
    pan_number?: string | null;
    aadhar_number?: string | null;
    contact_number?: string | null;
    email?: string | null;
    relationship?: string | null;
  }): Promise<number> {
    const sql = `
      INSERT INTO customer_co_applicants (
        project_customer_id, co_applicant_name, pan_number,
        aadhar_number, contact_number, email, relationship
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [res] = await dbPool.query<ResultSetHeader>(sql, [
      data.project_customer_id,
      data.co_applicant_name,
      data.pan_number || null,
      data.aadhar_number || null,
      data.contact_number || null,
      data.email || null,
      data.relationship || null
    ]);
    return res.insertId;
  }

  async deleteCoApplicant(id: number): Promise<boolean> {
    const [res] = await dbPool.query<ResultSetHeader>(`DELETE FROM customer_co_applicants WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  }
}
