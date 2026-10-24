import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../config/db';

export class ProcurementRepository {
  // ── Stores ─────────────────────────────────────────────────────────────
  async getStores(projectId?: number): Promise<any[]> {
    let sql = `SELECT * FROM stores WHERE is_active = 1`;
    const params: any[] = [];
    if (projectId) {
      sql += ` AND (project_id = ? OR project_id IS NULL)`;
      params.push(projectId);
    }
    sql += ` ORDER BY store_id ASC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async createStore(data: { store_code: string; store_name: string; project_id?: number | null; location?: string }): Promise<number> {
    const [res]: [ResultSetHeader, any] = await dbPool.query(
      `INSERT INTO stores (store_code, store_name, project_id, location, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [data.store_code, data.store_name, data.project_id || null, data.location || null]
    );
    return res.insertId;
  }

  // ── Indents ────────────────────────────────────────────────────────────
  async getIndents(filters?: { project_id?: number; status?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        mi.*,
        p.project_name,
        pw.wbs_name,
        t.task_name,
        e.name AS requester_name,
        (SELECT COUNT(*) FROM material_indent_items WHERE indent_id = mi.indent_id) AS items_count
      FROM material_indents mi
      LEFT JOIN projects p ON mi.project_id = p.project_id
      LEFT JOIN project_wbs pw ON mi.wbs_id = pw.id
      LEFT JOIN tasks t ON mi.task_id = t.task_id
      LEFT JOIN employees e ON mi.requested_by = e.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.project_id) {
      sql += ` AND mi.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters?.status) {
      sql += ` AND mi.status = ?`;
      params.push(filters.status);
    }
    sql += ` ORDER BY mi.indent_id DESC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async getIndentById(indentId: number): Promise<any | null> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT mi.*, p.project_name, pw.wbs_name, t.task_name, e.name AS requester_name
       FROM material_indents mi
       LEFT JOIN projects p ON mi.project_id = p.project_id
       LEFT JOIN project_wbs pw ON mi.wbs_id = pw.id
       LEFT JOIN tasks t ON mi.task_id = t.task_id
       LEFT JOIN employees e ON mi.requested_by = e.employee_id
       WHERE mi.indent_id = ?`,
      [indentId]
    );
    if (rows.length === 0) return null;

    const [items]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT mii.*, m.material_name, m.material_code, m.unit
       FROM material_indent_items mii
       JOIN materials m ON mii.material_id = m.material_id
       WHERE mii.indent_id = ?`,
      [indentId]
    );

    return { ...rows[0], items };
  }

  async createIndent(
    data: {
      indent_number?: string;
      project_id: number;
      wbs_id: number;
      task_id?: number | null;
      required_date?: string;
      remarks?: string;
      requested_by?: number;
      items: Array<{ material_id: number; requested_quantity: number; remarks?: string }>;
    },
    conn: PoolConnection
  ): Promise<number> {
    const indentNumber = data.indent_number || `IND-${Date.now().toString().slice(-6)}`;
    const [res]: [ResultSetHeader, any] = await conn.query(
      `INSERT INTO material_indents (
         indent_number, project_id, wbs_id, task_id, required_date,
         remarks, requested_by, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        indentNumber,
        data.project_id,
        data.wbs_id,
        data.task_id || null,
        data.required_date || null,
        data.remarks || null,
        data.requested_by || null,
      ]
    );

    const indentId = res.insertId;

    for (const item of data.items) {
      await conn.query(
        `INSERT INTO material_indent_items (
           indent_id, material_id, requested_quantity, approved_quantity, remarks
         ) VALUES (?, ?, ?, 0.00, ?)`,
        [indentId, item.material_id, item.requested_quantity, item.remarks || null]
      );
    }

    return indentId;
  }

  async updateIndentStatus(indentId: number, status: string, approvedBy?: number): Promise<boolean> {
    const [res]: [ResultSetHeader, any] = await dbPool.query(
      `UPDATE material_indents 
       SET status = ?, approved_by = ?, approved_at = NOW() 
       WHERE indent_id = ?`,
      [status, approvedBy || null, indentId]
    );
    return res.affectedRows > 0;
  }

  // ── Purchase Orders ────────────────────────────────────────────────────
  async getPurchaseOrders(filters?: { project_id?: number; vendor_id?: number; status?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        po.*,
        p.project_name,
        pw.wbs_name,
        v.vendor_name,
        (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.po_id) AS items_count,
        (SELECT COALESCE(SUM(quantity), 0) FROM purchase_order_items WHERE po_id = po.po_id) AS total_ordered_qty,
        (SELECT COALESCE(SUM(received_qty), 0) FROM purchase_order_items WHERE po_id = po.po_id) AS total_received_qty
      FROM purchase_orders po
      LEFT JOIN projects p ON po.project_id = p.project_id
      LEFT JOIN project_wbs pw ON po.wbs_id = pw.id
      LEFT JOIN vendors v ON po.vendor_id = v.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.project_id) {
      sql += ` AND po.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters?.vendor_id) {
      sql += ` AND po.vendor_id = ?`;
      params.push(filters.vendor_id);
    }
    if (filters?.status) {
      sql += ` AND po.status = ?`;
      params.push(filters.status);
    }
    sql += ` ORDER BY po.po_id DESC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async getPurchaseOrderById(poId: number): Promise<any | null> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT po.*, p.project_name, pw.wbs_name, v.vendor_name, v.contact_person, v.email, v.phone
       FROM purchase_orders po
       LEFT JOIN projects p ON po.project_id = p.project_id
       LEFT JOIN project_wbs pw ON po.wbs_id = pw.id
       LEFT JOIN vendors v ON po.vendor_id = v.vendor_id
       WHERE po.po_id = ?`,
      [poId]
    );
    if (rows.length === 0) return null;

