import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';
import { ScheduleService } from '../services/schedule.service';
import crypto from 'crypto';

export class PlanningRepository {
  /**
   * Get all planning records with joined quotation and customer information
   */
  static async getAll(filters: { status?: string; customer_id?: number; quotation_id?: number } = {}) {
    let sql = `
      SELECT 
        p.*,
        q.quotation_code,
        q.quotation_date,
        q.total_amount AS quotation_total,
        c.customer_name,
        c.customer_code,
        pt.type_name AS project_type_name,
        pr.project_name,
        pr.project_code,
        e1.name AS created_by_name,
        e2.name AS approved_by_name,
        e3.name AS submitted_by_name,
        (SELECT COUNT(*) FROM planning_wbs pw WHERE pw.planning_id = p.id) AS wbs_count,
        (SELECT COUNT(*) FROM planning_tasks pt JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id WHERE pw.planning_id = p.id) AS tasks_count
      FROM planning p
      JOIN quotations q ON p.quotation_id = q.quotation_id
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      LEFT JOIN project_types pt ON p.project_type_id = pt.type_id
      LEFT JOIN projects pr ON p.project_id = pr.project_id
      LEFT JOIN employees e1 ON p.created_by = e1.employee_id
      LEFT JOIN employees e2 ON p.approved_by = e2.employee_id
      LEFT JOIN employees e3 ON p.submitted_by = e3.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status) {
      sql += ` AND p.status = ?`;
      params.push(filters.status);
    }
    if (filters.customer_id) {
      sql += ` AND p.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters.quotation_id) {
      sql += ` AND p.quotation_id = ?`;
      params.push(filters.quotation_id);
    }

