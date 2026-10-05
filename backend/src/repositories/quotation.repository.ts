import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';
import { CalculationService, TaxInput } from '../services/calculation.service';
import { saveBase64DocumentFile } from '../utils/documentHelper';

export interface CreateQuotationDTO {
  quotation_code?: string;
  customer_id: number;
  project_id?: number | null;
  new_project_name?: string | null;
  project_type_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  quotation_date: string;
  validity_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
  terms_snapshots?: {
    template_id?: number | null;
    template_name?: string | null;
    title: string;
    description: string;
    is_mandatory?: number | boolean;
    sort_order?: number;
  }[];
  selected_templates?: {
    template_id: number;
    template_name: string;
    sort_order?: number;
  }[];
  taxes?: TaxInput[];
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'revised';
  planning_required?: number | boolean;
  created_by?: number | null;
  documents?: {
    file_name: string;
    file_size?: number;
    mime_type?: string;
    file_base64?: string;
    file_path?: string;
  }[];
}

export interface QuotationDisciplineDTO {
  id?: number;
  discipline_id?: number | null;
  discipline_name: string;
  description?: string | null;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
  terms_conditions?: string | null;
  wbs_type?: 'labour' | 'material' | 'both';
  wbs_template_id?: number | null;
  wbs_id?: number | null;
  labour_hours?: number;
  labour_rate?: number;
  labour_cost?: number;
  material_quantity?: number;
  material_rate?: number;
  material_cost?: number;
  start_date?: string | null;
  end_date?: string | null;
  labours?: any[];
  materials?: any[];
}

export class QuotationRepository {
  static async getAll(filters: { customer_id?: number; project_id?: number; status?: string } = {}) {
    let sql = `
      SELECT 
        q.*,
        c.customer_name,
        c.customer_code,
        COALESCE(p.project_name, q.new_project_name, 'New Project (Pending)') AS project_name,
        p.project_code,
        cur.currency_code,
        cur.symbol AS currency_symbol,
        e1.name AS created_by_name,
        e2.name AS approved_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.customer_id
      LEFT JOIN projects p ON q.project_id = p.project_id
      LEFT JOIN currencies cur ON q.currency_id = cur.currency_id
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
        COALESCE(p.project_name, q.new_project_name, 'New Project (Pending)') AS project_name,
        p.project_code,
        p.project_address,
        cur.currency_code,
        cur.currency_name,
        cur.symbol AS currency_symbol,
        2 AS decimal_places,
        e1.name AS created_by_name,
        e2.name AS approved_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.customer_id
      LEFT JOIN projects p ON q.project_id = p.project_id
      LEFT JOIN currencies cur ON q.currency_id = cur.currency_id
      LEFT JOIN employees e1 ON q.created_by = e1.employee_id
      LEFT JOIN employees e2 ON q.approved_by = e2.employee_id
      WHERE q.quotation_id = ? AND q.is_deleted = 0
    `,
      [id]
    );

    console.log(`[getById] Fetched quotation ${id}, rows found:`, rows.length);
    if (rows.length === 0) return null;

    const quotation = rows[0];

    // Fetch quotation line disciplines
    const [disciplines]: any = await dbPool.query(
      `
      SELECT qd.*, d.discipline_code
      FROM quotation_disciplines qd
      LEFT JOIN disciplines d ON qd.discipline_id = d.discipline_id
      WHERE qd.quotation_id = ? AND qd.status = 'active'
      ORDER BY qd.id ASC
    `,
      [id]
    );

    const [labours]: any = await dbPool.query(`SELECT * FROM quotation_wbs_labour WHERE quotation_id = ?`, [id]);
    const [materials]: any = await dbPool.query(`SELECT * FROM quotation_wbs_material WHERE quotation_id = ?`, [id]);