    const [items]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT poi.*, m.material_code, m.category AS material_category
       FROM purchase_order_items poi
       JOIN materials m ON poi.material_id = m.material_id
       WHERE poi.po_id = ?`,
      [poId]
    );

    return { ...rows[0], items };
  }

  /**
   * Retrieves receivable lines for a purchase order (ordered, previously received, pending).
   * Restricts to issued or partially_received POs.
   */
  async getReceivablePoLines(poId: number): Promise<any | null> {
    const [poRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT po.po_id, po.po_number, po.status, po.project_id, p.project_name,
              po.wbs_id, pw.wbs_name, po.vendor_id, po.vendor_name
       FROM purchase_orders po
       LEFT JOIN projects p ON po.project_id = p.project_id
       LEFT JOIN project_wbs pw ON po.wbs_id = pw.id
       WHERE po.po_id = ?`,
      [poId]
    );
    if (poRows.length === 0) return null;
    const po = poRows[0];

    const [items]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT 
         poi.po_item_id,
         poi.material_id,
         poi.material_name,
         poi.unit,
         poi.unit_rate,
         poi.tax_percentage,
         poi.quantity AS ordered_quantity,
         poi.received_qty AS previously_received,
         (poi.quantity - poi.received_qty) AS pending_quantity
       FROM purchase_order_items poi
       WHERE poi.po_id = ?
       ORDER BY poi.po_item_id ASC`,
      [poId]
    );

    return { ...po, items };
  }

  async createPurchaseOrder(
    data: {
      po_number?: string;
      po_date?: string;
      project_id: number;
      wbs_id: number;
      indent_id?: number | null;
      vendor_id: number;
      vendor_name?: string;
      expected_delivery_date?: string | null;
      payment_terms?: string | null;
      delivery_address?: string | null;
      terms_conditions?: string | null;
      created_by?: number | null;
      items: Array<{
        material_id: number;
        material_name?: string;
        unit?: string;
        quantity: number;
        unit_rate: number;
        discount_amount?: number;
        tax_percentage?: number;
        remarks?: string;
      }>;
    },
    conn: PoolConnection
  ): Promise<number> {
    const poNumber = data.po_number || `PO-${Date.now().toString().slice(-6)}`;
    const poDate = data.po_date || new Date().toISOString().split('T')[0];

    let subtotal = 0;
    let totalTax = 0;
    const processedItems: any[] = [];

    for (const item of data.items) {
      const [matRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT material_name, unit, COALESCE(purchase_rate, rate) as rate, tax_percentage FROM materials WHERE material_id = ?`,
        [item.material_id]
      );
      const mat = matRows[0] || { material_name: 'Material', unit: 'Nos', rate: 0, tax_percentage: 18 };

      const name = item.material_name || mat.material_name;
      const unit = item.unit || mat.unit || 'Nos';
      const rate = Number(item.unit_rate !== undefined ? item.unit_rate : mat.rate);
      const qty = Number(item.quantity);
      const discount = Number(item.discount_amount || 0);
      const taxPercent = Number(item.tax_percentage !== undefined ? item.tax_percentage : mat.tax_percentage || 0);

      const lineGross = qty * rate - discount;
      const lineTax = (lineGross * taxPercent) / 100;
      const lineTotal = lineGross + lineTax;

      subtotal += lineGross;
      totalTax += lineTax;

      processedItems.push({
        material_id: item.material_id,
        material_name: name,
        unit: unit,
        quantity: qty,
        unit_rate: rate,
        discount_amount: discount,
        tax_percentage: taxPercent,
        tax_amount: lineTax,
        total_amount: lineTotal,
        remarks: item.remarks || null,
      });
    }

    const totalAmount = subtotal + totalTax;

    const [res]: [ResultSetHeader, any] = await conn.query(
      `INSERT INTO purchase_orders (
         po_number, po_date, project_id, wbs_id, indent_id, vendor_id, vendor_name,
         expected_delivery_date, subtotal_amount, tax_amount, total_amount,
         payment_terms, delivery_address, terms_conditions, status, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        poNumber,
        poDate,
        data.project_id,
        data.wbs_id,
        data.indent_id || null,
        data.vendor_id,
        data.vendor_name || 'Vendor',
        data.expected_delivery_date || null,
        subtotal,
        totalTax,
        totalAmount,
        data.payment_terms || null,
        data.delivery_address || null,
        data.terms_conditions || null,
        data.created_by || null,
      ]
    );

    const poId = res.insertId;

    for (const pItem of processedItems) {
      await conn.query(
        `INSERT INTO purchase_order_items (
           po_id, material_id, material_name, unit, quantity, unit_rate,
           discount_amount, tax_percentage, tax_amount, total_amount,
           received_qty, remarks
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?)`,
        [
          poId,
          pItem.material_id,
          pItem.material_name,
          pItem.unit,
          pItem.quantity,
          pItem.unit_rate,
          pItem.discount_amount,
          pItem.tax_percentage,
          pItem.tax_amount,
          pItem.total_amount,
          pItem.remarks,
        ]
      );
    }

    return poId;
  }

  async updatePoStatus(poId: number, status: string, conn?: PoolConnection): Promise<boolean> {
    const executor = conn || dbPool;
    const [res]: [ResultSetHeader, any] = await executor.query(
      `UPDATE purchase_orders SET status = ? WHERE po_id = ?`,
      [status, poId]
    );
    return res.affectedRows > 0;
  }

  // ── Goods Receipt Notes (GRN) ──────────────────────────────────────────
  async getGrns(filters?: { project_id?: number; status?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        grn.*,
        p.project_name,
        po.po_number,
        s.store_name,
        (SELECT COUNT(*) FROM grn_items WHERE grn_id = grn.grn_id) AS items_count,
        (SELECT COALESCE(SUM(total_value), 0) FROM grn_items WHERE grn_id = grn.grn_id) AS total_grn_value
      FROM goods_receipt_notes grn
      LEFT JOIN projects p ON grn.project_id = p.project_id
      LEFT JOIN purchase_orders po ON grn.po_id = po.po_id
      LEFT JOIN stores s ON grn.store_id = s.store_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.project_id) {
      sql += ` AND grn.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters?.status) {
      sql += ` AND grn.status = ?`;
      params.push(filters.status);
    }
    sql += ` ORDER BY grn.grn_id DESC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async getGrnById(grnId: number): Promise<any | null> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT grn.*, p.project_name, po.po_number, s.store_name, s.store_code
       FROM goods_receipt_notes grn
       LEFT JOIN projects p ON grn.project_id = p.project_id
       LEFT JOIN purchase_orders po ON grn.po_id = po.po_id
       LEFT JOIN stores s ON grn.store_id = s.store_id
       WHERE grn.grn_id = ?`,
      [grnId]
    );
    if (rows.length === 0) return null;

    const [items]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT gi.*, m.material_code
       FROM grn_items gi
       JOIN materials m ON gi.material_id = m.material_id
       WHERE gi.grn_id = ?`,
      [grnId]
    );

    return { ...rows[0], items };
  }

  async createDraftGrn(
    data: {
      grn_number?: string;
      po_id?: number | null;
      project_id: number;
      wbs_id?: number | null;
      vendor_id?: number | null;
      vendor_name?: string;
      store_id?: number;
      delivery_date: string;
      delivery_challan_number?: string | null;
      challan_date?: string | null;
      invoice_number?: string | null;
      invoice_date?: string | null;
      remarks?: string | null;
      attachments?: any | null;
      created_by?: number | null;
      items: Array<{
        po_item_id?: number | null;
        material_id: number;
        ordered_quantity?: number;
        received_quantity: number;
        accepted_quantity: number;
        rejected_quantity?: number;
        damaged_quantity?: number;
        short_quantity?: number;
        unit_rate: number;
        remarks?: string;
      }>;
    },
    conn: PoolConnection
  ): Promise<number> {
    const grnNumber = data.grn_number || `GRN-${Date.now().toString().slice(-6)}`;
    const storeId = data.store_id || 1;

    // Attachments as JSON string if object/array
    let attachmentsJson: string | null = null;
    if (data.attachments) {
      attachmentsJson = typeof data.attachments === 'string' ? data.attachments : JSON.stringify(data.attachments);
    }

    const [res]: [ResultSetHeader, any] = await conn.query(
      `INSERT INTO goods_receipt_notes (
         grn_number, po_id, project_id, wbs_id, vendor_id, vendor_name,
         store_id, delivery_date, delivery_challan_number, challan_date,
         invoice_number, invoice_date, remarks, attachments, created_by,
         status, is_posted
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0)`,
      [
        grnNumber,
        data.po_id || null,
        data.project_id,
        data.wbs_id || null,
        data.vendor_id || null,
        data.vendor_name || 'Vendor',
        storeId,
        data.delivery_date,
        data.delivery_challan_number || null,
        data.challan_date || null,
        data.invoice_number || null,
        data.invoice_date || null,
        data.remarks || null,
        attachmentsJson,
        data.created_by || null,
      ]
    );

    const grnId = res.insertId;

    for (const item of data.items) {
      const [matRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT material_name, unit FROM materials WHERE material_id = ?`,
        [item.material_id]
      );
      const mat = matRows[0] || { material_name: 'Material', unit: 'Nos' };

      await conn.query(
        `INSERT INTO grn_items (
           grn_id, po_item_id, material_id, material_name, unit,
           ordered_quantity, received_quantity, accepted_quantity,
           rejected_quantity, damaged_quantity, short_quantity, unit_rate, remarks
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grnId,
          item.po_item_id || null,
          item.material_id,
          mat.material_name,
          mat.unit || 'Nos',
          item.ordered_quantity || 0,
          item.received_quantity,
          item.accepted_quantity,
          item.rejected_quantity || 0,
          item.damaged_quantity || 0,
          item.short_quantity || 0,
          item.unit_rate,
          item.remarks || null,
        ]
      );
    }

    return grnId;
  }

  // ── Material Issues & Returns ──────────────────────────────────────────
  async getMaterialIssues(filters?: { project_id?: number; task_id?: number }): Promise<any[]> {
    let sql = `
      SELECT 
        mi.*,
        p.project_name,
        pw.wbs_name,
        t.task_name,
        e.name AS issued_to_name,
        s.store_name
      FROM material_issues mi
      LEFT JOIN projects p ON mi.project_id = p.project_id
      LEFT JOIN project_wbs pw ON mi.wbs_id = pw.id
      LEFT JOIN tasks t ON mi.task_id = t.task_id
      LEFT JOIN employees e ON mi.issued_to_id = e.employee_id
      LEFT JOIN stores s ON mi.store_id = s.store_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.project_id) {
      sql += ` AND mi.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters?.task_id) {
      sql += ` AND mi.task_id = ?`;
      params.push(filters.task_id);
    }
    sql += ` ORDER BY mi.issue_id DESC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async getMaterialIssueById(issueId: number): Promise<any | null> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT mi.*, p.project_name, pw.wbs_name, t.task_name
       FROM material_issues mi
       LEFT JOIN projects p ON mi.project_id = p.project_id
       LEFT JOIN project_wbs pw ON mi.wbs_id = pw.id
       LEFT JOIN tasks t ON mi.task_id = t.task_id
       WHERE mi.issue_id = ?`,
      [issueId]
    );
    return rows[0] || null;
  }

  async createMaterialIssueRecord(
    data: {
      issue_code: string;
      store_id: number;
      project_id: number;
      wbs_id: number;
      task_id?: number | null;
      material_id: number;
      material_name: string;
      unit: string;
      issue_date: string;
      quantity: number;
      unit_rate: number;
      issued_to_id?: number | null;
      site_location?: string | null;
      remarks?: string | null;
      created_by?: number | null;
    },
    conn: PoolConnection
  ): Promise<number> {
    const [res]: [ResultSetHeader, any] = await conn.query(
      `INSERT INTO material_issues (
         issue_code, store_id, project_id, wbs_id, task_id, material_id,
         material_name, unit, issue_date, quantity, consumed_quantity, returned_quantity, unit_rate,
         issued_to_id, site_location, remarks, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, ?, ?)`,
      [
        data.issue_code,
        data.store_id,
        data.project_id,
        data.wbs_id,
        data.task_id || null,
        data.material_id,
        data.material_name,
        data.unit || 'Nos',
        data.issue_date,
        data.quantity,
        data.unit_rate,
        data.issued_to_id || null,
        data.site_location || null,
        data.remarks || null,
        data.created_by || null,
      ]
    );
    return res.insertId;
  }

  /**
   * Retrieves requirement, reserved, previously issued, remaining requirement, and available stock for issue dialog.
   */
  async getIssueContext(projectId: number, wbsId: number, materialId: number, storeId: number = 1): Promise<{
    requirement: number;
    reserved: number;
    previously_issued: number;
    remaining_requirement: number;
    available_stock: number;
  }> {
    // 1. Requirement from project_materials
    const [pmRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT COALESCE(planned_quantity, 0) AS planned_quantity
       FROM project_materials
       WHERE project_id = ? AND wbs_id = ? AND material_id = ?`,
      [projectId, wbsId, materialId]
    );
    const requirement = Number(pmRows[0]?.planned_quantity || 0);

    // 2. Previously issued to this project & WBS
    const [issRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT COALESCE(SUM(quantity - returned_quantity), 0) AS previously_issued
       FROM material_issues
       WHERE project_id = ? AND wbs_id = ? AND material_id = ?`,
      [projectId, wbsId, materialId]
    );
    const previouslyIssued = Number(issRows[0]?.previously_issued || 0);
    const remainingRequirement = Math.max(0, requirement - previouslyIssued);

    // 3. Active reservations
    const [resRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT COALESCE(SUM(reserved_qty), 0) AS reserved_qty
       FROM material_reservations
       WHERE project_id = ? AND wbs_id = ? AND material_id = ? AND status = 'active'`,
      [projectId, wbsId, materialId]
    );
    const reserved = Number(resRows[0]?.reserved_qty || 0);

    // 4. Available stock in store
    const [balRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT on_hand_qty, reserved_qty
       FROM material_store_balances
       WHERE material_id = ? AND store_id = ?`,
      [materialId, storeId]
    );
    const onHand = Number(balRows[0]?.on_hand_qty || 0);
    const storeReserved = Number(balRows[0]?.reserved_qty || 0);
    const availableStock = Math.max(0, onHand - storeReserved);

    return {
      requirement,
      reserved,
      previously_issued: previouslyIssued,
      remaining_requirement: remainingRequirement,
      available_stock: availableStock,
    };
  }

  // ── Vendor Invoices ────────────────────────────────────────────────────
  async getVendorInvoices(filters?: { po_id?: number; grn_id?: number; project_id?: number }): Promise<any[]> {
    let sql = `
      SELECT vi.*, p.project_name, po.po_number, grn.grn_number
      FROM vendor_invoices vi
      JOIN projects p ON vi.project_id = p.project_id
      JOIN purchase_orders po ON vi.po_id = po.po_id
      LEFT JOIN goods_receipt_notes grn ON vi.grn_id = grn.grn_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.po_id) {
      sql += ` AND vi.po_id = ?`;
      params.push(filters.po_id);
    }
    if (filters?.grn_id) {
      sql += ` AND vi.grn_id = ?`;
      params.push(filters.grn_id);
    }
    if (filters?.project_id) {
      sql += ` AND vi.project_id = ?`;
      params.push(filters.project_id);
    }
    sql += ` ORDER BY vi.vendor_invoice_id DESC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  async getVendorInvoiceById(id: number): Promise<any | null> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT vi.*, p.project_name, po.po_number, grn.grn_number
       FROM vendor_invoices vi
       JOIN projects p ON vi.project_id = p.project_id
       JOIN purchase_orders po ON vi.po_id = po.po_id
       LEFT JOIN goods_receipt_notes grn ON vi.grn_id = grn.grn_id
       WHERE vi.vendor_invoice_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async createVendorInvoice(
    data: {
      invoice_number: string;
      invoice_date: string;
      po_id: number;
      grn_id?: number | null;
      project_id: number;
      wbs_id: number;
      vendor_name: string;
      invoice_amount: number;
      tax_amount: number;
      payable_amount: number;
    },
    conn?: PoolConnection
  ): Promise<number> {
    const executor = conn || dbPool;
    const [res]: [ResultSetHeader, any] = await executor.query(
      `INSERT INTO vendor_invoices (
         invoice_number, invoice_date, po_id, grn_id, project_id, wbs_id,
         vendor_name, invoice_amount, tax_amount, payable_amount, paid_amount,
         balance_amount, payment_status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'unpaid')`,
      [
        data.invoice_number,
        data.invoice_date,
        data.po_id,
        data.grn_id || null,
        data.project_id,
        data.wbs_id,
        data.vendor_name,
        data.invoice_amount,
        data.tax_amount,
        data.payable_amount,
        data.payable_amount,
      ]
    );
    return res.insertId;
  }
}