    sql += ` ORDER BY p.id DESC`;
    const [rows]: any = await dbPool.query(sql, params);
    return rows;
  }

  /**
   * Get full planning details by ID including all child entities and quotation diff detection
   */
  static async getById(id: number) {
    const [rows]: any = await dbPool.query(
      `
      SELECT 
        p.*,
        q.quotation_code,
        q.quotation_date,
        q.total_amount AS quotation_total,
        q.subtotal_amount AS quotation_subtotal,
        q.discount_amount AS quotation_discount,
        q.tax_amount AS quotation_tax_amount,
        q.start_date AS quotation_start_date,
        q.end_date AS quotation_end_date,
        q.validity_date AS quotation_validity_date,
        q.status AS quotation_status,
        q.new_project_name AS quotation_new_project_name,
        q.project_id AS quotation_project_id,
        c.customer_name,
        c.customer_code,
        c.contact_person,
        c.contact_number,
        c.email AS customer_email,
        c.address AS customer_address,
        pt.type_name AS project_type_name,
        pr.project_name,
        pr.project_code,
        cal.calendar_name,
        e1.name AS created_by_name,
        e2.name AS approved_by_name,
        e3.name AS submitted_by_name
      FROM planning p
      JOIN quotations q ON p.quotation_id = q.quotation_id
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      LEFT JOIN project_types pt ON p.project_type_id = pt.type_id
      LEFT JOIN projects pr ON p.project_id = pr.project_id
      LEFT JOIN company_calendar cal ON p.calendar_id = cal.id
      LEFT JOIN employees e1 ON p.created_by = e1.employee_id
      LEFT JOIN employees e2 ON p.approved_by = e2.employee_id
      LEFT JOIN employees e3 ON p.submitted_by = e3.employee_id
      WHERE p.id = ?
    `,
      [id]
    );

    if (rows.length === 0) return null;
    const planning = rows[0];

    // 1. Fetch WBS
    const [wbsRows]: any = await dbPool.query(
      `SELECT * FROM planning_wbs WHERE planning_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    // 2. Fetch Tasks
    const [tasksRows]: any = await dbPool.query(
      `SELECT pt.*, pt.duration AS duration_days, pw.wbs_name, pw.wbs_code 
       FROM planning_tasks pt
       JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
       WHERE pw.planning_id = ?
       ORDER BY pt.sort_order ASC, pt.id ASC`,
      [id]
    );

    // 3. Fetch Dependencies
    const [depsRows]: any = await dbPool.query(
      `SELECT ptd.*, 
              t1.task_name, 
              t2.task_name AS predecessor_task_name 
       FROM planning_task_dependencies ptd
       JOIN planning_tasks t1 ON ptd.task_id = t1.id
       JOIN planning_tasks t2 ON ptd.predecessor_task_id = t2.id
       JOIN planning_wbs pw ON t1.planning_wbs_id = pw.id
       WHERE pw.planning_id = ?`,
      [id]
    );

    // 4. Fetch Labour
    const [labourRows]: any = await dbPool.query(
      `SELECT pl.*, pl.worker_count AS workers_count, pw.wbs_name 
       FROM planning_wbs_labour pl
       JOIN planning_wbs pw ON pl.planning_wbs_id = pw.id
       WHERE pl.planning_id = ?
       ORDER BY pl.id ASC`,
      [id]
    );

    // 5. Fetch Materials
    const [materialRows]: any = await dbPool.query(
      `SELECT pm.*, pw.wbs_name 
       FROM planning_wbs_material pm
       JOIN planning_wbs pw ON pm.planning_wbs_id = pw.id
       WHERE pm.planning_id = ?
       ORDER BY pm.id ASC`,
      [id]
    );

    // 6. Fetch Terms Templates & Snapshots
    const [termTemplates]: any = await dbPool.query(
      `SELECT * FROM planning_terms_templates WHERE planning_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    const [termSnapshots]: any = await dbPool.query(
      `SELECT * FROM planning_terms_snapshots WHERE planning_id = ? ORDER BY sort_order ASC, snapshot_id ASC`,
      [id]
    );

    // 7. Fetch Taxes
    const [taxesRows]: any = await dbPool.query(
      `SELECT * FROM planning_taxes WHERE planning_id = ? ORDER BY id ASC`,
      [id]
    );

    // 8. Fetch Revisions
    const [revisionRows]: any = await dbPool.query(
      `SELECT pr.*, e.name AS created_by_name 
       FROM planning_revisions pr
       LEFT JOIN employees e ON pr.created_by = e.employee_id
       WHERE pr.planning_id = ?
       ORDER BY pr.version DESC, pr.id DESC`,
      [id]
    );

    // 9. Fetch Quotation Documents for Reference
    const [documents]: any = await dbPool.query(
      `SELECT * FROM entity_documents WHERE entity_type = 'quotation' AND entity_id = ?`,
      [planning.quotation_id]
    );

    // 10. Quotation Change Detection Diff
    const quotationChanges = await this.detectQuotationChanges(id, planning.quotation_id);

    planning.wbs = wbsRows;
    planning.tasks = tasksRows;
    planning.dependencies = depsRows;
    planning.labour = labourRows;
    planning.materials = materialRows;
    planning.terms_templates = termTemplates;
    planning.terms_snapshots = termSnapshots;
    planning.terms = termSnapshots;
    planning.taxes = taxesRows;
    planning.revisions = revisionRows;
    planning.documents = documents;
    planning.quotation_changes = quotationChanges;

    return planning;
  }

  /**
   * Detects differences between current Quotation data and current Planning data
   */
  static async detectQuotationChanges(planningId: number, quotationId: number) {
    const diffs: Array<{ type: string; title: string; message: string; details?: any }> = [];

    const [qRows]: any = await dbPool.query(`SELECT * FROM quotations WHERE quotation_id = ?`, [quotationId]);
    if (qRows.length === 0) return { has_changes: false, diffs: [] };
    const quotation = qRows[0];

    const [pRows]: any = await dbPool.query(`SELECT * FROM planning WHERE id = ?`, [planningId]);
    const planning = pRows[0];

    // Check header level changes
    if (quotation.start_date && planning.start_date && quotation.start_date !== planning.start_date) {
      diffs.push({
        type: 'date',
        title: 'Start Date Difference',
        message: `Quotation Start Date is ${quotation.start_date}, Planning Start Date is ${planning.start_date}`,
        details: { quotation_date: quotation.start_date, planning_date: planning.start_date },
      });
    }

    if (quotation.end_date && planning.end_date && quotation.end_date !== planning.end_date) {
      diffs.push({
        type: 'date',
        title: 'End Date Difference',
        message: `Quotation End Date is ${quotation.end_date}, Planning End Date is ${planning.end_date}`,
        details: { quotation_date: quotation.end_date, planning_date: planning.end_date },
      });
    }

    // Check Disciplines / WBS differences
    const [qDisciplines]: any = await dbPool.query(
      `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active'`,
      [quotationId]
    );
    const [pWbs]: any = await dbPool.query(
      `SELECT * FROM planning_wbs WHERE planning_id = ?`,
      [planningId]
    );

    for (const qd of qDisciplines) {
      const match = pWbs.find((pw: any) => pw.quotation_discipline_id === qd.id || pw.wbs_name.toLowerCase() === qd.discipline_name.toLowerCase());
      if (!match) {
        diffs.push({
          type: 'wbs_added',
          title: 'New WBS in Quotation',
          message: `Quotation includes discipline "${qd.discipline_name}" which is not in Planning`,
          details: qd,
        });
      } else {
        // Compare quantity / budget / dates
        if (Number(qd.amount || 0) !== Number(match.budget_amount || 0)) {
          diffs.push({
            type: 'wbs_budget',
            title: `Budget difference on "${qd.discipline_name}"`,
            message: `Quotation Amount: ₹${qd.amount} vs Planning Budget: ₹${match.budget_amount}`,
            details: { quotation_amount: qd.amount, planning_budget: match.budget_amount, wbs_name: qd.discipline_name },
          });
        }
      }
    }

    // Check Labour differences
    const [qLabour]: any = await dbPool.query(`SELECT * FROM quotation_wbs_labour WHERE quotation_id = ?`, [quotationId]);
    const [pLabour]: any = await dbPool.query(`SELECT * FROM planning_wbs_labour WHERE planning_id = ?`, [planningId]);

    if (qLabour.length !== pLabour.length) {
      diffs.push({
        type: 'labour_count',
        title: 'Labour Count Mismatch',
        message: `Quotation has ${qLabour.length} labour lines, Planning has ${pLabour.length} labour lines`,
        details: { quotation_count: qLabour.length, planning_count: pLabour.length },
      });
    }

    // Check Material differences
    const [qMaterials]: any = await dbPool.query(`SELECT * FROM quotation_wbs_material WHERE quotation_id = ?`, [quotationId]);
    const [pMaterials]: any = await dbPool.query(`SELECT * FROM planning_wbs_material WHERE planning_id = ?`, [planningId]);

    if (qMaterials.length !== pMaterials.length) {
      diffs.push({
        type: 'material_count',
        title: 'Material Count Mismatch',
        message: `Quotation has ${qMaterials.length} material lines, Planning has ${pMaterials.length} material lines`,
        details: { quotation_count: qMaterials.length, planning_count: pMaterials.length },
      });
    }

    return {
      has_changes: diffs.length > 0,
      diffs,
    };
  }

  /**
   * Automatically creates a complete Planning record from an Approved Quotation
   */
  static async createFromQuotation(quotationId: number, userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if planning already exists for this quotation
      const [existingPlans]: any = await connection.query(
        `SELECT id, status FROM planning WHERE quotation_id = ? LIMIT 1`,
        [quotationId]
      );

      if (existingPlans.length > 0) {
        connection.release();
        return this.getById(existingPlans[0].id);
      }

      // Fetch Quotation with all details
      const [qRows]: any = await connection.query(`SELECT * FROM quotations WHERE quotation_id = ?`, [quotationId]);
      if (qRows.length === 0) throw new Error(`Quotation with ID ${quotationId} not found`);
      const quotation = qRows[0];

      // Insert Planning Header
      const [planRes]: any = await connection.query(
        `INSERT INTO planning (
           quotation_id, project_id, customer_id, project_type_id, new_project_name,
           calendar_id, status, version, start_date, end_date, total_duration,
           total_budget, total_labour_cost, total_material_cost, total_tax_amount,
           terms_conditions, created_by
         ) VALUES (?, ?, ?, ?, ?, 1, 'draft', 1, ?, ?, 0, ?, 0, 0, ?, ?, ?)`,
        [
          quotationId,
          quotation.project_id || null,
          quotation.customer_id || null,
          quotation.project_type_id || null,
          quotation.new_project_name || null,
          quotation.start_date || null,
          quotation.end_date || null,
          quotation.total_amount || 0.00,
          quotation.tax_amount || 0.00,
          quotation.terms_conditions || null,
          userId || quotation.created_by || null,
        ]
      );

      const planningId = planRes.insertId;

      // 1. Copy WBS (Disciplines)
      const [qDisciplines]: any = await connection.query(
        `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active' ORDER BY id ASC`,
        [quotationId]
      );

      const disciplineMap = new Map<number, number>(); // qd.id -> pw.id

      for (let i = 0; i < qDisciplines.length; i++) {
        const qd = qDisciplines[i];
        const wbsType = qd.wbs_type === 'material' ? 'material' : (qd.wbs_type === 'both' ? 'both' : 'labour');
        const defaultUnit = wbsType === 'material' ? 'Nos' : 'hours';

        const [wbsRes]: any = await connection.query(
          `INSERT INTO planning_wbs (
             planning_id, quotation_discipline_id, wbs_id, wbs_template_id, wbs_name, wbs_code,
             wbs_type, level, sort_order, unit, planned_quantity, rate, budget_amount,
             planned_hours, planned_labour_cost, planned_material_cost, planned_other_cost,
             baseline_start, baseline_end, baseline_duration, start_date, end_date, duration, description
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, 0, ?)`,
          [
            planningId,
            qd.id,
            qd.wbs_id || null,
            qd.wbs_template_id || null,
            qd.discipline_name,
            qd.wbs_code || `WBS-${(i + 1).toString().padStart(2, '0')}`,
            wbsType,
            i,
            qd.unit || defaultUnit,
            qd.quantity || 1.00,
            qd.rate || 0.00,
            qd.amount || 0.00,
            qd.labour_hours || (wbsType === 'labour' ? qd.quantity : 0),
            qd.labour_cost || (wbsType === 'labour' ? qd.amount : 0),
            qd.material_cost || (wbsType === 'material' ? qd.amount : 0),
            qd.start_date || quotation.start_date || null,
            qd.end_date || quotation.end_date || null,
            qd.start_date || quotation.start_date || null,
            qd.end_date || quotation.end_date || null,
            qd.description || null,
          ]
        );

        const planWbsId = wbsRes.insertId;
        disciplineMap.set(qd.id, planWbsId);

        // Generate initial default task for this WBS
        const taskDuration = 5; // Default 5 working days
        await connection.query(
          `INSERT INTO planning_tasks (
             planning_wbs_id, task_name, task_code, description, priority,
             baseline_start, baseline_end, baseline_duration,
             start_date, end_date, duration, planned_hours,
             planned_labour_cost, planned_material_cost, status, sort_order
           ) VALUES (?, ?, ?, ?, 'medium', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
          [
            planWbsId,
            `Execute ${qd.discipline_name}`,
            `TSK-${(i + 1).toString().padStart(2, '0')}-01`,
            qd.description || `Primary execution task for ${qd.discipline_name}`,
            qd.start_date || quotation.start_date || null,
            qd.end_date || quotation.end_date || null,
            taskDuration,
            qd.start_date || quotation.start_date || null,
            qd.end_date || quotation.end_date || null,
            taskDuration,
            qd.labour_hours || 40.00,
            qd.labour_cost || (wbsType === 'labour' ? qd.amount : 0),
            qd.material_cost || (wbsType === 'material' ? qd.amount : 0),
          ]
        );
      }

      // 2. Copy Labour Details
      const [qLabours]: any = await connection.query(`SELECT * FROM quotation_wbs_labour WHERE quotation_id = ?`, [quotationId]);
      for (const ql of qLabours) {
        const planWbsId = disciplineMap.get(ql.quotation_discipline_id);
        if (planWbsId) {
          await connection.query(
            `INSERT INTO planning_wbs_labour (
               planning_id, planning_wbs_id, quotation_labour_id, labour_id,
               labour_name, labour_type, worker_count, hours, rate, amount,
               start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            [
              planningId,
              planWbsId,
              ql.id,
              ql.labour_id || null,
              ql.labour_name,
              ql.labour_type || null,
              ql.hours || 0,
              ql.rate || 0,
              ql.amount || 0,
              ql.start_date || quotation.start_date || null,
              ql.end_date || quotation.end_date || null,
            ]
          );
        }
      }

      // 3. Copy Material Details
      const [qMaterials]: any = await connection.query(`SELECT * FROM quotation_wbs_material WHERE quotation_id = ?`, [quotationId]);
      for (const qm of qMaterials) {
        const planWbsId = disciplineMap.get(qm.quotation_discipline_id);
        if (planWbsId) {
          await connection.query(
            `INSERT INTO planning_wbs_material (
               planning_id, planning_wbs_id, quotation_material_id, material_id,
               material_name, quantity, unit, rate, amount,
               start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              planningId,
              planWbsId,
              qm.id,
              qm.material_id || null,
              qm.material_name,
              qm.quantity || 0,
              qm.unit || 'Nos',
              qm.rate || 0,
              qm.amount || 0,
              qm.start_date || quotation.start_date || null,
              qm.end_date || quotation.end_date || null,
            ]
          );
        }
      }

      // 4. Copy Terms Templates & Snapshots
      const [qTemplates]: any = await connection.query(`SELECT * FROM quotation_terms_templates WHERE quotation_id = ?`, [quotationId]);
      for (const qt of qTemplates) {
        await connection.query(
          `INSERT INTO planning_terms_templates (planning_id, template_id, template_name, sort_order) VALUES (?, ?, ?, ?)`,
          [planningId, qt.template_id, qt.template_name, qt.sort_order || 0]
        );
      }

      const [qTerms]: any = await connection.query(`SELECT * FROM quotation_terms_snapshots WHERE quotation_id = ?`, [quotationId]);
      for (const term of qTerms) {
        await connection.query(
          `INSERT INTO planning_terms_snapshots (
             planning_id, template_id, template_name, title, description, is_mandatory, sort_order, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            planningId,
            term.template_id || null,
            term.template_name || null,
            term.title,
            term.description,
            term.is_mandatory ? 1 : 0,
            term.sort_order || 0,
            term.status || 'active',
          ]
        );
      }

      // 5. Copy Taxes
      const [qTaxes]: any = await connection.query(`SELECT * FROM quotation_taxes WHERE quotation_id = ?`, [quotationId]);
      for (const tax of qTaxes) {
        await connection.query(
          `INSERT INTO planning_taxes (
             planning_id, tax_id, tax_name, tax_code, tax_type, tax_percentage, taxable_amount, tax_amount
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            planningId,
            tax.tax_id,
            tax.tax_name,
            tax.tax_code || null,
            tax.tax_type || null,
            tax.tax_percentage,
            tax.taxable_amount,
            tax.tax_amount,
          ]
        );
      }

      // 6. Save Quotation Snapshot Hash
      const snapshotContent = JSON.stringify({ quotation, disciplines: qDisciplines, labours: qLabours, materials: qMaterials });
      const snapshotHash = crypto.createHash('sha256').update(snapshotContent).digest('hex');
      await connection.query(
        `INSERT INTO quotation_snapshots (quotation_id, snapshot_hash, snapshot_data) VALUES (?, ?, ?)`,
        [quotationId, snapshotHash, snapshotContent]
      );

      // 7. Save Initial Revision
      await connection.query(
        `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
         VALUES (?, 1, 'Initial Plan', 'Initial planning dataset generated from Approved Quotation', ?, ?)`,
        [planningId, snapshotContent, userId || quotation.created_by || null]
      );

      // 8. Run Scheduling Engine to populate initial working days & roll-ups
      await ScheduleService.calculatePlanningSchedule(planningId, connection);

      await connection.commit();

      if (userId) {
        await AuditService.log({
          user_id: userId,
          action: 'CREATE_PLANNING',
          module: 'planning',
          description: `Created planning ID ${planningId} from quotation ID ${quotationId}`,
          record_id: planningId,
          ip_address: ipAddress || '127.0.0.1',
        });
      }

      return this.getById(planningId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Saves updated planning draft (WBS, Tasks, Dependencies, Labour, Materials, Terms, Taxes)
   */
  static async saveDraft(id: number, data: any, userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [pRows]: any = await connection.query(`SELECT * FROM planning WHERE id = ?`, [id]);
      if (pRows.length === 0) {
        connection.release();
        const err: any = new Error(`Planning with ID ${id} not found`);
        err.statusCode = 404;
        throw err;
      }
      const currentPlan = pRows[0];

      if (currentPlan.status === 'approved') {
        connection.release();
        const err: any = new Error('Approved planning cannot be edited directly.');
        err.statusCode = 400;
        throw err;
      }

      // 1. Update Header fields
      await connection.query(
        `UPDATE planning SET 
           new_project_name = COALESCE(?, new_project_name),
           project_type_id = COALESCE(?, project_type_id),
           calendar_id = COALESCE(?, calendar_id),
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           terms_conditions = COALESCE(?, terms_conditions)
         WHERE id = ?`,
        [
          data.new_project_name !== undefined ? data.new_project_name : null,
          data.project_type_id || null,
          data.calendar_id || null,
          data.start_date || null,
          data.end_date || null,
          data.terms_conditions !== undefined ? data.terms_conditions : null,
          id
        ]
      );

      // 2. Sync WBS
      if (data.wbs && Array.isArray(data.wbs)) {
        for (let i = 0; i < data.wbs.length; i++) {
          const w = data.wbs[i];
          if (w.id) {
            await connection.query(
              `UPDATE planning_wbs SET 
                 wbs_name = ?, wbs_code = ?, wbs_type = ?, sort_order = ?, unit = ?,
                 planned_quantity = ?, rate = ?, budget_amount = ?, planned_hours = ?,
                 planned_labour_cost = ?, planned_material_cost = ?, planned_other_cost = ?,
                 start_date = ?, end_date = ?, duration = ?, description = ?
               WHERE id = ? AND planning_id = ?`,
              [
                w.wbs_name, w.wbs_code || null, w.wbs_type || 'labour', i, w.unit || 'hours',
                w.planned_quantity || 1, w.rate || 0, w.budget_amount || 0, w.planned_hours || 0,
                w.planned_labour_cost || 0, w.planned_material_cost || 0, w.planned_other_cost || 0,
                w.start_date || null, w.end_date || null, w.duration || 0, w.description || null,
                w.id, id
              ]
            );
          } else {
            await connection.query(
              `INSERT INTO planning_wbs (
                 planning_id, wbs_name, wbs_code, wbs_type, sort_order, unit,
                 planned_quantity, rate, budget_amount, planned_hours,
                 planned_labour_cost, planned_material_cost, planned_other_cost,
                 start_date, end_date, duration, baseline_start, baseline_end, description
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id, w.wbs_name, w.wbs_code || null, w.wbs_type || 'labour', i, w.unit || 'hours',
                w.planned_quantity || 1, w.rate || 0, w.budget_amount || 0, w.planned_hours || 0,
                w.planned_labour_cost || 0, w.planned_material_cost || 0, w.planned_other_cost || 0,
                w.start_date || null, w.end_date || null, w.duration || 0,
                w.start_date || null, w.end_date || null, w.description || null
              ]
            );
          }
        }
      }

      // 3. Sync Tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        for (let i = 0; i < data.tasks.length; i++) {
          const t = data.tasks[i];
          if (t.id) {
            await connection.query(
              `UPDATE planning_tasks SET 
                 task_name = ?, task_code = ?, description = ?, priority = ?,
                 start_date = ?, end_date = ?, duration = ?, planned_hours = ?,
                 planned_labour_cost = ?, planned_material_cost = ?, planned_other_cost = ?,
                 manually_adjusted = ?, status = ?, sort_order = ?
               WHERE id = ?`,
              [
                t.task_name, t.task_code || null, t.description || null, t.priority || 'medium',
                t.start_date || null, t.end_date || null, t.duration ?? t.duration_days ?? 1, t.planned_hours || 8,
                t.planned_labour_cost || 0, t.planned_material_cost || 0, t.planned_other_cost || 0,
                t.manually_adjusted ? 1 : 0, t.status || 'pending', i,
                t.id
              ]
            );
          } else if (t.planning_wbs_id) {
            await connection.query(
              `INSERT INTO planning_tasks (
                 planning_wbs_id, task_name, task_code, description, priority,
                 start_date, end_date, duration, baseline_start, baseline_end, baseline_duration,
                 planned_hours, planned_labour_cost, planned_material_cost, planned_other_cost,
                 status, sort_order
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                t.planning_wbs_id, t.task_name, t.task_code || null, t.description || null, t.priority || 'medium',
                t.start_date || null, t.end_date || null, t.duration ?? t.duration_days ?? 1,
                t.baseline_start || t.start_date || null, t.baseline_end || t.end_date || null, t.baseline_duration ?? t.duration ?? t.duration_days ?? 1,
                t.planned_hours || 8, t.planned_labour_cost || 0, t.planned_material_cost || 0, t.planned_other_cost || 0,
                t.status || 'pending', i
              ]
            );
          }
        }
      }

      // 4. Sync Dependencies
      if (data.dependencies && Array.isArray(data.dependencies)) {
        // Delete dependencies for tasks belonging to this planning
        await connection.query(
          `DELETE ptd FROM planning_task_dependencies ptd
           JOIN planning_tasks pt ON ptd.task_id = pt.id
           JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
           WHERE pw.planning_id = ?`,
          [id]
        );

        for (const dep of data.dependencies) {
          const succId = dep.task_id || dep.successor_task_id;
          const predId = dep.predecessor_task_id || dep.predecessor_id;
          if (succId && predId && succId !== predId) {
            await connection.query(
              `INSERT IGNORE INTO planning_task_dependencies (task_id, predecessor_task_id, dependency_type, lag_days)
               VALUES (?, ?, ?, ?)`,
              [succId, predId, dep.dependency_type || 'FS', Number(dep.lag_days || 0)]
            );
          }
        }
      }

      // 5. Sync Labour
      if (data.labour && Array.isArray(data.labour)) {
        await connection.query(`DELETE FROM planning_wbs_labour WHERE planning_id = ?`, [id]);
        for (const l of data.labour) {
          if (l.planning_wbs_id && l.labour_name) {
            await connection.query(
              `INSERT INTO planning_wbs_labour (
                 planning_id, planning_wbs_id, labour_id, labour_name, labour_type,
                 worker_count, hours, rate, amount, start_date, end_date, notes
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id, l.planning_wbs_id, l.labour_id || null, l.labour_name, l.labour_type || null,
                l.workers_count !== undefined ? l.workers_count : (l.worker_count !== undefined ? l.worker_count : 1),
                l.hours || 0, l.rate || 0, l.amount || (Number(l.hours || 0) * Number(l.rate || 0)),
                l.start_date || null, l.end_date || null, l.notes || null
              ]
            );
          }
        }
      }

      // 6. Sync Materials
      if (data.materials && Array.isArray(data.materials)) {
        await connection.query(`DELETE FROM planning_wbs_material WHERE planning_id = ?`, [id]);
        for (const m of data.materials) {
          if (m.planning_wbs_id && m.material_name) {
            await connection.query(
              `INSERT INTO planning_wbs_material (
                 planning_id, planning_wbs_id, material_id, material_name,
                 quantity, unit, rate, amount, start_date, end_date, notes
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id, m.planning_wbs_id, m.material_id || null, m.material_name,
                m.quantity || 0, m.unit || 'Nos', m.rate || 0, m.amount || (Number(m.quantity || 0) * Number(m.rate || 0)),
                m.start_date || null, m.end_date || null, m.notes || null
              ]
            );
          }
        }
      }

      // 7. Sync Terms & Conditions Snapshots
      const termsToSave = data.terms_snapshots || data.terms;
      if (termsToSave && Array.isArray(termsToSave)) {
        await connection.query(`DELETE FROM planning_terms_snapshots WHERE planning_id = ?`, [id]);
        for (let i = 0; i < termsToSave.length; i++) {
          const t = termsToSave[i];
          await connection.query(
            `INSERT INTO planning_terms_snapshots (
               planning_id, template_id, template_name, title, description, is_mandatory, sort_order, status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, t.template_id || null, t.template_name || null, t.title, t.description,
              t.is_mandatory ? 1 : 0, t.sort_order ?? i, t.status || 'active'
            ]
          );
        }
      }

      // 8. Run schedule recalculation to roll up dates and costs
      await ScheduleService.calculatePlanningSchedule(id, connection);

      // Record revision if reason provided
      if (data.revision_reason) {
        const nextVersion = Number(currentPlan.version || 1) + 1;
        await connection.query(`UPDATE planning SET version = ? WHERE id = ?`, [nextVersion, id]);
        await connection.query(
          `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, nextVersion, data.revision_reason, data.change_summary || data.revision_reason, JSON.stringify(data), userId || null]
        );
      }

      await connection.commit();

      if (userId) {
        await AuditService.log({
          user_id: userId,
          action: 'SAVE_PLANNING_DRAFT',
          module: 'planning',
          description: `Saved planning draft ID ${id}`,
          record_id: id,
          ip_address: ipAddress || '127.0.0.1',
        });
      }

      return this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Validates planning completeness and integrity
   */
  static async validatePlanning(id: number) {
    const planning = await this.getById(id);
    if (!planning) throw new Error(`Planning with ID ${id} not found`);

    const errors: Array<{ field: string; message: string; tab: string; id?: number }> = [];
    const warnings: string[] = [];

    // Header validations
    if (!planning.start_date) {
      errors.push({ field: 'start_date', message: 'Planning start date is required', tab: 'Overview' });
    }
    if (!planning.end_date) {
      errors.push({ field: 'end_date', message: 'Planning end date is required', tab: 'Overview' });
    }
    if (planning.start_date && planning.end_date && planning.start_date > planning.end_date) {
      errors.push({ field: 'end_date', message: 'Planning start date must be before or equal to end date', tab: 'Overview' });
    }

    // WBS validations
    if (!planning.wbs || planning.wbs.length === 0) {
      errors.push({ field: 'wbs', message: 'At least one Work Breakdown Structure (WBS) item is required', tab: 'WBS Planning' });
    } else {
      planning.wbs.forEach((w: any) => {
        if (!w.wbs_name || !w.wbs_name.trim()) {
          errors.push({ field: 'wbs_name', message: `WBS ID ${w.id} has an empty name`, tab: 'WBS Planning', id: w.id });
        }
        if (!w.start_date) {
          errors.push({ field: 'start_date', message: `WBS "${w.wbs_name}" is missing start date`, tab: 'WBS Planning', id: w.id });
        }
        if (!w.end_date) {
          errors.push({ field: 'end_date', message: `WBS "${w.wbs_name}" is missing end date`, tab: 'WBS Planning', id: w.id });
        }
        if (w.start_date && w.end_date && w.start_date > w.end_date) {
          errors.push({ field: 'dates', message: `WBS "${w.wbs_name}" start date is after end date`, tab: 'WBS Planning', id: w.id });
        }
      });
    }

    // Tasks validations
    if (planning.tasks && planning.tasks.length > 0) {
      planning.tasks.forEach((t: any) => {
        if (!t.task_name || !t.task_name.trim()) {
          errors.push({ field: 'task_name', message: `Task ID ${t.id} has an empty name`, tab: 'Task Planning', id: t.id });
        }
        if (!t.start_date) {
          errors.push({ field: 'start_date', message: `Task "${t.task_name}" is missing start date`, tab: 'Task Planning', id: t.id });
        }
        if (!t.end_date) {
          errors.push({ field: 'end_date', message: `Task "${t.task_name}" is missing end date`, tab: 'Task Planning', id: t.id });
        }
        if (t.start_date && t.end_date && t.start_date > t.end_date) {
          errors.push({ field: 'dates', message: `Task "${t.task_name}" start date is after end date`, tab: 'Task Planning', id: t.id });
        }
      });
    }

    // Mandatory Terms & Conditions Check
    if (planning.terms_snapshots && planning.terms_snapshots.length > 0) {
      const mandatoryTerms = planning.terms_snapshots.filter((t: any) => t.is_mandatory);
      mandatoryTerms.forEach((term: any) => {
        if (!term.description || !term.description.trim()) {
          errors.push({ field: 'terms', message: `Mandatory Term "${term.title}" description is empty`, tab: 'Terms & Conditions' });
        }
      });
    }

    // Check if quotation changes are unreviewed
    if (planning.quotation_changes && planning.quotation_changes.has_changes) {
      warnings.push(`Quotation has ${planning.quotation_changes.diffs.length} changed items compared to initial plan.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Submits planning for review
   */
  static async submitPlanning(id: number, userId?: number, ipAddress?: string) {
    const validation = await this.validatePlanning(id);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map(e => `${e.tab}: ${e.message}`).join('; ');
      throw new Error(`Cannot submit planning due to validation errors: ${errorMsg}`);
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE planning SET status = 'in_review', submitted_by = ?, submitted_at = NOW() WHERE id = ?`,
        [userId || null, id]
      );

      const [pRows]: any = await connection.query(`SELECT * FROM planning WHERE id = ?`, [id]);
      const currentPlan = pRows[0];
      const nextVersion = Number(currentPlan.version || 1) + 1;

      await connection.query(`UPDATE planning SET version = ? WHERE id = ?`, [nextVersion, id]);

      await connection.query(
        `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
         VALUES (?, ?, 'Submitted for Review', 'Plan submitted by planner for management approval', ?, ?)`,
        [id, nextVersion, JSON.stringify(currentPlan), userId || null]
      );

      await connection.commit();

      if (userId) {
        await AuditService.log({
          user_id: userId,
          action: 'SUBMIT_PLANNING',
          module: 'planning',
          description: `Submitted planning ID ${id} for review`,
          record_id: id,
          ip_address: ipAddress || '127.0.0.1',
        });
      }

      return this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Approves planning and creates new project or updates existing project
   */
  static async approvePlanning(id: number, userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [pRows]: any = await connection.query(`SELECT * FROM planning WHERE id = ?`, [id]);
      if (pRows.length === 0) throw new Error('Planning record not found');
      const planning = pRows[0];

      if (planning.status === 'approved') {
        throw new Error('Planning is already approved');
      }

      // 1. Mark planning as approved
      await connection.query(
        `UPDATE planning SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
        [userId || null, id]
      );

      const nextVersion = Number(planning.version || 1) + 1;
      await connection.query(`UPDATE planning SET version = ? WHERE id = ?`, [nextVersion, id]);
      await connection.query(
        `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
         VALUES (?, ?, 'Plan Approved', 'Planning approved and project updated / created', ?, ?)`,
        [id, nextVersion, JSON.stringify(planning), userId || null]
      );

      // 2. Fetch Quotation
      const [qRows]: any = await connection.query(`SELECT * FROM quotations WHERE quotation_id = ?`, [planning.quotation_id]);
      const quotation = qRows[0];

      let projectId = quotation?.project_id || planning.project_id;
      let projectAction: 'created' | 'updated' = 'updated';

      // 3. Determine if Project already exists
      if (projectId) {
        // Verify it actually exists in the DB (in case of manual deletion/orphans)
        const [checkProj]: any = await connection.query(
          `SELECT project_id FROM projects WHERE project_id = ? AND is_deleted = 0`,
          [projectId]
        );
        if (checkProj.length === 0) {
          projectId = null;
        }
      }

      if (!projectId) {
        const [existingProj]: any = await connection.query(
          `SELECT project_id FROM projects WHERE source_quotation_id = ? AND is_deleted = 0 LIMIT 1`,
          [quotation?.quotation_id || planning.quotation_id]
        );

        if (existingProj.length > 0) {
          projectId = existingProj[0].project_id;
        }
      }

      if (!projectId) {
        // --- CASE 1: NEW PROJECT AUTO-CREATION ---
        projectAction = 'created';
        const projectCode = `PRJ-${quotation?.quotation_code || planning.id}`;
        const [custRows]: any = await connection.query(`SELECT customer_name FROM customers WHERE customer_id = ?`, [quotation?.customer_id || planning.customer_id]);
        const custName = custRows[0]?.customer_name || 'Client';
        const projectName = planning.new_project_name || quotation?.new_project_name || `${custName} Project`;

        const [newProjRes]: any = await connection.query(
          `INSERT INTO projects (
             project_code, project_name, customer_id, project_type_id, start_date, end_date,
             budget_amount, status, source_quotation_id, planning_id, planning_required,
             currency_id, exchange_rate, terms_conditions, quotation_reference, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 0, ?, ?, ?, ?, NOW())`,
          [
            projectCode,
            projectName,
            quotation?.customer_id || planning.customer_id,
            planning.project_type_id || quotation?.project_type_id || null,
            planning.start_date || quotation?.start_date || null,
            planning.end_date || quotation?.end_date || null,
            planning.total_budget || quotation?.total_amount || 0,
            quotation?.quotation_id || planning.quotation_id || null,
            id,
            quotation?.currency_id || null,
            quotation?.exchange_rate || 1.000000,
            planning.terms_conditions || quotation?.terms_conditions || null,
            quotation?.quotation_code || null,
          ]
        );
        projectId = newProjRes.insertId;

        // Update links
        if (quotation) {
          await connection.query(`UPDATE quotations SET project_id = ? WHERE quotation_id = ?`, [projectId, quotation.quotation_id]);
        }
        await connection.query(`UPDATE planning SET project_id = ? WHERE id = ?`, [projectId, id]);
      } else {
        // --- CASE 2: EXISTING PROJECT UPDATE (Smart Sync) ---
        projectAction = 'updated';
        await connection.query(
          `UPDATE projects SET 
             start_date = COALESCE(?, start_date),
             end_date = COALESCE(?, end_date),
             budget_amount = ?,
             project_type_id = COALESCE(?, project_type_id),
             planning_id = ?,
             terms_conditions = COALESCE(?, terms_conditions)
           WHERE project_id = ?`,
          [
            planning.start_date,
            planning.end_date,
            planning.total_budget,
            planning.project_type_id,
            id,
            planning.terms_conditions,
            projectId
          ]
        );
        await connection.query(`UPDATE planning SET project_id = ? WHERE id = ?`, [projectId, id]);
      }

      // 4. Smart Sync Project WBS
      const [pWbsRows]: any = await connection.query(`SELECT * FROM planning_wbs WHERE planning_id = ?`, [id]);
      const wbsMapping = new Map<number, number>(); // planning_wbs.id -> project_wbs.id

      for (const pw of pWbsRows) {
        // Look up Master WBS by name or verify existing
        let wbsMasterId = pw.wbs_id;
        
        if (wbsMasterId) {
          const [checkMaster]: any = await connection.query(
            `SELECT id FROM work_breakdown_structures WHERE id = ?`,
            [wbsMasterId]
          );
          if (checkMaster.length === 0) {
            wbsMasterId = null; // Invalid ID passed (perhaps from template detail mismatch earlier)
          }
        }

        if (!wbsMasterId) {
          const [masterRows]: any = await connection.query(
            `SELECT id FROM work_breakdown_structures WHERE LOWER(wbs_name) = LOWER(?) LIMIT 1`,
            [pw.wbs_name]
          );
          if (masterRows.length > 0) {
            wbsMasterId = masterRows[0].id;
          } else {
            const prefix = pw.wbs_type === 'material' ? 'MAT-WBS' : (pw.wbs_type === 'both' ? 'COM-WBS' : 'LAB-WBS');
            const [newMaster]: any = await connection.query(
              `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, description, status) VALUES (?, ?, ?, 1)`,
              [`${prefix}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`, pw.wbs_name, pw.description || null]
            );
            wbsMasterId = newMaster.insertId;
          }
        }

        // Check if project_wbs already exists for this project
        const [existingPw]: any = await connection.query(
          `SELECT id FROM project_wbs 
           WHERE project_id = ? 
             AND (wbs_id = ? OR quotation_discipline_id = ? OR LOWER(wbs_name) = LOWER(?)) 
             AND deleted_at IS NULL LIMIT 1`,
          [projectId, wbsMasterId, pw.quotation_discipline_id, pw.wbs_name]
        );

        let projectWbsId: number;
        if (existingPw.length > 0) {
          projectWbsId = existingPw[0].id;
          await connection.query(
            `UPDATE project_wbs SET 
               wbs_code = COALESCE(?, wbs_code),
               wbs_name = ?,
               wbs_type = ?,
               unit = ?,
               planned_quantity = ?,
               rate = ?,
               budget_amount = ?,
               total_hours = ?,
               planned_labour_cost = ?,
               planned_material_cost = ?,
               planned_other_cost = ?,
               start_date = COALESCE(?, start_date),
               end_date = COALESCE(?, end_date)
             WHERE id = ?`,
            [
              pw.wbs_code, pw.wbs_name, pw.wbs_type, pw.unit,
              pw.planned_quantity, pw.rate, pw.budget_amount, pw.planned_hours,
              pw.planned_labour_cost, pw.planned_material_cost, pw.planned_other_cost,
              pw.start_date, pw.end_date,
              projectWbsId
            ]
          );
        } else {
          const [newPwRes]: any = await connection.query(
            `INSERT INTO project_wbs (
               project_id, wbs_id, wbs_code, wbs_name, wbs_type, unit,
               planned_quantity, rate, budget_amount, total_hours,
               planned_labour_cost, planned_material_cost, planned_other_cost,
               quotation_discipline_id, start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              projectId, wbsMasterId, pw.wbs_code, pw.wbs_name, pw.wbs_type, pw.unit,
              pw.planned_quantity, pw.rate, pw.budget_amount, pw.planned_hours,
              pw.planned_labour_cost, pw.planned_material_cost, pw.planned_other_cost,
              pw.quotation_discipline_id, pw.start_date, pw.end_date
            ]
          );
          projectWbsId = newPwRes.insertId;
        }

        wbsMapping.set(pw.id, projectWbsId);
      }

      // 5. Smart Sync Project Tasks
      const [pTasksRows]: any = await connection.query(
        `SELECT pt.*, pw.id AS plan_wbs_id 
         FROM planning_tasks pt
         JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
         WHERE pw.planning_id = ?`,
        [id]
      );

      const taskMapping = new Map<number, number>(); // planning_tasks.id -> tasks.task_id

      for (const pt of pTasksRows) {
        const targetProjWbsId = wbsMapping.get(pt.plan_wbs_id) || null;

        // Check if task already exists
        const [existingTasks]: any = await connection.query(
          `SELECT task_id FROM tasks 
           WHERE project_id = ? 
             AND (planning_task_id = ? OR (wbs_id = ? AND LOWER(task_name) = LOWER(?)))
             AND is_deleted = 0 LIMIT 1`,
          [projectId, pt.id, targetProjWbsId, pt.task_name]
        );

        let finalTaskId: number;
        if (existingTasks.length > 0) {
          finalTaskId = existingTasks[0].task_id;
          await connection.query(
            `UPDATE tasks SET 
               wbs_id = COALESCE(?, wbs_id),
               task_name = ?,
               description = ?,
               start_date = COALESCE(?, start_date),
               target_date = COALESCE(?, target_date),
               estimated_hours = ?,
               priority = ?,
               planned_labour_cost = ?,
               planned_material_cost = ?,
               planned_other_cost = ?,
               planning_task_id = ?
             WHERE task_id = ?`,
            [
              targetProjWbsId, pt.task_name, pt.description,
              pt.start_date, pt.end_date, pt.planned_hours,
              pt.priority || 'medium',
              pt.planned_labour_cost, pt.planned_material_cost, pt.planned_other_cost,
              pt.id,
              finalTaskId
            ]
          );
        } else {
          const [newTaskRes]: any = await connection.query(
            `INSERT INTO tasks (
               project_id, wbs_id, task_name, description, start_date, target_date,
               estimated_hours, priority, planned_labour_cost, planned_material_cost,
               planned_other_cost, planning_task_id, status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
              projectId, targetProjWbsId, pt.task_name, pt.description,
              pt.start_date, pt.end_date, pt.planned_hours,
              pt.priority || 'medium',
              pt.planned_labour_cost, pt.planned_material_cost, pt.planned_other_cost,
              pt.id
            ]
          );
          finalTaskId = newTaskRes.insertId;
        }

        taskMapping.set(pt.id, finalTaskId);
      }

      // 6. Smart Sync Task Dependencies
      const [pDepsRows]: any = await connection.query(
        `SELECT ptd.* FROM planning_task_dependencies ptd
         JOIN planning_tasks pt ON ptd.task_id = pt.id
         JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
         WHERE pw.planning_id = ?`,
        [id]
      );

      for (const pdep of pDepsRows) {
        const mappedTaskId = taskMapping.get(pdep.task_id);
        const mappedPredId = taskMapping.get(pdep.predecessor_task_id);
        if (mappedTaskId && mappedPredId) {
          await connection.query(
            `INSERT IGNORE INTO task_dependencies (task_id, predecessor_task_id, dependency_type, lag_days)
             VALUES (?, ?, ?, ?)`,
            [mappedTaskId, mappedPredId, pdep.dependency_type || 'FS', pdep.lag_days || 0]
          );
        }
      }

      // 7. Smart Sync Project Materials
      const [pMatRows]: any = await connection.query(
        `SELECT pm.* FROM planning_wbs_material pm
         JOIN planning_wbs pw ON pm.planning_wbs_id = pw.id
         WHERE pw.planning_id = ?`,
        [id]
      );

      for (const pmat of pMatRows) {
        const targetProjWbsId = wbsMapping.get(pmat.planning_wbs_id) || null;
        const [existingProjMat]: any = await connection.query(
          `SELECT id FROM project_materials 
           WHERE project_id = ? AND wbs_id = ? AND LOWER(material_name) = LOWER(?) LIMIT 1`,
          [projectId, targetProjWbsId, pmat.material_name]
        );

        const qty = Number(pmat.quantity || 0);
        const rate = Number(pmat.rate || 0);
        const amount = Number(pmat.amount || (qty * rate));

        if (existingProjMat.length > 0) {
          await connection.query(
            `UPDATE project_materials SET 
               unit = ?, planned_quantity = ?, unit_rate = ?, planned_cost = ?
             WHERE id = ?`,
            [pmat.unit || 'Nos', qty, rate, amount, existingProjMat[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO project_materials (
               project_id, wbs_id, material_name, unit, planned_quantity, unit_rate,
               received_quantity, used_quantity, remaining_quantity, extra_quantity,
               planned_cost, actual_cost, remaining_cost, notes
             ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 0, ?, 0, ?, 'Initialized from Planning')`,
            [projectId, targetProjWbsId, pmat.material_name, pmat.unit || 'Nos', qty, rate, qty, amount, amount]
          );
        }
      }

      // 8. Copy Taxes & Terms to Project
      const [pTaxes]: any = await connection.query(`SELECT * FROM planning_taxes WHERE planning_id = ?`, [id]);
      for (const pt of pTaxes) {
        await connection.query(
          `INSERT IGNORE INTO project_taxes (project_id, tax_id, tax_name, tax_code, tax_type, tax_percentage, taxable_amount, tax_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [projectId, pt.tax_id, pt.tax_name, pt.tax_code, pt.tax_type, pt.tax_percentage, pt.taxable_amount, pt.tax_amount]
        );
      }

      const [pTemplates]: any = await connection.query(`SELECT * FROM planning_terms_templates WHERE planning_id = ?`, [id]);
      for (const pt of pTemplates) {
        await connection.query(
          `INSERT IGNORE INTO project_terms_templates (project_id, template_id, template_name, sort_order)
           VALUES (?, ?, ?, ?)`,
          [projectId, pt.template_id, pt.template_name, pt.sort_order]
        );
      }

      const [pTerms]: any = await connection.query(`SELECT * FROM planning_terms_snapshots WHERE planning_id = ?`, [id]);
      for (const term of pTerms) {
        await connection.query(
          `INSERT IGNORE INTO project_terms_snapshots (project_id, template_id, template_name, title, description, is_mandatory, sort_order, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [projectId, term.template_id, term.template_name, term.title, term.description, term.is_mandatory, term.sort_order, term.status]
        );
      }

      await connection.commit();

      if (userId) {
        await AuditService.log({
          user_id: userId,
          action: 'APPROVE_PLANNING',
          module: 'planning',
          description: `Approved planning ID ${id} and ${projectAction} project ID ${projectId}`,
          record_id: id,
          ip_address: ipAddress || '127.0.0.1',
        });
      }

      return {
        project_id: projectId,
        action: projectAction,
        planning_id: id,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Rejects planning with reason
   */
  static async rejectPlanning(id: number, reason: string, userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE planning SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
        [reason, id]
      );

      const [pRows]: any = await connection.query(`SELECT * FROM planning WHERE id = ?`, [id]);
      const currentPlan = pRows[0];
      const nextVersion = Number(currentPlan.version || 1) + 1;

      await connection.query(`UPDATE planning SET version = ? WHERE id = ?`, [nextVersion, id]);
      await connection.query(
        `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
         VALUES (?, ?, 'Plan Rejected', ?, ?, ?)`,
        [id, nextVersion, `Rejected with reason: ${reason}`, JSON.stringify(currentPlan), userId || null]
      );

      await connection.commit();

      if (userId) {
        await AuditService.log({
          user_id: userId,
          action: 'REJECT_PLANNING',
          module: 'planning',
          description: `Rejected planning ID ${id}: ${reason}`,
          record_id: id,
          ip_address: ipAddress || '127.0.0.1',
        });
      }

      return this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Applies latest Quotation changes into Planning
   */
  static async applyQuotationChanges(planningId: number, userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [pRows]: any = await connection.query(`SELECT * FROM planning WHERE id = ?`, [planningId]);
      if (pRows.length === 0) throw new Error('Planning not found');
      const planning = pRows[0];

      const quotationId = planning.quotation_id;
      const [qRows]: any = await connection.query(`SELECT * FROM quotations WHERE quotation_id = ?`, [quotationId]);
      const quotation = qRows[0];

      // Update Header
      await connection.query(
        `UPDATE planning SET 
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           total_budget = ?,
           total_tax_amount = ?
         WHERE id = ?`,
        [quotation.start_date, quotation.end_date, quotation.total_amount, quotation.tax_amount, planningId]
      );

      // Sync WBS
      const [qDisciplines]: any = await connection.query(
        `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active'`,
        [quotationId]
      );
      const [pWbs]: any = await connection.query(
        `SELECT * FROM planning_wbs WHERE planning_id = ?`,
        [planningId]
      );

      for (let i = 0; i < qDisciplines.length; i++) {
        const qd = qDisciplines[i];
        const match = pWbs.find((pw: any) => pw.quotation_discipline_id === qd.id || pw.wbs_name.toLowerCase() === qd.discipline_name.toLowerCase());
        const wbsType = qd.wbs_type === 'material' ? 'material' : (qd.wbs_type === 'both' ? 'both' : 'labour');
        const defaultUnit = wbsType === 'material' ? 'Nos' : 'hours';

        if (match) {
          await connection.query(
            `UPDATE planning_wbs SET 
               wbs_name = ?, unit = ?, planned_quantity = ?, rate = ?, budget_amount = ?,
               planned_hours = ?, planned_labour_cost = ?, planned_material_cost = ?
             WHERE id = ?`,
            [
              qd.discipline_name, qd.unit || defaultUnit, qd.quantity || 1, qd.rate || 0, qd.amount || 0,
              qd.labour_hours || (wbsType === 'labour' ? qd.quantity : 0),
              qd.labour_cost || (wbsType === 'labour' ? qd.amount : 0),
              qd.material_cost || (wbsType === 'material' ? qd.amount : 0),
              match.id
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO planning_wbs (
               planning_id, quotation_discipline_id, wbs_id, wbs_name, wbs_code, wbs_type,
               sort_order, unit, planned_quantity, rate, budget_amount, planned_hours,
               planned_labour_cost, planned_material_cost, start_date, end_date, duration
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5)`,
            [
              planningId, qd.id, qd.wbs_id || null, qd.discipline_name,
              qd.wbs_code || `WBS-${(i + 1).toString().padStart(2, '0')}`, wbsType,
              i, qd.unit || defaultUnit, qd.quantity || 1, qd.rate || 0, qd.amount || 0,
              qd.labour_hours || (wbsType === 'labour' ? qd.quantity : 0),
              qd.labour_cost || (wbsType === 'labour' ? qd.amount : 0),
              qd.material_cost || (wbsType === 'material' ? qd.amount : 0),
              qd.start_date || quotation.start_date || null,
              qd.end_date || quotation.end_date || null
            ]
          );
        }
      }

      // Run schedule recalculation
      await ScheduleService.calculatePlanningSchedule(planningId, connection);

      const nextVersion = Number(planning.version || 1) + 1;
      await connection.query(`UPDATE planning SET version = ? WHERE id = ?`, [nextVersion, planningId]);
      await connection.query(
        `INSERT INTO planning_revisions (planning_id, version, reason, change_summary, snapshot_data, created_by)
         VALUES (?, ?, 'Applied Quotation Changes', 'Synchronized latest quotation changes into planning', ?, ?)`,
        [planningId, nextVersion, JSON.stringify(quotation), userId || null]
      );

      await connection.commit();

      return this.getById(planningId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
