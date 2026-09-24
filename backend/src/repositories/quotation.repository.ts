import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';

export interface CreateQuotationDTO {
  quotation_code?: string;
  customer_id: number;
  project_id: number;
  quotation_date: string;
  validity_date?: string | null;
  description?: string | null;
  subtotal_amount: number;
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  terms_conditions?: string | null;
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'revised';
  created_by?: number | null;
}

export interface QuotationDisciplineDTO {
  discipline_id: number;
  discipline_name: string;
  description?: string | null;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
  terms_conditions?: string | null;
}

export class QuotationRepository {
  static async getAll(filters: { customer_id?: number; project_id?: number; status?: string } = {}) {
    let sql = `
      SELECT 
        q.*,
        c.customer_name,
        c.customer_code,
        p.project_name,
        p.project_code,
        e1.name AS created_by_name,
        e2.name AS approved_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.customer_id
      JOIN projects p ON q.project_id = p.project_id
      LEFT JOIN employees e1 ON q.created_by = e1.employee_id
      LEFT JOIN employees e2 ON q.approved_by = e2.employee_id
      WHERE q.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters.customer_id) {
      sql += ` AND q.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters.project_id) {
      sql += ` AND q.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters.status) {
      sql += ` AND q.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY q.created_at DESC`;
    const [rows]: any = await dbPool.query(sql, params);
    return rows;
  }

  static async getById(id: number) {
    const [rows]: any = await dbPool.query(
      `
      SELECT 
        q.*,
        c.customer_name,
        c.customer_code,
        c.contact_person,
        c.contact_number,
        c.email AS customer_email,
        c.address AS customer_address,
        p.project_name,
        p.project_code,
        p.project_address,
        e1.name AS created_by_name,
        e2.name AS approved_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.customer_id
      JOIN projects p ON q.project_id = p.project_id
      LEFT JOIN employees e1 ON q.created_by = e1.employee_id
      LEFT JOIN employees e2 ON q.approved_by = e2.employee_id
      WHERE q.quotation_id = ? AND q.is_deleted = 0
    `,
      [id]
    );

    if (rows.length === 0) return null;

    const quotation = rows[0];

    // Fetch quotation line disciplines
    const [disciplines]: any = await dbPool.query(
      `
      SELECT qd.*, d.discipline_code
      FROM quotation_disciplines qd
      JOIN disciplines d ON qd.discipline_id = d.discipline_id
      WHERE qd.quotation_id = ? AND qd.status = 'active'
      ORDER BY qd.id ASC
    `,
      [id]
    );

    quotation.disciplines = disciplines;
    return quotation;
  }

  static async create(data: CreateQuotationDTO, disciplines: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // Auto-generate code if not provided
      let code = data.quotation_code;
      if (!code) {
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        const [seqRow]: any = await connection.query(`SELECT COUNT(*) as count FROM quotations`);
        const nextSeq = (seqRow[0].count + 1).toString().padStart(4, '0');
        code = `QT-${dateStr}-${nextSeq}`;
      }

      const [result]: any = await connection.query(
        `
        INSERT INTO quotations (
          quotation_code, customer_id, project_id, quotation_date, validity_date,
          description, subtotal_amount, tax_percentage, tax_amount, discount_amount,
          total_amount, terms_conditions, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          code,
          data.customer_id,
          data.project_id,
          data.quotation_date,
          data.validity_date || null,
          data.description || null,
          data.subtotal_amount,
          data.tax_percentage,
          data.tax_amount,
          data.discount_amount,
          data.total_amount,
          data.terms_conditions || null,
          data.status || 'draft',
          userId || data.created_by || null,
        ]
      );

      const quotationId = result.insertId;

