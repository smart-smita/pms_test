import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export class MaterialRepository {
  // ── 1. Material Master ───────────────────────────────────────────────────
  async getMaterials(filters: { category?: string; status?: string; search?: string } = {}): Promise<any[]> {
    let sql = `SELECT m.* FROM materials m WHERE 1=1`;
    const params: any[] = [];

    if (filters.category) {
      sql += ` AND m.category = ?`;
      params.push(filters.category);
    }
    if (filters.status) {
      sql += ` AND m.status = ?`;
      params.push(filters.status);
    }
    if (filters.search) {
      sql += ` AND (m.material_name LIKE ? OR m.material_code LIKE ? OR m.category LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY m.material_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getMaterialById(id: number): Promise<any | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT m.* FROM materials m WHERE m.material_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async createMaterial(data: any): Promise<number> {
    const code = data.material_code || `MAT-${Date.now().toString().slice(-4)}`;
    const [res] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO materials (
        material_code, material_name, category, description, unit, brand_spec, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code, data.material_name, data.category || null, data.description || null,
        data.unit || 'Nos', data.brand_spec || null, data.status || 'active'
      ]
    );
    return res.insertId;
  }

  async updateMaterial(id: number, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable = ['material_name', 'category', 'description', 'unit', 'brand_spec', 'status'];

    for (const key of editable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return false;
    params.push(id);
    const [res] = await dbPool.query<ResultSetHeader>(`UPDATE materials SET ${fields.join(', ')} WHERE material_id = ?`, params);
    return res.affectedRows > 0;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const [res] = await dbPool.query<ResultSetHeader>(`DELETE FROM materials WHERE material_id = ?`, [id]);
    return res.affectedRows > 0;
  }

  // ── 2. Material Quotations ─────────────────────────────────────────────
  async getQuotations(filters: { project_id?: number; wbs_id?: number; status?: string } = {}): Promise<any[]> {
    let sql = `
      SELECT q.*, p.project_name, w.wbs_name,
             (SELECT COUNT(*) FROM material_quotation_items WHERE quotation_id = q.quotation_id) AS item_count,
             (SELECT SUM(total_amount) FROM material_quotation_items WHERE quotation_id = q.quotation_id) AS total_amount
      FROM material_quotations q
      JOIN projects p ON q.project_id = p.project_id
      JOIN project_wbs w ON q.wbs_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters.project_id) { sql += ` AND q.project_id = ?`; params.push(filters.project_id); }
    if (filters.wbs_id) { sql += ` AND q.wbs_id = ?`; params.push(filters.wbs_id); }
    if (filters.status) { sql += ` AND q.status = ?`; params.push(filters.status); }

    sql += ` ORDER BY q.quotation_date DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getQuotationById(id: number): Promise<any | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT q.*, p.project_name, w.wbs_name
       FROM material_quotations q
       JOIN projects p ON q.project_id = p.project_id
       JOIN project_wbs w ON q.wbs_id = w.id
       WHERE q.quotation_id = ?`,
      [id]
    );
    if (!rows.length) return null;
    const quotation = rows[0];

    const [items] = await dbPool.query<RowDataPacket[]>(
      `SELECT qi.*, m.material_name, m.material_code, m.unit
       FROM material_quotation_items qi
       JOIN materials m ON qi.material_id = m.material_id
       WHERE qi.quotation_id = ?`,
      [id]
    );
    quotation.items = items;
    return quotation;
  }

  async createQuotation(data: any, items: any[]): Promise<number> {
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const [res]: any = await conn.query(
        `INSERT INTO material_quotations (
          project_id, wbs_id, quotation_date, status, created_by
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quotation_date = VALUES(quotation_date), status = VALUES(status)`,
        [
          data.project_id, data.wbs_id, data.quotation_date || new Date().toISOString().split('T')[0],
          data.status || 'draft', data.created_by || null
        ]
      );
      
      const quotationId = res.insertId || (await conn.query<RowDataPacket[]>(`SELECT quotation_id FROM material_quotations WHERE project_id = ? AND wbs_id = ?`, [data.project_id, data.wbs_id]))[0][0].quotation_id;
      
      // Delete existing items if updating
      await conn.query(`DELETE FROM material_quotation_items WHERE quotation_id = ?`, [quotationId]);

      if (items && items.length > 0) {
        for (const item of items) {
          const plannedQty = Number(item.planned_quantity || 0);
          const rate = Number(item.rate || 0);
          const plannedAmt = plannedQty * rate;
          const taxPct = Number(item.tax_percentage || 0);
          const taxAmt = (plannedAmt * taxPct) / 100;
          const totalAmt = plannedAmt + taxAmt;

          await conn.query(
            `INSERT INTO material_quotation_items (quotation_id, material_id, planned_quantity, rate, planned_amount, tax_percentage, tax_amount, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [quotationId, item.material_id, plannedQty, rate, plannedAmt, taxPct, taxAmt, totalAmt]
          );
        }
      }
      await conn.commit();
      return quotationId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateQuotationStatus(id: number, status: string): Promise<boolean> {
    const [res] = await dbPool.query<ResultSetHeader>(`UPDATE material_quotations SET status = ? WHERE quotation_id = ?`, [status, id]);
    return res.affectedRows > 0;
  }

  // ── 3. Monthly Material Surveys ─────────────────────────────────────────
  async getSurveys(filters: { project_id?: number; wbs_id?: number; status?: string } = {}): Promise<any[]> {
    let sql = `
      SELECT s.*, p.project_name, w.wbs_name
      FROM material_surveys s
      JOIN projects p ON s.project_id = p.project_id
      JOIN project_wbs w ON s.wbs_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters.project_id) { sql += ` AND s.project_id = ?`; params.push(filters.project_id); }
    if (filters.wbs_id) { sql += ` AND s.wbs_id = ?`; params.push(filters.wbs_id); }
    if (filters.status) { sql += ` AND s.status = ?`; params.push(filters.status); }

    sql += ` ORDER BY s.survey_date DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getSurveyById(id: number): Promise<any | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT s.*, p.project_name, w.wbs_name
       FROM material_surveys s
       JOIN projects p ON s.project_id = p.project_id
       JOIN project_wbs w ON s.wbs_id = w.id
       WHERE s.survey_id = ?`,
      [id]
    );
    if (!rows.length) return null;
    const survey = rows[0];

    const [items] = await dbPool.query<RowDataPacket[]>(
      `SELECT si.*, m.material_name, m.material_code, m.unit
       FROM material_survey_items si
       JOIN materials m ON si.material_id = m.material_id
       WHERE si.survey_id = ?`,
      [id]
    );
    survey.items = items;
    return survey;
  }

  async createSurvey(data: any, items: any[]): Promise<number> {
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const [res]: any = await conn.query(
        `INSERT INTO material_surveys (
          project_id, wbs_id, survey_date, survey_month, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.project_id, data.wbs_id, data.survey_date, data.survey_month,
          data.status || 'draft', data.created_by || null
        ]
      );
      const surveyId = res.insertId;

      for (const item of items) {
        const opQty = Number(item.opening_qty || 0);
        const addQty = Number(item.added_qty || 0);
        const usedQty = Number(item.used_qty || 0);
        const wastQty = Number(item.wastage_qty || 0);
        const remQty = opQty + addQty - usedQty - wastQty;

        const rate = Number(item.rate || 0);
        const usedCost = usedQty * rate;
        const remCost = remQty * rate;

        await conn.query(
          `INSERT INTO material_survey_items (survey_id, material_id, opening_qty, added_qty, used_qty, wastage_qty, remaining_qty, rate, used_cost, remaining_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [surveyId, item.material_id, opQty, addQty, usedQty, wastQty, remQty, rate, usedCost, remCost]
        );
      }
      
      await conn.commit();
      return surveyId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateSurveyStatus(id: number, status: string): Promise<boolean> {
    const [res] = await dbPool.query<ResultSetHeader>(`UPDATE material_surveys SET status = ? WHERE survey_id = ?`, [status, id]);
    return res.affectedRows > 0;
  }

  // ── 4. Reports & Cost Summaries ─────────────────────────────────────────
  async getProjectMaterialReport(projectId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_name,
        w.wbs_name,
        m.material_name,
        m.material_code,
        m.category,
        m.unit,
        COALESCE(ind.planned_qty, 0) AS planned_qty,
        COALESCE(ind.planned_amount, 0) AS planned_cost,
        COALESCE(iss.used_qty, 0) AS used_qty,
        COALESCE(iss.used_cost, 0) AS actual_cost,
        COALESCE(iss.remaining_qty, 0) AS remaining_qty,
        COALESCE(iss.remaining_cost, 0) AS remaining_cost,
        (COALESCE(ind.planned_amount, 0) - COALESCE(iss.used_cost, 0)) AS cost_variance
      FROM materials m
      CROSS JOIN projects p
      CROSS JOIN project_wbs w ON w.project_id = p.project_id
      LEFT JOIN (
        SELECT q.project_id, q.wbs_id, qi.material_id, 
               SUM(qi.planned_quantity) AS planned_qty,
               SUM(qi.total_amount) AS planned_amount
        FROM material_quotation_items qi
        JOIN material_quotations q ON qi.quotation_id = q.quotation_id
        WHERE q.status = 'approved'
        GROUP BY q.project_id, q.wbs_id, qi.material_id
      ) ind ON ind.project_id = p.project_id AND ind.wbs_id = w.id AND ind.material_id = m.material_id
      LEFT JOIN (
        SELECT s.project_id, s.wbs_id, si.material_id, 
               SUM(si.used_qty) AS used_qty,
               SUM(si.used_cost) AS used_cost,
               (SELECT remaining_qty FROM material_survey_items si2 JOIN material_surveys s2 ON si2.survey_id = s2.survey_id WHERE s2.project_id = s.project_id AND s2.wbs_id = s.wbs_id AND si2.material_id = si.material_id ORDER BY s2.survey_date DESC LIMIT 1) AS remaining_qty,
               (SELECT remaining_cost FROM material_survey_items si2 JOIN material_surveys s2 ON si2.survey_id = s2.survey_id WHERE s2.project_id = s.project_id AND s2.wbs_id = s.wbs_id AND si2.material_id = si.material_id ORDER BY s2.survey_date DESC LIMIT 1) AS remaining_cost
        FROM material_survey_items si
        JOIN material_surveys s ON si.survey_id = s.survey_id
        GROUP BY s.project_id, s.wbs_id, si.material_id
      ) iss ON iss.project_id = p.project_id AND iss.wbs_id = w.id AND iss.material_id = m.material_id
      WHERE (ind.planned_qty > 0 OR iss.used_qty > 0 OR iss.remaining_qty > 0)
    `;
    const params: any[] = [];
    if (projectId) { sql += ` AND p.project_id = ?`; params.push(projectId); }
    sql += ` ORDER BY p.project_name, w.wbs_name, m.material_name`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getProjectCostSummary(projectId: number): Promise<any> {
    const [proj] = await dbPool.query<RowDataPacket[]>(`SELECT project_id, project_name, budget_amount FROM projects WHERE project_id = ?`, [projectId]);
    if (!proj.length) return null;

    // Actual Material Cost (from Surveys)
    const [matCost] = await dbPool.query<RowDataPacket[]>(`
      SELECT COALESCE(SUM(si.used_cost), 0) AS total 
      FROM material_survey_items si 
      JOIN material_surveys s ON si.survey_id = s.survey_id 
      WHERE s.project_id = ?
    `, [projectId]);
    const actualMaterialCost = Number(matCost[0].total || 0);

    // Actual Labour/Employee Cost
    const [labCost] = await dbPool.query<RowDataPacket[]>(`SELECT COALESCE(SUM(total_cost), 0) AS total FROM labour_work_logs WHERE project_id = ?`, [projectId]);
    const actualLabourCost = Number(labCost[0].total || 0);

    const plannedBudget = Number(proj[0].budget_amount || 0);
    const totalActualCost = actualMaterialCost + actualLabourCost;
    const costVariance = plannedBudget - totalActualCost;

    return {
      project_id: projectId,
      project_name: proj[0].project_name,
      planned_budget: plannedBudget,
      actual_material_cost: actualMaterialCost,
      actual_labour_cost: actualLabourCost,
      total_vendor_invoices: 0,
      total_actual_cost: totalActualCost,
      cost_variance: costVariance,
    };
  }
}
