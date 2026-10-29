import { dbPool } from '../src/config/db';
import { CustomerAllocationService } from '../src/services/customerAllocation.service';
import { ProjectCustomerRepository } from '../src/repositories/projectCustomer.repository';

async function runModule2Tests() {
  console.log('🧪 Starting Module 2: Project & Customer Model Test Suite...\n');

  const connection = await dbPool.getConnection();
  const service = new CustomerAllocationService();
  const pcRepo = new ProjectCustomerRepository();

  let testProjectId: number = 0;
  let custAId: number = 0;
  let custBId: number = 0;
  let custCId: number = 0;
  let custDId: number = 0;
  let allotAId: number = 0;
  let allotBId: number = 0;
  let allotCId: number = 0;
  let allotDId: number = 0;
  let testQuotationId: number = 0;
  let testInvoiceId: number = 0;

  try {
    // 0. Setup Test Customers
    console.log('--- Step 0: Setting up Test Entities ---');
    const [resA]: any = await connection.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, status)
       VALUES ('CUST-MOD2-A', 'Unitglo Investor A', 'investorA@test.com', '9876543210', 'active')`
    );
    custAId = resA.insertId;

    const [resB]: any = await connection.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, status)
       VALUES ('CUST-MOD2-B', 'Unitglo Investor B', 'investorB@test.com', '9876543211', 'active')`
    );
    custBId = resB.insertId;

    const [resC]: any = await connection.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, status)
       VALUES ('CUST-MOD2-C', 'Unitglo Investor C', 'investorC@test.com', '9876543212', 'active')`
    );
    custCId = resC.insertId;

    const [resD]: any = await connection.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, status)
       VALUES ('CUST-MOD2-D', 'Unitglo Buyer D (Transferee)', 'buyerD@test.com', '9876543213', 'active')`
    );
    custDId = resD.insertId;

    // Create Test Project
    const [resProj]: any = await connection.query(
      `INSERT INTO projects (project_code, project_name, customer_id, budget_amount, approved_quotation_value, status)
       VALUES ('PRJ-MOD2-TEST', 'Azure Residency Tower A', ?, 10000000.00, 10000000.00, 'active')`,
      [custAId]
    );
    testProjectId = resProj.insertId;

    console.log(`Created Project ID: ${testProjectId}, Customers: A(${custAId}), B(${custBId}), C(${custCId}), D(${custDId})`);

    // 1. Attach Multi-Customer Allotments
    console.log('\n--- Test 1: Multi-Customer Allotments & Fractional Share ---');
    allotAId = await pcRepo.create({
      project_id: testProjectId,
      customer_id: custAId,
      unit_number: 'Tower A - 1001',
      allocated_area_sqft: 1000,
      ownership_percentage: 50.00,
      split_rule: 'percentage',
      agreement_value: 5000000.00,
      is_primary_billing_contact: true
    });

    allotBId = await pcRepo.create({
      project_id: testProjectId,
      customer_id: custBId,
      unit_number: 'Tower A - 1002',
      allocated_area_sqft: 600,
      ownership_percentage: 30.00,
      split_rule: 'percentage',
      agreement_value: 3000000.00,
      is_primary_billing_contact: false
    });

    allotCId = await pcRepo.create({
      project_id: testProjectId,
      customer_id: custCId,
      unit_number: 'Tower A - 1003',
      allocated_area_sqft: 400,
      ownership_percentage: 20.00,
      split_rule: 'percentage',
      agreement_value: 2000000.00,
      is_primary_billing_contact: false
    });

    // Add co-applicant to Allotment A
    await pcRepo.addCoApplicant({
      project_customer_id: allotAId,
      co_applicant_name: 'Co-Applicant Jane Doe',
      pan_number: 'ABCDE1234F',
      relationship: 'Spouse'
    });

    const projectCustomers = await pcRepo.getByProjectId(testProjectId);
    if (projectCustomers.length !== 3) {
      throw new Error(`Expected 3 customer allotments, got ${projectCustomers.length}`);
    }
    const retrievedA = projectCustomers.find(c => c.id === allotAId);
    if (!retrievedA?.co_applicants || retrievedA.co_applicants.length !== 1) {
      throw new Error('Co-applicant verification failed');
    }
    console.log('✅ Test 1 Passed: 3 customer allotments attached with fractional ownership & co-applicant verified.');

    // 2. Test Shared WBS Cost Allocation
    console.log('\n--- Test 2: Shared WBS Cost Allocation (Zero-Penny-Loss) ---');
    const wbsCost = 100000.00; // ₹1,00,000 WBS node cost
    const resultPct = await service.calculateSharedWbsCost(testProjectId, wbsCost, 'percentage');
    console.log('Percentage split shares:', resultPct.shares.map(s => `${s.customer_name}: ₹${s.allocated_cost} (${s.share_percentage}%)`));

    const totalAllocated = resultPct.shares.reduce((sum, s) => sum + s.allocated_cost, 0);
    if (Math.abs(totalAllocated - wbsCost) > 0.001) {
      throw new Error(`Rounding variance detected: Expected ₹${wbsCost}, got ₹${totalAllocated}`);
    }
    const shareA = resultPct.shares.find(s => s.project_customer_id === allotAId)?.allocated_cost;
    const shareB = resultPct.shares.find(s => s.project_customer_id === allotBId)?.allocated_cost;
    const shareC = resultPct.shares.find(s => s.project_customer_id === allotCId)?.allocated_cost;

    if (shareA !== 50000 || shareB !== 30000 || shareC !== 20000) {
      throw new Error(`Incorrect percentage split: A=${shareA}, B=${shareB}, C=${shareC}`);
    }

    // Test Area Ratio Split
    const resultArea = await service.calculateSharedWbsCost(testProjectId, 250000.00, 'area_ratio');
    console.log('Area ratio split shares for ₹2,50,000:', resultArea.shares.map(s => `${s.customer_name}: ₹${s.allocated_cost}`));
    const sumArea = resultArea.shares.reduce((sum, s) => sum + s.allocated_cost, 0);
    if (Math.abs(sumArea - 250000.00) > 0.001) {
      throw new Error(`Area ratio rounding mismatch: Expected 250000, got ${sumArea}`);
    }
    console.log('✅ Test 2 Passed: WBS cost split calculated cleanly with zero rounding penny variance.');

    // 3. Test Invoicing & Audit Integrity Deletion Guard
    console.log('\n--- Test 3: Historical Invoice Audit Integrity (Deletion Guard) ---');
    // Create an approved quotation for foreign key integrity
    const [quotRes]: any = await connection.query(
      `INSERT INTO quotations (quotation_code, customer_id, project_id, quotation_date, status)
       VALUES ('QUO-MOD2-TEST', ?, ?, CURRENT_DATE, 'approved')`,
      [custAId, testProjectId]
    );
    testQuotationId = quotRes.insertId;

    // Create an invoice linked to Allotment A
    const [invRes]: any = await connection.query(
      `INSERT INTO invoices (
         invoice_number, quotation_id, customer_id, project_id, project_customer_id, currency_id,
         invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status
       ) VALUES ('INV/MOD2/001', ?, ?, ?, ?, 2, CURRENT_DATE, CURRENT_DATE, 1000000.00, 180000.00, 1180000.00, 'sent')`,
      [testQuotationId, custAId, testProjectId, allotAId]
    );
    testInvoiceId = invRes.insertId;

    let deletionBlocked = false;
    try {
      await service.removeCustomerAllotment(allotAId, 1, '127.0.0.1');
    } catch (err: any) {
      if (err.message.includes('historical invoice')) {
        deletionBlocked = true;
        console.log(`Expected guard triggered: "${err.message}"`);
      } else {
        throw err;
      }
    }

    if (!deletionBlocked) {
      throw new Error('FAILED: removeCustomerAllotment allowed deletion of an allotment with historical invoices!');
    }
    console.log('✅ Test 3 Passed: Hard deletion strictly blocked (409 Conflict) when historical invoices exist.');

    // 4. Test Mid-Project Allotment Transfer
    console.log('\n--- Test 4: Mid-Project Allotment Transfer ---');
    // Add a pending payment schedule for Allotment A (unbilled milestone)
    const [schedRes]: any = await connection.query(
      `INSERT INTO customer_payment_schedules (
         project_customer_id, milestone_name, milestone_percentage, trigger_progress_percentage,
         installment_amount, gst_amount, tds_deductible_amount, net_receivable_amount, status, sort_order
       ) VALUES (?, 'Plinth Completion', 20.00, 20.00, 1000000.00, 180000.00, 10000.00, 1170000.00, 'pending', 1)`,
      [allotAId]
    );
    const testScheduleId = schedRes.insertId;

    // Execute transfer from Customer A to Customer D
    const transferResult = await service.transferCustomerAllotment({
      project_customer_id: allotAId,
      new_customer_id: custDId,
      transfer_reason: 'Allotment transferred due to resale agreement',
      user_id: 1,
      ip_address: '127.0.0.1'
    });

    allotDId = transferResult.new_allotment.id;

    // Verify Old Allotment
    const oldAfter = await pcRepo.getById(allotAId);
    if (oldAfter?.status !== 'transferred' || oldAfter.transferred_to_id !== allotDId) {
      throw new Error(`Old allotment status mismatch: status=${oldAfter?.status}, transferred_to_id=${oldAfter?.transferred_to_id}`);
    }

    // Verify New Allotment
    const newAfter = await pcRepo.getById(allotDId);
    if (newAfter?.status !== 'active' || newAfter.customer_id !== custDId) {
      throw new Error(`New allotment mismatch: status=${newAfter?.status}, customer_id=${newAfter?.customer_id}`);
    }
    // Remaining unbilled balance: ₹50,00,000 - ₹11,80,000 = ₹38,20,000
    console.log(`New Allotment Agreement Value (Remaining Unbilled): ₹${newAfter.agreement_value}`);

    // Verify Pending Schedule re-linked to new allotment
    const [schedCheck]: any = await connection.query(
      `SELECT project_customer_id FROM customer_payment_schedules WHERE id = ?`,
      [testScheduleId]
    );
    if (schedCheck[0].project_customer_id !== allotDId) {
      throw new Error(`Pending schedule was not transferred: expected ${allotDId}, got ${schedCheck[0].project_customer_id}`);
    }

    // Verify Historical Invoice remains tied to Customer A's allotment
    const [invCheck]: any = await connection.query(
      `SELECT project_customer_id, customer_id FROM invoices WHERE invoice_id = ?`,
      [testInvoiceId]
    );
    if (invCheck[0].project_customer_id !== allotAId || invCheck[0].customer_id !== custAId) {
      throw new Error('Historical invoice was improperly modified during transfer!');
    }

    // Verify Audit Log entry
    const [auditRows]: any = await connection.query(
      `SELECT * FROM audit_logs WHERE action = 'TRANSFER_CUSTOMER_ALLOTMENT' AND record_id = ?`,
      [allotAId]
    );
    if (auditRows.length === 0) {
      throw new Error('Audit log for allotment transfer not found');
    }
    console.log('Audit log verified:', auditRows[0].description);
    console.log('✅ Test 4 Passed: Allotment transferred cleanly: historical invoices frozen, unbilled schedules moved, audit logged.');

    // 5. Test Safe Deletion of Unbilled Allotment
    console.log('\n--- Test 5: Safe Deletion of Unbilled Allotment ---');
    const deleteRes = await service.removeCustomerAllotment(allotCId, 1, '127.0.0.1');
    if (!deleteRes.deleted) {
      throw new Error('Failed to delete unbilled allotment');
    }
    const checkDeleted = await pcRepo.getById(allotCId);
    if (checkDeleted) {
      throw new Error('Allotment row still exists after deletion');
    }
    console.log('✅ Test 5 Passed: Unbilled allotment safely deleted without affecting project integrity.');

    console.log('\n🎉 ALL 5 MODULE 2 TESTS PASSED PERFECTLY!\n');
  } finally {
    // Cleanup test data
    console.log('--- Cleaning Up Test Data ---');
    if (testInvoiceId) await connection.query(`DELETE FROM invoices WHERE invoice_id = ?`, [testInvoiceId]);
    if (testQuotationId) await connection.query(`DELETE FROM quotations WHERE quotation_id = ?`, [testQuotationId]);
    if (testProjectId) {
      await connection.query(`DELETE FROM customer_payment_schedules WHERE project_customer_id IN (?, ?, ?, ?)`, [allotAId, allotBId, allotCId, allotDId]);
      await connection.query(`DELETE FROM customer_co_applicants WHERE project_customer_id IN (?, ?, ?, ?)`, [allotAId, allotBId, allotCId, allotDId]);
      await connection.query(`DELETE FROM project_customers WHERE project_id = ?`, [testProjectId]);
      await connection.query(`DELETE FROM projects WHERE project_id = ?`, [testProjectId]);
    }
    await connection.query(`DELETE FROM customers WHERE customer_id IN (?, ?, ?, ?)`, [custAId, custBId, custCId, custDId]);
    connection.release();
    console.log('Cleanup completed.');
  }
}

runModule2Tests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Module 2 Test Failed:', err);
    process.exit(1);
  });
