import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../config/db';
import { AuditService } from './audit.service';

export interface StockPostRequest {
  material_id: number;
  store_id: number;
  dest_store_id?: number | null;
  dest_project_id?: number | null;
  txn_type:
    | 'opening'
    | 'grn_receipt'
    | 'issue'
    | 'consumption'
    | 'return'
    | 'transfer_out'
    | 'transfer_in'
    | 'adjustment'
    | 'reversal'
    | 'damage';
  qty_in?: number;
  qty_out?: number;
  rate?: number;
  txn_date?: string;
  ref_type?: string;
  ref_id?: number | null;
  project_id?: number | null;
  wbs_id?: number | null;
  task_id?: number | null;
  reversal_of_id?: number | null;
  remarks?: string | null;
  created_by?: number | null;
}

export interface StockAdjustmentRequest {
  material_id: number;
  store_id: number;
  adjusted_qty: number; // positive = add stock, negative = deduct stock
  rate?: number;
  reason: string;
  user_id: number;
  req_ip?: string;
}

export class StockInsufficientError extends Error {
  statusCode = 409;
  constructor(required: number, available: number) {
    super(`Insufficient stock. Required: ${required}, Available: ${available}`);
    this.name = 'StockInsufficientError';
  }
}

export class StockService {
  /**
   * The single, authoritative entry point for writing stock in the entire system.
   * Nobody writes stock numbers anywhere else.
   */
  async post(data: StockPostRequest, externalConnection?: PoolConnection): Promise<{ ledger_id: number }> {
    const conn = externalConnection || (await dbPool.getConnection());
    const isLocalTrx = !externalConnection;

    try {
      if (isLocalTrx) {
        await conn.beginTransaction();
      }

      const materialId = Number(data.material_id);
      const storeId = Number(data.store_id || 1);
      const qtyIn = Math.max(0, Number(data.qty_in || 0));
      const qtyOut = Math.max(0, Number(data.qty_out || 0));
      const rate = Number(data.rate || 0);
      const txnDate = data.txn_date || new Date().toISOString().split('T')[0];

      if (!materialId || isNaN(materialId)) {
        throw new Error('Valid material_id is required for stock transactions');
      }
      if (qtyIn === 0 && qtyOut === 0) {
        throw new Error('Transaction must specify either qty_in or qty_out greater than zero');
      }

      // 1. Pessimistic Row Lock on Material + Store Balance
      const [balanceRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT on_hand_qty, reserved_qty 
         FROM material_store_balances 
         WHERE material_id = ? AND store_id = ? 
         FOR UPDATE`,
        [materialId, storeId]
      );

      let onHand = 0;
      let reserved = 0;
      if (balanceRows.length > 0) {
        onHand = Number(balanceRows[0].on_hand_qty || 0);
        reserved = Number(balanceRows[0].reserved_qty || 0);
      } else {
        // Initialize balance row if missing
        await conn.query(
          `INSERT INTO material_store_balances (material_id, store_id, on_hand_qty, reserved_qty)
           VALUES (?, ?, 0.00, 0.00)
           ON DUPLICATE KEY UPDATE updated_at = NOW()`,
          [materialId, storeId]
        );
      }

      // 2. Strict Non-Negative Stock Validation (Consumption operates against issued balance, not store inventory)
      if (qtyOut > 0 && data.txn_type !== 'consumption') {
        const available = onHand - reserved;
        if (available < qtyOut) {
          throw new StockInsufficientError(qtyOut, available);
        }
      }

      // 3. Reversal Validation
      if (data.txn_type === 'reversal' && data.reversal_of_id) {
        const [origRow]: [RowDataPacket[], any] = await conn.query(
          `SELECT ledger_id FROM stock_ledger WHERE ledger_id = ?`,
          [data.reversal_of_id]
        );
        if (origRow.length === 0) {
          throw new Error(`Referenced ledger row ${data.reversal_of_id} for reversal does not exist`);
        }
        // Check if already reversed
        const [alreadyReversed]: [RowDataPacket[], any] = await conn.query(
          `SELECT ledger_id FROM stock_ledger WHERE reversal_of_id = ?`,
          [data.reversal_of_id]
        );
        if (alreadyReversed.length > 0) {
          throw new Error(`Ledger entry ${data.reversal_of_id} has already been reversed`);
        }
      }

      // 4. Idempotency Check for Document Postings
      if (data.ref_type && data.ref_id) {
        const [existingPosting]: [RowDataPacket[], any] = await conn.query(
          `SELECT ledger_id FROM stock_ledger 
           WHERE ref_type = ? AND ref_id = ? AND material_id = ? AND txn_type = ?`,
          [data.ref_type, data.ref_id, materialId, data.txn_type]
        );
        if (existingPosting.length > 0) {
          const err: any = new Error(
            `Idempotency violation: ${data.ref_type} #${data.ref_id} for material #${materialId} has already been posted`
          );
          err.statusCode = 409;
          throw err;
        }
      }

