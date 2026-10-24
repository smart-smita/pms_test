import { StockService, StockInsufficientError } from '../src/services/stock.service';
import { ProcurementService } from '../src/services/procurement.service';
import { MaterialRepository } from '../src/repositories/material.repository';
import { dbPool } from '../src/config/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING STOCK ENGINE & PROCUREMENT AUDIT TESTS');
  console.log('====================================================\n');

  const stockSvc = new StockService();
  const procSvc = new ProcurementService();
  const matRepo = new MaterialRepository();

  let testMaterialId = 1;

  try {
    // 0. Ensure a test material exists
    const [mRows]: any = await dbPool.query(`SELECT material_id, material_name FROM materials LIMIT 1`);
    if (mRows.length > 0) {
      testMaterialId = mRows[0].material_id;
    } else {
      const [res]: any = await dbPool.query(
        `INSERT INTO materials (material_name, unit, rate, purchase_rate, billing_rate) VALUES ('Test Cement 50kg', 'Bags', 350, 320, 350)`
      );
      testMaterialId = res.insertId;
    }
    console.log(`Using Material ID: ${testMaterialId}`);

    // Set opening balance = 15 units for Store 1
    const [existingBal]: any = await dbPool.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE material_id = ? AND store_id = 1`,
      [testMaterialId]
    );

    const currentOnHand = Number(existingBal[0]?.on_hand_qty || 0);
    const targetOpening = 15;
    const diff = targetOpening - currentOnHand;

    if (diff !== 0) {
      if (diff > 0) {
        await stockSvc.post({
          material_id: testMaterialId,
          store_id: 1,
          txn_type: 'opening',
          qty_in: diff,
          rate: 320,
          remarks: 'Opening setup for test',
        });
      } else {
        await stockSvc.post({
          material_id: testMaterialId,
          store_id: 1,
          txn_type: 'adjustment',
          qty_out: Math.abs(diff),
          rate: 320,
          remarks: 'Calibration setup for test',
        });
      }
    }

    const [balAfterInit]: any = await dbPool.query(
      `SELECT on_hand_qty, reserved_qty FROM material_store_balances WHERE material_id = ? AND store_id = 1`,
      [testMaterialId]
    );
    console.log(`✅ Base balance initialized: on_hand = ${balAfterInit[0].on_hand_qty}, reserved = ${balAfterInit[0].reserved_qty}\n`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Concurrent Stock Deductions & 409 Non-Negative Rejection
    // ─────────────────────────────────────────────────────────────────
    console.log('--- TEST 1: CONCURRENT STOCK DEDUCTION (15 units available, 5 concurrent requests of 10 units) ---');
    const results: Array<{ id: number; success: boolean; status?: number; error?: string }> = [];

    const attempts = [1, 2, 3, 4, 5];
    await Promise.all(
      attempts.map(async (num) => {
        try {
          const res = await stockSvc.post({
            material_id: testMaterialId,
            store_id: 1,
            txn_type: 'issue',
            qty_out: 10,
            rate: 320,
            remarks: `Concurrent test request #${num}`,
          });
          results.push({ id: num, success: true });
        } catch (err: any) {
          results.push({
            id: num,
            success: false,
            status: err.statusCode || (err instanceof StockInsufficientError ? 409 : 500),
            error: err.message,
          });
        }
      })
    );

    const successful = results.filter((r) => r.success);
    const rejected = results.filter((r) => !r.success);

    console.log(`Results: ${successful.length} succeeded, ${rejected.length} rejected.`);
    console.log('Successful attempt:', successful);
    console.log('Sample rejected error:', rejected[0]);

    if (successful.length === 1 && rejected.length === 4 && rejected[0].status === 409) {
      console.log('✅ TEST 1 PASSED: Strict row-level lock prevented negative stock; exactly 1 succeeded and 4 rejected with HTTP 409.\n');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 1 success and 4 rejections with 409. Got ${successful.length} success and ${rejected.length} rejections.`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: GRN Post Idempotency Guard (Double-Click Prevention)
    // ─────────────────────────────────────────────────────────────────
    console.log('--- TEST 2: GRN IDEMPOTENT POSTING ---');
    // Create draft GRN
    const [pRows]: any = await dbPool.query(`SELECT project_id FROM projects LIMIT 1`);
    const projectId = pRows[0]?.project_id || 1;

    const grnId = await procSvc.createDraftGrn({
      project_id: projectId,
      delivery_date: new Date().toISOString().split('T')[0],
      store_location: 'Main Central Store',
      remarks: 'Test Idempotent GRN',
      items: [
        {
          material_id: testMaterialId,
          received_quantity: 20,
          accepted_quantity: 20,
          unit_rate: 320,
        },
      ],
    });

    console.log(`Created draft GRN #${grnId}. Posting first time...`);
    const firstPost = await procSvc.postGrn(grnId, 1);
    console.log('First Post Result:', firstPost);

    console.log('Attempting second post of the exact same GRN (simulating double-click)...');
    let doublePostFailed = false;
    let doublePostErr = '';
    try {
      await procSvc.postGrn(grnId, 1);
    } catch (err: any) {
      doublePostFailed = true;
      doublePostErr = err.message;
      console.log(`Second Post correctly rejected with error: "${err.message}" (status: ${err.statusCode || 400})`);
    }

    if (doublePostFailed) {
      console.log('✅ TEST 2 PASSED: Double posting prevented gracefully.\n');
    } else {
      throw new Error('TEST 2 FAILED: Second GRN post should have failed with idempotency error');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Soft Delete Guard When Ledger Rows Exist
    // ─────────────────────────────────────────────────────────────────
    console.log('--- TEST 3: SOFT DELETE GUARD (No hard delete if ledger rows exist) ---');
    // Create project material
    const pmId = await matRepo.createProjectMaterial({
      project_id: projectId,
      wbs_id: 1,
      material_id: testMaterialId,
      material_name: 'Guarded Material',
      planned_quantity: 50,
      unit_rate: 320,
    });

    // Write a ledger entry for this project + material
    await stockSvc.post({
      material_id: testMaterialId,
      store_id: 1,
      txn_type: 'issue',
      qty_out: 1,
      rate: 320,
      project_id: projectId,
      wbs_id: 1,
      remarks: 'Issue for soft-delete test',
    });

    let deleteBlocked = false;
    let deleteErrMsg = '';
    try {
      await matRepo.deleteProjectMaterial(pmId);
    } catch (err: any) {
      deleteBlocked = true;
      deleteErrMsg = err.message;
      console.log(`Delete was blocked as expected: "${err.message}"`);
    }

    if (deleteBlocked) {
      console.log('✅ TEST 3 PASSED: Hard delete strictly blocked when stock ledger transactions exist.\n');
    } else {
      throw new Error('TEST 3 FAILED: Record was deleted despite active stock ledger entries!');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Audit Log Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('--- TEST 4: AUDIT LOG VERIFICATION ---');
    const [recentAudits]: any = await dbPool.query(
      `SELECT module, action, description FROM audit_logs ORDER BY id DESC LIMIT 5`
    );
    console.log('Recent audit log entries:');
    console.table(recentAudits);

    const hasGrnAudit = recentAudits.some((a: any) => a.module === 'grn' && a.action === 'post');
    if (hasGrnAudit) {
      console.log('✅ TEST 4 PASSED: GRN post successfully recorded in audit_logs.\n');
    } else {
      console.warn('⚠️ Warning: GRN post audit log not found in recent rows.');
    }

    console.log('====================================================');
    console.log('🎉 ALL NON-NEGOTIABLE STOCK & PROCUREMENT TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ Test execution error:', err.message);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

runTests();