    for (let i = 0; i < disciplines.length; i++) {
      disciplines[i].labours = labours.filter((l: any) => l.quotation_discipline_id === disciplines[i].id);
      disciplines[i].materials = materials.filter((m: any) => m.quotation_discipline_id === disciplines[i].id);
    }

    quotation.disciplines = disciplines;

    // Fetch selected terms templates
    // Fetch selected terms templates
    const [selectedTemplates]: any = await dbPool.query(
      `SELECT * FROM quotation_terms_templates WHERE quotation_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    quotation.selected_templates = selectedTemplates;

    // Fetch selected WBS templates
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS quotation_wbs_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          quotation_id INT NOT NULL,
          template_id INT NOT NULL,
          template_name VARCHAR(255) NULL,
          sort_order INT DEFAULT 0
        )
      `);
      const [wbsTemplates]: any = await dbPool.query(
        `SELECT * FROM quotation_wbs_templates WHERE quotation_id = ? ORDER BY sort_order ASC, id ASC`,
        [id]
      );
      if (wbsTemplates.length > 0) {
        quotation.selected_wbs_templates = wbsTemplates;
      } else {
        const [discTmpls]: any = await dbPool.query(
          `SELECT DISTINCT qd.wbs_template_id AS template_id, wt.template_name
           FROM quotation_disciplines qd
           LEFT JOIN wbs_templates wt ON qd.wbs_template_id = wt.template_id
           WHERE qd.quotation_id = ? AND qd.wbs_template_id IS NOT NULL`,
          [id]
        );
        quotation.selected_wbs_templates = discTmpls;
      }
    } catch (e) {
      quotation.selected_wbs_templates = [];
    }

    // Fetch documents
    try {
      const [docs]: any = await dbPool.query(
        `SELECT document_id, document_name AS file_name, file_size, mime_type, file_path, created_at
         FROM entity_documents
         WHERE entity_type = 'quotation' AND entity_id = ?
         ORDER BY document_id ASC`,
        [id]
      );
      quotation.documents = docs;
    } catch (e) {
      quotation.documents = [];
    }

    // Fetch terms snapshots
    const [snapshots]: any = await dbPool.query(
      `SELECT * FROM quotation_terms_snapshots WHERE quotation_id = ? ORDER BY sort_order ASC, snapshot_id ASC`,
      [id]
    );
    quotation.terms_snapshots = snapshots;

    // Fetch multiple taxes breakdown
    const [taxes]: any = await dbPool.query(
      `SELECT * FROM quotation_taxes WHERE quotation_id = ? ORDER BY id ASC`,
      [id]
    );
    quotation.taxes = taxes;

    return quotation;
  }

  static async create(data: CreateQuotationDTO, disciplines: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      let code = data.quotation_code;
      if (!code) {
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        const [seqRow]: any = await connection.query(`SELECT COUNT(*) as count FROM quotations`);
        const nextSeq = (seqRow[0].count + 1).toString().padStart(4, '0');
        code = `QT-${dateStr}-${nextSeq}`;
      }

      // Currency lookup if not provided
      let currencyId = data.currency_id || null;
      let exchangeRate = data.exchange_rate || 1.0;
      if (!currencyId) {
        const [baseCur]: any = await connection.query(`SELECT currency_id, exchange_rate FROM currencies WHERE is_base = 1 LIMIT 1`);
        if (baseCur.length > 0) {
          currencyId = baseCur[0].currency_id;
          exchangeRate = Number(baseCur[0].exchange_rate || 1);
        }
      }

      const [result]: any = await connection.query(
        `
        INSERT INTO quotations (
          quotation_code, customer_id, project_id, new_project_name, project_type_id,
          currency_id, exchange_rate, quotation_date, validity_date, start_date, end_date,
          description, subtotal_amount, tax_id, tax_type, tax_percentage,
          cgst_amount, sgst_amount, igst_amount, tax_amount, discount_amount,
          total_amount, terms_conditions, status, planning_required, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          code,
          data.customer_id,
          data.project_id || null,
          data.new_project_name || null,
          data.project_type_id || null,
          currencyId,
          exchangeRate,
          data.quotation_date,
          data.validity_date || null,
          data.start_date || null,
          data.end_date || null,
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
          data.planning_required !== undefined ? (data.planning_required ? 1 : 0) : 1,
          userId || data.created_by || null,
        ]
      );

      const quotationId = result.insertId;

      // Insert selected templates
      if (data.selected_templates && data.selected_templates.length > 0) {
        for (let i = 0; i < data.selected_templates.length; i++) {
          const tmpl = data.selected_templates[i];
          await connection.query(
            `INSERT IGNORE INTO quotation_terms_templates (quotation_id, template_id, template_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [quotationId, tmpl.template_id, tmpl.template_name, tmpl.sort_order ?? i]
          );
        }
      }

      // Insert selected WBS templates
      const wbsTemplatesToSave = (data as any).selected_wbs_templates;
      if (wbsTemplatesToSave && Array.isArray(wbsTemplatesToSave) && wbsTemplatesToSave.length > 0) {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS quotation_wbs_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            template_id INT NOT NULL,
            template_name VARCHAR(255) NULL,
            sort_order INT DEFAULT 0
          )
        `);
        for (let i = 0; i < wbsTemplatesToSave.length; i++) {
          const wt = wbsTemplatesToSave[i];
          await connection.query(
            `INSERT INTO quotation_wbs_templates (quotation_id, template_id, template_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [quotationId, wt.template_id, wt.template_name || null, wt.sort_order ?? i]
          );
        }
      }

      // Insert terms snapshots with template tracking and is_mandatory
      if (data.terms_snapshots && data.terms_snapshots.length > 0) {
        for (const item of data.terms_snapshots) {
          await connection.query(
            `INSERT INTO quotation_terms_snapshots (quotation_id, template_id, template_name, title, description, is_mandatory, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              quotationId,
              item.template_id || null,
              item.template_name || null,
              item.title,
              item.description,
              item.is_mandatory ? 1 : 0,
              item.sort_order || 0,
            ]
          );
        }
      }

      // Insert multiple taxes
      if (data.taxes && data.taxes.length > 0) {
        const taxableAmount = Math.max(0, Number(data.subtotal_amount || 0) - Number(data.discount_amount || 0));
        for (const tax of data.taxes) {
          const pct = Number(tax.tax_percentage || 0);
          const amt = (taxableAmount * pct) / 100;
          await connection.query(
            `INSERT INTO quotation_taxes (quotation_id, tax_id, tax_name, tax_code, tax_type, tax_percentage, taxable_amount, tax_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [quotationId, tax.tax_id, tax.tax_name, tax.tax_code || null, tax.tax_type || null, pct, taxableAmount, amt]
          );
        }
      }

      // Insert line item disciplines
      if (disciplines && disciplines.length > 0) {
        for (const disc of disciplines) {
          const wbsType = disc.wbs_type === 'material' ? 'material' : (disc.wbs_type === 'both' ? 'both' : 'labour');
          const defaultUnit = wbsType === 'material' ? 'Nos' : 'hours';
          const [discRes] = await connection.query(
            `
            INSERT INTO quotation_disciplines (
              quotation_id, project_id, discipline_id, discipline_name, description,
              unit, quantity, rate, amount, terms_conditions,
              wbs_type, wbs_template_id, labour_hours, labour_rate, labour_cost,
              material_quantity, material_rate, material_cost, start_date, end_date, wbs_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              quotationId,
              data.project_id || null,
              disc.discipline_id || null,
              disc.discipline_name,
              disc.description || null,
              disc.unit || defaultUnit,
              disc.quantity,
              disc.rate,
              disc.amount,
              disc.terms_conditions || null,
              wbsType,
              disc.wbs_template_id || null,
              disc.labour_hours || (wbsType === 'labour' ? disc.quantity : 0),
              disc.labour_rate || (wbsType === 'labour' ? disc.rate : 0),
              disc.labour_cost || (wbsType === 'labour' ? disc.amount : 0),
              disc.material_quantity || (wbsType === 'material' ? disc.quantity : 0),
              disc.material_rate || (wbsType === 'material' ? disc.rate : 0),
              disc.material_cost || (wbsType === 'material' ? disc.amount : 0),
              disc.start_date || null,
              disc.end_date || null,
              disc.wbs_id || null,
            ]
          );
          
          const disciplineId = (discRes as any).insertId;

          if (disc.labours && disc.labours.length > 0) {
            for (const l of disc.labours) {
              const labourName = l.labour_name || l.labour_type || 'Labour Item';
              const labourType = l.labour_type || l.labour_name || null;
              const hours = Number(l.hours !== undefined ? l.hours : (l.total_hours !== undefined ? l.total_hours : (l.workers_count ? l.workers_count * (l.hours_per_day || 8) : 0)));
              const rate = Number(l.rate !== undefined ? l.rate : (l.rate_per_hour !== undefined ? l.rate_per_hour : 0));
              const amount = Number(l.amount !== undefined ? l.amount : (l.total_cost !== undefined ? l.total_cost : (hours * rate)));
              await connection.query(
                `INSERT INTO quotation_wbs_labour (quotation_id, quotation_discipline_id, labour_id, labour_name, labour_type, hours, rate, amount, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [quotationId, disciplineId, l.labour_id || null, labourName, labourType, hours, rate, amount, l.start_date || null, l.end_date || null]
              );
            }
          }

          if (disc.materials && disc.materials.length > 0) {
            for (const m of disc.materials) {
              const materialName = m.material_name || m.name || 'Material Item';
              const qty = Number(m.quantity !== undefined ? m.quantity : 0);
              const unit = m.unit || null;
              const matRate = Number(m.rate !== undefined ? m.rate : 0);
              const matAmount = Number(m.amount !== undefined ? m.amount : (m.total_cost !== undefined ? m.total_cost : (qty * matRate)));
              await connection.query(
                `INSERT INTO quotation_wbs_material (quotation_id, quotation_discipline_id, material_id, material_name, quantity, unit, rate, amount, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [quotationId, disciplineId, m.material_id || null, materialName, qty, unit, matRate, matAmount, m.start_date || null, m.end_date || null]
              );
            }
          }
        }
      }

      // Insert documents
      if (data.documents && data.documents.length > 0) {
        const [docTypes]: any = await connection.query(`SELECT doc_type_id FROM document_types LIMIT 1`);
        const docTypeId = docTypes.length > 0 ? docTypes[0].doc_type_id : 1;

        for (const doc of data.documents) {
          let filePath = doc.file_path || '';
          let fileSize = doc.file_size || 0;
          let mimeType = doc.mime_type || 'application/pdf';

          if (doc.file_base64) {
            try {
              const saved = saveBase64DocumentFile(doc.file_base64, doc.file_name, 'quotation', quotationId);
              filePath = saved.filePath;
              fileSize = saved.fileSize;
              mimeType = saved.mimeType;
            } catch (err) {
              console.error('Failed to save base64 document:', err);
            }
          }

          if (filePath) {
            await connection.query(
              `INSERT INTO entity_documents (
                 entity_type, entity_id, doc_type_id, document_name, file_path, file_size, mime_type, uploaded_by
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              ['quotation', quotationId, docTypeId, doc.file_name, filePath, fileSize, mimeType, userId || null]
            );
          }
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
          project_id = ?,
          new_project_name = ?,
          project_type_id = COALESCE(?, project_type_id),
          currency_id = COALESCE(?, currency_id),
          exchange_rate = COALESCE(?, exchange_rate),
          quotation_date = COALESCE(?, quotation_date),
          validity_date = ?,
          start_date = ?,
          end_date = ?,
          description = ?,
          subtotal_amount = COALESCE(?, subtotal_amount),
          tax_id = ?,
          tax_type = ?,
          tax_percentage = COALESCE(?, tax_percentage),
          cgst_amount = COALESCE(?, cgst_amount),
          sgst_amount = COALESCE(?, sgst_amount),
          igst_amount = COALESCE(?, igst_amount),
          tax_amount = COALESCE(?, tax_amount),
          discount_amount = COALESCE(?, discount_amount),
          total_amount = COALESCE(?, total_amount),
          terms_conditions = ?,
          status = COALESCE(?, status),
          planning_required = COALESCE(?, planning_required)
        WHERE quotation_id = ?
      `,
        [
          data.customer_id,
          data.project_id !== undefined ? data.project_id : null,
          data.new_project_name !== undefined ? data.new_project_name : null,
          data.project_type_id,
          data.currency_id,
          data.exchange_rate,
          data.quotation_date,
          data.validity_date !== undefined ? data.validity_date : null,
          data.start_date !== undefined ? data.start_date : null,
          data.end_date !== undefined ? data.end_date : null,
          data.description,
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
          data.terms_conditions,
          data.status,
          data.planning_required !== undefined ? (data.planning_required ? 1 : 0) : null,
          id,
        ]
      );

      // Update selected templates if provided
      if (data.selected_templates !== undefined) {
        await connection.query(`DELETE FROM quotation_terms_templates WHERE quotation_id = ?`, [id]);
        if (data.selected_templates.length > 0) {
          for (let i = 0; i < data.selected_templates.length; i++) {
            const tmpl = data.selected_templates[i];
            await connection.query(
              `INSERT IGNORE INTO quotation_terms_templates (quotation_id, template_id, template_name, sort_order)
               VALUES (?, ?, ?, ?)`,
              [id, tmpl.template_id, tmpl.template_name, tmpl.sort_order ?? i]
            );
          }
        }
      }

      // Update selected WBS templates
      const wbsTemplatesToSave = (data as any).selected_wbs_templates;
      if (wbsTemplatesToSave !== undefined && Array.isArray(wbsTemplatesToSave)) {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS quotation_wbs_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            template_id INT NOT NULL,
            template_name VARCHAR(255) NULL,
            sort_order INT DEFAULT 0
          )
        `);
        await connection.query(`DELETE FROM quotation_wbs_templates WHERE quotation_id = ?`, [id]);
        if (wbsTemplatesToSave.length > 0) {
          for (let i = 0; i < wbsTemplatesToSave.length; i++) {
            const wt = wbsTemplatesToSave[i];
            await connection.query(
              `INSERT INTO quotation_wbs_templates (quotation_id, template_id, template_name, sort_order)
               VALUES (?, ?, ?, ?)`,
              [id, wt.template_id, wt.template_name || null, wt.sort_order ?? i]
            );
          }
        }
      }

      // Update terms snapshots if provided
      if (data.terms_snapshots !== undefined) {
        await connection.query(`DELETE FROM quotation_terms_snapshots WHERE quotation_id = ?`, [id]);
        if (data.terms_snapshots.length > 0) {
          for (const item of data.terms_snapshots) {
            await connection.query(
              `INSERT INTO quotation_terms_snapshots (quotation_id, template_id, template_name, title, description, is_mandatory, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                item.template_id || null,
                item.template_name || null,
                item.title,
                item.description,
                item.is_mandatory ? 1 : 0,
                item.sort_order || 0,
              ]
            );
          }
        }
      }

      // Update multiple taxes
      if (data.taxes !== undefined) {
        await connection.query(`DELETE FROM quotation_taxes WHERE quotation_id = ?`, [id]);
        if (data.taxes.length > 0) {
          const taxableAmount = Math.max(0, Number(data.subtotal_amount || 0) - Number(data.discount_amount || 0));
          for (const tax of data.taxes) {
            const pct = Number(tax.tax_percentage || 0);
            const amt = (taxableAmount * pct) / 100;
            await connection.query(
              `INSERT INTO quotation_taxes (quotation_id, tax_id, tax_name, tax_code, tax_type, tax_percentage, taxable_amount, tax_amount)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [id, tax.tax_id, tax.tax_name, tax.tax_code || null, tax.tax_type || null, pct, taxableAmount, amt]
            );
          }
        }
      }

      // Update disciplines if provided
      if (disciplines && disciplines.length > 0) {
        await connection.query(`DELETE FROM quotation_wbs_labour WHERE quotation_id = ?`, [id]);
        await connection.query(`DELETE FROM quotation_wbs_material WHERE quotation_id = ?`, [id]);
        await connection.query(`DELETE FROM quotation_disciplines WHERE quotation_id = ?`, [id]);
        for (const disc of disciplines) {
          const wbsType = disc.wbs_type === 'material' ? 'material' : (disc.wbs_type === 'both' ? 'both' : 'labour');
          const defaultUnit = wbsType === 'material' ? 'Nos' : 'hours';
          const [discRes] = await connection.query(
            `
            INSERT INTO quotation_disciplines (
              quotation_id, project_id, discipline_id, discipline_name, description,
              unit, quantity, rate, amount, terms_conditions,
              wbs_type, wbs_template_id, labour_hours, labour_rate, labour_cost,
              material_quantity, material_rate, material_cost, start_date, end_date, wbs_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              id,
              data.project_id || null,
              disc.discipline_id || null,
              disc.discipline_name,
              disc.description || null,
              disc.unit || defaultUnit,
              disc.quantity,
              disc.rate,
              disc.amount,
              disc.terms_conditions || null,
              wbsType,
              disc.wbs_template_id || null,
              disc.labour_hours || (wbsType === 'labour' ? disc.quantity : 0),
              disc.labour_rate || (wbsType === 'labour' ? disc.rate : 0),
              disc.labour_cost || (wbsType === 'labour' ? disc.amount : 0),
              disc.material_quantity || (wbsType === 'material' ? disc.quantity : 0),
              disc.material_rate || (wbsType === 'material' ? disc.rate : 0),
              disc.material_cost || (wbsType === 'material' ? disc.amount : 0),
              disc.start_date || null,
              disc.end_date || null,
              disc.wbs_id || null,
            ]
          );

          const disciplineId = (discRes as any).insertId;

          if (disc.labours && disc.labours.length > 0) {
            for (const l of disc.labours) {
              const labourName = l.labour_name || l.labour_type || 'Labour Item';
              const labourType = l.labour_type || l.labour_name || null;
              const hours = Number(l.hours !== undefined ? l.hours : (l.total_hours !== undefined ? l.total_hours : (l.workers_count ? l.workers_count * (l.hours_per_day || 8) : 0)));
              const rate = Number(l.rate !== undefined ? l.rate : (l.rate_per_hour !== undefined ? l.rate_per_hour : 0));
              const amount = Number(l.amount !== undefined ? l.amount : (l.total_cost !== undefined ? l.total_cost : (hours * rate)));
              await connection.query(
                `INSERT INTO quotation_wbs_labour (quotation_id, quotation_discipline_id, labour_id, labour_name, labour_type, hours, rate, amount, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, disciplineId, l.labour_id || null, labourName, labourType, hours, rate, amount, l.start_date || null, l.end_date || null]
              );
            }
          }

          if (disc.materials && disc.materials.length > 0) {
            for (const m of disc.materials) {
              const materialName = m.material_name || m.name || 'Material Item';
              const qty = Number(m.quantity !== undefined ? m.quantity : 0);
              const unit = m.unit || null;
              const matRate = Number(m.rate !== undefined ? m.rate : 0);
              const matAmount = Number(m.amount !== undefined ? m.amount : (m.total_cost !== undefined ? m.total_cost : (qty * matRate)));
              await connection.query(
                `INSERT INTO quotation_wbs_material (quotation_id, quotation_discipline_id, material_id, material_name, quantity, unit, rate, amount, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, disciplineId, m.material_id || null, materialName, qty, unit, matRate, matAmount, m.start_date || null, m.end_date || null]
              );
            }
          }
        }
      }

      // Update documents (Insert new base64 ones or preserve existing)
      if (data.documents !== undefined) {
        await connection.query(`DELETE FROM entity_documents WHERE entity_type = 'quotation' AND entity_id = ?`, [id]);
        
        if (data.documents.length > 0) {
          const [docTypes]: any = await connection.query(`SELECT doc_type_id FROM document_types LIMIT 1`);
          const docTypeId = docTypes.length > 0 ? docTypes[0].doc_type_id : 1;

          for (const doc of data.documents) {
            let filePath = doc.file_path || '';
            let fileSize = doc.file_size || 0;
            let mimeType = doc.mime_type || 'application/pdf';

            if (doc.file_base64) {
              try {
                const saved = saveBase64DocumentFile(doc.file_base64, doc.file_name, 'quotation', id);
                filePath = saved.filePath;
                fileSize = saved.fileSize;
                mimeType = saved.mimeType;
              } catch (err) {
                console.error('Failed to save base64 document:', err);
              }
            }

            if (filePath) {
              await connection.query(
                `INSERT INTO entity_documents (
                   entity_type, entity_id, doc_type_id, document_name, file_path, file_size, mime_type, uploaded_by
                 ) VALUES ('quotation', ?, ?, ?, ?, ?, ?, ?)`,
                [id, docTypeId, doc.file_name, filePath, fileSize, mimeType, userId || null]
              );
            }
          }
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

      // On approval: Automatically create full Planning record
      if (status === 'approved') {
        await connection.commit();
        const { PlanningRepository } = await import('./planning.repository');
        await PlanningRepository.createFromQuotation(id, approvedBy, ipAddress);

        await AuditService.log({
          user_id: approvedBy,
          action: `QUOTATION_STATUS_${status.toUpperCase()}`,
          module: 'quotations',
          description: `Changed status of quotation ID ${id} to ${status} and created planning workspace`,
          record_id: id,
          ip_address: ipAddress,
        });

        return this.getById(id);
      }

      await connection.commit();

      await AuditService.log({
        user_id: approvedBy,
        action: `QUOTATION_STATUS_${status.toUpperCase()}`,
        module: 'quotations',
        description: `Changed status of quotation ID ${id} to ${status}`,
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
    const quotation = await this.getById(quotationId);
    if (!quotation) {
      throw new Error(`Quotation with ID ${quotationId} not found`);
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      let projectId = quotation.project_id;
      if (!projectId) {
        const [projRes]: any = await connection.query(
          `INSERT INTO projects (
             customer_id, project_code, project_name, project_address,
             project_type_id, source_quotation_id, budget_amount, currency_id,
             exchange_rate, radius_meters, status, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
          [
            quotation.customer_id,
            overrides.project_code,
            overrides.project_name || `${quotation.customer_name} Project`,
            overrides.project_address || quotation.customer_address || '',
            overrides.project_type_id || quotation.project_type_id || null,
            quotationId,
            quotation.total_amount,
            quotation.currency_id || null,
            quotation.exchange_rate || 1.0,
            overrides.radius_meters || 200,
          ]
        );
        projectId = projRes.insertId;

        await connection.query(
          `UPDATE quotations SET project_id = ? WHERE quotation_id = ?`,
          [projectId, quotationId]
        );
      }

      await connection.commit();

      // Trigger standard approval workflow which syncs WBS, taxes, and documents idempotently
      await this.updateStatus(quotationId, 'approved', userId, ipAddress);

      return { project_id: projectId };
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
}
