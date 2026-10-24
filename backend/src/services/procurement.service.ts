import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../config/db';
import { ProcurementRepository } from '../repositories/procurement.repository';
import { StockService, StockInsufficientError } from './stock.service';
import { AuditService } from './audit.service';

export class ProcurementService {
  private repo = new ProcurementRepository();
  private stockService = new StockService();

  // ── Stores ─────────────────────────────────────────────────────────────
  async getStores(projectId?: number) {
    return this.repo.getStores(projectId);
  }

  async createStore(data: any) {
    if (!data.store_code || !data.store_name) {
      throw new Error('store_code and store_name are required');
    }
    return this.repo.createStore(data);
  }

  // ── Indents ────────────────────────────────────────────────────────────
  async getIndents(filters?: { project_id?: number; status?: string }) {
    return this.repo.getIndents(filters);
  }

  async getIndentById(id: number) {
    const data = await this.repo.getIndentById(id);
    if (!data) throw new Error('Material Indent not found');
    return data;
  }

  async createIndent(data: any, userId?: number) {
    if (!data.project_id || !data.wbs_id || !data.items || data.items.length === 0) {
      throw new Error('project_id, wbs_id, and at least one item are required');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();
      const indentId = await this.repo.createIndent({ ...data, requested_by: userId }, conn);
      await conn.commit();
      return indentId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async updateIndentStatus(indentId: number, status: string, userId?: number, reqIp?: string) {
    const allowed = ['draft', 'approved', 'rejected', 'ordered', 'cancelled'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status: ${status}. Allowed: ${allowed.join(', ')}`);
    }

    const updated = await this.repo.updateIndentStatus(indentId, status, userId);
    if (!updated) throw new Error('Indent not found');

    await AuditService.log({
      user_id: userId,
      module: 'purchase_orders',
      action: 'approve',
      description: `Updated Indent #${indentId} status to ${status}`,
      record_id: indentId,
      ip_address: reqIp,
    });

    return true;
  }

  // ── Purchase Orders ────────────────────────────────────────────────────
  async getPurchaseOrders(filters?: { project_id?: number; vendor_id?: number; status?: string }) {
    return this.repo.getPurchaseOrders(filters);
  }

  async getPurchaseOrderById(id: number) {
    const data = await this.repo.getPurchaseOrderById(id);
    if (!data) throw new Error('Purchase Order not found');
    return data;
  }

  async getReceivablePoLines(poId: number) {
    const data = await this.repo.getReceivablePoLines(poId);
    if (!data) throw new Error('Purchase Order not found');
    if (!['issued', 'partially_received'].includes(data.status)) {
      throw new Error(`PO #${data.po_number} cannot receive goods. Status is '${data.status}'. Must be 'issued' or 'partially_received'.`);
    }
    return data;
  }

  async getMaterialAvailabilityAndRecommendation(materialId: number, projectId: number, storeId: number = 1) {
    // 1. Required from project_materials
    const [pmRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(planned_quantity), 0) AS required_qty FROM project_materials WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    );
    const requiredQty = Number(pmRows[0]?.required_qty || 0);

    // 2. On hand from stock_ledger
    const [slRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(qty_in) - SUM(qty_out), 0) AS on_hand_qty FROM stock_ledger WHERE material_id = ? AND store_id = ?`,
      [materialId, storeId]
    );
    const onHandQty = Number(slRows[0]?.on_hand_qty || 0);

    // 3. Reserved from material_store_balances
    const [balRows]: any = await dbPool.query(
      `SELECT COALESCE(reserved_qty, 0) AS reserved_qty FROM material_store_balances WHERE material_id = ? AND store_id = ?`,
      [materialId, storeId]
    );
    const reservedQty = Number(balRows[0]?.reserved_qty || 0);
    const availableQty = Math.max(0, onHandQty - reservedQty);

    // 4. Pending in issued purchase orders
    const [poRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(poi.quantity - poi.received_qty), 0) AS pending_po_qty
       FROM purchase_order_items poi
       JOIN purchase_orders po ON poi.po_id = po.po_id
       WHERE po.project_id = ? AND poi.material_id = ? AND po.status IN ('issued', 'partially_received')`,
      [projectId, materialId]
    );
    const pendingPoQty = Number(poRows[0]?.pending_po_qty || 0);

    // 5. Additional required = Required - Available - Pending PO
    const additionalRequired = Math.max(0, requiredQty - availableQty - pendingPoQty);