      // Insert line item disciplines
      if (disciplines && disciplines.length > 0) {
        for (const disc of disciplines) {
          await connection.query(
            `
            INSERT INTO quotation_disciplines (
              quotation_id, project_id, discipline_id, discipline_name, description,
              unit, quantity, rate, amount, terms_conditions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              quotationId,
              data.project_id,
              disc.discipline_id,
              disc.discipline_name,
              disc.description || null,
              disc.unit || 'lump_sum',
              disc.quantity,
              disc.rate,
              disc.amount,
              disc.terms_conditions || null,
            ]
          );
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'CREATE_QUOTATION',
        module: 'quotations',
        description: `Created quotation ${code} (ID: ${quotationId})`,
        record_id: quotationId,
        ip_address: ipAddress,
      });

      return this.getById(quotationId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, data: Partial<CreateQuotationDTO>, disciplines?: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing]: any = await connection.query(`SELECT status FROM quotations WHERE quotation_id = ? AND is_deleted = 0`, [id]);
      if (existing.length === 0) throw new Error('Quotation not found');

      await connection.query(
        `
        UPDATE quotations SET
          customer_id = COALESCE(?, customer_id),
          project_id = COALESCE(?, project_id),
          quotation_date = COALESCE(?, quotation_date),
          validity_date = ?,
          description = ?,
          subtotal_amount = COALESCE(?, subtotal_amount),
          tax_percentage = COALESCE(?, tax_percentage),
          tax_amount = COALESCE(?, tax_amount),
          discount_amount = COALESCE(?, discount_amount),
          total_amount = COALESCE(?, total_amount),
          terms_conditions = ?,
          status = COALESCE(?, status)
        WHERE quotation_id = ?
      `,
        [
          data.customer_id,
          data.project_id,
          data.quotation_date,
          data.validity_date !== undefined ? data.validity_date : null,
          data.description !== undefined ? data.description : null,
          data.subtotal_amount,
          data.tax_percentage,
          data.tax_amount,
          data.discount_amount,
          data.total_amount,
          data.terms_conditions !== undefined ? data.terms_conditions : null,
          data.status,
          id,
        ]
      );

      if (disciplines) {
        // Soft-delete or clear previous disciplines and re-insert
        await connection.query(`DELETE FROM quotation_disciplines WHERE quotation_id = ?`, [id]);

        for (const disc of disciplines) {
          await connection.query(
            `
            INSERT INTO quotation_disciplines (
              quotation_id, project_id, discipline_id, discipline_name, description,
              unit, quantity, rate, amount, terms_conditions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              id,
              data.project_id || existing[0].project_id,
              disc.discipline_id,
              disc.discipline_name,
              disc.description || null,
              disc.unit || 'lump_sum',
              disc.quantity,
              disc.rate,
              disc.amount,
              disc.terms_conditions || null,
            ]
          );
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'UPDATE_QUOTATION',
        module: 'quotations',
        description: `Updated quotation ID ${id}`,
        record_id: id,
        ip_address: ipAddress,
      });

      return this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id: number, status: 'approved' | 'rejected' | 'pending_approval', approvedBy?: number, rejectionReason?: string, ipAddress?: string) {
    let approvedAt = null;
    if (status === 'approved') {
      approvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await dbPool.query(
      `
      UPDATE quotations SET
        status = ?,
        approved_by = ?,
        approved_at = ?,
        rejection_reason = ?
      WHERE quotation_id = ? AND is_deleted = 0
    `,
      [status, approvedBy || null, approvedAt, rejectionReason || null, id]
    );

    await AuditService.log({
      user_id: approvedBy,
      action: `QUOTATION_STATUS_${status.toUpperCase()}`,
      module: 'quotations',
      description: `Changed status of quotation ID ${id} to ${status}`,
      record_id: id,
      ip_address: ipAddress,
    });

    return this.getById(id);
  }

  static async softDelete(id: number, userId?: number, ipAddress?: string) {
    await dbPool.query(
      `UPDATE quotations SET is_deleted = 1, deleted_at = NOW() WHERE quotation_id = ?`,
      [id]
    );

    await AuditService.log({
      user_id: userId,
      action: 'DELETE_QUOTATION',
      module: 'quotations',
      description: `Soft-deleted quotation ID ${id}`,
      record_id: id,
      ip_address: ipAddress,
    });

    return true;
  }
}
