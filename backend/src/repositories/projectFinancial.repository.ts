import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/db';

export interface PortfolioExecutiveMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  delayed_projects: number;
  total_contract_value: number;
  total_budget_amount: number;
  total_actual_cost: number;
  total_remaining_budget: number;
  total_invoiced: number;
  total_cash_collected: number;
  total_receivables: number;
  total_vendor_liabilities: number;
  total_cash_outflows: number;
  net_cash_position: number;
  funding_shortfall: number;
  projects_requiring_attention: number;
  monthly_cashflow_trend: {
    month: string;
    inflows: number;
    outflows: number;
    net_cash: number;
  }[];
}

export class ProjectFinancialRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Central Executive Dashboard & Portfolio Overview
  // ─────────────────────────────────────────────────────────────────────────
  async getPortfolioExecutiveMetrics(managerId?: number): Promise<PortfolioExecutiveMetrics> {
    let prjWhere = '(p.is_deleted = 0 OR p.is_deleted IS NULL)';
    const prjParams: any[] = [];

    if (managerId) {
      prjWhere += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?)
        OR p.project_manager_id = ?
        OR p.project_id IN (
          SELECT t.project_id FROM tasks t 
          JOIN task_assignments ta ON t.task_id = ta.task_id 
          WHERE ta.employee_id = ?
        )
      )`;
      prjParams.push(managerId, managerId, managerId);
    }

    // Projects count & budget
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         COUNT(p.project_id) AS total_projects,
         SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_projects,
         SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed_projects,
         SUM(CASE WHEN (p.status = 'active' OR p.status = 'in-progress') AND p.end_date < CURRENT_DATE THEN 1 ELSE 0 END) AS delayed_projects,
         COALESCE(SUM(CASE WHEN COALESCE(p.approved_quotation_value, 0) > 0 THEN p.approved_quotation_value ELSE COALESCE(p.budget_amount, 0) END), 0) AS total_contract_value,
         COALESCE(SUM(COALESCE(p.budget_amount, 0)), 0) AS total_budget_amount
       FROM projects p
       WHERE ${prjWhere}`,
      prjParams
    );

    // Labour cost incurred
    const [labourRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(lw.amount), 0) AS total_labour_cost
       FROM labour_work_logs lw
       JOIN projects p ON lw.project_id = p.project_id
       WHERE (lw.is_deleted = 0 OR lw.is_deleted IS NULL) AND ${prjWhere}`,
      prjParams
    );

    // Material cost incurred from task_used_materials
    const [materialRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(tum.amount), 0) AS total_material_cost
       FROM task_used_materials tum
       JOIN projects p ON tum.project_id = p.project_id
       WHERE ${prjWhere}`,
      prjParams
    );

    // Equipment cost incurred from equipment_usage_logs
    const [equipRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(eul.total_cost), 0) AS total_equipment_cost
       FROM equipment_usage_logs eul
       JOIN projects p ON eul.project_id = p.project_id
       WHERE ${prjWhere}`,
      prjParams
    );

    // Vendor Invoices (Contractor & Supplier bills)
    const [vendorInvRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(vi.payable_amount), 0) AS total_vendor_payable,
         COALESCE(SUM(vi.paid_amount), 0) AS total_vendor_paid,
         COALESCE(SUM(vi.balance_amount), 0) AS total_vendor_balance
       FROM vendor_invoices vi
       JOIN projects p ON vi.project_id = p.project_id
       WHERE ${prjWhere}`,
      prjParams
    );

    // Customer Invoiced & Verified Collections
    const [invRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(i.total_amount), 0) AS total_invoiced,
         COALESCE((
           SELECT SUM(ip.amount) 
           FROM invoice_payments ip 
           JOIN invoices inv ON ip.invoice_id = inv.invoice_id
           JOIN projects prj ON inv.project_id = prj.project_id
           WHERE ip.status = 'completed' AND ${prjWhere.replace(/p\./g, 'prj.')}
         ), 0) AS total_cash_collected
       FROM invoices i
       JOIN projects p ON i.project_id = p.project_id
       WHERE i.status != 'cancelled' AND ${prjWhere}`,
      prjParams.concat(prjParams)
    );

    // Labour paid cash outflows
    const [labourPaidRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(lp.total_amount), 0) AS total_labour_paid
       FROM labour_payments lp
       JOIN projects p ON lp.project_id = p.project_id
       WHERE lp.status = 'paid' AND ${prjWhere}`,
      prjParams
    );

    const totalProjects = Number(pRows[0]?.total_projects || 0);
    const activeProjects = Number(pRows[0]?.active_projects || 0);
    const completedProjects = Number(pRows[0]?.completed_projects || 0);
    const delayedProjects = Number(pRows[0]?.delayed_projects || 0);
    const contractValue = Number(pRows[0]?.total_contract_value || 0);
    const budgetAmount = Number(pRows[0]?.total_budget_amount || 0);

    const labourCost = Number(labourRows[0]?.total_labour_cost || 0);
    const materialCost = Number(materialRows[0]?.total_material_cost || 0);
    const equipmentCost = Number(equipRows[0]?.total_equipment_cost || 0);
    const vendorPayable = Number(vendorInvRows[0]?.total_vendor_payable || 0);
    const vendorBalance = Number(vendorInvRows[0]?.total_vendor_balance || 0);
    const vendorPaid = Number(vendorInvRows[0]?.total_vendor_paid || 0);
    const labourPaid = Number(labourPaidRows[0]?.total_labour_paid || 0);

    // Actual recognized cost = Labour + Materials + Equipment + Vendor bills
    const totalActualCost = labourCost + materialCost + equipmentCost + vendorPayable;
    const remainingBudget = budgetAmount - totalActualCost;

    const totalInvoiced = Number(invRows[0]?.total_invoiced || 0);
    const cashCollected = Number(invRows[0]?.total_cash_collected || 0);
    const receivables = Math.max(0, totalInvoiced - cashCollected);

    // Cash outflows = Verified Payments to Vendors + Verified Payments to Labours
    const totalCashOutflows = vendorPaid + labourPaid;
    const netCashPosition = cashCollected - totalCashOutflows;
    const fundingShortfall = netCashPosition < 0 ? Math.abs(netCashPosition) : 0;

    // Supplier & Contractor liabilities = Unpaid Vendor Invoices + Unpaid Labour logs
    const unpaidLabourAmount = Math.max(0, labourCost - labourPaid);
    const vendorLiabilities = vendorBalance + unpaidLabourAmount;

    // Count projects requiring attention: budget exceeded OR delayed OR cash negative
    const [attentionRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT p.project_id) AS attention_count
       FROM projects p
       LEFT JOIN (
         SELECT project_id, SUM(amount) AS l_cost FROM labour_work_logs WHERE (is_deleted = 0 OR is_deleted IS NULL) GROUP BY project_id
       ) lc ON p.project_id = lc.project_id
       LEFT JOIN (
         SELECT project_id, SUM(amount) AS m_cost FROM task_used_materials GROUP BY project_id
       ) mc ON p.project_id = mc.project_id
       WHERE ${prjWhere} AND (
         ((p.status = 'active' OR p.status = 'in-progress') AND p.end_date < CURRENT_DATE)
         OR (COALESCE(lc.l_cost, 0) + COALESCE(mc.m_cost, 0)) > COALESCE(p.budget_amount, 0)
       )`,
      prjParams
    );

    // 6-Month Inflow vs Outflow trend
    const [trendRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         DATE_FORMAT(m.dt, '%b %Y') AS month_label,
         DATE_FORMAT(m.dt, '%Y-%m') AS month_sort,
         COALESCE((
           SELECT SUM(ip.amount) 
           FROM invoice_payments ip 
           WHERE ip.status = 'completed' AND DATE_FORMAT(ip.payment_date, '%Y-%m') = DATE_FORMAT(m.dt, '%Y-%m')
         ), 0) AS inflows,
         COALESCE((
           SELECT SUM(vp.amount) 
           FROM vendor_payments vp 
           WHERE DATE_FORMAT(vp.payment_date, '%Y-%m') = DATE_FORMAT(m.dt, '%Y-%m')
         ), 0) +
         COALESCE((
           SELECT SUM(lp.total_amount) 
           FROM labour_payments lp 
           WHERE lp.status = 'paid' AND DATE_FORMAT(lp.payment_date, '%Y-%m') = DATE_FORMAT(m.dt, '%Y-%m')
         ), 0) AS outflows
       FROM (
         SELECT CURRENT_DATE - INTERVAL 5 MONTH AS dt UNION ALL
         SELECT CURRENT_DATE - INTERVAL 4 MONTH UNION ALL
         SELECT CURRENT_DATE - INTERVAL 3 MONTH UNION ALL
         SELECT CURRENT_DATE - INTERVAL 2 MONTH UNION ALL
         SELECT CURRENT_DATE - INTERVAL 1 MONTH UNION ALL
         SELECT CURRENT_DATE
       ) m
       ORDER BY month_sort ASC`
    );

    const monthlyTrend = trendRows.map(r => ({
      month: r.month_label,
      inflows: Number(r.inflows || 0),
      outflows: Number(r.outflows || 0),
      net_cash: Number(r.inflows || 0) - Number(r.outflows || 0),
    }));

    return {
      total_projects: totalProjects,
      active_projects: activeProjects,
      completed_projects: completedProjects,
      delayed_projects: delayedProjects,
      total_contract_value: contractValue,
      total_budget_amount: budgetAmount,
      total_actual_cost: totalActualCost,
      total_remaining_budget: remainingBudget,
      total_invoiced: totalInvoiced,
      total_cash_collected: cashCollected,
      total_receivables: receivables,
      total_vendor_liabilities: vendorLiabilities,
      total_cash_outflows: totalCashOutflows,
      net_cash_position: netCashPosition,
      funding_shortfall: fundingShortfall,
      projects_requiring_attention: Number(attentionRows[0]?.attention_count || 0),
      monthly_cashflow_trend: monthlyTrend,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Project Portfolio Summary Table (Central Dashboard & Progress Hub)
  // ─────────────────────────────────────────────────────────────────────────
  async getProjectPortfolioList(filters?: { manager_id?: number; customer_id?: number; status?: string; search?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        p.project_id,
        p.project_code,
        p.project_name,
        p.status AS project_status,
        p.start_date,
        p.end_date,
        COALESCE(p.approved_quotation_value, p.budget_amount, 0) AS approved_contract_value,
        COALESCE(p.budget_amount, 0) AS approved_budget,
        COALESCE(c.customer_name, p.client_name, 'Direct Client') AS customer_name,
        COALESCE(c.customer_code, p.client_code, '') AS customer_code,
        COALESCE(pm.name, 'Unassigned') AS project_manager_name,
        -- Weighted Progress from Project WBS or Tasks
        COALESCE((
          SELECT AVG(CASE 
            WHEN pw.status = 'Completed' OR pw.progress_percent >= 100 THEN 100
            ELSE COALESCE(pw.progress_percent, 0)
          END)
          FROM project_wbs pw 
          WHERE pw.project_id = p.project_id AND pw.deleted_at IS NULL
        ), (
          SELECT AVG(CASE 
            WHEN t.status = 'completed' THEN 100 
            WHEN t.status = 'in-progress' THEN 50 
            ELSE 0 
          END)
          FROM tasks t
          WHERE t.project_id = p.project_id AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
        ), 0) AS overall_progress_pct,
        -- Labour Cost
        COALESCE((
          SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)
        ), 0) AS labour_cost,
        -- Material Cost
        COALESCE((
          SELECT SUM(amount) FROM task_used_materials WHERE project_id = p.project_id
        ), 0) AS material_cost,
        -- Equipment Cost
        COALESCE((
          SELECT SUM(total_cost) FROM equipment_usage_logs WHERE project_id = p.project_id
        ), 0) AS equipment_cost,
        -- Vendor Invoices (Contractor bills)
        COALESCE((
          SELECT SUM(payable_amount) FROM vendor_invoices WHERE project_id = p.project_id
        ), 0) AS vendor_cost,
        -- Total Invoiced
        COALESCE((
          SELECT SUM(total_amount) FROM invoices WHERE project_id = p.project_id AND status != 'cancelled'
        ), 0) AS total_invoiced,
        -- Total Cash Collected
        COALESCE((
          SELECT SUM(ip.amount) FROM invoice_payments ip 
          JOIN invoices inv ON ip.invoice_id = inv.invoice_id 
          WHERE inv.project_id = p.project_id AND ip.status = 'completed'
        ), 0) AS total_collected
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      LEFT JOIN employees pm ON p.project_manager_id = pm.employee_id
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;

    const params: any[] = [];

    if (filters?.manager_id) {
      sql += ` AND (
        p.project_id IN (SELECT project_id FROM manager_projects WHERE manager_id = ?)
        OR p.project_manager_id = ?
      )`;
      params.push(filters.manager_id, filters.manager_id);
    }
    if (filters?.customer_id) {
      sql += ` AND p.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters?.status) {
      sql += ` AND p.status = ?`;
      params.push(filters.status);
    }
    if (filters?.search) {
      sql += ` AND (p.project_name LIKE ? OR p.project_code LIKE ? OR c.customer_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY p.project_id DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const budget = Number(r.approved_budget || 0);
      const labour = Number(r.labour_cost || 0);
      const material = Number(r.material_cost || 0);
      const equipment = Number(r.equipment_cost || 0);
      const vendor = Number(r.vendor_cost || 0);
      const actualCost = labour + material + equipment + vendor;
      const remainingBudget = budget - actualCost;

      const invoiced = Number(r.total_invoiced || 0);
      const collected = Number(r.total_collected || 0);
      const receivables = Math.max(0, invoiced - collected);
      const progress = Math.min(100, Math.round(Number(r.overall_progress_pct || 0)));

      // Health status calculation
      const today = new Date().toISOString().split('T')[0];
      const endDate = r.end_date ? String(r.end_date).split('T')[0] : '';
      let healthStatus = 'On Track';

      if (r.project_status === 'completed' || progress >= 100) {
        healthStatus = 'Completed';
      } else if (actualCost > budget && budget > 0) {
        healthStatus = 'At Risk';
      } else if (endDate && endDate < today && progress < 100) {
        healthStatus = 'Delayed';
      } else if (r.project_status === 'pending' || r.project_status === 'draft') {
        healthStatus = 'Awaiting Approval';
      }

      return {
        project_id: r.project_id,
        project_code: r.project_code,
        project_name: r.project_name,
        customer_name: r.customer_name,
        customer_code: r.customer_code,
        project_manager: r.project_manager_name,
        start_date: r.start_date ? String(r.start_date).split('T')[0] : null,
        end_date: endDate || null,
        progress_percentage: progress,
        health_status: healthStatus,
        approved_contract_value: Number(r.approved_contract_value || 0),
        approved_budget: budget,
        labour_cost: labour,
        material_cost: material,
        equipment_cost: equipment,
        vendor_cost: vendor,
        actual_cost: actualCost,
        remaining_budget: remainingBudget,
        budget_utilization_pct: budget > 0 ? Math.min(100, Math.round((actualCost / budget) * 100)) : 0,
        total_invoiced: invoiced,
        customer_collections: collected,
        outstanding_receivables: receivables,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. WBS-Wise Budget vs Actual Report
  // ─────────────────────────────────────────────────────────────────────────
  async getWbsBudgetVsActual(projectId: number): Promise<any[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT 
         pw.id AS project_wbs_id,
         pw.wbs_id,
         COALESCE(pw.wbs_code, w.wbs_code, CONCAT('WBS-', pw.id)) AS wbs_code,
         COALESCE(pw.wbs_name, w.wbs_name, 'General Discipline') AS wbs_name,
         pw.wbs_type,
         pw.unit,
         pw.planned_quantity,
         pw.actual_quantity,
         pw.start_date,
         pw.end_date,
         pw.progress_percent,
         pw.status AS wbs_status,
         COALESCE(pw.budget_amount, pw.planned_labour_cost + pw.planned_material_cost, 0) AS budget_amount,
         -- Actual Labour Cost for this WBS
         COALESCE((
           SELECT SUM(lw.amount) 
           FROM labour_work_logs lw 
           WHERE lw.wbs_id = pw.id AND (lw.is_deleted = 0 OR lw.is_deleted IS NULL)
         ), 0) AS actual_labour_cost,
         -- Actual Material Cost for this WBS
         COALESCE((
           SELECT SUM(tum.amount) 
           FROM task_used_materials tum 
           WHERE tum.wbs_id = pw.id
         ), 0) AS actual_material_cost,
         -- Actual Equipment Cost for this WBS
         COALESCE((
           SELECT SUM(eul.total_cost) 
           FROM equipment_usage_logs eul 
           WHERE eul.project_wbs_id = pw.id
         ), 0) AS actual_equipment_cost,
         -- Contractor / Vendor Cost for this WBS
         COALESCE((
           SELECT SUM(vi.payable_amount) 
           FROM vendor_invoices vi 
           WHERE vi.wbs_id = pw.id
         ), 0) AS actual_contractor_cost
       FROM project_wbs pw
       LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
       WHERE pw.project_id = ? AND pw.deleted_at IS NULL
       ORDER BY pw.id ASC`,
      [projectId]
    );

    return rows.map((r: any) => {
      const budget = Number(r.budget_amount || 0);
      const labour = Number(r.actual_labour_cost || 0);
      const material = Number(r.actual_material_cost || 0);
      const equipment = Number(r.actual_equipment_cost || 0);
      const contractor = Number(r.actual_contractor_cost || 0);
      const totalActual = labour + material + equipment + contractor;
      const remaining = budget - totalActual;
      const variance = budget - totalActual;

      let status = 'Within Budget';
      if (totalActual > budget && budget > 0) {
        status = 'Over Budget';
      } else if (totalActual >= budget * 0.85 && budget > 0) {
        status = 'Near Limit';
      }

      return {
        project_wbs_id: r.project_wbs_id,
        wbs_code: r.wbs_code,
        wbs_name: r.wbs_name,
        wbs_type: r.wbs_type || 'General',
        unit: r.unit || 'Units',
        planned_quantity: Number(r.planned_quantity || 0),
        actual_quantity: Number(r.actual_quantity || 0),
        progress_percentage: Math.min(100, Number(r.progress_percent || 0)),
        start_date: r.start_date ? String(r.start_date).split('T')[0] : null,
        end_date: r.end_date ? String(r.end_date).split('T')[0] : null,
        budget_amount: budget,
        labour_cost: labour,
        material_cost: material,
        equipment_cost: equipment,
        contractor_cost: contractor,
        total_actual_cost: totalActual,
        remaining_budget: remaining,
        cost_variance: variance,
        forecast_final_cost: totalActual > budget ? totalActual : budget,
        status: status,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Customer Collections vs Project Spending
  // ─────────────────────────────────────────────────────────────────────────
  async getCustomerCollectionsVsSpending(projectId?: number, startDate?: string, endDate?: string): Promise<any> {
    let pWhere = '(1=1)';
    const pParams: any[] = [];
    if (projectId) {
      pWhere += ` AND project_id = ?`;
      pParams.push(projectId);
    }

    // Verified Customer Collections
    let collSql = `
      SELECT COALESCE(SUM(ip.amount), 0) AS total_collections
      FROM invoice_payments ip
      JOIN invoices i ON ip.invoice_id = i.invoice_id
      WHERE ip.status = 'completed' AND ${pWhere.replace(/project_id/g, 'i.project_id')}
    `;
    const collParams = [...pParams];
    if (startDate) { collSql += ` AND ip.payment_date >= ?`; collParams.push(startDate); }
    if (endDate) { collSql += ` AND ip.payment_date <= ?`; collParams.push(endDate); }
    const [collRows] = await dbPool.query<RowDataPacket[]>(collSql, collParams);

    // Verified Outflows (Vendor Payments + Labour Payments)
    let vpSql = `
      SELECT COALESCE(SUM(vp.amount), 0) AS vendor_paid
      FROM vendor_payments vp
      JOIN vendor_invoices vi ON vp.vendor_invoice_id = vi.vendor_invoice_id
      WHERE ${pWhere.replace(/project_id/g, 'vi.project_id')}
    `;
    const vpParams = [...pParams];
    if (startDate) { vpSql += ` AND vp.payment_date >= ?`; vpParams.push(startDate); }
    if (endDate) { vpSql += ` AND vp.payment_date <= ?`; vpParams.push(endDate); }
    const [vpRows] = await dbPool.query<RowDataPacket[]>(vpSql, vpParams);

    let lpSql = `
      SELECT COALESCE(SUM(lp.total_amount), 0) AS labour_paid
      FROM labour_payments lp
      WHERE lp.status = 'paid' AND ${pWhere.replace(/project_id/g, 'lp.project_id')}
    `;
    const lpParams = [...pParams];
    if (startDate) { lpSql += ` AND lp.payment_date >= ?`; lpParams.push(startDate); }
    if (endDate) { lpSql += ` AND lp.payment_date <= ?`; lpParams.push(endDate); }
    const [lpRows] = await dbPool.query<RowDataPacket[]>(lpSql, lpParams);

    // Unpaid Supplier & Contractor Invoices (Liabilities)
    const [unpaidVendorRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(balance_amount), 0) AS unpaid_vendor_amount
       FROM vendor_invoices
       WHERE ${pWhere}`,
      pParams
    );

    // Upcoming Purchase Order Commitments (Issued POs not yet billed)
    const [poCommitmentRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total_amount), 0) AS po_commitments
       FROM purchase_orders
       WHERE status IN ('issued', 'approved') AND ${pWhere}`,
      pParams
    );

    const collections = Number(collRows[0]?.total_collections || 0);
    const vendorPaid = Number(vpRows[0]?.vendor_paid || 0);
    const labourPaid = Number(lpRows[0]?.labour_paid || 0);
    const totalOutflows = vendorPaid + labourPaid;
    const netCashPosition = collections - totalOutflows;
    const fundingShortfall = netCashPosition < 0 ? Math.abs(netCashPosition) : 0;
    const unpaidInvoices = Number(unpaidVendorRows[0]?.unpaid_vendor_amount || 0);
    const upcomingCommitments = Number(poCommitmentRows[0]?.po_commitments || 0);

    return {
      verified_customer_collections: collections,
      actual_cash_outflows: totalOutflows,
      vendor_payments_disbursed: vendorPaid,
      labour_payments_disbursed: labourPaid,
      unpaid_supplier_invoices: unpaidInvoices,
      upcoming_payment_commitments: upcomingCommitments,
      net_project_cash_position: netCashPosition,
      funding_shortfall: fundingShortfall,
      funding_surplus: netCashPosition > 0 ? netCashPosition : 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Customer-Wise Financial Report
  // ─────────────────────────────────────────────────────────────────────────
  async getCustomerWiseFinancials(customerId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        c.customer_id,
        c.customer_code,
        c.customer_name,
        p.project_id,
        p.project_code,
        p.project_name,
        COALESCE(p.approved_quotation_value, p.budget_amount, 0) AS approved_agreement_value,
        -- Invoiced
        COALESCE((
          SELECT SUM(i.total_amount) 
          FROM invoices i 
          WHERE i.customer_id = c.customer_id AND (p.project_id IS NULL OR i.project_id = p.project_id) AND i.status != 'cancelled'
        ), 0) AS total_invoiced,
        -- Payments Received
        COALESCE((
          SELECT SUM(ip.amount) 
          FROM invoice_payments ip 
          JOIN invoices inv ON ip.invoice_id = inv.invoice_id
          WHERE inv.customer_id = c.customer_id AND (p.project_id IS NULL OR inv.project_id = p.project_id) AND ip.status = 'completed'
        ), 0) AS payments_received,
        -- TDS & Approved Deductions
        COALESCE((
          SELECT SUM(tds.tds_amount)
          FROM customer_tds_credits tds
          WHERE tds.customer_id = c.customer_id
        ), 0) AS approved_deductions,
        -- Overdue Invoices Amount
        COALESCE((
          SELECT SUM(inv_o.total_amount - COALESCE(pmt_o.p_amt, 0))
          FROM invoices inv_o
          LEFT JOIN (
            SELECT invoice_id, SUM(amount) AS p_amt FROM invoice_payments WHERE status = 'completed' GROUP BY invoice_id
          ) pmt_o ON inv_o.invoice_id = pmt_o.invoice_id
          WHERE inv_o.customer_id = c.customer_id AND (p.project_id IS NULL OR inv_o.project_id = p.project_id)
            AND inv_o.status != 'cancelled' AND inv_o.due_date < CURRENT_DATE
        ), 0) AS overdue_amount,
        -- Next Payment Due Date
        (
          SELECT MIN(inv_due.due_date)
          FROM invoices inv_due
          WHERE inv_due.customer_id = c.customer_id AND (p.project_id IS NULL OR inv_due.project_id = p.project_id)
            AND inv_due.status IN ('issued', 'partially_paid') AND inv_due.due_date >= CURRENT_DATE
        ) AS next_payment_due_date
      FROM customers c
      LEFT JOIN projects p ON (c.customer_id = p.customer_id AND (p.is_deleted = 0 OR p.is_deleted IS NULL))
      WHERE (c.is_deleted = 0 OR c.is_deleted IS NULL)
    `;

    const params: any[] = [];
    if (customerId) {
      sql += ` AND c.customer_id = ?`;
      params.push(customerId);
    }
    sql += ` ORDER BY c.customer_name ASC, p.project_name ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const agreement = Number(r.approved_agreement_value || 0);
      const invoiced = Number(r.total_invoiced || 0);
      const received = Number(r.payments_received || 0);
      const deductions = Number(r.approved_deductions || 0);
      const outstanding = Math.max(0, invoiced - (received + deductions));
      const unbilled = Math.max(0, agreement - invoiced);

      return {
        customer_id: r.customer_id,
        customer_code: r.customer_code,
        customer_name: r.customer_name,
        project_id: r.project_id,
        project_code: r.project_code,
        project_name: r.project_name || 'All Assigned Projects',
        approved_agreement_value: agreement,
        total_invoiced: invoiced,
        verified_payments_received: received,
        approved_deductions: deductions,
        outstanding_amount: outstanding,
        overdue_amount: Number(r.overdue_amount || 0),
        remaining_unbilled_value: unbilled,
        next_payment_due_date: r.next_payment_due_date ? String(r.next_payment_due_date).split('T')[0] : null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Invoice Register & Aging Report
  // ─────────────────────────────────────────────────────────────────────────
  async getInvoiceRegisterAndAging(filters?: { customer_id?: number; project_id?: number; status?: string; aging_bucket?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.due_date,
        i.status AS invoice_status,
        i.subtotal_amount,
        i.tax_amount,
        i.total_amount,
        c.customer_name,
        c.customer_code,
        p.project_name,
        p.project_code,
        COALESCE(pmt.total_paid, 0) AS total_paid,
        DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue
      FROM invoices i
      JOIN customers c ON i.customer_id = c.customer_id
      LEFT JOIN projects p ON i.project_id = p.project_id
      LEFT JOIN (
        SELECT invoice_id, SUM(amount) AS total_paid 
        FROM invoice_payments 
        WHERE status = 'completed'
        GROUP BY invoice_id
      ) pmt ON i.invoice_id = pmt.invoice_id
      WHERE i.status != 'cancelled'
    `;

    const params: any[] = [];
    if (filters?.customer_id) { sql += ` AND i.customer_id = ?`; params.push(filters.customer_id); }
    if (filters?.project_id) { sql += ` AND i.project_id = ?`; params.push(filters.project_id); }
    if (filters?.status) { sql += ` AND i.status = ?`; params.push(filters.status); }

    sql += ` ORDER BY i.invoice_date DESC, i.invoice_id DESC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const total = Number(r.total_amount || 0);
      const paid = Number(r.total_paid || 0);
      const outstanding = Math.max(0, total - paid);
      const daysOverdue = Number(r.days_overdue || 0);

      let agingBucket = 'Current';
      if (daysOverdue > 90) agingBucket = '90+ Days';
      else if (daysOverdue > 60) agingBucket = '61–90 Days';
      else if (daysOverdue > 30) agingBucket = '31–60 Days';
      else if (daysOverdue > 0) agingBucket = '1–30 Days';

      // Computed status
      let status = r.invoice_status;
      if (paid >= total && total > 0) {
        status = 'Paid';
      } else if (paid > 0) {
        status = 'Partially Paid';
      } else if (daysOverdue > 0) {
        status = 'Overdue';
      }

      return {
        invoice_id: r.invoice_id,
        invoice_number: r.invoice_number,
        invoice_date: r.invoice_date ? String(r.invoice_date).split('T')[0] : null,
        due_date: r.due_date ? String(r.due_date).split('T')[0] : null,
        customer_name: r.customer_name,
        customer_code: r.customer_code,
        project_name: r.project_name || 'N/A',
        project_code: r.project_code || 'N/A',
        subtotal_amount: Number(r.subtotal_amount || 0),
        tax_amount: Number(r.tax_amount || 0),
        total_amount: total,
        amount_received: paid,
        outstanding_amount: outstanding,
        payment_status: status,
        days_overdue: Math.max(0, daysOverdue),
        aging_bucket: agingBucket,
      };
    }).filter((item) => {
      if (!filters?.aging_bucket) return true;
      return item.aging_bucket === filters.aging_bucket;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Equipment Utilization (Owned vs Rental)
  // ─────────────────────────────────────────────────────────────────────────
  async getEquipmentUtilizationReport(ownershipType?: 'own' | 'rented', projectId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        em.equipment_id,
        em.equipment_code,
        em.equipment_name,
        em.ownership_type,
        em.vendor_id,
        v.vendor_name,
        em.internal_hourly_rate,
        em.rental_rate,
        em.rental_rate_unit,
        em.status,
        -- Total meter hours logged
        COALESCE((
          SELECT SUM(GREATEST(0, eul.end_meter_hours - eul.start_meter_hours))
          FROM equipment_usage_logs eul
          WHERE eul.equipment_id = em.equipment_id ${projectId ? `AND eul.project_id = ${Number(projectId)}` : ''}
        ), 0) AS total_meter_hours,
        -- Total fuel consumed
        COALESCE((
          SELECT SUM(eul.fuel_litres_consumed)
          FROM equipment_usage_logs eul
          WHERE eul.equipment_id = em.equipment_id ${projectId ? `AND eul.project_id = ${Number(projectId)}` : ''}
        ), 0) AS total_fuel_litres,
        -- Total charged usage cost
        COALESCE((
          SELECT SUM(eul.total_cost)
          FROM equipment_usage_logs eul
          WHERE eul.equipment_id = em.equipment_id ${projectId ? `AND eul.project_id = ${Number(projectId)}` : ''}
        ), 0) AS total_charged_cost,
        -- Vendor invoices billed for rental equipment
        COALESCE((
          SELECT SUM(vi.payable_amount)
          FROM vendor_invoices vi
          WHERE vi.vendor_name = v.vendor_name ${projectId ? `AND vi.project_id = ${Number(projectId)}` : ''}
        ), 0) AS rental_billed_amount,
        -- Vendor payments made
        COALESCE((
          SELECT SUM(vi.paid_amount)
          FROM vendor_invoices vi
          WHERE vi.vendor_name = v.vendor_name ${projectId ? `AND vi.project_id = ${Number(projectId)}` : ''}
        ), 0) AS rental_paid_amount
      FROM equipment_master em
      LEFT JOIN vendors v ON em.vendor_id = v.vendor_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (ownershipType) {
      sql += ` AND em.ownership_type = ?`;
      params.push(ownershipType);
    }
    sql += ` ORDER BY em.equipment_name ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const billed = Number(r.rental_billed_amount || 0);
      const paid = Number(r.rental_paid_amount || 0);
      const balance = Math.max(0, billed - paid);

      return {
        equipment_id: r.equipment_id,
        equipment_code: r.equipment_code,
        equipment_name: r.equipment_name,
        ownership_type: r.ownership_type,
        vendor_name: r.vendor_name || 'Internal Company Owned',
        internal_hourly_rate: Number(r.internal_hourly_rate || 0),
        rental_rate: Number(r.rental_rate || 0),
        rental_rate_unit: r.rental_rate_unit || 'hour',
        status: r.status,
        total_meter_hours: Number(r.total_meter_hours || 0),
        total_fuel_litres: Number(r.total_fuel_litres || 0),
        total_charged_cost: Number(r.total_charged_cost || 0),
        rental_billed_amount: billed,
        rental_paid_amount: paid,
        rental_balance_due: balance,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Purchase Order vs GRN vs Vendor Invoice Reconciliation
  // ─────────────────────────────────────────────────────────────────────────
  async getPoGrnReconciliationReport(projectId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        po.po_id,
        po.po_number,
        po.po_date,
        po.status AS po_status,
        po.total_amount AS po_value,
        po.vendor_name,
        p.project_name,
        p.project_code,
        -- Total items ordered
        COALESCE((SELECT SUM(quantity) FROM purchase_order_items WHERE po_id = po.po_id), 0) AS ordered_qty,
        -- Total accepted items from GRN
        COALESCE((
          SELECT SUM(gi.accepted_quantity) 
          FROM grn_items gi 
          JOIN goods_receipt_notes grn ON gi.grn_id = grn.grn_id 
          WHERE grn.po_id = po.po_id AND grn.status = 'posted'
        ), 0) AS accepted_qty,
        -- Total rejected items from GRN
        COALESCE((
          SELECT SUM(gi.rejected_quantity) 
          FROM grn_items gi 
          JOIN goods_receipt_notes grn ON gi.grn_id = grn.grn_id 
          WHERE grn.po_id = po.po_id
        ), 0) AS rejected_qty,
        -- Invoiced value from vendor_invoices
        COALESCE((
          SELECT SUM(payable_amount) FROM vendor_invoices WHERE po_id = po.po_id
        ), 0) AS invoiced_amount,
        -- Paid amount
        COALESCE((
          SELECT SUM(paid_amount) FROM vendor_invoices WHERE po_id = po.po_id
        ), 0) AS paid_amount
      FROM purchase_orders po
      LEFT JOIN projects p ON po.project_id = p.project_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (projectId) {
      sql += ` AND po.project_id = ?`;
      params.push(projectId);
    }
    sql += ` ORDER BY po.po_id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const ordered = Number(r.ordered_qty || 0);
      const accepted = Number(r.accepted_qty || 0);
      const rejected = Number(r.rejected_qty || 0);
      const pendingQty = Math.max(0, ordered - accepted);

      const poValue = Number(r.po_value || 0);
      const invoiced = Number(r.invoiced_amount || 0);
      const paid = Number(r.paid_amount || 0);
      const balance = Math.max(0, invoiced - paid);

      const hasDiscrepancy = (invoiced > poValue && poValue > 0) || (accepted > ordered && ordered > 0);

      return {
        po_id: r.po_id,
        po_number: r.po_number,
        po_date: r.po_date ? String(r.po_date).split('T')[0] : null,
        po_status: r.po_status,
        vendor_name: r.vendor_name || 'Vendor',
        project_name: r.project_name || 'General Project',
        project_code: r.project_code || 'N/A',
        ordered_quantity: ordered,
        accepted_quantity: accepted,
        rejected_quantity: rejected,
        pending_quantity: pendingQty,
        po_value: poValue,
        invoiced_value: invoiced,
        paid_amount: paid,
        outstanding_supplier_balance: balance,
        has_discrepancy: hasDiscrepancy,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Material Stock Valuation & Summary
  // ─────────────────────────────────────────────────────────────────────────
  async getMaterialStockValuationReport(storeId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        m.material_id,
        m.material_code,
        m.material_name,
        m.category,
        m.unit,
        COALESCE(m.billing_rate, m.rate, m.purchase_rate, 0) AS unit_rate,
        COALESCE(m.min_stock_level, 0) AS min_stock_level,
        COALESCE(m.reorder_level, 0) AS reorder_level,
        s.store_name,
        COALESCE(msb.on_hand_qty, 0) AS on_hand_qty,
        COALESCE(msb.reserved_qty, 0) AS reserved_qty,
        COALESCE(msb.on_hand_qty - msb.reserved_qty, 0) AS available_qty,
        -- Total receipts
        COALESCE((
          SELECT SUM(qty_in) FROM stock_ledger WHERE material_id = m.material_id ${storeId ? `AND store_id = ${Number(storeId)}` : ''}
        ), 0) AS total_received,
        -- Total issues
        COALESCE((
          SELECT SUM(qty_out) FROM stock_ledger WHERE material_id = m.material_id AND txn_type IN ('issue', 'consumption') ${storeId ? `AND store_id = ${Number(storeId)}` : ''}
        ), 0) AS total_issued,
        -- Total returns
        COALESCE((
          SELECT SUM(qty_in) FROM stock_ledger WHERE material_id = m.material_id AND txn_type = 'return' ${storeId ? `AND store_id = ${Number(storeId)}` : ''}
        ), 0) AS total_returned
      FROM materials m
      LEFT JOIN material_store_balances msb ON m.material_id = msb.material_id
      LEFT JOIN stores s ON msb.store_id = s.store_id
      WHERE (m.status != 'inactive' OR m.status IS NULL)
    `;

    const params: any[] = [];
    if (storeId) {
      sql += ` AND msb.store_id = ?`;
      params.push(storeId);
    }
    sql += ` ORDER BY m.material_name ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return rows.map((r: any) => {
      const avail = Number(r.available_qty || 0);
      const reorder = Number(r.reorder_level || 0);
      const rate = Number(r.unit_rate || 0);
      const stockVal = avail * rate;

      let status = 'In Stock';
      if (avail <= 0) {
        status = 'Out of Stock';
      } else if (reorder > 0 && avail <= reorder) {
        status = 'Low Stock';
      }

      return {
        material_id: r.material_id,
        material_code: r.material_code,
        material_name: r.material_name,
        category: r.category || 'General',
        store_name: r.store_name || 'Central Warehouse',
        unit: r.unit || 'Nos',
        unit_rate: rate,
        available_quantity: avail,
        reserved_quantity: Number(r.reserved_qty || 0),
        on_hand_quantity: Number(r.on_hand_qty || 0),
        reorder_level: reorder,
        stock_value: stockVal,
        total_received: Number(r.total_received || 0),
        total_issued: Number(r.total_issued || 0),
        total_returned: Number(r.total_returned || 0),
        status: status,
      };
    });
  }
}
