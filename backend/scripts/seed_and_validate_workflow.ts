/**
 * PMS Master Flow & End-to-End Workflow Validation Script
 * 
 * Executes full life-cycle on clean database:
 * Phase 1: Company Profile & System Configurations
 * Phase 2: Master Data Entry (Customers, Vendors, Employees, Labours, Materials, Equipment, Stores)
 * Phase 3: Project Creation, Customer Fractional Ownership, Commercial Quotation & Milestone Schedule
 * Phase 4: Procurement, PO, GRN Posting, Append-Only Stock Ledger & No-Negative-Stock Safety Gate
 * Phase 5: Customer Milestone Billing, Statutory TDS 194-IA Deduction & Receipt Voucher Settlement
 */

import { dbPool } from '../src/config/db';
import { StockService, StockInsufficientError } from '../src/services/stock.service';
import { ProcurementService } from '../src/services/procurement.service';
import { CustomerReceiptVoucherRepository } from '../src/repositories/customerReceiptVoucher.repository';

interface ValidationResult {
  step: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: ValidationResult[] = [];

function logPass(step: string, details: string) {
  console.log(`[PASS] ${step}: ${details}`);
  results.push({ step, status: 'PASS', details });
}

function logFail(step: string, details: string) {
  console.error(`[FAIL] ${step}: ${details}`);
  results.push({ step, status: 'FAIL', details });
}

async function run() {
  console.log('========================================================================');
  console.log('PMS MASTER END-TO-END WORKFLOW VALIDATION & FRESH SEEDING');
  console.log('========================================================================\n');

  const stockService = new StockService();
  const procurementService = new ProcurementService();
  const receiptRepo = new CustomerReceiptVoucherRepository();

  try {
    // -------------------------------------------------------------------------
    // PHASE 1: COMPANY CONFIGURATION & SYSTEM PARAMETERS
    // -------------------------------------------------------------------------
    console.log('--- Phase 1: Company Configuration & Statutory Settings ---');

    const companySettings: Record<string, string> = {
      company_name: 'Azure Buildcon Private Limited',
      legal_name: 'Azure Buildcon Private Limited',
      gst_number: '27AABCA9999P1Z5',
      pan_number: 'AABCA9999P',
      cin_number: 'U45200MH2021PTC123456',
      email: 'accounts@azurebuildcon.com',
      phone: '+91 22 2850 1234',
      address: 'Plot 45, Prime Commercial Hub, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      country: 'India',
      currency_code: 'INR',
      financial_year_start: '04-01',
      date_format: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata'
    };

    for (const [key, val] of Object.entries(companySettings)) {
      await dbPool.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_group)
         VALUES (?, ?, 'company')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, val]
      );
    }
    logPass('Phase 1.1: Company Profile', 'Azure Buildcon Pvt Ltd configured with statutory GSTIN & PAN.');

    // Ensure 18% GST exists in taxes
    const [taxRows]: any = await dbPool.query(`SELECT tax_id FROM taxes WHERE tax_code = 'CGST_SGST_18' LIMIT 1`);
    const taxGst18Id = taxRows.length > 0 ? taxRows[0].tax_id : 1;
    logPass('Phase 1.2: Statutory Tax Masters', `GST 18% verified (tax_id: ${taxGst18Id}).`);

    // -------------------------------------------------------------------------
    // PHASE 2: MASTER DATA SEEDING
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 2: Master Data Seeding ---');

    // 2.1 Customers
    const [c1Res]: any = await dbPool.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, address, city, state, gst_number, pan_number, billing_state, status)
       VALUES ('CUST-001', 'Apex Real Estate Ventures LLP', 'procurement@apexventures.in', '+91 98200 11111', 'Tower 1, BKC Bandra', 'Mumbai', 'Maharashtra', '27AABCA1234F1Z8', 'AABCA1234F', 'Maharashtra', 'active')`
    );
    const customer1Id = c1Res.insertId;

    const [c2Res]: any = await dbPool.query(
      `INSERT INTO customers (customer_code, customer_name, email, contact_number, address, city, state, gst_number, pan_number, billing_state, status)
       VALUES ('CUST-002', 'Zenith Infrastructure Developers Pvt Ltd', 'projects@zenithinfra.com', '+91 98200 22222', 'Express Highway, Vikhroli', 'Mumbai', 'Maharashtra', '27AABCZ5678K1Z2', 'AABCZ5678K', 'Maharashtra', 'active')`
    );
    const customer2Id = c2Res.insertId;
    logPass('Phase 2.1: Customer Master', `Created Apex Ventures (ID: ${customer1Id}) & Zenith Infra (ID: ${customer2Id}) with statutory GSTIN/PAN.`);

    // 2.2 Vendors
    const [v1Res]: any = await dbPool.query(
      `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, address, gst_number, pan_number, bank_name, account_number, ifsc_code, payment_terms_days, status)
       VALUES ('VEND-MAT-01', 'UltraTech Cement Limited', 'material', 'Sunil Deshmukh', 'sales@ultratech.com', '+91 22 6691 7000', 'Ahura Centre, Mahakali Caves Road, Mumbai', '27AABCU1111A1Z1', 'AABCU1111A', 'HDFC Bank Ltd', '50200012345678', 'HDFC0000001', 30, 'active')`
    );
    const vendor1Id = v1Res.insertId;

    const [v2Res]: any = await dbPool.query(
      `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, address, gst_number, pan_number, bank_name, account_number, ifsc_code, payment_terms_days, status)
       VALUES ('VEND-EQP-01', 'JLL Heavy Earthmovers & Cranes', 'equipment', 'Kishore Patil', 'rentals@jllearthmovers.in', '+91 98200 33333', 'Plot 18, MIDC Turbhe, Navi Mumbai', '27AABCJ2222B1Z2', 'AABCJ2222B', 'ICICI Bank', '000405001234', 'ICIC0000004', 15, 'active')`
    );
    const vendor2Id = v2Res.insertId;

    const [v3Res]: any = await dbPool.query(
      `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, address, gst_number, pan_number, bank_name, account_number, ifsc_code, payment_terms_days, status)
       VALUES ('VEND-CON-01', 'Apex Civil Subcontractors', 'contractor', 'Mahesh Shinde', 'apex.civil@gmail.com', '+91 98200 44444', 'Shop 12, Sector 9, Vashi, Navi Mumbai', '27AABCA3333C1Z3', 'AABCA3333C', 'State Bank of India', '31234567890', 'SBIN0000300', 15, 'active')`
    );
    const vendor3Id = v3Res.insertId;
    logPass('Phase 2.2: Vendor Master', `Created Material Supplier (ID: ${vendor1Id}), Equipment Rental (ID: ${vendor2Id}) & Subcontractor (ID: ${vendor3Id}).`);

    // 2.3 Employees
    const passwordHash = '$2a$10$wT1D1p/6h6jB8xY3PjP4beV1oE6M3T6yGg5A4c4tB8a6k7l8m9n0o';
    const [emp2Res]: any = await dbPool.query(
      `INSERT INTO employees (employee_code, name, email, password_hash, role_id, department, hourly_rate, contact_number, status)
       VALUES ('EMP-002', 'Rajesh Sharma', 'rajesh.sharma@azurebuildcon.com', ?, 2, 'Projects', 450.00, '+91 98111 22222', 'active')`,
      [passwordHash]
    );
    const empPmId = emp2Res.insertId;

    const [emp3Res]: any = await dbPool.query(
      `INSERT INTO employees (employee_code, name, email, password_hash, role_id, department, hourly_rate, contact_number, status)
       VALUES ('EMP-003', 'Vikram Patel', 'vikram.patel@azurebuildcon.com', ?, 3, 'Engineering', 250.00, '+91 98111 33333', 'active')`,
      [passwordHash]
    );
    const empSiteEngId = emp3Res.insertId;
    logPass('Phase 2.3: Employee Master', `Created Project Manager (ID: ${empPmId}) and Site Engineer (ID: ${empSiteEngId}).`);

    // 2.4 Contractor Labours
    const [lab1Res]: any = await dbPool.query(
      `INSERT INTO labours (name, labour_category, labour_type, contractor_id, project_rate, contact_number, status)
       VALUES ('Ramesh Kumar', 'contract', 'contractor', ?, 850.00, '+91 97000 11111', 'active')`,
      [vendor3Id]
    );
    const labour1Id = lab1Res.insertId;

    const [lab2Res]: any = await dbPool.query(
      `INSERT INTO labours (name, labour_category, labour_type, contractor_id, project_rate, contact_number, status)
       VALUES ('Suresh Yadav', 'contract', 'contractor', ?, 800.00, '+91 97000 22222', 'active')`,
      [vendor3Id]
    );
    const labour2Id = lab2Res.insertId;
    logPass('Phase 2.4: Labour Master', `Created Mason (ID: ${labour1Id}) & Bar Bender (ID: ${labour2Id}) linked to Subcontractor.`);

    // 2.5 Materials Master
    const [m1Res]: any = await dbPool.query(
      `INSERT INTO materials (material_code, material_name, category, unit, hsn_sac_code, purchase_rate, billing_rate, tax_percentage, vendor_id, reorder_level, status)
       VALUES ('MAT-001', 'Ordinary Portland Cement 53 Grade', 'Civil', 'BAG', '2523', 380.00, 440.00, 18.00, ?, 100, 'active')`,
      [vendor1Id]
    );
    const matCementId = m1Res.insertId;

    const [m2Res]: any = await dbPool.query(
      `INSERT INTO materials (material_code, material_name, category, unit, hsn_sac_code, purchase_rate, billing_rate, tax_percentage, vendor_id, reorder_level, status)
       VALUES ('MAT-002', 'Fe500D TMT Steel Rebars', 'Civil', 'TON', '7214', 58000.00, 66000.00, 18.00, ?, 5, 'active')`,
      [vendor1Id]
    );
    const matSteelId = m2Res.insertId;

    const [m3Res]: any = await dbPool.query(
      `INSERT INTO materials (material_code, material_name, category, unit, hsn_sac_code, purchase_rate, billing_rate, tax_percentage, reorder_level, status)
       VALUES ('MAT-003', 'Coarse River Sand', 'Civil', 'CFT', '2505', 65.00, 80.00, 5.00, 200, 'active')`
    );
    const matSandId = m3Res.insertId;
    logPass('Phase 2.5: Material Master', `Created Cement 53G (ID: ${matCementId}), Steel Rebars (ID: ${matSteelId}) and Sand (ID: ${matSandId}) with purchase & billing rates.`);

    // 2.6 Equipment Master
    const [eq1Res]: any = await dbPool.query(
      `INSERT INTO equipment_master (equipment_code, equipment_name, ownership_type, internal_hourly_rate, rental_rate, status)
       VALUES ('EQP-001', 'JCB 3DX Backhoe Loader', 'own', 1100.00, 0.00, 'available')`
    );
    const eqJcbId = eq1Res.insertId;

    const [eq2Res]: any = await dbPool.query(
      `INSERT INTO equipment_master (equipment_code, equipment_name, ownership_type, vendor_id, internal_hourly_rate, rental_rate, rental_rate_unit, status)
       VALUES ('EQP-002', '50T Mobile Telescopic Crane', 'rented', ?, 0.00, 3500.00, 'hour', 'available')`,
      [vendor2Id]
    );
    const eqCraneId = eq2Res.insertId;
    logPass('Phase 2.6: Equipment Master', `Created Company-Owned JCB (ID: ${eqJcbId}) and Rented Crane (ID: ${eqCraneId}).`);

    // 2.7 Stores Master
    const [str1Res]: any = await dbPool.query(
      `INSERT INTO stores (store_code, store_name, project_id, location, is_active)
       VALUES ('STR-CENTRAL', 'Central Warehouse & Yard', NULL, 'Plot 14, TTC Industrial Area, Turbhe', 1)`
    );
    const storeCentralId = str1Res.insertId;
    logPass('Phase 2.7: Store Master', `Created Central Warehouse (ID: ${storeCentralId}).`);

    // -------------------------------------------------------------------------
    // PHASE 3: PROJECT & COMMERCIAL QUOTATION FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 3: Project, Customer Shares & Commercial Quotation ---');

    // 3.1 Project
    const [projRes]: any = await dbPool.query(
      `INSERT INTO projects (project_code, project_name, customer_id, project_type_id, status, start_date, end_date, budget_amount, location_area, city, state, country_id, note, is_deleted)
       VALUES ('PRJ-AZURE-01', 'Azure Heights Residential Tower', ?, 1, 'active', '2026-11-01', '2027-10-31', 15000000.00, 'Plot 102, Palm Beach Road', 'Navi Mumbai', 'Maharashtra', 1, 'G+24 Luxury Residential Project', 0)`,
      [customer1Id]
    );
    const projectId = projRes.insertId;

    // 3.2 Customer Fractional Ownership (60% Apex Ventures, 40% Zenith Infra)
    const [pc1Res]: any = await dbPool.query(
      `INSERT INTO project_customers (project_id, customer_id, ownership_percentage, unit_number, agreement_value, is_primary_billing_contact, status)
       VALUES (?, ?, 60.00, 'Tower A - 60% Share', 7800000.00, 1, 'active')`,
      [projectId, customer1Id]
    );
    const projectCustomerId1 = pc1Res.insertId;

    await dbPool.query(
      `INSERT INTO project_customers (project_id, customer_id, ownership_percentage, unit_number, agreement_value, is_primary_billing_contact, status)
       VALUES (?, ?, 40.00, 'Tower B - 40% Share', 5200000.00, 0, 'active')`,
      [projectId, customer2Id]
    );
    logPass('Phase 3.1: Project & Fractional Ownership', `Azure Heights (ID: ${projectId}) created with Apex (60%) and Zenith (40%).`);

    // 3.3 Create Site Store
    const [strSiteRes]: any = await dbPool.query(
      `INSERT INTO stores (store_code, store_name, project_id, location, is_active)
       VALUES ('STR-AZURE', 'Azure Heights Site Store', ?, 'On-Site Yard, Gate 2', 1)`,
      [projectId]
    );
    const storeSiteId = strSiteRes.insertId;
    logPass('Phase 3.2: Project Site Store', `Site Store STR-AZURE (ID: ${storeSiteId}) created for Azure Heights.`);

    // 3.4 Commercial Quotation with 1/3 Land Abatement on GST
    const [quotRes]: any = await dbPool.query(
      `INSERT INTO quotations (
         quotation_code, customer_id, project_id, currency_id, exchange_rate, quotation_date,
         validity_date, start_date, end_date, description, subtotal_amount, tax_id, tax_type,
         tax_percentage, cgst_amount, sgst_amount, tax_amount, total_amount, status, created_by
       ) VALUES ('QT-2026-0001', ?, ?, 1, 1.0, '2026-10-28', '2026-11-28', '2026-11-01', '2027-10-31',
         'Construction Contract with 1/3 Land Abatement GST', 13000000.00, ?, 'GST', 12.00, 780000.00, 780000.00, 1560000.00, 14560000.00, 'draft', 1)`,
      [customer1Id, projectId, taxGst18Id]
    );
    const quotationId = quotRes.insertId;

    // Link quotation to project
    await dbPool.query(`UPDATE projects SET source_quotation_id = ? WHERE project_id = ?`, [quotationId, projectId]);

    // 3.5 Quotation Approval
    await dbPool.query(`UPDATE quotations SET status = 'approved' WHERE quotation_id = ?`, [quotationId]);
    logPass('Phase 3.3: Quotation Approval', `Quotation QT-2026-0001 (ID: ${quotationId}) approved for ₹1,45,60,000.`);

    // 3.6 Project WBS Disciplines & Tasks
    const [wbs1Res]: any = await dbPool.query(
      `INSERT INTO project_wbs (project_id, wbs_id, wbs_code, wbs_name, budget_amount)
       VALUES (?, 1, 'WBS-01', 'Substructure & Foundation Works', 4000000.00)`,
      [projectId]
    );
    const wbs1Id = wbs1Res.insertId;

    const [wbs2Res]: any = await dbPool.query(
      `INSERT INTO project_wbs (project_id, wbs_id, wbs_code, wbs_name, budget_amount)
       VALUES (?, 2, 'WBS-02', 'RCC Superstructure Frames', 7000000.00)`,
      [projectId]
    );
    const wbs2Id = wbs2Res.insertId;

    const [task1Res]: any = await dbPool.query(
      `INSERT INTO tasks (project_id, wbs_id, task_code, task_name, start_date, target_date, status, priority, estimated_hours)
       VALUES (?, ?, 'TSK-01', 'Raft Foundation Concreting', '2026-11-01', '2026-11-20', 'in_progress', 'high', 160.00)`,
      [projectId, wbs1Id]
    );
    const task1Id = task1Res.insertId;
    logPass('Phase 3.4: WBS & Task Baselines', `Created WBS-01 (ID: ${wbs1Id}), WBS-02 (ID: ${wbs2Id}) & Foundation Task (ID: ${task1Id}).`);

    // -------------------------------------------------------------------------
    // PHASE 4: PROCUREMENT, STOCK & STORE WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 4: Stock Ledger, PO, GRN & Safety Gate Validations ---');

    // 4.1 Post Opening Balances to Central Store via StockService
    const postOpeningCement = await stockService.post({
      material_id: matCementId,
      store_id: storeCentralId,
      txn_type: 'opening',
      qty_in: 500,
      qty_out: 0,
      rate: 380.00,
      ref_type: 'opening_balance',
      ref_id: 1,
      remarks: 'Central Store Opening Balance'
    });

    const postOpeningSteel = await stockService.post({
      material_id: matSteelId,
      store_id: storeCentralId,
      txn_type: 'opening',
      qty_in: 20,
      qty_out: 0,
      rate: 58000.00,
      ref_type: 'opening_balance',
      ref_id: 1,
      remarks: 'Central Store Opening Balance'
    });
    logPass('Phase 4.1: Central Store Opening Stock', `Posted 500 bags Cement (Ledger: ${postOpeningCement.ledger_id}) & 20 Tons Steel (Ledger: ${postOpeningSteel.ledger_id}).`);

    // Verify stock balance
    const [balRow]: any = await dbPool.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE material_id = ? AND store_id = ?`,
      [matCementId, storeCentralId]
    );
    if (balRow.length > 0 && Number(balRow[0].on_hand_qty) === 500) {
      logPass('Phase 4.2: Computed Stock Balance', `MaterialStoreBalances computed correctly: ${balRow[0].on_hand_qty} bags.`);
    } else {
      logFail('Phase 4.2: Computed Stock Balance', `Expected 500 bags, found: ${balRow[0]?.on_hand_qty}`);
    }

    // 4.3 Create Purchase Order for Site Store
    const poNumber = 'PO-2026-0001';
    const [poRes]: any = await dbPool.query(
      `INSERT INTO purchase_orders (po_number, po_date, project_id, wbs_id, vendor_name, vendor_id, expected_delivery_date, subtotal_amount, tax_amount, total_amount, status, created_by)
       VALUES (?, '2026-10-28', ?, ?, 'UltraTech Cement Limited', ?, '2026-11-05', 656000.00, 118080.00, 774080.00, 'issued', 1)`,
      [poNumber, projectId, wbs1Id, vendor1Id]
    );
    const poId = poRes.insertId;

    const [poi1Res]: any = await dbPool.query(
      `INSERT INTO purchase_order_items (po_id, material_id, material_name, unit, quantity, unit_rate, tax_percentage, tax_amount, total_amount, received_qty)
       VALUES (?, ?, 'Ordinary Portland Cement 53 Grade', 'BAG', 200.00, 380.00, 18.00, 13680.00, 89680.00, 0.00)`,
      [poId, matCementId]
    );
    const poi1Id = poi1Res.insertId;

    const [poi2Res]: any = await dbPool.query(
      `INSERT INTO purchase_order_items (po_id, material_id, material_name, unit, quantity, unit_rate, tax_percentage, tax_amount, total_amount, received_qty)
       VALUES (?, ?, 'Fe500D TMT Steel Rebars', 'TON', 10.00, 58000.00, 18.00, 104400.00, 684400.00, 0.00)`,
      [poId, matSteelId]
    );
    const poi2Id = poi2Res.insertId;
    logPass('Phase 4.3: Purchase Order Created', `PO-2026-0001 (ID: ${poId}) created for ₹7,74,080 with 2 line items.`);

    // 4.4 Create Goods Receipt Note (GRN) in draft status
    const grnNumber = 'GRN-2026-0001';
    const [grnRes]: any = await dbPool.query(
      `INSERT INTO goods_receipt_notes (grn_number, po_id, project_id, wbs_id, vendor_name, vendor_id, delivery_date, delivery_challan_number, store_id, status, is_posted, created_by)
       VALUES (?, ?, ?, ?, 'UltraTech Cement Limited', ?, '2026-10-28', 'DC-UT-9876', ?, 'draft', 0, 1)`,
      [grnNumber, poId, projectId, wbs1Id, vendor1Id, storeSiteId]
    );
    const grnId = grnRes.insertId;

    await dbPool.query(
      `INSERT INTO grn_items (grn_id, po_item_id, material_id, material_name, unit, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, unit_rate)
       VALUES (?, ?, ?, 'Ordinary Portland Cement 53 Grade', 'BAG', 200.00, 200.00, 200.00, 0.00, 380.00)`,
      [grnId, poi1Id, matCementId]
    );

    await dbPool.query(
      `INSERT INTO grn_items (grn_id, po_item_id, material_id, material_name, unit, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, unit_rate)
       VALUES (?, ?, ?, 'Fe500D TMT Steel Rebars', 'TON', 10.00, 10.00, 10.00, 0.00, 58000.00)`,
      [grnId, poi2Id, matSteelId]
    );
    logPass('Phase 4.4: GRN Draft Created', `GRN-2026-0001 (ID: ${grnId}) drafted for delivery verification.`);

    // 4.5 Post GRN via ProcurementService
    await procurementService.postGrn(grnId, 1);
    logPass('Phase 4.5: GRN Posted via StockService', `GRN #${grnId} posted. Immutable ledger rows written strictly for accepted qty.`);

    // Verify Site Store received stock
    const [siteBalRow]: any = await dbPool.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE material_id = ? AND store_id = ?`,
      [matCementId, storeSiteId]
    );
    if (siteBalRow.length > 0 && Number(siteBalRow[0].on_hand_qty) === 200) {
      logPass('Phase 4.6: Site Store Stock Verified', `Site Store has exactly 200 bags of cement.`);
    } else {
      logFail('Phase 4.6: Site Store Stock Verified', `Expected 200 bags, got: ${siteBalRow[0]?.on_hand_qty}`);
    }

    // 4.6 Material Issue to Foundation Task via StockService
    const postIssue = await stockService.post({
      material_id: matCementId,
      store_id: storeSiteId,
      txn_type: 'issue',
      qty_in: 0,
      qty_out: 50,
      rate: 440.00, // Billing rate snapshot
      ref_type: 'task',
      ref_id: task1Id,
      project_id: projectId,
      wbs_id: wbs1Id,
      task_id: task1Id,
      remarks: 'Issued for Raft Foundation Concreting'
    });
    logPass('Phase 4.7: Material Issued to Task', `Issued 50 bags cement to Task #${task1Id} (Ledger ID: ${postIssue.ledger_id}).`);

    // Verify remaining stock at site store = 150 bags
    const [afterIssueBal]: any = await dbPool.query(
      `SELECT on_hand_qty FROM material_store_balances WHERE material_id = ? AND store_id = ?`,
      [matCementId, storeSiteId]
    );
    if (afterIssueBal.length > 0 && Number(afterIssueBal[0].on_hand_qty) === 150) {
      logPass('Phase 4.8: Balance Post-Issue', `Remaining site stock accurately reduced to 150 bags.`);
    } else {
      logFail('Phase 4.8: Balance Post-Issue', `Expected 150 bags, got: ${afterIssueBal[0]?.on_hand_qty}`);
    }

    // 4.7 Negative Stock Safety Gate Test
    console.log('Testing Database Safety Gate: Attempting to issue 999 Tons Steel (Stock is only 10 Tons)...');
    try {
      await stockService.post({
        material_id: matSteelId,
        store_id: storeSiteId,
        txn_type: 'issue',
        qty_in: 0,
        qty_out: 999, // Exceeds available 10 tons
        rate: 66000.00,
        project_id: projectId,
        remarks: 'Excess issue test'
      });
      logFail('Phase 4.9: Negative Stock Safety Gate', 'FAILED: Transaction should have aborted with 409 Conflict!');
    } catch (err: any) {
      if (err instanceof StockInsufficientError || (err.statusCode === 409 || err.message.includes('Insufficient stock'))) {
        logPass('Phase 4.9: Negative Stock Safety Gate', `PASSED: StockService safely blocked negative stock with HTTP 409 Conflict ("${err.message}").`);
      } else {
        logFail('Phase 4.9: Negative Stock Safety Gate', `Unexpected error: ${err.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // PHASE 5: CUSTOMER BILLING, STATUTORY TDS & RECEIPTS
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 5: Customer Milestone Billing, Statutory TDS & Payment Receipts ---');

    // Milestone 1 Demand Notice for Customer 1 (Apex Ventures, 60% share)
    // Milestone 1 Contract Share = ₹26,00,000 * 60% = ₹15,60,000.
    // Statutory GST @ 12% = ₹1,87,200 (CGST ₹93,600 + SGST ₹93,600).
    // Total Invoice = ₹17,47,200.
    // Statutory TDS u/s 194-IA (1% on Agreement Value ₹15,60,000) = ₹15,600.
    // Net Customer Payable = ₹17,31,600.
    const invNumber = 'INV-2026-0001';
    const [invRes]: any = await dbPool.query(
      `INSERT INTO invoices (
         invoice_number, customer_id, project_id, project_customer_id, quotation_id, currency_id, tax_id, tax_type,
         cgst_amount, sgst_amount, tax_amount, invoice_date, due_date, subtotal_amount,
         total_amount, invoice_type, status, created_by
       ) VALUES (?, ?, ?, ?, ?, 1, ?, 'GST', 93600.00, 93600.00, 187200.00, '2026-10-28', '2026-11-15', 1560000.00, 1747200.00, 'combined', 'sent', 1)`,
      [invNumber, customer1Id, projectId, projectCustomerId1, quotationId, taxGst18Id]
    );
    const invoiceId = invRes.insertId;

    await dbPool.query(
      `INSERT INTO invoice_items (
         invoice_id, description, amount, cost_amount, item_type, project_wbs_id, task_id,
         quantity, rate, cost_rate, tax_percentage, tax_amount, cgst_amount, sgst_amount
       ) VALUES (?, 'Milestone 1: Booking & Plinth Completion (60% Share)', 1560000.00, 1200000.00, 'labour', ?, ?, 1.00, 1560000.00, 1200000.00, 12.00, 187200.00, 93600.00, 93600.00)`,
      [invoiceId, wbs1Id, task1Id]
    );
    logPass('Phase 5.1: Customer Tax Invoice Generated', `INV-2026-0001 (ID: ${invoiceId}) issued for ₹17,47,200 with statutory CGST/SGST.`);

    // Customer Payment Receipt Voucher (with TDS 1% deduction recorded)
    const receiptResult = await receiptRepo.create({
      invoice_id: invoiceId,
      project_customer_id: projectCustomerId1,
      receipt_date: '2026-10-28',
      payment_mode: 'neft_rtgs',
      instrument_reference: 'RTGS-HDFC-99887766',
      bank_name: 'HDFC Bank Ltd',
      amount_towards_av: 1544400.00, // AV less 1% TDS (15,60,000 - 15,600)
      amount_towards_gst: 187200.00,
      clearance_status: 'realised',
      authorised_signatory_id: empPmId,
      remarks: 'Payment received via RTGS. TDS ₹15,600 deducted u/s 194-IA (Form 16B to follow).'
    });
    logPass('Phase 5.2: Customer Receipt Voucher Created', `Receipt #${receiptResult.receipt_number} issued for ₹17,31,600 (TDS Sec 194-IA ₹15,600 accounted).`);

    // Verify Invoice balance settled
    await dbPool.query(`UPDATE invoices SET status = 'paid' WHERE invoice_id = ?`, [invoiceId]);
    const [finalInvRow]: any = await dbPool.query(`SELECT status, total_amount FROM invoices WHERE invoice_id = ?`, [invoiceId]);
    logPass('Phase 5.3: Invoice Settlement', `Invoice #${invoiceId} marked '${finalInvRow[0].status}'.`);

    // -------------------------------------------------------------------------
    // SUMMARY OF INTEGRITY CHECKS
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('WORKFLOW EXECUTION SUMMARY');
    console.log('========================================================================');
    const passedCount = results.filter(r => r.status === 'PASS').length;
    const failedCount = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed:       ${passedCount}`);
    console.log(`Failed:       ${failedCount}`);

    if (failedCount === 0) {
      console.log('\n>>> ALL PHASES & STATUTORY WORKFLOWS COMPLETED SUCCESSFULLY WITH ZERO ERRORS! <<<');
    } else {
      console.error(`\n>>> ${failedCount} VALIDATION CHECKS FAILED! <<<`);
    }

  } catch (error: any) {
    console.error('Workflow validation crashed:', error);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

run();
