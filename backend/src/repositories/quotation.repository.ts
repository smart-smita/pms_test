import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';

export interface CreateQuotationDTO {
  quotation_code?: string;
  customer_id: number;
  project_id?: number | null;  // optional — set after project is created from quotation
  quotation_date: string;
  validity_date?: string | null;
  description?: string | null;
  subtotal_amount: number;
  tax_id?: number | null;
  tax_type?: string | null;
  tax_percentage: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  terms_conditions?: string | null;
  terms_snapshots?: { title: string; description: string; sort_order?: number }[];
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

    // Fetch terms snapshots
    const [snapshots]: any = await dbPool.query(
      `SELECT * FROM quotation_terms_snapshots WHERE quotation_id = ? AND status = 1 ORDER BY sort_order ASC`,
      [id]
    );
    quotation.terms_snapshots = snapshots;

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
          description, subtotal_amount, tax_id, tax_type, tax_percentage,
          cgst_amount, sgst_amount, igst_amount, tax_amount, discount_amount,
          total_amount, terms_conditions, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          code,
          data.customer_id,
          data.project_id,
          data.quotation_date,
          data.validity_date || null,
          data.description || null,
          data.subtotal_amount,
          data.tax_id || null,
          data.tax_type || null,
          data.tax_percentage || 0,
          data.cgst_amount || 0,
          data.sgst_amount || 0,
          data.igst_amount || 0,
          data.tax_amount || 0,
          data.discount_amount || 0,
          data.total_amount,
          data.terms_conditions || null,
          data.status || 'draft',
          userId || data.created_by || null,
        ]
      );

      const quotationId = result.insertId;

      // Insert terms snapshots
      if (data.terms_snapshots && data.terms_snapshots.length > 0) {
        for (const item of data.terms_snapshots) {
          await connection.query(
            `INSERT INTO quotation_terms_snapshots (quotation_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
            [quotationId, item.title, item.description, item.sort_order || 0]
          );
        }
      }

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
          tax_id = COALESCE(?, tax_id),
          tax_type = COALESCE(?, tax_type),
          tax_percentage = COALESCE(?, tax_percentage),
          cgst_amount = COALESCE(?, cgst_amount),
          sgst_amount = COALESCE(?, sgst_amount),
          igst_amount = COALESCE(?, igst_amount),
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
          data.tax_id !== undefined ? data.tax_id : null,
          data.tax_type !== undefined ? data.tax_type : null,
          data.tax_percentage,
          data.cgst_amount,
          data.sgst_amount,
          data.igst_amount,
          data.tax_amount,
          data.discount_amount,
          data.total_amount,
          data.terms_conditions !== undefined ? data.terms_conditions : null,
          data.status,
          id,
        ]
      );

      // Handle terms snapshots update
      if (data.terms_snapshots !== undefined) {
        await connection.query(`UPDATE quotation_terms_snapshots SET status = 0 WHERE quotation_id = ?`, [id]);
        if (data.terms_snapshots.length > 0) {
          for (const item of data.terms_snapshots) {
            await connection.query(
              `INSERT INTO quotation_terms_snapshots (quotation_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
              [id, item.title, item.description, item.sort_order || 0]
            );
          }
        }
      }

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
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      let approvedAt = null;
      if (status === 'approved') {
        approvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      await connection.query(
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

      // Carry over quotation WBS entries into project_wbs when approved
      if (status === 'approved') {
        const [qRows]: any = await connection.query(`SELECT project_id FROM quotations WHERE quotation_id = ?`, [id]);
        if (qRows.length > 0) {
          const projectId = qRows[0].project_id;
          const [qdRows]: any = await connection.query(
            `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active'`,
            [id]
          );

          for (const qd of qdRows) {
            let wbsId = null;
            const [wbsMaster]: any = await connection.query(
              `SELECT id FROM work_breakdown_structures WHERE LOWER(wbs_name) = LOWER(?) LIMIT 1`,
              [qd.discipline_name]
            );

            if (wbsMaster.length > 0) {
              wbsId = wbsMaster[0].id;
            } else {
              const [newMaster]: any = await connection.query(
                `INSERT INTO work_breakdown_structures (wbs_code, wbs_name) VALUES (?, ?)`,
                [`WBS-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`, qd.discipline_name]
              );
              wbsId = newMaster.insertId;
            }

            const [existingPw]: any = await connection.query(
              `SELECT id, budget_amount, total_hours FROM project_wbs WHERE project_id = ? AND wbs_id = ? AND deleted_at IS NULL`,
              [projectId, wbsId]
            );

            const itemHours = Number(qd.quantity || 1) * 8;
            const itemBudget = Number(qd.amount || 0);

            if (existingPw.length > 0) {
              const currentBudget = Number(existingPw[0].budget_amount || 0);
              const currentHours = Number(existingPw[0].total_hours || 0);
              await connection.query(
                `UPDATE project_wbs SET budget_amount = ?, total_hours = ? WHERE id = ?`,
                [currentBudget + itemBudget, currentHours + itemHours, existingPw[0].id]
              );
            } else {
              await connection.query(
                `INSERT INTO project_wbs (project_id, wbs_id, budget_amount, total_hours, start_date, end_date) VALUES (?, ?, ?, ?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY))`,
                [projectId, wbsId, itemBudget, itemHours]
              );
            }
          }
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: approvedBy,
        action: `QUOTATION_STATUS_${status.toUpperCase()}`,
        module: 'quotations',
        description: `Changed status of quotation ID ${id} to ${status} and carried over all WBS entries`,
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

  /**
   * createProjectFromQuotation
   * ─────────────────────────
   * Implements the Customer → Quotation → Project gate.
   * Must be called with an APPROVED quotation that has no project yet.
   * Creates the project, seeds project_wbs from quotation_disciplines,
   * and links both records to each other.
   */
  static async createProjectFromQuotation(
    quotationId: number,
    overrides: {
      project_code: string;
      project_name?: string;
      project_address?: string;
      project_type_id?: number | null;
      radius_meters?: number;
    },
    userId?: number,
    ipAddress?: string
  ) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch quotation — must be approved and have no project yet
      const [qRows]: any = await connection.query(
        `SELECT q.*, c.customer_name, c.customer_code, c.address AS customer_address
         FROM quotations q
         JOIN customers c ON q.customer_id = c.customer_id
         WHERE q.quotation_id = ? AND q.is_deleted = 0`,
        [quotationId]
      );
      if (qRows.length === 0) throw new Error('Quotation not found');
      const q = qRows[0];
      if (q.status !== 'approved') {
        throw new Error(`Quotation must be approved before creating a project. Current status: ${q.status}`);
      }
      if (q.project_id) {
        throw new Error(`A project (ID: ${q.project_id}) already exists for this quotation.`);
      }

      // 2. Create the project
      const [projResult]: any = await connection.query(
        `INSERT INTO projects (
          project_code, project_name, customer_id, source_quotation_id,
          project_type_id, project_address, budget_amount, radius_meters, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          overrides.project_code,
          overrides.project_name || q.customer_name + ' Project',
          q.customer_id,
          quotationId,
          overrides.project_type_id || null,
          overrides.project_address || q.customer_address || null,
          Number(q.total_amount || 0),
          overrides.radius_meters || 500,
        ]
      );
      const projectId = projResult.insertId;

      // 3. Link quotation → project
      await connection.query(
        `UPDATE quotations SET project_id = ? WHERE quotation_id = ?`,
        [projectId, quotationId]
      );

      // 4. Seed project_wbs from quotation_disciplines
      const [qdRows]: any = await connection.query(
        `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active'`,
        [quotationId]
      );

      for (const qd of qdRows) {
        // Find or create a WBS master entry for this discipline
        let wbsId: number | null = null;
        const [existingWbs]: any = await connection.query(
          `SELECT id FROM work_breakdown_structures
           WHERE LOWER(wbs_name) = LOWER(?) AND deleted_at IS NULL LIMIT 1`,
          [qd.discipline_name]
        );
        if (existingWbs.length > 0) {
          wbsId = existingWbs[0].id;
        } else {
          // Create a clean WBS master entry keyed from the discipline code
          const wbsCode = `WBS-${qd.discipline_id}-${Date.now().toString().slice(-6)}`;
          const [newWbs]: any = await connection.query(
            `INSERT INTO work_breakdown_structures (wbs_code, wbs_name) VALUES (?, ?)`,
            [wbsCode, qd.discipline_name]
          );
          wbsId = newWbs.insertId;
        }

        const itemHours = Number(qd.quantity || 1) * 8; // 8 hrs per unit as default
        const itemBudget = Number(qd.amount || 0);

        // Check if a project_wbs row already exists (idempotent)
        const [existingPw]: any = await connection.query(
          `SELECT id FROM project_wbs WHERE project_id = ? AND wbs_id = ? AND deleted_at IS NULL`,
          [projectId, wbsId]
        );
        if (existingPw.length === 0) {
          await connection.query(
            `INSERT INTO project_wbs (
               project_id, wbs_id, budget_amount, total_hours,
               quotation_discipline_id,
               start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY))`,
            [projectId, wbsId, itemBudget, itemHours, qd.id]
          );
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'CREATE_PROJECT_FROM_QUOTATION',
        module: 'projects',
        description: `Created project ${overrides.project_code} (ID: ${projectId}) from quotation ${quotationId}`,
        record_id: projectId,
        ip_address: ipAddress,
      });

      return { project_id: projectId, quotation_id: quotationId };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