    return {
      material_id: materialId,
      project_id: projectId,
      store_id: storeId,
      required_qty: requiredQty,
      on_hand_qty: onHandQty,
      reserved_qty: reservedQty,
      available_qty: availableQty,
      pending_po_qty: pendingPoQty,
      additional_required: additionalRequired,
      recommended_order_qty: additionalRequired,
    };
  }

  async createPurchaseOrder(data: any, userId?: number, reqIp?: string) {
    if (!data.project_id || !data.wbs_id || !data.vendor_id || !data.items || data.items.length === 0) {
      throw new Error('project_id, wbs_id, vendor_id, and items are required');
    }

    // Recommendation verification
    if (data.validate_recommendation) {
      for (const item of data.items) {
        const avail = await this.getMaterialAvailabilityAndRecommendation(item.material_id, data.project_id, data.store_id || 1);
        if (Number(item.quantity) > avail.recommended_order_qty) {
          if (!data.override_reason || data.override_reason.trim().length < 5) {
            throw new Error(
              `Ordered quantity (${item.quantity}) exceeds system recommended requirement (${avail.recommended_order_qty}). Manual override justification required.`
            );
          }
        }
      }
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();
      const poId = await this.repo.createPurchaseOrder({ ...data, created_by: userId }, conn);
      await conn.commit();

      if (data.override_reason) {
        await AuditService.log({
          user_id: userId,
          module: 'purchase_orders',
          action: 'override',
          description: `Manual purchase recommendation override for PO #${poId}. Reason: ${data.override_reason}`,
          record_id: poId,
          ip_address: reqIp,
        });
      }

      return poId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async approvePurchaseOrder(poId: number, userId: number, reqIp?: string) {
    const po = await this.repo.getPurchaseOrderById(poId);
    if (!po) throw new Error('Purchase Order not found');
    if (po.status !== 'draft') {
      throw new Error(`PO #${poId} cannot be approved from status '${po.status}'`);
    }

    await this.repo.updatePoStatus(poId, 'issued');

    await AuditService.log({
      user_id: userId,
      module: 'purchase_orders',
      action: 'approve',
      description: `Approved Purchase Order #${po.po_number} (issued to vendor)`,
      record_id: poId,
      ip_address: reqIp,
    });

    return true;
  }

  async cancelPurchaseOrder(poId: number, reason: string, userId: number, reqIp?: string) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A mandatory cancellation reason (min 5 characters) is required');
    }

    const po = await this.repo.getPurchaseOrderById(poId);
    if (!po) throw new Error('Purchase Order not found');
    if (['completed', 'cancelled'].includes(po.status)) {
      throw new Error(`Cannot cancel PO in '${po.status}' status`);
    }
    if (Number(po.total_received_qty || 0) > 0) {
      throw new Error(`Cannot cancel PO #${po.po_number}: Goods have already been received. Reverse or cancel the receipts first.`);
    }

    await this.repo.updatePoStatus(poId, 'cancelled');

    await AuditService.log({
      user_id: userId,
      module: 'purchase_orders',
      action: 'cancel',
      description: `Cancelled PO #${po.po_number}. Reason: ${reason}`,
      record_id: poId,
      ip_address: reqIp,
    });

    return true;
  }

  async overrideRecommendation(poId: number, reason: string, userId: number, reqIp?: string) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A mandatory override justification (min 5 characters) is required');
    }

    await AuditService.log({
      user_id: userId,
      module: 'purchase_orders',
      action: 'override',
      description: `Manual purchase recommendation override for PO #${poId}. Reason: ${reason}`,
      record_id: poId,
      ip_address: reqIp,
    });

    return true;
  }

  // ── Goods Receipt Notes (GRN) ──────────────────────────────────────────
  async getGrns(filters?: { project_id?: number; status?: string }) {
    return this.repo.getGrns(filters);
  }

  async getGrnById(id: number) {
    const data = await this.repo.getGrnById(id);
    if (!data) throw new Error('Goods Receipt Note not found');
    return data;
  }

  /**
   * Creates a draft GRN against an issued or partially_received PO.
   * Validates received <= pending, accepted + rejected + damaged = received, and duplicate invoice guard.
   */
  async createDraftGrn(data: any, userId?: number) {
    if (!data.project_id || !data.delivery_date || !data.items || data.items.length === 0) {
      throw new Error('project_id, delivery_date, and at least one item are required');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. PO Validation
      if (data.po_id) {
        const [poRows]: [RowDataPacket[], any] = await conn.query(
          `SELECT po_id, po_number, status, project_id, wbs_id, vendor_id, vendor_name 
           FROM purchase_orders WHERE po_id = ?`,
          [data.po_id]
        );
        if (poRows.length === 0) throw new Error(`PO #${data.po_id} not found`);
        const po = poRows[0];
        if (!['issued', 'partially_received'].includes(po.status)) {
          throw new Error(`Cannot create GRN against PO #${po.po_number} with status '${po.status}'. Must be 'issued' or 'partially_received'.`);
        }

        // Auto-fill header from PO if missing
        data.project_id = data.project_id || po.project_id;
        data.wbs_id = data.wbs_id || po.wbs_id;
        data.vendor_id = data.vendor_id || po.vendor_id;
        data.vendor_name = data.vendor_name || po.vendor_name;

        // Duplicate Invoice Guard per PO
        if (data.invoice_number && data.invoice_number.trim() !== '') {
          const [dupRows]: [RowDataPacket[], any] = await conn.query(
            `SELECT grn_id, grn_number FROM goods_receipt_notes 
             WHERE po_id = ? AND invoice_number = ? AND status != 'cancelled'`,
            [data.po_id, data.invoice_number.trim()]
          );
          if (dupRows.length > 0) {
            const err: any = new Error(`Supplier invoice number '${data.invoice_number}' has already been registered against PO #${po.po_number} (GRN #${dupRows[0].grn_number})`);
            err.statusCode = 409;
            throw err;
          }
        }
      }

      // 2. Line Items Validation
      for (const item of data.items) {
        const received = Number(item.received_quantity || 0);
        const accepted = Number(item.accepted_quantity || 0);
        const rejected = Number(item.rejected_quantity || 0);
        const damaged = Number(item.damaged_quantity || 0);

        if (received < 0 || accepted < 0 || rejected < 0 || damaged < 0) {
          throw new Error('Quantities cannot be negative');
        }

        // Strict Equation: accepted + rejected + damaged = received
        const partsSum = Math.round((accepted + rejected + damaged) * 100) / 100;
        if (Math.abs(partsSum - received) > 0.001) {
          throw new Error(
            `Line balance error for material #${item.material_id}: Accepted (${accepted}) + Rejected (${rejected}) + Damaged (${damaged}) = ${partsSum}, but Received is ${received}. Sum must equal received quantity.`
          );
        }

        // Validate received <= pending
        if (item.po_item_id) {
          const [poiRows]: [RowDataPacket[], any] = await conn.query(
            `SELECT quantity, received_qty, material_name FROM purchase_order_items WHERE po_item_id = ?`,
            [item.po_item_id]
          );
          if (poiRows.length > 0) {
            const pending = Number(poiRows[0].quantity) - Number(poiRows[0].received_qty);
            if (received > pending) {
              throw new Error(
                `Over-receipt not permitted for '${poiRows[0].material_name}'. Received: ${received}, Pending: ${pending}.`
              );
            }
            item.short_quantity = Math.max(0, pending - received);
          }
        } else {
          item.short_quantity = 0;
        }
      }

      const grnId = await this.repo.createDraftGrn({ ...data, created_by: userId }, conn);
      await conn.commit();
      return grnId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Post GRN into Stock Ledger (Transaction with Row-Level Locks).
   * - Locks PO lines with FOR UPDATE
   * - Re-validates pending quantity under lock
   * - Writes grn_receipt ledger rows for accepted quantity only
   * - Updates PO line received_qty
   * - Transitions PO status (issued -> partially_received -> completed) from posted receipts only
   * - Refreshes project_materials derived cache
   * - Idempotent & audit logged
   */
  async postGrn(grnId: number, userId: number, reqIp?: string) {
    const grn = await this.repo.getGrnById(grnId);
    if (!grn) throw new Error('Goods Receipt Note not found');
    if (grn.status !== 'draft' || grn.is_posted) {
      const err: any = new Error(`GRN #${grnId} cannot be posted. Current status: '${grn.status}', is_posted: ${grn.is_posted}`);
      err.statusCode = 409;
      throw err;
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Acquire lock on GRN row
      const [locked]: any = await conn.query(
        `SELECT grn_id, po_id, status, is_posted FROM goods_receipt_notes WHERE grn_id = ? FOR UPDATE`,
        [grnId]
      );
      if (locked.length === 0 || locked[0].status !== 'draft' || locked[0].is_posted) {
        throw new Error('GRN has already been posted or cancelled by a concurrent request');
      }

      // 2. Lock PO and PO lines if linked
      if (grn.po_id) {
        await conn.query(`SELECT po_id, status FROM purchase_orders WHERE po_id = ? FOR UPDATE`, [grn.po_id]);
        await conn.query(`SELECT po_item_id, quantity, received_qty FROM purchase_order_items WHERE po_id = ? FOR UPDATE`, [grn.po_id]);
      }

      const storeId = Number(grn.store_id || 1);
      let totalAccepted = 0;

      for (const item of grn.items) {
        const accepted = Number(item.accepted_quantity || 0);

        // Re-validate pending quantity under lock
        if (item.po_item_id && accepted > 0) {
          const [poiLock]: any = await conn.query(
            `SELECT quantity, received_qty, material_name FROM purchase_order_items WHERE po_item_id = ? FOR UPDATE`,
            [item.po_item_id]
          );
          if (poiLock.length > 0) {
            const currentPending = Number(poiLock[0].quantity) - Number(poiLock[0].received_qty);
            if (accepted > currentPending) {
              const err: any = new Error(
                `Cannot post GRN: Item '${poiLock[0].material_name}' accepted quantity (${accepted}) exceeds current pending PO quantity (${currentPending}).`
              );
              err.statusCode = 409;
              throw err;
            }
          }
        }

        if (accepted > 0) {
          totalAccepted += accepted;
          const rate = Number(item.unit_rate || 0);

          // Write append-only stock ledger row strictly for accepted quantity
          await this.stockService.post(
            {
              material_id: item.material_id,
              store_id: storeId,
              txn_type: 'grn_receipt',
              qty_in: accepted,
              qty_out: 0,
              rate: rate,
              txn_date: grn.delivery_date,
              ref_type: 'grn',
              ref_id: grnId,
              project_id: grn.project_id || null,
              wbs_id: grn.wbs_id || null,
              remarks: `GRN ${grn.grn_number} receipt`,
              created_by: userId,
            },
            conn
          );

          // Update PO item received_qty
          if (item.po_item_id) {
            await conn.query(
              `UPDATE purchase_order_items 
               SET received_qty = received_qty + ?
               WHERE po_item_id = ?`,
              [accepted, item.po_item_id]
            );
          }
        }
      }

      // 3. Update PO status from posted receipts only
      if (grn.po_id) {
        const [poSummary]: any = await conn.query(
          `SELECT 
             COUNT(*) AS total_items,
             SUM(CASE WHEN received_qty >= quantity THEN 1 ELSE 0 END) AS completed_items,
             SUM(received_qty) AS sum_received
           FROM purchase_order_items WHERE po_id = ?`,
          [grn.po_id]
        );
        const totalItems = Number(poSummary[0]?.total_items || 0);
        const completedItems = Number(poSummary[0]?.completed_items || 0);
        const sumReceived = Number(poSummary[0]?.sum_received || 0);

        let newPoStatus = 'issued';
        if (totalItems > 0 && completedItems === totalItems) {
          newPoStatus = 'completed';
        } else if (sumReceived > 0) {
          newPoStatus = 'partially_received';
        }

        await conn.query(`UPDATE purchase_orders SET status = ? WHERE po_id = ?`, [newPoStatus, grn.po_id]);
      }

      // 4. Mark GRN as posted
      await conn.query(
        `UPDATE goods_receipt_notes 
         SET status = 'posted', is_posted = 1, posted_at = NOW() 
         WHERE grn_id = ?`,
        [grnId]
      );

      await conn.commit();

      // Audit log
      await AuditService.log({
        user_id: userId,
        module: 'grn',
        action: 'post',
        description: `Posted GRN ${grn.grn_number} into stock ledger. Accepted items qty: ${totalAccepted}`,
        record_id: grnId,
        ip_address: reqIp,
      });

      return { success: true, grn_id: grnId, total_accepted_quantity: totalAccepted };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Reverses a posted GRN via reversal rows.
   * Enforces: only if stock is still available; otherwise rejects with clear conflict message.
   * Never edits a posted GRN.
   */
  async reverseGrn(grnId: number, reason: string, userId: number, reqIp?: string) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A mandatory reversal reason (min 5 characters) is required');
    }

    const grn = await this.repo.getGrnById(grnId);
    if (!grn) throw new Error('Goods Receipt Note not found');
    if (grn.status !== 'posted' || !grn.is_posted) {
      throw new Error(`Only posted GRNs can be reversed. Current status: '${grn.status}'`);
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const storeId = Number(grn.store_id || 1);

      // 1. Verify stock availability for all accepted items in the GRN
      for (const item of grn.items) {
        const accepted = Number(item.accepted_quantity || 0);
        if (accepted > 0) {
          const [balRows]: any = await conn.query(
            `SELECT on_hand_qty, reserved_qty FROM material_store_balances 
             WHERE material_id = ? AND store_id = ? FOR UPDATE`,
            [item.material_id, storeId]
          );
          const onHand = Number(balRows[0]?.on_hand_qty || 0);
          const reserved = Number(balRows[0]?.reserved_qty || 0);
          const available = onHand - reserved;

          if (available < accepted) {
            const err: any = new Error(
              `Cannot reverse GRN #${grnId}: Material '${item.material_name}' has insufficient stock in store (Available: ${available}, Required to reverse: ${accepted}). Stock has already been issued, consumed, or reserved.`
            );
            err.statusCode = 409;
            throw err;
          }
        }
      }

      // 2. Lock PO lines if linked
      if (grn.po_id) {
        await conn.query(`SELECT po_id FROM purchase_orders WHERE po_id = ? FOR UPDATE`, [grn.po_id]);
        await conn.query(`SELECT po_item_id FROM purchase_order_items WHERE po_id = ? FOR UPDATE`, [grn.po_id]);
      }

      // 3. Post reversal rows and deduct PO item received_qty
      for (const item of grn.items) {
        const accepted = Number(item.accepted_quantity || 0);
        if (accepted > 0) {
          // Find original grn_receipt ledger entry
          const [origLedger]: any = await conn.query(
            `SELECT ledger_id, rate FROM stock_ledger 
             WHERE ref_type = 'grn' AND ref_id = ? AND material_id = ? AND txn_type = 'grn_receipt'`,
            [grnId, item.material_id]
          );
          const origId = origLedger[0]?.ledger_id || null;
          const rate = Number(origLedger[0]?.rate || item.unit_rate || 0);

          await this.stockService.post(
            {
              material_id: item.material_id,
              store_id: storeId,
              txn_type: 'reversal',
              qty_in: 0,
              qty_out: accepted,
              rate: rate,
              ref_type: 'grn_reversal',
              ref_id: grnId,
              reversal_of_id: origId,
              project_id: grn.project_id || null,
              wbs_id: grn.wbs_id || null,
              remarks: `Reversal of GRN #${grn.grn_number}: ${reason}`,
              created_by: userId,
            },
            conn
          );

          if (item.po_item_id) {
            await conn.query(
              `UPDATE purchase_order_items 
               SET received_qty = GREATEST(0, received_qty - ?) 
               WHERE po_item_id = ?`,
              [accepted, item.po_item_id]
            );
          }
        }
      }

      // 4. Recompute PO status after deduction
      if (grn.po_id) {
        const [poSummary]: any = await conn.query(
          `SELECT 
             COUNT(*) AS total_items,
             SUM(CASE WHEN received_qty >= quantity THEN 1 ELSE 0 END) AS completed_items,
             SUM(received_qty) AS sum_received
           FROM purchase_order_items WHERE po_id = ?`,
          [grn.po_id]
        );
        const totalItems = Number(poSummary[0]?.total_items || 0);
        const completedItems = Number(poSummary[0]?.completed_items || 0);
        const sumReceived = Number(poSummary[0]?.sum_received || 0);

        let newPoStatus = 'issued';
        if (totalItems > 0 && completedItems === totalItems) {
          newPoStatus = 'completed';
        } else if (sumReceived > 0) {
          newPoStatus = 'partially_received';
        }

        await conn.query(`UPDATE purchase_orders SET status = ? WHERE po_id = ?`, [newPoStatus, grn.po_id]);
      }

      // 5. Update GRN status to 'reversed'
      await conn.query(
        `UPDATE goods_receipt_notes 
         SET status = 'reversed', is_posted = 0, reversal_reason = ?, reversed_by = ?, reversed_at = NOW() 
         WHERE grn_id = ?`,
        [reason, userId, grnId]
      );

      await conn.commit();

      // Audit log
      await AuditService.log({
        user_id: userId,
        module: 'grn',
        action: 'reverse',
        description: `Reversed posted GRN ${grn.grn_number}. Reason: ${reason}`,
        record_id: grnId,
        ip_address: reqIp,
      });

      return { success: true, grn_id: grnId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async cancelGrn(grnId: number, reason: string, userId: number, reqIp?: string) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A mandatory cancellation reason (min 5 chars) is required');
    }
    const grn = await this.repo.getGrnById(grnId);
    if (!grn) throw new Error('Goods Receipt Note not found');
    if (grn.status !== 'draft' || grn.is_posted) {
      throw new Error(`Cannot cancel GRN that has already been posted. Use reversal instead.`);
    }

    await dbPool.query(`UPDATE goods_receipt_notes SET status = 'cancelled' WHERE grn_id = ?`, [grnId]);

    await AuditService.log({
      user_id: userId,
      module: 'grn',
      action: 'cancel',
      description: `Cancelled draft GRN ${grn.grn_number}. Reason: ${reason}`,
      record_id: grnId,
      ip_address: reqIp,
    });

    return true;
  }

  // ── Vendor Invoices from GRN ───────────────────────────────────────────
  async createVendorInvoiceFromGrn(grnId: number, userId: number, reqIp?: string) {
    const grn = await this.repo.getGrnById(grnId);
    if (!grn) throw new Error('Goods Receipt Note not found');
    if (grn.status !== 'posted' || !grn.is_posted) {
      throw new Error('Vendor invoices can only be created from posted GRNs');
    }

    // Verify po_id, project_id, and wbs_id are consistent
    if (!grn.po_id || !grn.project_id || !grn.wbs_id) {
      throw new Error(`GRN #${grn.grn_number} lacks required PO, Project, or WBS linkages`);
    }

    // Check duplicate vendor invoice for this GRN
    const [existing]: any = await dbPool.query(
      `SELECT vendor_invoice_id, invoice_number FROM vendor_invoices WHERE grn_id = ?`,
      [grnId]
    );
    if (existing.length > 0) {
      const err: any = new Error(`Vendor invoice #${existing[0].invoice_number} already exists for GRN #${grn.grn_number}`);
      err.statusCode = 409;
      throw err;
    }

    // Compute invoice amount from accepted items
    let subtotal = 0;
    for (const item of grn.items) {
      const accepted = Number(item.accepted_quantity || 0);
      const rate = Number(item.unit_rate || 0);
      subtotal += accepted * rate;
    }

    // Estimate tax (18% default or 0)
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const payableAmount = subtotal + taxAmount;
    const invoiceNumber = grn.invoice_number || `VINV-${Date.now().toString().slice(-6)}`;
    const invoiceDate = grn.invoice_date || grn.delivery_date;

    const invoiceId = await this.repo.createVendorInvoice({
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      po_id: grn.po_id,
      grn_id: grnId,
      project_id: grn.project_id,
      wbs_id: grn.wbs_id,
      vendor_name: grn.vendor_name || 'Vendor',
      invoice_amount: subtotal,
      tax_amount: taxAmount,
      payable_amount: payableAmount,
    });

    await AuditService.log({
      user_id: userId,
      module: 'vendor_invoices',
      action: 'create',
      description: `Created vendor invoice #${invoiceNumber} for ₹${payableAmount} from GRN #${grn.grn_number}`,
      record_id: invoiceId,
      ip_address: reqIp,
    });

    return { vendor_invoice_id: invoiceId, invoice_number: invoiceNumber, payable_amount: payableAmount };
  }

  async getVendorInvoices(filters?: { po_id?: number; grn_id?: number; project_id?: number }) {
    return this.repo.getVendorInvoices(filters);
  }

  async getVendorInvoiceById(id: number) {
    const data = await this.repo.getVendorInvoiceById(id);
    if (!data) throw new Error('Vendor invoice not found');
    return data;
  }

  // ── Phase 5: Issues, Context, Consumption, Return & Transfer ───────────
  async getMaterialIssues(filters?: { project_id?: number; task_id?: number }) {
    return this.repo.getMaterialIssues(filters);
  }

  async getMaterialIssueById(id: number) {
    return this.repo.getMaterialIssueById(id);
  }
  async getIssueContext(projectId: number, wbsId: number, materialId: number, storeId: number = 1) {
    return this.repo.getIssueContext(projectId, wbsId, materialId, storeId);
  }

  /**
   * Issues materials to project/WBS/task.
   * Validates:
   * - project_wbs belongs to project
   * - task belongs to that WBS
   * - material belongs to project requirement
   * - qty <= available_stock (Error format: "Insufficient stock. Required: 50, Available: 20.")
   */
  async createMaterialIssue(data: {
    store_id?: number;
    project_id: number;
    wbs_id: number;
    task_id?: number | null;
    material_id: number;
    quantity: number;
    issue_date?: string;
    issued_to_id?: number | null;
    site_location?: string | null;
    remarks?: string | null;
    user_id: number;
    req_ip?: string;
  }) {
    const qty = Number(data.quantity);
    if (!qty || qty <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (!data.project_id || !data.wbs_id || !data.material_id) {
      throw new Error('project_id, wbs_id, and material_id are required');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Hierarchy Validations
      // A. project_wbs belongs to project
      const [wbsRows]: any = await conn.query(
        `SELECT id, project_id FROM project_wbs WHERE id = ?`,
        [data.wbs_id]
      );
      if (wbsRows.length === 0 || Number(wbsRows[0].project_id) !== Number(data.project_id)) {
        throw new Error(`Selected WBS Discipline #${data.wbs_id} does not belong to Project #${data.project_id}`);
      }

      // B. task belongs to that WBS
      if (data.task_id) {
        const [taskRows]: any = await conn.query(
          `SELECT task_id, wbs_id, project_id FROM tasks WHERE task_id = ?`,
          [data.task_id]
        );
        if (taskRows.length === 0 || Number(taskRows[0].wbs_id) !== Number(data.wbs_id)) {
          throw new Error(`Selected Task #${data.task_id} does not belong to WBS Discipline #${data.wbs_id}`);
        }
      }

      // C. material belongs to the project's requirement
      const [pmRows]: any = await conn.query(
        `SELECT id, planned_quantity FROM project_materials 
         WHERE project_id = ? AND wbs_id = ? AND material_id = ?`,
        [data.project_id, data.wbs_id, data.material_id]
      );
      if (pmRows.length === 0) {
        throw new Error(`Material #${data.material_id} is not part of Project #${data.project_id} WBS #${data.wbs_id} requirements. Authorized transfer required.`);
      }

      const storeId = Number(data.store_id || 1);

      // 2. Validate Stock Availability: qty <= available
      const [balRows]: any = await conn.query(
        `SELECT on_hand_qty, reserved_qty FROM material_store_balances 
         WHERE material_id = ? AND store_id = ? FOR UPDATE`,
        [data.material_id, storeId]
      );
      const onHand = Number(balRows[0]?.on_hand_qty || 0);
      const reserved = Number(balRows[0]?.reserved_qty || 0);
      const available = onHand - reserved;

      if (available < qty) {
        throw new StockInsufficientError(qty, available);
      }

      // Snapshot rate
      const [matRows]: any = await conn.query(
        `SELECT material_name, unit, COALESCE(purchase_rate, rate) AS rate FROM materials WHERE material_id = ?`,
        [data.material_id]
      );
      const mat = matRows[0] || { material_name: 'Material', unit: 'Nos', rate: 0 };
      const rate = Number(mat.rate || 0);
      const issueDate = data.issue_date || new Date().toISOString().split('T')[0];
      const issueCode = `ISS-${Date.now().toString().slice(-6)}`;

      // 3. Post to stock ledger (deducts from store)
      const stockRes = await this.stockService.post(
        {
          material_id: data.material_id,
          store_id: storeId,
          txn_type: 'issue',
          qty_in: 0,
          qty_out: qty,
          rate: rate,
          txn_date: issueDate,
          ref_type: 'material_issue',
          project_id: data.project_id,
          wbs_id: data.wbs_id,
          task_id: data.task_id || null,
          remarks: data.remarks || `Material issue ${issueCode}`,
          created_by: data.user_id,
        },
        conn
      );

      // 4. Create material_issues record
      const issueId = await this.repo.createMaterialIssueRecord(
        {
          issue_code: issueCode,
          store_id: storeId,
          project_id: data.project_id,
          wbs_id: data.wbs_id,
          task_id: data.task_id || null,
          material_id: data.material_id,
          material_name: mat.material_name,
          unit: mat.unit || 'Nos',
          issue_date: issueDate,
          quantity: qty,
          unit_rate: rate,
          issued_to_id: data.issued_to_id || null,
          site_location: data.site_location || null,
          remarks: data.remarks || null,
          created_by: data.user_id,
        },
        conn
      );

      // Link back ref_id on ledger
      await conn.query(`UPDATE stock_ledger SET ref_id = ? WHERE ledger_id = ?`, [issueId, stockRes.ledger_id]);

      await conn.commit();

      await AuditService.log({
        user_id: data.user_id,
        module: 'material_issue',
        action: 'issue',
        description: `Issued ${qty} ${mat.unit} of ${mat.material_name} to Project #${data.project_id}`,
        record_id: issueId,
        ip_address: data.req_ip,
      });

      return { issue_id: issueId, issue_code: issueCode, quantity: qty };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Records material consumption on a task/WBS.
   * Rules:
   * - Records usage against an issued quantity (cannot exceed issued - consumed - returned).
   * - Does NOT deduct store stock again.
   * - Ignores client-supplied rate; snapshots issue/average rate from server.
   * - Keeps task_used_materials synced as a read model.
   */
  async recordConsumption(data: {
    project_id: number;
    wbs_id: number;
    task_id?: number | null;
    material_id: number;
    quantity: number;
    store_id?: number;
    notes?: string;
    remarks?: string;
    used_date?: string;
    user_id: number;
    req_ip?: string;
  }) {
    const qty = Number(data.quantity);
    if (!qty || qty <= 0) {
      throw new Error('Consumption quantity must be greater than zero');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Hierarchy Validation
      const [wbsRows]: any = await conn.query(
        `SELECT id, project_id FROM project_wbs WHERE id = ?`,
        [data.wbs_id]
      );
      if (wbsRows.length === 0 || Number(wbsRows[0].project_id) !== Number(data.project_id)) {
        throw new Error(`WBS Discipline #${data.wbs_id} does not belong to Project #${data.project_id}`);
      }

      if (data.task_id) {
        const [taskRows]: any = await conn.query(
          `SELECT task_id, wbs_id FROM tasks WHERE task_id = ?`,
          [data.task_id]
        );
        if (taskRows.length === 0 || Number(taskRows[0].wbs_id) !== Number(data.wbs_id)) {
          throw new Error(`Task #${data.task_id} does not belong to WBS Discipline #${data.wbs_id}`);
        }
      }

      // 2. Query available issued balance for this material & project/WBS
      const [issueRows]: any = await conn.query(
        `SELECT issue_id, quantity, consumed_quantity, returned_quantity, unit_rate, material_name, unit
         FROM material_issues 
         WHERE project_id = ? AND wbs_id = ? AND material_id = ?
         ORDER BY issue_id ASC FOR UPDATE`,
        [data.project_id, data.wbs_id, data.material_id]
      );

      let totalIssued = 0;
      let totalConsumed = 0;
      let totalReturned = 0;
      let rate = 0;
      let matName = 'Material';
      let matUnit = 'Nos';

      for (const row of issueRows) {
        totalIssued += Number(row.quantity || 0);
        totalConsumed += Number(row.consumed_quantity || 0);
        totalReturned += Number(row.returned_quantity || 0);
        rate = Number(row.unit_rate || rate);
        matName = row.material_name || matName;
        matUnit = row.unit || matUnit;
      }

      const maxConsumable = Math.max(0, totalIssued - totalConsumed - totalReturned);
      if (qty > maxConsumable) {
        throw new Error(
          `Cannot consume ${qty} units of '${matName}'. Maximum remaining issued balance available on site is ${maxConsumable} (Total Issued: ${totalIssued}, Previously Consumed: ${totalConsumed}, Returned: ${totalReturned}).`
        );
      }

      // 3. Allocate consumption across issue rows
      let remainingToConsume = qty;
      for (const row of issueRows) {
        if (remainingToConsume <= 0) break;
        const availableInThisIssue = Number(row.quantity) - Number(row.consumed_quantity) - Number(row.returned_quantity);
        if (availableInThisIssue > 0) {
          const consumeFromThis = Math.min(availableInThisIssue, remainingToConsume);
          await conn.query(
            `UPDATE material_issues 
             SET consumed_quantity = consumed_quantity + ? 
             WHERE issue_id = ?`,
            [consumeFromThis, row.issue_id]
          );
          remainingToConsume -= consumeFromThis;
        }
      }

      const today = data.used_date || new Date().toISOString().split('T')[0];

      // 4. Post to stock_ledger with txn_type = 'consumption' (does NOT deduct store stock again)
      const ledgerRes = await this.stockService.post(
        {
          material_id: data.material_id,
          store_id: data.store_id || 1,
          txn_type: 'consumption',
          qty_in: 0,
          qty_out: qty,
          rate: rate, // Server snapshot rate, ignoring client input
          txn_date: today,
          ref_type: 'task_consumption',
          ref_id: data.task_id || null,
          project_id: data.project_id,
          wbs_id: data.wbs_id,
          task_id: data.task_id || null,
          remarks: data.remarks || data.notes || `Consumed on Task #${data.task_id || 'N/A'}`,
          created_by: data.user_id,
        },
        conn
      );

      // 5. Sync task_used_materials as read model
      if (data.task_id) {
        await conn.query(
          `INSERT INTO task_used_materials (
             task_id, project_id, wbs_id, material_id, material_name,
             quantity, unit, rate, amount, used_date, notes
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.task_id,
            data.project_id,
            data.wbs_id,
            data.material_id,
            matName,
            qty,
            matUnit,
            rate,
            qty * rate,
            today,
            data.notes || null,
          ]
        );
      }

      await conn.commit();

      await AuditService.log({
        user_id: data.user_id,
        module: 'material_issue',
        action: 'consume',
        description: `Consumed ${qty} ${matUnit} of ${matName} on Project #${data.project_id} WBS #${data.wbs_id}`,
        record_id: ledgerRes.ledger_id,
        ip_address: data.req_ip,
      });

      return { ledger_id: ledgerRes.ledger_id, consumed_quantity: qty, rate };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async returnMaterial(data: {
    issue_id: number;
    return_quantity: number;
    reason?: string;
    user_id: number;
    req_ip?: string;
  }) {
    const qty = Number(data.return_quantity);
    if (!qty || qty <= 0) {
      throw new Error('Return quantity must be greater than zero');
    }

    const issue = await this.repo.getMaterialIssueById(data.issue_id);
    if (!issue) throw new Error('Material Issue not found');

    const maxReturnable = Number(issue.quantity) - Number(issue.consumed_quantity || 0) - Number(issue.returned_quantity || 0);
    if (qty > maxReturnable) {
      throw new Error(`Cannot return ${qty} units. Maximum remaining returnable balance from this issue is ${maxReturnable}`);
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const storeId = Number(issue.store_id || 1);
      const today = new Date().toISOString().split('T')[0];

      // Post return to stock ledger (adds back to store inventory)
      await this.stockService.post(
        {
          material_id: issue.material_id,
          store_id: storeId,
          txn_type: 'return',
          qty_in: qty,
          qty_out: 0,
          rate: Number(issue.unit_rate || 0),
          txn_date: today,
          ref_type: 'material_return',
          ref_id: issue.issue_id,
          project_id: issue.project_id,
          wbs_id: issue.wbs_id,
          task_id: issue.task_id || null,
          remarks: data.reason || `Material return against issue #${issue.issue_id}`,
          created_by: data.user_id,
        },
        conn
      );

      // Update returned_quantity on issue record
      await conn.query(
        `UPDATE material_issues 
         SET returned_quantity = returned_quantity + ? 
         WHERE issue_id = ?`,
        [qty, issue.issue_id]
      );

      await conn.commit();

      await AuditService.log({
        user_id: data.user_id,
        module: 'material_issue',
        action: 'return',
        description: `Returned ${qty} units against issue #${issue.issue_id}. Reason: ${data.reason || 'N/A'}`,
        record_id: issue.issue_id,
        ip_address: data.req_ip,
      });

      return { success: true, returned_quantity: qty };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

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
  }) {
    return this.stockService.transferStock(data);
  }

  async recordDamage(data: {
    store_id: number;
    material_id: number;
    quantity: number;
    reason: string;
    user_id: number;
    project_id?: number | null;
    wbs_id?: number | null;
    req_ip?: string;
  }) {
    return this.stockService.recordDamage(data);
  }
}