      // 5. Append-Only Insert to stock_ledger
      const [insertRes]: [ResultSetHeader, any] = await conn.query(
        `INSERT INTO stock_ledger (
           material_id, store_id, dest_store_id, dest_project_id, txn_type,
           qty_in, qty_out, rate, txn_date, ref_type, ref_id, project_id,
           wbs_id, task_id, reversal_of_id, remarks, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          materialId,
          storeId,
          data.dest_store_id || null,
          data.dest_project_id || null,
          data.txn_type,
          qtyIn,
          qtyOut,
          rate,
          txnDate,
          data.ref_type || null,
          data.ref_id || null,
          data.project_id || null,
          data.wbs_id || null,
          data.task_id || null,
          data.reversal_of_id || null,
          data.remarks || null,
          data.created_by || null,
        ]
      );

      const ledgerId = insertRes.insertId;

      // 6. Update Material Store Balance Row Atomically
      // Note: Consumption records usage against issued stock on site and does NOT deduct store balance again.
      if (data.txn_type !== 'consumption') {
        const netChange = qtyIn - qtyOut;
        await conn.query(
          `UPDATE material_store_balances 
           SET on_hand_qty = on_hand_qty + ?, updated_at = NOW()
           WHERE material_id = ? AND store_id = ?`,
          [netChange, materialId, storeId]
        );
      }

      // 7. Refresh Derived Cached Columns in project_materials (read-only cache)
      if (data.project_id && data.wbs_id) {
        await this.refreshProjectMaterialDerivedCache(conn, data.project_id, data.wbs_id, materialId);
      }

      if (isLocalTrx) {
        await conn.commit();
      }

      return { ledger_id: ledgerId };
    } catch (err) {
      if (isLocalTrx) {
        await conn.rollback();
      }
      throw err;
    } finally {
      if (isLocalTrx) {
        conn.release();
      }
    }
  }

  /**
   * Reserves stock for a project/WBS/task.
   * Atomically locks store balance, validates available quantity, and increments reserved_qty.
   */
  async reserve(
    data: {
      project_id: number;
      wbs_id: number;
      task_id?: number | null;
      material_id: number;
      store_id: number;
      qty: number;
      user_id: number;
    },
    externalConnection?: PoolConnection
  ): Promise<number> {
    const conn = externalConnection || (await dbPool.getConnection());
    const isLocalTrx = !externalConnection;

    try {
      if (isLocalTrx) await conn.beginTransaction();

      const [balanceRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT on_hand_qty, reserved_qty 
         FROM material_store_balances 
         WHERE material_id = ? AND store_id = ? 
         FOR UPDATE`,
        [data.material_id, data.store_id]
      );

      const onHand = Number(balanceRows[0]?.on_hand_qty || 0);
      const reserved = Number(balanceRows[0]?.reserved_qty || 0);
      const available = onHand - reserved;

      if (available < data.qty) {
        throw new StockInsufficientError(data.qty, available);
      }

      // Update reserved_qty in store balance
      await conn.query(
        `UPDATE material_store_balances 
         SET reserved_qty = reserved_qty + ?, updated_at = NOW() 
         WHERE material_id = ? AND store_id = ?`,
        [data.qty, data.material_id, data.store_id]
      );

