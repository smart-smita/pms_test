import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../config/db';

export interface ReportFilterOptions {
  start_date?: string;
  end_date?: string;
  project_id?: number;
  wbs_id?: number;
  task_id?: number;
  material_id?: number;
  vendor_id?: number;
  store_id?: number;
  grn_id?: number;
  po_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProcurementReportRepository {
  // ── 1. Purchased vs Ordered vs Received vs Pending ─────────────────────
  async getPurchasedVsOrderedReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.start_date) {
      whereClause += ` AND po.po_date >= ? `;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      whereClause += ` AND po.po_date <= ? `;
      params.push(filters.end_date);
    }
    if (filters.project_id) {
      whereClause += ` AND po.project_id = ? `;
      params.push(filters.project_id);
    }
    if (filters.vendor_id) {
      whereClause += ` AND po.vendor_id = ? `;
      params.push(filters.vendor_id);
    }
    if (filters.po_id) {
      whereClause += ` AND po.po_id = ? `;
      params.push(filters.po_id);
    }
    if (filters.material_id) {
      whereClause += ` AND poi.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.search) {
      whereClause += ` AND (po.po_number LIKE ? OR po.vendor_name LIKE ? OR poi.material_name LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Base query using stock_ledger for received quantity (NO CACHED COUNTERS)
    const baseFrom = `
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.po_id = po.po_id
      LEFT JOIN projects p ON po.project_id = p.project_id
      LEFT JOIN vendors v ON po.vendor_id = v.vendor_id
      ${whereClause}
    `;

    // 1. Get Totals matching exact filter
    const [totalsRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         COUNT(*) AS total_items,
         COALESCE(SUM(poi.quantity), 0) AS total_ordered_qty,
         COALESCE(SUM(poi.total_amount), 0) AS total_ordered_amount,
         COALESCE(SUM(
           (SELECT COALESCE(SUM(sl.qty_in), 0) 
            FROM stock_ledger sl 
            WHERE sl.ref_type = 'grn' 
              AND sl.material_id = poi.material_id 
              AND sl.ref_id IN (SELECT grn.grn_id FROM goods_receipt_notes grn WHERE grn.po_id = po.po_id))
         ), 0) AS total_received_qty
       ${baseFrom}`,
      params
    );

    const totals = totalsRows[0];
    totals.total_pending_qty = Math.max(0, Number(totals.total_ordered_qty) - Number(totals.total_received_qty));

    // 2. Get Paginated Rows
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         po.po_id,
         po.po_number,
         DATE_FORMAT(po.po_date, '%Y-%m-%d') AS po_date,
         po.status AS po_status,
         po.vendor_id,
         COALESCE(v.vendor_name, po.vendor_name) AS vendor_name,
         po.project_id,
         p.project_name,
         poi.po_item_id,
         poi.material_id,
         poi.material_name,
         poi.unit,
         poi.unit_rate,
         poi.quantity AS ordered_quantity,
         poi.tax_percentage,
         poi.total_amount AS total_ordered_cost,
         -- Strictly computed from stock_ledger:
         COALESCE((
           SELECT SUM(sl.qty_in) 
           FROM stock_ledger sl 
           WHERE sl.ref_type = 'grn' 
             AND sl.material_id = poi.material_id 
             AND sl.ref_id IN (SELECT grn.grn_id FROM goods_receipt_notes grn WHERE grn.po_id = po.po_id)
         ), 0) AS received_quantity,
         GREATEST(0, poi.quantity - COALESCE((
           SELECT SUM(sl.qty_in) 
           FROM stock_ledger sl 
           WHERE sl.ref_type = 'grn' 
             AND sl.material_id = poi.material_id 
             AND sl.ref_id IN (SELECT grn.grn_id FROM goods_receipt_notes grn WHERE grn.po_id = po.po_id)
         ), 0)) AS pending_quantity
       ${baseFrom}
       ORDER BY po.po_date DESC, po.po_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total: Number(totals.total_items || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totals.total_items || 0) / limit),
      totals: {
        total_ordered_qty: Number(totals.total_ordered_qty || 0),
        total_received_qty: Number(totals.total_received_qty || 0),
        total_pending_qty: Number(totals.total_pending_qty || 0),
        total_ordered_amount: Number(totals.total_ordered_amount || 0),
      },
    };
  }

  // ── 2. QC / Inspection (Accepted vs Rejected vs Damaged) ───────────────
  async getInspectionReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.start_date) {
      whereClause += ` AND grn.delivery_date >= ? `;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      whereClause += ` AND grn.delivery_date <= ? `;
      params.push(filters.end_date);
    }
    if (filters.project_id) {
      whereClause += ` AND grn.project_id = ? `;
      params.push(filters.project_id);
    }
    if (filters.vendor_id) {
      whereClause += ` AND grn.vendor_id = ? `;
      params.push(filters.vendor_id);
    }
    if (filters.grn_id) {
      whereClause += ` AND grn.grn_id = ? `;
      params.push(filters.grn_id);
    }
    if (filters.po_id) {
      whereClause += ` AND grn.po_id = ? `;
      params.push(filters.po_id);
    }
    if (filters.material_id) {
      whereClause += ` AND gi.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.search) {
      whereClause += ` AND (grn.grn_number LIKE ? OR grn.vendor_name LIKE ? OR gi.material_name LIKE ? OR grn.delivery_challan_number LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const baseFrom = `
      FROM grn_items gi
      JOIN goods_receipt_notes grn ON gi.grn_id = grn.grn_id
      LEFT JOIN projects p ON grn.project_id = p.project_id
      LEFT JOIN purchase_orders po ON grn.po_id = po.po_id
      LEFT JOIN vendors v ON grn.vendor_id = v.vendor_id
      ${whereClause}
    `;

    // Totals matching filter
    const [totalsRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         COUNT(*) AS total_items,
         COALESCE(SUM(gi.received_quantity), 0) AS total_received_qty,
         COALESCE(SUM(gi.accepted_quantity), 0) AS total_accepted_qty,
         COALESCE(SUM(gi.rejected_quantity), 0) AS total_rejected_qty,
         COALESCE(SUM(gi.damaged_quantity), 0) AS total_damaged_qty,
         COALESCE(SUM(gi.accepted_quantity * gi.unit_rate), 0) AS total_accepted_value
       ${baseFrom}`,
      params
    );

    const totals = totalsRows[0];

    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         grn.grn_id,
         grn.grn_number,
         DATE_FORMAT(grn.delivery_date, '%Y-%m-%d') AS delivery_date,
         grn.status AS grn_status,
         grn.is_posted,
         grn.delivery_challan_number,
         grn.invoice_number,
         grn.project_id,
         p.project_name,
         grn.po_id,
         po.po_number,
         grn.vendor_id,
         COALESCE(v.vendor_name, grn.vendor_name) AS vendor_name,
         gi.grn_item_id,
         gi.material_id,
         gi.material_name,
         gi.unit,
         gi.unit_rate,
         gi.ordered_quantity,
         gi.received_quantity,
         gi.accepted_quantity,
         gi.rejected_quantity,
         gi.damaged_quantity,
         ROUND(gi.accepted_quantity * gi.unit_rate, 2) AS total_accepted_value,
         gi.remarks
       ${baseFrom}
       ORDER BY grn.delivery_date DESC, grn.grn_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total: Number(totals.total_items || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totals.total_items || 0) / limit),
      totals: {
        total_received_qty: Number(totals.total_received_qty || 0),
        total_accepted_qty: Number(totals.total_accepted_qty || 0),
        total_rejected_qty: Number(totals.total_rejected_qty || 0),
        total_damaged_qty: Number(totals.total_damaged_qty || 0),
        total_accepted_value: Number(totals.total_accepted_value || 0),
      },
    };
  }

  // ── 3. Stock On Hand by Store & Valuation ──────────────────────────────
  async getStockOnHandReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.store_id) {
      whereClause += ` AND s.store_id = ? `;
      params.push(filters.store_id);
    }
    if (filters.material_id) {
      whereClause += ` AND m.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.search) {
      whereClause += ` AND (m.material_name LIKE ? OR m.material_code LIKE ? OR s.store_name LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Strictly computed from stock_ledger: on_hand = SUM(qty_in) - SUM(qty_out)
    const baseQuery = `
      FROM materials m
      CROSS JOIN stores s
      LEFT JOIN material_store_balances msb ON (msb.material_id = m.material_id AND msb.store_id = s.store_id)
      ${whereClause}
      HAVING on_hand_qty > 0 OR reserved_qty > 0 OR available_qty > 0
    `;

    // First fetch all matching rows computed strictly from stock_ledger
    const [allRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         s.store_id,
         s.store_code,
         s.store_name,
         m.material_id,
         m.material_code,
         m.material_name,
         m.category,
         m.unit,
         COALESCE(m.purchase_rate, m.rate, 0) AS unit_rate,
         -- Strictly computed from stock_ledger:
         COALESCE((
           SELECT SUM(sl.qty_in) - SUM(sl.qty_out)
           FROM stock_ledger sl
           WHERE sl.material_id = m.material_id AND sl.store_id = s.store_id
         ), 0) AS on_hand_qty,
         COALESCE(msb.reserved_qty, 0) AS reserved_qty,
         (
           COALESCE((
             SELECT SUM(sl.qty_in) - SUM(sl.qty_out)
             FROM stock_ledger sl
             WHERE sl.material_id = m.material_id AND sl.store_id = s.store_id
           ), 0) - COALESCE(msb.reserved_qty, 0)
         ) AS available_qty,
         ROUND(
           COALESCE((
             SELECT SUM(sl.qty_in) - SUM(sl.qty_out)
             FROM stock_ledger sl
             WHERE sl.material_id = m.material_id AND sl.store_id = s.store_id
           ), 0) * COALESCE(m.purchase_rate, m.rate, 0), 2
         ) AS total_valuation
       ${baseQuery}
       ORDER BY s.store_name ASC, m.material_name ASC`,
      params
    );

    const totalCount = allRows.length;
    const paginatedItems = allRows.slice(offset, offset + limit);

    // Totals equal ledger sum
    const totalOnHand = allRows.reduce((sum, r) => sum + Number(r.on_hand_qty || 0), 0);
    const totalReserved = allRows.reduce((sum, r) => sum + Number(r.reserved_qty || 0), 0);
    const totalAvailable = allRows.reduce((sum, r) => sum + Number(r.available_qty || 0), 0);
    const totalValuation = allRows.reduce((sum, r) => sum + Number(r.total_valuation || 0), 0);

    return {
      items: paginatedItems,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totals: {
        total_on_hand: totalOnHand,
        total_reserved: totalReserved,
        total_available: totalAvailable,
        total_valuation: totalValuation,
      },
    };
  }

  // ── 4. Project Issue / Consumption / Return per Project-WBS-Task ────────
  async getProjectUsageReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE sl.txn_type IN ('issue', 'consumption', 'return') `;
    const params: any[] = [];

    if (filters.start_date) {
      whereClause += ` AND sl.txn_date >= ? `;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      whereClause += ` AND sl.txn_date <= ? `;
      params.push(filters.end_date);
    }
    if (filters.project_id) {
      whereClause += ` AND sl.project_id = ? `;
      params.push(filters.project_id);
    }
    if (filters.wbs_id) {
      whereClause += ` AND sl.wbs_id = ? `;
      params.push(filters.wbs_id);
    }
    if (filters.task_id) {
      whereClause += ` AND sl.task_id = ? `;
      params.push(filters.task_id);
    }
    if (filters.material_id) {
      whereClause += ` AND sl.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.store_id) {
      whereClause += ` AND sl.store_id = ? `;
      params.push(filters.store_id);
    }
    if (filters.search) {
      whereClause += ` AND (m.material_name LIKE ? OR p.project_name LIKE ? OR pw.wbs_name LIKE ? OR t.task_name LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const baseFrom = `
      FROM stock_ledger sl
      JOIN materials m ON sl.material_id = m.material_id
      JOIN stores s ON sl.store_id = s.store_id
      LEFT JOIN projects p ON sl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON sl.wbs_id = pw.id
      LEFT JOIN tasks t ON sl.task_id = t.task_id
      LEFT JOIN employees e ON sl.created_by = e.employee_id
      ${whereClause}
    `;

    const [totalsRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         COUNT(*) AS total_items,
         COALESCE(SUM(CASE WHEN sl.txn_type = 'issue' THEN sl.qty_out ELSE 0 END), 0) AS total_issued_qty,
         COALESCE(SUM(CASE WHEN sl.txn_type = 'consumption' THEN sl.qty_out ELSE 0 END), 0) AS total_consumed_qty,
         COALESCE(SUM(CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END), 0) AS total_returned_qty,
         COALESCE(SUM((CASE WHEN sl.txn_type IN ('issue', 'consumption') THEN sl.qty_out ELSE 0 END) - (CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END)), 0) AS total_net_used_qty,
         COALESCE(SUM(((CASE WHEN sl.txn_type IN ('issue', 'consumption') THEN sl.qty_out ELSE 0 END) - (CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END)) * sl.rate), 0) AS total_net_cost
       ${baseFrom}`,
      params
    );

    const totals = totalsRows[0];

    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         sl.ledger_id,
         DATE_FORMAT(sl.txn_date, '%Y-%m-%d') AS txn_date,
         sl.txn_type,
         sl.ref_type,
         sl.ref_id,
         sl.project_id,
         COALESCE(p.project_name, 'Central Store') AS project_name,
         sl.wbs_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         sl.task_id,
         COALESCE(t.task_name, '-') AS task_name,
         sl.store_id,
         s.store_name,
         sl.material_id,
         m.material_name,
         m.unit,
         sl.rate,
         sl.qty_in,
         sl.qty_out,
         CASE WHEN sl.txn_type = 'issue' THEN sl.qty_out ELSE 0 END AS issued_qty,
         CASE WHEN sl.txn_type = 'consumption' THEN sl.qty_out ELSE 0 END AS consumed_qty,
         CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END AS returned_qty,
         ((CASE WHEN sl.txn_type IN ('issue', 'consumption') THEN sl.qty_out ELSE 0 END) - (CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END)) AS net_used_qty,
         ROUND(((CASE WHEN sl.txn_type IN ('issue', 'consumption') THEN sl.qty_out ELSE 0 END) - (CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END)) * sl.rate, 2) AS net_cost,
         COALESCE(e.name, 'System') AS created_by_name,
         sl.remarks
       ${baseFrom}
       ORDER BY sl.txn_date DESC, sl.ledger_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total: Number(totals.total_items || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totals.total_items || 0) / limit),
      totals: {
        total_issued_qty: Number(totals.total_issued_qty || 0),
        total_consumed_qty: Number(totals.total_consumed_qty || 0),
        total_returned_qty: Number(totals.total_returned_qty || 0),
        total_net_used_qty: Number(totals.total_net_used_qty || 0),
        total_net_cost: Number(totals.total_net_cost || 0),
      },
    };
  }

  // ── 5. Remaining Requirement (Planned vs Actual Consumption) ───────────
  async getRemainingRequirementReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.project_id) {
      whereClause += ` AND pm.project_id = ? `;
      params.push(filters.project_id);
    }
    if (filters.wbs_id) {
      whereClause += ` AND pm.wbs_id = ? `;
      params.push(filters.wbs_id);
    }
    if (filters.material_id) {
      whereClause += ` AND pm.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.search) {
      whereClause += ` AND (pm.material_name LIKE ? OR p.project_name LIKE ? OR pw.wbs_name LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const baseFrom = `
      FROM project_materials pm
      JOIN projects p ON pm.project_id = p.project_id
      LEFT JOIN project_wbs pw ON pm.wbs_id = pw.id
      ${whereClause}
    `;

    // Dynamic computation from stock_ledger for actual consumption:
    const [allRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         pm.id,
         pm.project_id,
         p.project_name,
         pm.wbs_id,
         COALESCE(pw.wbs_name, 'General') AS wbs_name,
         pm.material_id,
         pm.material_name,
         pm.unit,
         pm.unit_rate,
         pm.planned_quantity,
         -- Strictly computed from stock_ledger:
         COALESCE((
           SELECT SUM(sl.qty_out) - SUM(sl.qty_in)
           FROM stock_ledger sl
           WHERE sl.project_id = pm.project_id 
             AND sl.wbs_id = pm.wbs_id 
             AND sl.material_id = pm.material_id
             AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0) AS actual_consumed_qty,
         GREATEST(0, pm.planned_quantity - COALESCE((
           SELECT SUM(sl.qty_out) - SUM(sl.qty_in)
           FROM stock_ledger sl
           WHERE sl.project_id = pm.project_id 
             AND sl.wbs_id = pm.wbs_id 
             AND sl.material_id = pm.material_id
             AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0)) AS remaining_requirement,
         GREATEST(0, COALESCE((
           SELECT SUM(sl.qty_out) - SUM(sl.qty_in)
           FROM stock_ledger sl
           WHERE sl.project_id = pm.project_id 
             AND sl.wbs_id = pm.wbs_id 
             AND sl.material_id = pm.material_id
             AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0) - pm.planned_quantity) AS extra_quantity,
         ROUND(pm.planned_quantity * pm.unit_rate, 2) AS planned_cost,
         ROUND(COALESCE((
           SELECT SUM(sl.qty_out) - SUM(sl.qty_in)
           FROM stock_ledger sl
           WHERE sl.project_id = pm.project_id 
             AND sl.wbs_id = pm.wbs_id 
             AND sl.material_id = pm.material_id
             AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0) * pm.unit_rate, 2) AS actual_cost
       ${baseFrom}
       ORDER BY p.project_name ASC, pw.wbs_name ASC, pm.material_name ASC`,
      params
    );

    const totalCount = allRows.length;
    const paginatedItems = allRows.slice(offset, offset + limit);

    const totalPlannedQty = allRows.reduce((sum, r) => sum + Number(r.planned_quantity || 0), 0);
    const totalConsumedQty = allRows.reduce((sum, r) => sum + Number(r.actual_consumed_qty || 0), 0);
    const totalRemainingQty = allRows.reduce((sum, r) => sum + Number(r.remaining_requirement || 0), 0);
    const totalExtraQty = allRows.reduce((sum, r) => sum + Number(r.extra_quantity || 0), 0);
    const totalPlannedCost = allRows.reduce((sum, r) => sum + Number(r.planned_cost || 0), 0);
    const totalActualCost = allRows.reduce((sum, r) => sum + Number(r.actual_cost || 0), 0);

    return {
      items: paginatedItems,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totals: {
        total_planned_qty: totalPlannedQty,
        total_consumed_qty: totalConsumedQty,
        total_remaining_qty: totalRemainingQty,
        total_extra_qty: totalExtraQty,
        total_planned_cost: totalPlannedCost,
        total_actual_cost: totalActualCost,
        variance_cost: totalActualCost - totalPlannedCost,
      },
    };
  }

  // ── 6. Purchase Cost vs Consumption Cost Analysis ──────────────────────
  async getPurchaseVsConsumptionReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.material_id) {
      whereClause += ` AND m.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.search) {
      whereClause += ` AND (m.material_name LIKE ? OR m.material_code LIKE ? OR m.category LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Built directly from stock_ledger:
    const [allRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         m.material_id,
         m.material_code,
         m.material_name,
         m.category,
         m.unit,
         COALESCE(m.purchase_rate, m.rate, 0) AS unit_rate,
         -- Total Purchased (GRN receipts):
         COALESCE((
           SELECT SUM(sl.qty_in)
           FROM stock_ledger sl
           WHERE sl.material_id = m.material_id AND sl.txn_type = 'grn_receipt'
         ), 0) AS purchased_qty,
         ROUND(COALESCE((
           SELECT SUM(sl.qty_in * sl.rate)
           FROM stock_ledger sl
           WHERE sl.material_id = m.material_id AND sl.txn_type = 'grn_receipt'
         ), 0), 2) AS purchased_cost,
         -- Total Consumed (issue + consumption - return):
         COALESCE((
           SELECT SUM(sl.qty_out) - SUM(CASE WHEN sl.txn_type = 'return' THEN sl.qty_in ELSE 0 END)
           FROM stock_ledger sl
           WHERE sl.material_id = m.material_id AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0) AS consumed_qty,
         ROUND(COALESCE((
           SELECT SUM(sl.qty_out * sl.rate) - SUM(CASE WHEN sl.txn_type = 'return' THEN sl.qty_in * sl.rate ELSE 0 END)
           FROM stock_ledger sl
           WHERE sl.material_id = m.material_id AND sl.txn_type IN ('issue', 'consumption', 'return')
         ), 0), 2) AS consumed_cost,
         -- Remaining in stock valuation:
         ROUND(
           COALESCE((
             SELECT SUM(sl.qty_in) - SUM(sl.qty_out)
             FROM stock_ledger sl
             WHERE sl.material_id = m.material_id
           ), 0) * COALESCE(m.purchase_rate, m.rate, 0), 2
         ) AS in_stock_valuation
       FROM materials m
       ${whereClause}
       HAVING purchased_qty > 0 OR consumed_qty > 0
       ORDER BY m.material_name ASC`,
      params
    );

    const totalCount = allRows.length;
    const paginatedItems = allRows.slice(offset, offset + limit);

    const totalPurchasedCost = allRows.reduce((sum, r) => sum + Number(r.purchased_cost || 0), 0);
    const totalConsumedCost = allRows.reduce((sum, r) => sum + Number(r.consumed_cost || 0), 0);
    const totalInStockValuation = allRows.reduce((sum, r) => sum + Number(r.in_stock_valuation || 0), 0);

    return {
      items: paginatedItems,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totals: {
        total_purchased_cost: totalPurchasedCost,
        total_consumed_cost: totalConsumedCost,
        total_in_stock_valuation: totalInStockValuation,
      },
    };
  }

  // ── 7. Stock Movement History (Audit Trail) ─────────────────────────────
  async getStockMovementReport(filters: ReportFilterOptions) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Number(filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClause = ` WHERE 1=1 `;
    const params: any[] = [];

    if (filters.start_date) {
      whereClause += ` AND sl.txn_date >= ? `;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      whereClause += ` AND sl.txn_date <= ? `;
      params.push(filters.end_date);
    }
    if (filters.project_id) {
      whereClause += ` AND sl.project_id = ? `;
      params.push(filters.project_id);
    }
    if (filters.wbs_id) {
      whereClause += ` AND sl.wbs_id = ? `;
      params.push(filters.wbs_id);
    }
    if (filters.task_id) {
      whereClause += ` AND sl.task_id = ? `;
      params.push(filters.task_id);
    }
    if (filters.material_id) {
      whereClause += ` AND sl.material_id = ? `;
      params.push(filters.material_id);
    }
    if (filters.store_id) {
      whereClause += ` AND sl.store_id = ? `;
      params.push(filters.store_id);
    }
    if (filters.search) {
      whereClause += ` AND (m.material_name LIKE ? OR m.material_code LIKE ? OR sl.remarks LIKE ? OR p.project_name LIKE ?) `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const baseFrom = `
      FROM stock_ledger sl
      JOIN materials m ON sl.material_id = m.material_id
      JOIN stores s ON sl.store_id = s.store_id
      LEFT JOIN projects p ON sl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON sl.wbs_id = pw.id
      LEFT JOIN tasks t ON sl.task_id = t.task_id
      LEFT JOIN employees e ON sl.created_by = e.employee_id
      ${whereClause}
    `;

    const [totalsRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         COUNT(*) AS total_items,
         COALESCE(SUM(sl.qty_in), 0) AS total_qty_in,
         COALESCE(SUM(sl.qty_out), 0) AS total_qty_out,
         COALESCE(SUM((sl.qty_in + sl.qty_out) * sl.rate), 0) AS total_amount
       ${baseFrom}`,
      params
    );

    const totals = totalsRows[0];

    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         sl.ledger_id,
         DATE_FORMAT(sl.txn_date, '%Y-%m-%d') AS txn_date,
         sl.txn_type,
         sl.ref_type,
         sl.ref_id,
         sl.store_id,
         s.store_name,
         sl.material_id,
         m.material_code,
         m.material_name,
         m.unit,
         sl.rate,
         sl.qty_in,
         sl.qty_out,
         ROUND((sl.qty_in + sl.qty_out) * sl.rate, 2) AS total_value,
         sl.project_id,
         p.project_name,
         sl.wbs_id,
         pw.wbs_name,
         sl.task_id,
         t.task_name,
         COALESCE(e.name, 'System') AS created_by_name,
         sl.remarks
       ${baseFrom}
       ORDER BY sl.txn_date DESC, sl.ledger_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total: Number(totals.total_items || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totals.total_items || 0) / limit),
      totals: {
        total_qty_in: Number(totals.total_qty_in || 0),
        total_qty_out: Number(totals.total_qty_out || 0),
        total_amount: Number(totals.total_amount || 0),
      },
    };
  }
}
