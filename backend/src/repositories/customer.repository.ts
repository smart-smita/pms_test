import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export interface CustomerRow {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  country_id: number | null;
  country_name?: string | null;
  state: string | null;
  city: string | null;
  community_id: number | null;
  community_name?: string | null;
  nationality_id: number | null;
  nationality_name?: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  project_count?: number;
  created_by: number | null;
  created_by_name?: string | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export class CustomerRepository {
  async findAll(filters: { search?: string; status?: string } = {}): Promise<CustomerRow[]> {
    let sql = `
      SELECT
        c.*,
        co.country_name,
        cm.community_name,
        n.nationality_name,
        e.name AS created_by_name,
        (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.customer_id AND (p.is_deleted = 0 OR p.is_deleted IS NULL)) AS project_count
      FROM customers c
      LEFT JOIN countries   co ON c.country_id     = co.country_id
      LEFT JOIN communities cm ON c.community_id   = cm.community_id
      LEFT JOIN nationalities n ON c.nationality_id = n.nationality_id
      LEFT JOIN employees   e  ON c.created_by     = e.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search?.trim()) {
      const t = `%${filters.search.trim()}%`;
      sql += ` AND (c.customer_name LIKE ? OR c.customer_code LIKE ? OR c.contact_person LIKE ? OR c.email LIKE ? OR c.city LIKE ?)`;
      params.push(t, t, t, t, t);
    }
    if (filters.status) {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY c.customer_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as CustomerRow[];
  }

  async findById(id: number): Promise<CustomerRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(`
      SELECT
        c.*,
        co.country_name,
        cm.community_name,
        n.nationality_name,
        e.name AS created_by_name
      FROM customers c
      LEFT JOIN countries    co ON c.country_id     = co.country_id
      LEFT JOIN communities  cm ON c.community_id   = cm.community_id
      LEFT JOIN nationalities n ON c.nationality_id = n.nationality_id
      LEFT JOIN employees    e  ON c.created_by     = e.employee_id
      WHERE c.customer_id = ?
    `, [id]);
    return (rows[0] as CustomerRow) || null;
  }

  async findByCode(code: string, excludeId?: number): Promise<CustomerRow | null> {
    let sql = `SELECT * FROM customers WHERE customer_code = ?`;
    const params: any[] = [code.trim()];
    if (excludeId) { sql += ` AND customer_id != ?`; params.push(excludeId); }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as CustomerRow) || null;
  }

  async findByEmail(email: string, excludeId?: number): Promise<CustomerRow | null> {
    if (!email?.trim()) return null;
    let sql = `SELECT * FROM customers WHERE email = ?`;
    const params: any[] = [email.trim()];
    if (excludeId) { sql += ` AND customer_id != ?`; params.push(excludeId); }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as CustomerRow) || null;
  }

  async create(data: {
    customer_code: string;
    customer_name: string;
    contact_person?: string | null;
    contact_number?: string | null;
    email?: string | null;
    country_id?: number | null;
    state?: string | null;
    city?: string | null;
    community_id?: number | null;
    nationality_id?: number | null;
    address?: string | null;
    status?: 'active' | 'inactive';
    created_by?: number | null;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO customers
         (customer_code, customer_name, contact_person, contact_number, email,
          country_id, state, city, community_id, nationality_id, address, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_code.trim(), data.customer_name.trim(),
        data.contact_person || null, data.contact_number || null,
        data.email || null, data.country_id || null, data.state || null,
        data.city || null, data.community_id || null, data.nationality_id || null,
        data.address || null, data.status || 'active', data.created_by || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<CustomerRow> & { updated_by?: number | null }): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable = [
      'customer_name','contact_person','contact_number','email',
      'country_id','state','city','community_id','nationality_id','address','status',
    ] as const;

    for (const key of editable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] ?? null);
      }
    }
    if (data.updated_by !== undefined) { fields.push('updated_by = ?'); params.push(data.updated_by); }
    if (!fields.length) return false;

    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`, params
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `DELETE FROM customers WHERE customer_id = ?`, [id]
    );
    return result.affectedRows > 0;
  }

  /** Check if customer has linked projects (prevent delete) */
  async getProjectCount(customerId: number): Promise<number> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM projects WHERE customer_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [customerId]
    );
    return Number((rows[0] as any).cnt || 0);
  }

  /** Generate next customer code: CUST-0001, CUST-0002, etc. */
  async generateCode(): Promise<string> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT customer_code FROM customers ORDER BY customer_id DESC LIMIT 1`
    );
    if (rows.length === 0) return 'CUST-0001';
    const last = (rows[0] as any).customer_code as string;
    const match = last.match(/(\d+)$/);
    const next = match ? parseInt(match[1], 10) + 1 : 1;
    return `CUST-${String(next).padStart(4, '0')}`;
  }
}