      // Insert active reservation row
      const [res]: [ResultSetHeader, any] = await conn.query(
        `INSERT INTO material_reservations (
           project_id, wbs_id, task_id, material_id, store_id, reserved_qty, status, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          data.project_id,
          data.wbs_id,
          data.task_id || null,
          data.material_id,
          data.store_id,
          data.qty,
          data.user_id,
        ]
      );

      if (isLocalTrx) await conn.commit();
      return res.insertId;
    } catch (err) {
      if (isLocalTrx) await conn.rollback();
      throw err;
    } finally {
      if (isLocalTrx) conn.release();
    }
  }

  /**
   * Releases an active reservation when materials are issued or the reservation is cancelled.
   */
  async releaseReservation(
    reservationId: number,
    newStatus: 'issued' | 'cancelled',
    externalConnection?: PoolConnection
  ): Promise<void> {
    const conn = externalConnection || (await dbPool.getConnection());
    const isLocalTrx = !externalConnection;

    try {
      if (isLocalTrx) await conn.beginTransaction();

      const [resRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT reservation_id, material_id, store_id, reserved_qty, status 
         FROM material_reservations 
         WHERE reservation_id = ? FOR UPDATE`,
        [reservationId]
      );

      if (resRows.length > 0 && resRows[0].status === 'active') {
        const row = resRows[0];
        await conn.query(
          `UPDATE material_store_balances 
           SET reserved_qty = GREATEST(0, reserved_qty - ?), updated_at = NOW() 
           WHERE material_id = ? AND store_id = ?`,
          [row.reserved_qty, row.material_id, row.store_id]
        );

        await conn.query(
          `UPDATE material_reservations SET status = ? WHERE reservation_id = ?`,
          [newStatus, reservationId]
        );
      }

