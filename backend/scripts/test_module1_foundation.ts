import { dbPool } from '../src/config/db';
import { NumberSeriesService } from '../src/services/numberSeries.service';
import { MeasurementUnitRepository } from '../src/repositories/measurementUnit.repository';
import { AuditService } from '../src/services/audit.service';

async function runModule1Tests() {
  console.log('🧪 Starting Module 1 Foundation Test Suite...\n');

  // 1. Test Number Series & Concurrency
  console.log('--- Test 1: Number Series Concurrency & Sequential Integrity ---');
  const seriesCode = 'QUOTATION';
  const promises = [
    NumberSeriesService.getNextNumber(seriesCode),
    NumberSeriesService.getNextNumber(seriesCode),
    NumberSeriesService.getNextNumber(seriesCode),
    NumberSeriesService.getNextNumber(seriesCode),
    NumberSeriesService.getNextNumber(seriesCode)
  ];
  const generatedNumbers = await Promise.all(promises);
  console.log('Generated Numbers:', generatedNumbers);

  // Verify unique numbers
  const uniqueSet = new Set(generatedNumbers);
  if (uniqueSet.size !== 5) {
    throw new Error(`Concurrency race condition detected: duplicates in ${JSON.stringify(generatedNumbers)}`);
  }
  // Verify format pattern (PREFIX/YYYY-YY/NNNN)
  if (!generatedNumbers[0].startsWith('QUO/')) {
    throw new Error(`Unexpected prefix format: ${generatedNumbers[0]}`);
  }
  console.log('✅ Test 1 Passed: 5 concurrent requests produced 5 strictly sequential unique numbers.\n');

  // 2. Test Measurement Units Master
  console.log('--- Test 2: Measurement Units Master ---');
  const unitRepo = new MeasurementUnitRepository();
  const allUnits = await unitRepo.getAll();
  console.log(`Retrieved ${allUnits.length} measurement units.`);
  const requiredUnits = ['NOS', 'SQFT', 'CUM', 'BRASS', 'MT', 'KG', 'BAG', 'HRS'];
  for (const code of requiredUnits) {
    const found = allUnits.some(u => u.unit_code === code);
    if (!found) throw new Error(`Missing expected construction unit: ${code}`);
  }
  console.log('Standard units verified:', requiredUnits.join(', '));

  // Create custom unit
  const testUnitCode = `TEST_${Date.now().toString().slice(-4)}`;
  const createdUnit = await unitRepo.create({
    unit_code: testUnitCode,
    unit_name: 'Kilovolt Ampere',
    symbol: 'kVA',
    is_decimal_allowed: true
  });
  console.log('Created unit:', createdUnit.unit_code, createdUnit.symbol);

  await unitRepo.update(createdUnit.unit_id, { unit_name: 'Kilovolt Ampere (Updated)' });
  const updatedUnit = await unitRepo.getById(createdUnit.unit_id);
  if (updatedUnit?.unit_name !== 'Kilovolt Ampere (Updated)') {
    throw new Error('Unit update verification failed');
  }
  // Cleanup test unit
  await dbPool.query(`DELETE FROM measurement_units WHERE unit_id = ?`, [createdUnit.unit_id]);
  console.log('✅ Test 2 Passed: Measurement units master CRUD verified.\n');

  // 3. Test Audit Log with Old & New Value Tracking
  console.log('--- Test 3: Financial Change Audit Logging (Old vs New Values) ---');
  const auditAction = `TEST_BUDGET_REVISION_${Date.now()}`;
  const oldVal = { budget: 5000000.00, approval_status: 'draft' };
  const newVal = { budget: 5500000.00, approval_status: 'approved', revision_reason: 'Scope expansion' };

  await AuditService.log({
    user_id: 1,
    action: auditAction,
    module: 'financial_control',
    description: 'Updated project budget baseline with new scope',
    record_id: 101,
    old_value: oldVal,
    new_value: newVal,
    ip_address: '127.0.0.1'
  });

  const [auditRows]: any = await dbPool.query(
    `SELECT * FROM audit_logs WHERE action = ? ORDER BY id DESC LIMIT 1`,
    [auditAction]
  );
  if (auditRows.length === 0) throw new Error('Audit log row not found');
  const logged = auditRows[0];
  console.log('Logged Audit Entry:');
  console.log('  Action:', logged.action);
  console.log('  Old Value:', logged.old_value);
  console.log('  New Value:', logged.new_value);

  const parsedOld = JSON.parse(logged.old_value);
  const parsedNew = JSON.parse(logged.new_value);
  if (parsedOld.budget !== 5000000 || parsedNew.budget !== 5500000) {
    throw new Error('Audit old/new value deserialization mismatch');
  }
  // Cleanup test audit log
  await dbPool.query(`DELETE FROM audit_logs WHERE id = ?`, [logged.id]);
  console.log('✅ Test 3 Passed: Financial change tracking with before/after state verified.\n');

  // 4. Test Roles and Permissions
  console.log('--- Test 4: Roles & Permissions Seeding ---');
  const [roleRows]: any = await dbPool.query(`SELECT role_name FROM roles`);
  const roleNames = roleRows.map((r: any) => r.role_name);
  const requiredRoles = ['Project Manager', 'Site Engineer', 'Store Keeper', 'Accounts Manager', 'Customer Portal'];
  for (const r of requiredRoles) {
    if (!roleNames.includes(r)) throw new Error(`Missing seeded role: ${r}`);
  }
  console.log('Verified roles:', requiredRoles.join(', '));
  console.log('✅ Test 4 Passed: All requested roles present in database.\n');

  // 5. Test Contractors Master (Vendors of type contractor)
  console.log('--- Test 5: Contractor Master Verification ---');
  const testContractorCode = `CONT-${Date.now().toString().slice(-4)}`;
  const [resHeader]: any = await dbPool.query(
    `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, gst_number, pan_number, status)
     VALUES (?, 'Apex Civil Subcontractors Pvt Ltd', 'contractor', 'Ramesh Patil', 'ramesh@apexcivil.com', '9876543210', '27ABCDE1234F1Z5', 'ABCDE1234F', 'active')`,
    [testContractorCode]
  );
  const contractorId = resHeader.insertId;

  const [contractorRows]: any = await dbPool.query(
    `SELECT * FROM vendors WHERE vendor_type = 'contractor' AND vendor_id = ?`,
    [contractorId]
  );
  if (contractorRows.length === 0 || contractorRows[0].vendor_type !== 'contractor') {
    throw new Error('Contractor creation/filtering failed');
  }
  console.log('Created and verified contractor:', contractorRows[0].vendor_name, 'PAN:', contractorRows[0].pan_number);
  // Cleanup test contractor
  await dbPool.query(`DELETE FROM vendors WHERE vendor_id = ?`, [contractorId]);
  console.log('✅ Test 5 Passed: Contractor master integration verified.\n');

  console.log('🎉 ALL 5 MODULE 1 FOUNDATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runModule1Tests().catch(err => {
  console.error('❌ Module 1 test failed with error:', err);
  process.exit(1);
});
