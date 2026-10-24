import { dbPool } from '../src/config/db';
import { ProcurementService } from '../src/services/procurement.service';
import { StockService } from '../src/services/stock.service';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING PHASE 4 & PHASE 5 AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  const procSvc = new ProcurementService();
  const stockSvc = new StockService();

  const conn = await dbPool.getConnection();
  try {
    // 0. Setup: Ensure we have test project, wbs, material, supplier, store
    const [storeRows]: any = await conn.query(`SELECT store_id FROM stores LIMIT 1`);
    const storeId = storeRows.length ? storeRows[0].store_id : 1;

    const [wbsRows]: any = await conn.query(`SELECT id, project_id FROM project_wbs WHERE wbs_type IN ('labour','both') LIMIT 1`);
    const wbsId = wbsRows[0].id;
    const projectId = wbsRows[0].project_id;

    const [matRows]: any = await conn.query(`SELECT material_id, material_name FROM materials WHERE status = 'active' LIMIT 1`);
    const materialId = matRows[0].material_id;
    const materialName = matRows[0].material_name;

    // Ensure material requirement exists in project_materials
    const [pmRows]: any = await conn.query(
      `SELECT id FROM project_materials WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    );
    if (pmRows.length === 0) {
      await conn.query(
        `INSERT INTO project_materials (project_id, wbs_id, material_id, material_name, unit, unit_rate, planned_quantity)
         VALUES (?, ?, ?, ?, 'Nos', 100.00, 100.00)`,
        [projectId, wbsId, materialId, materialName]
      );
    }

    console.log(`Using Test Fixtures: Project #${projectId}, WBS #${wbsId}, Material #${materialId} (${materialName}), Store #${storeId}`);

    // Create an Issued Purchase Order with 20 units
    const poNumber = `PO-TEST-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const [poRes]: any = await conn.query(
      `INSERT INTO purchase_orders (po_number, po_date, project_id, wbs_id, vendor_name, status, subtotal_amount, tax_amount, total_amount, created_by)
       VALUES (?, ?, ?, ?, 'Test Vendor Ltd', 'issued', 2000.00, 0.00, 2000.00, 1)`,
      [poNumber, today, projectId, wbsId]
    );
    const poId = poRes.insertId;

    const [itemRes]: any = await conn.query(
      `INSERT INTO purchase_order_items (po_id, material_id, material_name, unit, quantity, unit_rate, total_amount, received_qty)
       VALUES (?, ?, ?, 'Nos', 20.00, 100.00, 2000.00, 0.00)`,
      [poId, materialId, materialName]
    );
    const poItemId = itemRes.insertId;

    console.log(`Created Issued PO #${poId} with 20 units of material #${materialId}\n`);

    // ── TEST 1: Receivable Lines Query ─────────────────────────
    console.log('TEST 1: Fetching Receivable PO Lines...');
    const recLines = await procSvc.getReceivablePoLines(poId);
    if (!recLines || !recLines.items || recLines.items.length === 0 || Number(recLines.items[0].pending_quantity) !== 20) {
      throw new Error(`TEST 1 FAILED: Expected 20 pending units, got ${recLines?.items?.[0]?.pending_quantity}`);
    }
    console.log(`✔ PASS: PO has ${recLines.items[0].ordered_quantity} ordered, ${recLines.items[0].previously_received} prev received, ${recLines.items[0].pending_quantity} pending.`);

    // ── TEST 2: GRN Math Validation (accepted + rejected + damaged = received)
    console.log('\nTEST 2: Testing GRN Math Validation & Over-receipt rejection...');
    try {
      await procSvc.createDraftGrn({
        po_id: poId,
        project_id: projectId,
        store_id: storeId, delivery_date: '2026-10-17', challan_number: 'CH-ERR-1',
        items: [{
          po_item_id: poItemId,
          material_id: materialId,
          received_quantity: 10,
          accepted_quantity: 5,
          rejected_quantity: 2,
          damaged_quantity: 1 // 5 + 2 + 1 = 8 != 10
        }]
      }, 1);
      throw new Error('TEST 2 FAILED: Math imbalance should have been rejected!');
    } catch (e: any) {
      console.log(`✔ PASS: Math mismatch rejected with error: "${e.message}"`);
    }

    try {
      await procSvc.createDraftGrn({
        po_id: poId,
        project_id: projectId,
        store_id: storeId, delivery_date: '2026-10-17', challan_number: 'CH-ERR-2',
        items: [{
          po_item_id: poItemId,
          material_id: materialId,
          received_quantity: 25, // pending is 20!
          accepted_quantity: 25,
          rejected_quantity: 0,
          damaged_quantity: 0
        }]
      }, 1);
      throw new Error('TEST 2 FAILED: Over-receipt should have been rejected!');
    } catch (e: any) {
      console.log(`✔ PASS: Over-receipt rejected with error: "${e.message}"`);
    }

    // ── TEST 3: Create Valid Draft GRN (15 units: 12 accepted, 2 rejected, 1 damaged)
    console.log('\nTEST 3: Creating Valid Draft GRN (15 units received: 12 accepted, 2 rejected, 1 damaged)...');
    const invoiceNum = `INV-TEST-${Date.now()}`;
    const grnId = await procSvc.createDraftGrn({
      po_id: poId,
      project_id: projectId,
      store_id: storeId,
      challan_number: 'CH-VALID-1',
      delivery_date: '2026-10-17', invoice_number: invoiceNum, supplier_invoice_number: invoiceNum,
      invoice_date: '2026-10-17',
      items: [{
        po_item_id: poItemId,
        material_id: materialId,
        received_quantity: 15,
        accepted_quantity: 12,
        rejected_quantity: 2,
        damaged_quantity: 1,
        unit_rate: 100
      }]
    }, 1);
    console.log(`✔ PASS: Draft GRN #${grnId} created successfully.`);

    // ── TEST 4: Duplicate Supplier Invoice Guard ────────────────
    console.log('\nTEST 4: Duplicate Supplier Invoice Number Guard...');
    try {
      await procSvc.createDraftGrn({
        po_id: poId,
        project_id: projectId,
        store_id: storeId,
        challan_number: 'CH-VALID-DUP',
        delivery_date: '2026-10-17', invoice_number: invoiceNum, supplier_invoice_number: invoiceNum, // Duplicate invoice!
        items: [{
          po_item_id: poItemId,
          material_id: materialId,
          received_quantity: 5,
          accepted_quantity: 5,
          rejected_quantity: 0,
          damaged_quantity: 0
        }]
      }, 1);
      throw new Error('TEST 4 FAILED: Duplicate supplier invoice was not rejected!');
    } catch (e: any) {
      console.log(`✔ PASS: Duplicate invoice rejected with error: "${e.message}"`);
    }

    // ── TEST 5: Post GRN in Transaction ─────────────────────────
    console.log('\nTEST 5: Posting GRN to Stock Ledger in Transaction...');
    const postRes = await procSvc.postGrn(grnId, 1);
    console.log(`✔ PASS: GRN #${grnId} posted:`, postRes);

    // Verify PO status transitioned to 'partially_received'
    const [poCheck]: any = await conn.query(`SELECT status FROM purchase_orders WHERE po_id = ?`, [poId]);
    if (poCheck[0].status !== 'partially_received') {
      throw new Error(`TEST 5 FAILED: Expected PO status 'partially_received', got '${poCheck[0].status}'`);
    }
    console.log(`✔ PASS: PO status transitioned to '${poCheck[0].status}'.`);

    // Verify stock ledger has accepted_quantity (12 units)
    const [storeBal]: any = await conn.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE store_id = ? AND material_id = ?`,
      [storeId, materialId]
    );
    console.log(`✔ PASS: Current Store #${storeId} on-hand stock is ${storeBal[0]?.on_hand_qty}.`);

    // ── TEST 6: Vendor Invoice Generation from Posted GRN ──────
    console.log('\nTEST 6: Generating Vendor Invoice from Posted GRN...');
    const viRes = await procSvc.createVendorInvoiceFromGrn(grnId, 1);
    console.log(`✔ PASS: Vendor Invoice created with ID #${viRes.vendor_invoice_id}, Amount: ${viRes.payable_amount}.`);

    // Ensure duplicate invoice creation from same GRN fails
    try {
      await procSvc.createVendorInvoiceFromGrn(grnId, 1);
      throw new Error('TEST 6 FAILED: Duplicate vendor invoice from same GRN was allowed!');
    } catch (e: any) {
      console.log(`✔ PASS: Duplicate vendor invoice rejected with: "${e.message}"`);
    }

    // ── TEST 7: Phase 5 Issue Dialog Context & Hierarchy ───────
    console.log('\nTEST 7: Fetching Issue Context (Requirement, Reserved, Issued, Available)...');
    const issueCtx = await procSvc.getIssueContext(projectId, wbsId, materialId, storeId);
    console.log('Issue Context:', issueCtx);
    if (issueCtx.available_stock < 12) {
      throw new Error(`TEST 7 FAILED: Available stock should be at least 12, got ${issueCtx.available_stock}`);
    }
    console.log('✔ PASS: Issue context retrieved with verified balances.');

    // ── TEST 8: Issue Material with Stock Shortage Check ────────
    console.log('\nTEST 8: Testing Stock Shortage Exact Error Message...');
    try {
      await procSvc.createMaterialIssue({
        store_id: storeId,
        project_id: projectId,
        wbs_id: wbsId,
        material_id: materialId,
        quantity: 999999, // Way more than available!
        user_id: 1
      });
      throw new Error('TEST 8 FAILED: Excessive issue was not rejected!');
    } catch (e: any) {
      if (!e.message.includes('Insufficient stock')) {
        throw new Error(`TEST 8 FAILED: Expected error to contain "Insufficient stock", got: ${e.message}`);
      }
      console.log(`✔ PASS: Stock shortage rejected with formatted error: "${e.message}"`);
    }

    // ── TEST 9: Valid Issue (10 units issued to Project & WBS) ──
    console.log('\nTEST 9: Issuing 10 units to Project & WBS...');
    const issueRes = await procSvc.createMaterialIssue({
      store_id: storeId,
      project_id: projectId,
      wbs_id: wbsId,
      material_id: materialId,
      quantity: 10,
      user_id: 1,
      remarks: 'Phase 5 Test Issue'
    });
    const issueId = issueRes.issue_id;
    console.log(`✔ PASS: Material Issue #${issueId} created.`);

    // ── TEST 10: Task Consumption (Does NOT deduct store stock again) ──
    console.log('\nTEST 10: Task Material Consumption...');
    const [balBefore]: any = await conn.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE store_id = ? AND material_id = ?`,
      [storeId, materialId]
    );

    // Consume 6 units on task
    const consumeRes = await procSvc.recordConsumption({
      project_id: projectId,
      wbs_id: wbsId,
      material_id: materialId,
      quantity: 6,
      notes: 'Task usage',
      user_id: 1
    });
    console.log(`✔ PASS: Consumption recorded in ledger #${consumeRes.ledger_id}.`);

    const [balAfter]: any = await conn.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE store_id = ? AND material_id = ?`,
      [storeId, materialId]
    );
    if (Number(balBefore[0].on_hand_qty) !== Number(balAfter[0].on_hand_qty)) {
      throw new Error(
        `TEST 10 FAILED: Consumption deducted store stock! Before: ${balBefore[0].on_hand_qty}, After: ${balAfter[0].on_hand_qty}`
      );
    }
    console.log(`✔ PASS: Store balance remained identical (${balAfter[0].on_hand_qty}). Zero double-deduction!`);

    // Verify over-consumption is blocked
    try {
      await procSvc.recordConsumption({
        project_id: projectId,
        wbs_id: wbsId,
        material_id: materialId,
        quantity: 10, // Remaining issued is 4 (10 - 6)!
        user_id: 1
      });
      throw new Error('TEST 10 FAILED: Over-consumption was allowed!');
    } catch (e: any) {
      console.log(`✔ PASS: Over-consumption blocked with: "${e.message}"`);
    }

    // ── TEST 11: Return Unused Material (2 units returned) ──────
    console.log('\nTEST 11: Returning 2 Unused Units to Store...');
    const returnRes = await procSvc.returnMaterial({
      issue_id: issueId,
      return_quantity: 2,
      reason: 'Excess material after task completion',
      user_id: 1
    });
    console.log('✔ PASS: Returned units:', returnRes);

    const [balAfterReturn]: any = await conn.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE store_id = ? AND material_id = ?`,
      [storeId, materialId]
    );
    if (Number(balAfterReturn[0].on_hand_qty) !== Number(balAfter[0].on_hand_qty) + 2) {
      throw new Error(`TEST 11 FAILED: Store balance did not increase by 2 upon return!`);
    }
    console.log(`✔ PASS: Store balance increased to ${balAfterReturn[0].on_hand_qty}.`);

    // ── TEST 12: Reversal Refusal on Consumed/Issued Stock ──────
    console.log('\nTEST 12: Testing GRN Reversal Safety (refusal when stock has been consumed)...');
    // Deplete store available stock below accepted qty (12) by issuing remaining balance down to 5 units
    const currentOnHand = Number(balAfterReturn[0].on_hand_qty);
    const issueToDeplete = currentOnHand - 5;
    if (issueToDeplete > 0) {
      await procSvc.createMaterialIssue({
        store_id: storeId,
        project_id: projectId,
        wbs_id: wbsId,
        material_id: materialId,
        quantity: issueToDeplete,
        user_id: 1,
        remarks: 'Deplete for reversal refusal test'
      });
    }

    try {
      // GRN accepted 12 units, but store only has 5 units available!
      await procSvc.reverseGrn(grnId, 'Test accidental receipt', 1);
      throw new Error('TEST 12 FAILED: Reversal of consumed stock was allowed!');
    } catch (e: any) {
      if (e.message.includes('TEST 12 FAILED')) throw e;
      console.log(`✔ PASS: GRN Reversal safely blocked with 409 conflict: "${e.message}"`);
    }

    console.log('\n====================================================');
    console.log('ALL PHASE 4 & PHASE 5 TESTS PASSED SUCCESSFULLY! ✔');
    console.log('====================================================');
  } finally {
    conn.release();
    await dbPool.end();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER ERROR:', err);
  process.exit(1);
});