      if (isLocalTrx) await conn.commit();
    } catch (err) {
      if (isLocalTrx) await conn.rollback();
      throw err;
    } finally {
      if (isLocalTrx) conn.release();
    }
  }

  /**
   * Controlled transfer of stock between stores and/or projects in a single atomic transaction.
   */
  async transferStock(data: {
    from_store_id: number;
    to_store_id: number;
    material_id: number;
    quantity: number;
    reason: string;
    user_id: number;
    from_project_id?: number | null;
    to_project_id?: number | null;
    req_ip?: string;
  }): Promise<{ transfer_out_id: number; transfer_in_id: number }> {
    const qty = Number(data.quantity);
    if (!qty || qty <= 0) {
      throw new Error('Valid transfer quantity greater than zero is required');
    }
    if (data.from_store_id === data.to_store_id && data.from_project_id === data.to_project_id) {
      throw new Error('Source and destination cannot be identical');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // Snapshot material rate
      const [matRows]: [RowDataPacket[], any] = await conn.query(
        `SELECT COALESCE(purchase_rate, rate) AS rate FROM materials WHERE material_id = ?`,
        [data.material_id]
      );
      const rate = Number(matRows[0]?.rate || 0);
      const today = new Date().toISOString().split('T')[0];

      // 1. Transfer Out from source store
      const outRes = await this.post(
        {
          material_id: data.material_id,
          store_id: data.from_store_id,
          dest_store_id: data.to_store_id,
          dest_project_id: data.to_project_id || null,
          txn_type: 'transfer_out',
          qty_in: 0,
          qty_out: qty,
          rate: rate,
          txn_date: today,
          ref_type: 'transfer',
          project_id: data.from_project_id || null,
          remarks: `Transfer out: ${data.reason}`,
          created_by: data.user_id,
        },
        conn
      );

      // 2. Transfer In to destination store
      const inRes = await this.post(
        {
          material_id: data.material_id,
          store_id: data.to_store_id,
          dest_store_id: data.from_store_id,
          dest_project_id: data.from_project_id || null,
          txn_type: 'transfer_in',
          qty_in: qty,
          qty_out: 0,
          rate: rate,
          txn_date: today,
          ref_type: 'transfer',
          ref_id: outRes.ledger_id,
          project_id: data.to_project_id || null,
          remarks: `Transfer in: ${data.reason}`,
          created_by: data.user_id,
        },
        conn
      );

      await conn.commit();

      // Audit log
      await AuditService.log({
        user_id: data.user_id,
        module: 'stock',
        action: 'transfer',
        description: `Transferred ${qty} units of Material #${data.material_id} from Store #${data.from_store_id} to Store #${data.to_store_id}. Reason: ${data.reason}`,
        record_id: outRes.ledger_id,
        ip_address: data.req_ip,
      });

      return { transfer_out_id: outRes.ledger_id, transfer_in_id: inRes.ledger_id };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Records damaged material write-off.
   */
  async recordDamage(data: {
    store_id: number;
    material_id: number;
    quantity: number;
    reason: string;
    user_id: number;
    project_id?: number | null;
    wbs_id?: number | null;
    req_ip?: string;
  }): Promise<{ ledger_id: number }> {
    const qty = Number(data.quantity);
    if (!qty || qty <= 0) {
      throw new Error('Valid damaged quantity greater than zero is required');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A mandatory description of the damage (min 5 characters) is required');
    }

    const [matRows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT COALESCE(purchase_rate, rate) AS rate FROM materials WHERE material_id = ?`,
      [data.material_id]
    );
    const rate = Number(matRows[0]?.rate || 0);

    const res = await this.post({
      material_id: data.material_id,
      store_id: data.store_id || 1,
      txn_type: 'damage',
      qty_in: 0,
      qty_out: qty,
      rate: rate,
      project_id: data.project_id || null,
      wbs_id: data.wbs_id || null,
      remarks: `Damaged write-off: ${data.reason}`,
      created_by: data.user_id,
    });

    await AuditService.log({
      user_id: data.user_id,
      module: 'stock',
      action: 'damage',
      description: `Wrote off ${qty} damaged units of Material #${data.material_id}. Reason: ${data.reason}`,
      record_id: res.ledger_id,
      ip_address: data.req_ip,
    });

    return res;
  }

  /**
   * Refreshes derived project_materials quantities strictly from stock_ledger.
   */
  async refreshProjectMaterialDerivedCache(
    conn: PoolConnection,
    projectId: number,
    wbsId: number,
    materialId: number
  ): Promise<void> {
    // 1. Get sum of GRN receipts for this project, WBS, and material
    const [rcvRows]: [RowDataPacket[], any] = await conn.query(
      `SELECT COALESCE(SUM(qty_in), 0) AS total_received
       FROM stock_ledger
       WHERE project_id = ? AND wbs_id = ? AND material_id = ? AND txn_type = 'grn_receipt'`,
      [projectId, wbsId, materialId]
    );
    const totalReceived = Number(rcvRows[0]?.total_received || 0);

    // 2. Get sum of issues/consumptions
    const [usedRows]: [RowDataPacket[], any] = await conn.query(
      `SELECT COALESCE(SUM(qty_out - qty_in), 0) AS total_used
       FROM stock_ledger
       WHERE project_id = ? AND wbs_id = ? AND material_id = ? AND txn_type IN ('issue', 'consumption', 'return')`,
      [projectId, wbsId, materialId]
    );
    const totalUsed = Math.max(0, Number(usedRows[0]?.total_used || 0));

    // 3. Update project_materials record
    const [pmRow]: [RowDataPacket[], any] = await conn.query(
      `SELECT id, unit_rate, planned_quantity FROM project_materials WHERE project_id = ? AND wbs_id = ? AND material_id = ?`,
      [projectId, wbsId, materialId]
    );

    if (pmRow.length > 0) {
      const pmId = pmRow[0].id;
      const rate = Number(pmRow[0].unit_rate || 0);
      const plannedQty = Number(pmRow[0].planned_quantity || 0);
      const remainingQty = Math.max(0, totalReceived - totalUsed);
      const extraQty = Math.max(0, totalUsed - plannedQty);
      const actualCost = totalUsed * rate;
      const remainingCost = remainingQty * rate;

      await conn.query(
        `UPDATE project_materials 
         SET received_quantity = ?,
             used_quantity = ?,
             remaining_quantity = ?,
             extra_quantity = ?,
             actual_cost = ?,
             remaining_cost = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [totalReceived, totalUsed, remainingQty, extraQty, actualCost, remainingCost, pmId]
      );
    }
  }

  /**
   * Adjusts stock with dedicated permission, mandatory reason, and audit logging.
   */
  async adjustStock(data: StockAdjustmentRequest): Promise<{ ledger_id: number }> {
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A mandatory, descriptive reason (min 5 characters) is required for stock adjustments');
    }
    const qty = Number(data.adjusted_qty);
    if (!qty || isNaN(qty)) {
      throw new Error('Valid adjustment quantity is required');
    }

    const postReq: StockPostRequest = {
      material_id: data.material_id,
      store_id: data.store_id || 1,
      txn_type: 'adjustment',
      qty_in: qty > 0 ? qty : 0,
      qty_out: qty < 0 ? Math.abs(qty) : 0,
      rate: data.rate || 0,
      remarks: data.reason,
      created_by: data.user_id,
    };

    const res = await this.post(postReq);

    // Audit log
    await AuditService.log({
      user_id: data.user_id,
      module: 'stock',
      action: 'adjust',
      description: `Stock adjusted by ${qty} units. Reason: ${data.reason}`,
      record_id: res.ledger_id,
      ip_address: data.req_ip,
    });

    return res;
  }

  /**
   * Returns current on-hand, reserved, and available-to-allocate balances per material and store.
   */
  async getStoreBalances(filters?: { store_id?: number; material_id?: number; search?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        msb.store_id,
        s.store_name,
        s.store_code,
        msb.material_id,
        m.material_code,
        m.material_name,
        m.unit,
        m.category,
        COALESCE(m.purchase_rate, m.rate) AS rate,
        msb.on_hand_qty,
        msb.reserved_qty,
        (msb.on_hand_qty - msb.reserved_qty) AS available_qty,
        (msb.on_hand_qty * COALESCE(m.purchase_rate, m.rate)) AS total_valuation,
        msb.updated_at
      FROM material_store_balances msb
      JOIN materials m ON msb.material_id = m.material_id
      JOIN stores s ON msb.store_id = s.store_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.store_id) {
      sql += ` AND msb.store_id = ?`;
      params.push(filters.store_id);
    }
    if (filters?.material_id) {
      sql += ` AND msb.material_id = ?`;
      params.push(filters.material_id);
    }
    if (filters?.search) {
      sql += ` AND (m.material_name LIKE ? OR m.material_code LIKE ? OR m.category LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY m.material_name ASC`;
    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  /**
   * Retrieves the append-only stock ledger audit trail.
   */
  async getStockLedger(filters?: {
    material_id?: number;
    store_id?: number;
    project_id?: number;
    txn_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<any[]> {
    let sql = `
      SELECT 
        sl.*,
        m.material_name,
        m.material_code,
        m.unit,
        s.store_name,
        p.project_name,
        pw.wbs_name,
        t.task_name,
        e.name AS created_by_name
      FROM stock_ledger sl
      JOIN materials m ON sl.material_id = m.material_id
      JOIN stores s ON sl.store_id = s.store_id
      LEFT JOIN projects p ON sl.project_id = p.project_id
      LEFT JOIN project_wbs pw ON sl.wbs_id = pw.id
      LEFT JOIN tasks t ON sl.task_id = t.task_id
      LEFT JOIN employees e ON sl.created_by = e.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.material_id) {
      sql += ` AND sl.material_id = ?`;
      params.push(filters.material_id);
    }
    if (filters?.store_id) {
      sql += ` AND sl.store_id = ?`;
      params.push(filters.store_id);
    }
    if (filters?.project_id) {
      sql += ` AND sl.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters?.txn_type) {
      sql += ` AND sl.txn_type = ?`;
      params.push(filters.txn_type);
    }
    if (filters?.start_date) {
      sql += ` AND sl.txn_date >= ?`;
      params.push(filters.start_date);
    }
    if (filters?.end_date) {
      sql += ` AND sl.txn_date <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY sl.ledger_id DESC LIMIT ?`;
    params.push(filters?.limit || 200);

    const [rows]: [RowDataPacket[], any] = await dbPool.query(sql, params);
    return rows;
  }

  /**
   * Reverses a previous ledger entry by creating an opposite correction entry.
   */
  async reverse(originalLedgerId: number, userId: number, reason: string): Promise<{ ledger_id: number }> {
    const [rows]: [RowDataPacket[], any] = await dbPool.query(
      `SELECT * FROM stock_ledger WHERE ledger_id = ?`,
      [originalLedgerId]
    );
    if (rows.length === 0) {
      throw new Error(`Ledger entry ${originalLedgerId} not found`);
    }

    const orig = rows[0];
    const postReq: StockPostRequest = {
      material_id: orig.material_id,
      store_id: orig.store_id,
      txn_type: 'reversal',
      qty_in: orig.qty_out,
      qty_out: orig.qty_in,
      rate: orig.rate,
      ref_type: 'reversal',
      ref_id: orig.ledger_id,
      project_id: orig.project_id,
      wbs_id: orig.wbs_id,
      task_id: orig.task_id,
      reversal_of_id: orig.ledger_id,
      remarks: `Reversal of entry #${orig.ledger_id}: ${reason}`,
      created_by: userId,
    };

    return this.post(postReq);
  }
}
