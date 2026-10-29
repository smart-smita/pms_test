import { dbPool } from '../src/config/db';
import { ProjectCustomerRepository } from '../src/repositories/projectCustomer.repository';
import { QuotationCostSheetRepository } from '../src/repositories/quotationCostSheet.repository';
import { CustomerPaymentScheduleRepository } from '../src/repositories/customerPaymentSchedule.repository';
import { CustomerReceiptVoucherRepository } from '../src/repositories/customerReceiptVoucher.repository';
import { EquipmentRepository } from '../src/repositories/equipment.repository';
import { CashControlService } from '../src/services/cashControl.service';
import { numberToIndianWords } from '../src/utils/numberToWords';

async function runTests() {
  console.log('🧪 Starting Phase 2 Verification Test Suite...\n');

  const pcRepo = new ProjectCustomerRepository();
  const costSheetRepo = new QuotationCostSheetRepository();
  const schedRepo = new CustomerPaymentScheduleRepository();
  const receiptRepo = new CustomerReceiptVoucherRepository();
  const eqRepo = new EquipmentRepository();
  const cashControl = new CashControlService();

  // 1. Test Number to Indian Words
  console.log('--- Test 1: Number to Words ---');
  const words1 = numberToIndianWords(1250000);
  console.log('1250000 =>', words1);
  if (!words1.includes('Twelve Lakh Fifty Thousand')) throw new Error('Number to words test failed');
  console.log('✅ Test 1 Passed\n');

  // 2. Test Multi-Customer & Co-Applicant
  console.log('--- Test 2: Multi-Entity Customer & Co-Applicant ---');
  // Find a sample project
  const [projRows]: any = await dbPool.query(`SELECT project_id, customer_id FROM projects LIMIT 1`);
  const sampleProjectId = projRows[0].project_id;
  const sampleCustomerId = projRows[0].customer_id;
  const unitNum = `TEST-UNIT-${Date.now().toString().slice(-6)}`;

  const pcId = await pcRepo.create({
    project_id: sampleProjectId,
    customer_id: sampleCustomerId,
    unit_number: unitNum,
    allocated_area_sqft: 1850.00,
    ownership_percentage: 50.00,
    split_rule: 'percentage',
    agreement_value: 7500000.00,
    is_primary_billing_contact: true
  });
  console.log('Created project_customer allotment ID:', pcId);

  const coAppId = await pcRepo.addCoApplicant({
    project_customer_id: pcId,
    co_applicant_name: 'Anita Verma',
    pan_number: 'ABCDE1234F',
    relationship: 'Co-Owner (Spouse)'
  });
  console.log('Added Co-Applicant ID:', coAppId);

  const pcFetched = await pcRepo.getById(pcId);
  console.log('Allotment verified:', pcFetched?.unit_number, 'Co-applicants count:', pcFetched?.co_applicants?.length);
  if (!pcFetched || pcFetched.co_applicants?.length !== 1) throw new Error('Multi-customer test failed');
  console.log('✅ Test 2 Passed\n');

  // 3. Test Quotation Cost Sheet with 1/3 Land Abatement
  console.log('--- Test 3: Statutory Cost Sheet Calculation ---');
  const [quotRows]: any = await dbPool.query(`SELECT quotation_id FROM quotations LIMIT 1`);
  const sampleQuotationId = quotRows[0].quotation_id;

  const costSheet = await costSheetRepo.save({
    quotation_id: sampleQuotationId,
    basic_construction_value: 6000000.00,
    development_charges: 1500000.00, // Agreement Value = 75,00,000
    stamp_duty_percentage: 6.00,      // 4,50,000
    registration_fee: 30000.00,       // 30,000
    gst_rate_percentage: 12.00,       // 12% with 1/3 abatement = 8.00% = 6,00,000
    land_abatement_fraction: 0.3333
  });

  console.log('Cost Sheet Saved:');
  console.log('  Basic Construction:', costSheet.basic_construction_value);
  console.log('  Agreement Value:', costSheet.agreement_value);
  console.log('  Stamp Duty (6%):', costSheet.stamp_duty_amount);
  console.log('  Effective GST Rate:', costSheet.effective_gst_rate, '%');
  console.log('  GST Amount:', costSheet.gst_amount);
  console.log('  Grand Total:', costSheet.grand_total);

  if (costSheet.agreement_value !== 7500000 || costSheet.effective_gst_rate !== 8.00) {
    throw new Error('Cost sheet calculation mismatch');
  }
  console.log('✅ Test 3 Passed\n');

  // 4. Test Milestone Payment Schedule Generation
  console.log('--- Test 4: Milestone Payment Schedule ---');
  await schedRepo.generateDefaultMilestones(pcId, 7500000.00, 8.00);
  const schedules = await schedRepo.getByProjectCustomerId(pcId);
  console.log(`Generated ${schedules.length} milestone schedules:`);
  schedules.forEach(s => {
    console.log(`  [${s.sort_order}] ${s.milestone_name}: ${s.milestone_percentage}% -> Inst: ₹${s.installment_amount}, GST: ₹${s.gst_amount}, TDS 1%: ₹${s.tds_deductible_amount}, Net: ₹${s.net_receivable_amount}`);
  });
  if (schedules.length !== 8) throw new Error('Milestone schedule count mismatch');
  console.log('✅ Test 4 Passed\n');

  // 5. Test Equipment Master & Usage Log
  console.log('--- Test 5: Equipment Fleet & Usage Meter ---');
  const eq = await eqRepo.create({
    equipment_code: `TEST-EQ-${Date.now().toString().slice(-4)}`,
    equipment_name: 'JCB 3DX Excavator',
    ownership_type: 'own',
    internal_hourly_rate: 1850.00,
    status: 'deployed'
  });
  console.log('Created Equipment:', eq.equipment_code, eq.equipment_name, 'Rate:', eq.internal_hourly_rate);

  // Find a WBS
  const [wbsRows]: any = await dbPool.query(`SELECT id FROM project_wbs WHERE project_id = ? LIMIT 1`, [sampleProjectId]);
  const sampleWbsId = wbsRows.length > 0 ? wbsRows[0].id : 1;

  const usageLog = await eqRepo.logUsage({
    equipment_id: eq.equipment_id,
    project_id: sampleProjectId,
    project_wbs_id: sampleWbsId,
    log_date: new Date().toISOString().slice(0, 10),
    start_meter_hours: 100.00,
    end_meter_hours: 108.50, // 8.5 hours
    fuel_litres_consumed: 42.00,
    charged_rate: 1850.00,
    remarks: 'Foundation excavation excavation run'
  });
  console.log('Usage Logged: Hours:', usageLog.operational_hours, 'Total Cost: ₹', usageLog.total_cost);
  if (usageLog.operational_hours !== 8.5 || usageLog.total_cost !== 15725) throw new Error('Equipment cost calculation mismatch');
  console.log('✅ Test 5 Passed\n');

  // 6. Test Cash Control Position & Deficit Check
  console.log('--- Test 6: Cash Control & Deficit Guard ---');
  const cashPos = await cashControl.getProjectCashPosition(sampleProjectId);
  console.log('Cash Position for Project', sampleProjectId, ':');
  console.log('  Total Inflows (Receipts): ₹', cashPos.total_inflows);
  console.log('  Total Outflows (Vendor+Labour+Eq): ₹', cashPos.total_outflows);
  console.log('  Net Available Cash: ₹', cashPos.net_available_cash);

  // Attempt large disbursement beyond cash position without override
  const attemptResult = await cashControl.checkDisbursementAllowed({
    project_id: sampleProjectId,
    amount: 99999999.00,
    transaction_type: 'vendor_payment',
    transaction_ref_id: 1,
    user_id: 1
  });
  console.log('High Outflow Attempt Result (Without Override):', attemptResult.allowed ? 'ALLOWED' : 'BLOCKED');
  if (attemptResult.allowed) throw new Error('Disbursement should have been BLOCKED');
  console.log('Deficit message:', attemptResult.message?.slice(0, 80), '...');

  // Attempt same with override reason
  const overrideResult = await cashControl.checkDisbursementAllowed({
    project_id: sampleProjectId,
    amount: 99999999.00,
    transaction_type: 'vendor_payment',
    transaction_ref_id: 1,
    user_id: 1,
    override_reason: 'Executive Director approved emergency project mobilization fund'
  });
  console.log('Outflow Attempt Result (With Override):', overrideResult.allowed ? 'ALLOWED' : 'BLOCKED', 'Override Logged:', overrideResult.override_logged);
  if (!overrideResult.allowed || !overrideResult.override_logged) throw new Error('Disbursement override failed');
  console.log('✅ Test 6 Passed\n');

  // Clean up test allotment
  await dbPool.query(`DELETE FROM customer_co_applicants WHERE project_customer_id = ?`, [pcId]);
  await dbPool.query(`DELETE FROM customer_payment_schedules WHERE project_customer_id = ?`, [pcId]);
  await dbPool.query(`DELETE FROM project_customers WHERE id = ?`, [pcId]);
  console.log('Cleaned up test allotment.');

  console.log('\n🎉 ALL 6 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
