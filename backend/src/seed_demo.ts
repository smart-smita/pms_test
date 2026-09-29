import { dbPool } from './config/db';

export async function runDemoSeed() {
  console.log('--- STARTING DEMO DATASET CLEAN SEED ---');
  const connection = await dbPool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Truncate transaction and project tables safely
    const tablesToClean = [
      'vendor_payments',
      'vendor_invoices',
      'material_transactions',
      'grn_items',
      'goods_receipt_notes',
      'purchase_order_items',
      'purchase_orders',
      'material_requirements',
      'materials',
      'invoice_payments',
      'invoice_items',
      'invoices',
      'monthly_completed_work',
      'billing_schedules',
      'quotation_terms_snapshots',
      'quotation_disciplines',
      'quotations',
      'site_survey_photo_disciplines',
      'site_survey_photos',
      'site_surveys',
      'task_labours',
      'task_employees',
      'task_dependencies',
      'labour_work_logs',
      'attendance_logs',
      'tasks',
      'project_wbs',
      'project_employees',
      'project_documents',
      'projects',
      'customers',
    ];

    for (const table of tablesToClean) {
      try {
        await connection.query(`TRUNCATE TABLE \`${table}\``);
      } catch (err: any) {
        try {
          await connection.query(`DELETE FROM \`${table}\``);
        } catch (innerErr: any) {
          console.warn(`Could not clean table ${table}: ${innerErr.message}`);
        }
      }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Old demo transaction data cleared cleanly.');

    // Fetch master references
    const [countries]: any = await connection.query(`SELECT country_id, country_code FROM countries`);
    const countryMap: Record<string, number> = {};
    for (const c of countries) { countryMap[c.country_code] = c.country_id; }
    const indiaId = countryMap['IN'] || 1;

    const [employees]: any = await connection.query(`SELECT employee_id, name FROM employees WHERE status = 'active' LIMIT 5`);
    const mainEmpId = employees[0]?.employee_id || 1;

    const [labours]: any = await connection.query(`SELECT labour_id, name FROM labours WHERE status = 'active' LIMIT 5`);

    // 2. Insert Customer
    const [custRes]: any = await connection.query(`
      INSERT INTO customers (
        customer_code, customer_name, contact_person, contact_number, email,
        country_id, state, city, address, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'CUST-IND-001', 'Pune Logistics & Warehousing Pvt Ltd', 'Ramesh Kulkarni',
      '+91 98220 12345', 'ramesh.kulkarni@punelogistics.com', indiaId,
      'Maharashtra', 'Pune', 'Plot 45, Chakan Industrial Area, Phase II, Pune - 410501',
      'active', mainEmpId
    ]);
    const customerId = custRes.insertId;

    // 3. Insert Demo Project
    const [projRes]: any = await connection.query(`
      INSERT INTO projects (
        project_code, project_name, customer_id, country_id, budget_amount,
        project_address, latitude, longitude, radius_meters, project_date, status, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'PRJ-PUNE-001', 'Pune Industrial Warehouse Construction', customerId, indiaId, 25000000.00,
      'Chakan MIDC Industrial Zone, Pune, Maharashtra', 18.7600, 73.8600, 500,
      '2026-09-01', 'active', 'Modern 100,000 sq ft industrial warehouse with MEP & civil works'
    ]);
    const projectId = projRes.insertId;

    // 4. Insert Master WBS for Project
    const [wbs1Res]: any = await connection.query(`
      INSERT INTO project_wbs (
        project_id, wbs_id, wbs_code, wbs_name, start_date, end_date, total_hours, status, completion_percentage, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, 1, 'WBS-PUNE-01', 'Civil & Substructure Work', '2026-09-01', '2026-11-30', 1500, 1, 45.00, 'Excavation, foundation, RCC columns and brickwork']);
    const wbs1Id = wbs1Res.insertId;

    const [wbs2Res]: any = await connection.query(`
      INSERT INTO project_wbs (
        project_id, wbs_id, wbs_code, wbs_name, start_date, end_date, total_hours, status, completion_percentage, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, 2, 'WBS-PUNE-02', 'Electrical & High Voltage Installation', '2026-09-15', '2026-12-15', 900, 1, 30.00, 'Main cable laying, panels, lighting and sub-station setup']);
    const wbs2Id = wbs2Res.insertId;

    const [wbs3Res]: any = await connection.query(`
      INSERT INTO project_wbs (
        project_id, wbs_id, wbs_code, wbs_name, start_date, end_date, total_hours, status, completion_percentage, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, 3, 'WBS-PUNE-03', 'Plumbing & Drainage Utilities', '2026-10-01', '2026-12-31', 600, 1, 15.00, 'Water supply pipelines, underground drainage and fittings']);
    const wbs3Id = wbs3Res.insertId;

    // 5. Insert Tasks under WBS
    const [t1Res]: any = await connection.query(`
      INSERT INTO tasks (
        project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, actual_hours,
        start_date, target_date, status, productivity_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, wbs1Id, 'Foundation Excavation & RCC Footing', 'Excavate soil and pour C30 grade RCC for main pillars', 8, 400, 220, '2026-09-01', '2026-09-30', 'in-progress', 'on-time']);
    const t1Id = t1Res.insertId;

    const [t2Res]: any = await connection.query(`
      INSERT INTO tasks (
        project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, actual_hours,
        start_date, target_date, status, productivity_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, wbs1Id, 'Superstructure Brickwork & Column Casting', 'Construct external brick walls and cast vertical columns', 10, 600, 180, '2026-09-15', '2026-10-31', 'in-progress', 'on-time']);
    const t2Id = t2Res.insertId;

    const [t3Res]: any = await connection.query(`
      INSERT INTO tasks (
        project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, actual_hours,
        start_date, target_date, status, productivity_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, wbs2Id, 'Main Armoured Cable Laying & Trenching', 'Trenching and pulling 4-core 240 sqmm cables across site', 6, 350, 120, '2026-09-20', '2026-10-20', 'in-progress', 'on-time']);
    const t3Id = t3Res.insertId;

    const [t4Res]: any = await connection.query(`
      INSERT INTO tasks (
        project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, actual_hours,
        start_date, target_date, status, productivity_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [projectId, wbs3Id, 'Underground Drainage Pipe Laying', 'Install 110mm heavy duty PVC drainage pipes', 5, 250, 60, '2026-10-01', '2026-10-25', 'pending', 'on-time']);
    const t4Id = t4Res.insertId;

    // Assign employees & labour to task 1
    if (mainEmpId) {
      await connection.query(`INSERT IGNORE INTO task_employees (task_id, employee_id) VALUES (?, ?)`, [t1Id, mainEmpId]);
    }
    for (const l of labours) {
      await connection.query(`INSERT IGNORE INTO task_labours (task_id, labour_id) VALUES (?, ?)`, [t1Id, l.labour_id]);
    }

    // 6. Insert Materials Master
    const materialsSeed = [
      ['MAT-001', 'Portland Pozzolana Cement (PPC)', 'Civil', '50kg Bags Grade 53 PPC Cement', 'Bag', 'UltraTech / Ambuja', '2523', 18.00, 400.00, 100.00, 200.00, 'active'],
      ['MAT-002', 'TMT Steel Bars 12mm Fe550D', 'Civil', 'High strength Fe550D TMT reinforcement steel', 'Kg', 'Tata Tiscon / JSW', '7214', 18.00, 65.00, 500.00, 1000.00, 'active'],
      ['MAT-003', '4-Core 240 sqmm Armoured Cable', 'Electrical', 'Heavy duty XLPE insulated LT armoured copper cable', 'Meter', 'Havells / Polycab', '8544', 18.00, 120.00, 200.00, 400.00, 'active'],
      ['MAT-004', 'Heavy Duty PVC Pipe 110mm', 'Plumbing', '10 Bar pressure rated PVC drainage pipe', 'Meter', 'Supreme / Astral', '3917', 18.00, 180.00, 100.00, 200.00, 'active'],
      ['MAT-005', 'Electrical PVC Conduit Pipe 25mm', 'Electrical', 'FRLS rigid PVC electrical conduit pipe', 'Meter', 'Finolex', '3917', 18.00, 45.00, 100.00, 250.00, 'active'],
      ['MAT-006', 'Washed River Sand', 'Civil', 'Coarse river sand for concrete mixing and masonry', 'Ton', 'Local Quarry', '2505', 18.00, 1500.00, 20.00, 50.00, 'active']
    ];

    const matIdMap: Record<string, number> = {};
    for (const [code, name, cat, desc, unit, brand, hsn, tax, rate, minStk, reord, st] of materialsSeed) {
      const [mRes]: any = await connection.query(`
        INSERT INTO materials (
          material_code, material_name, category, description, unit, brand_spec, hsn_sac_code,
          tax_percentage, rate, min_stock_level, reorder_level, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [code, name, cat, desc, unit, brand, hsn, tax, rate, minStk, reord, st]);
      matIdMap[code as string] = mRes.insertId;
    }

    // 7. Insert Customer Quotation
    const [taxRow]: any = await connection.query(`SELECT tax_id FROM taxes WHERE is_split = 1 LIMIT 1`);
    const defaultTaxId = taxRow[0]?.tax_id || 1;

    const [qRes]: any = await connection.query(`
      INSERT INTO quotations (
        quotation_code, customer_id, project_id, quotation_date, validity_date,
        description, subtotal_amount, tax_id, tax_type, tax_percentage,
        cgst_amount, sgst_amount, igst_amount, tax_amount, discount_amount,
        total_amount, terms_conditions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'QT-2026-0001', customerId, projectId, '2026-08-25', '2026-09-25',
      'Quotation for Pune Warehouse Construction (Civil, Electrical, Plumbing)',
      20000000.00, defaultTaxId, 'CGST_SGST', 18.00,
      1755000.00, 1755000.00, 0.00, 3510000.00, 500000.00,
      23010000.00, '1. 50% advance upon quotation approval.\n2. All material subject to site inspection.\n3. Defect liability period 12 months.',
      'approved'
    ]);
    const quotationId = qRes.insertId;

    // Insert quotation disciplines line items
    const qDisciplines = [
      [quotationId, projectId, 1, 'Civil & Substructure Work', 'Excavation, foundation & RCC column structure', 'lump_sum', 1, 10000000.00, 10000000.00],
      [quotationId, projectId, 2, 'Electrical & High Voltage Installation', 'Cable laying, HT panels and LED bay lighting', 'lump_sum', 1, 6000000.00, 6000000.00],
      [quotationId, projectId, 3, 'Plumbing & Drainage Utilities', 'Underground piping, storm water drainage and sanitary fittings', 'lump_sum', 1, 4000000.00, 4000000.00]
    ];
    for (const qd of qDisciplines) {
      await connection.query(`
        INSERT INTO quotation_disciplines (
          quotation_id, project_id, discipline_id, discipline_name, description, unit, quantity, rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, qd);
    }

    // 8. Insert Material Requirements
    await connection.query(`
      INSERT INTO material_requirements (project_id, wbs_id, material_id, estimated_quantity, rate_budgeted, notes, created_by) VALUES
      (?, ?, ?, 500, 400.00, 'Civil foundation materials requirement', ?),
      (?, ?, ?, 2000, 65.00, 'Civil foundation materials requirement', ?),
      (?, ?, ?, 100, 1500.00, 'Civil foundation materials requirement', ?)
    `, [
      projectId, wbs1Id, matIdMap['MAT-001'], mainEmpId,
      projectId, wbs1Id, matIdMap['MAT-002'], mainEmpId,
      projectId, wbs1Id, matIdMap['MAT-006'], mainEmpId
    ]);
    const ind1Id = 1; // Dummy for PO linkage if needed, though PO uses indent_id? Let's check PO schema next.

    await connection.query(`
      INSERT INTO material_requirements (project_id, wbs_id, material_id, estimated_quantity, rate_budgeted, notes, created_by) VALUES
      (?, ?, ?, 2000, 120.00, 'Electrical main cable & conduit requirement', ?),
      (?, ?, ?, 500, 45.00, 'Electrical main cable & conduit requirement', ?)
    `, [
      projectId, wbs2Id, matIdMap['MAT-003'], mainEmpId,
      projectId, wbs2Id, matIdMap['MAT-005'], mainEmpId
    ]);
    const ind2Id = 2; // Dummy

    // 9. Insert Material Purchase Orders (POs)
    const [po1Res]: any = await connection.query(`
      INSERT INTO purchase_orders (
        po_number, po_date, project_id, wbs_id, indent_id, vendor_name, expected_delivery_date,
        subtotal_amount, tax_amount, total_amount, payment_terms, delivery_address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'PO-2026-001', '2026-09-07', projectId, wbs1Id, ind1Id, 'UltraTech & Tata Steel Authorized Distributors', '2026-09-12',
      480000.00, 86400.00, 566400.00, '30 days net from GRN date', 'Chakan Site Store, Pune Warehouse Project', 'completed'
    ]);
    const po1Id = po1Res.insertId;

    await connection.query(`
      INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_rate, discount_amount, tax_percentage, tax_amount, total_amount) VALUES
      (?, ?, 500, 400.00, 0.00, 18.00, 36000.00, 236000.00),
      (?, ?, 2000, 65.00, 0.00, 18.00, 23400.00, 153400.00),
      (?, ?, 100, 1500.00, 0.00, 18.00, 27000.00, 177000.00)
    `, [po1Id, matIdMap['MAT-001'], po1Id, matIdMap['MAT-002'], po1Id, matIdMap['MAT-006']]);

    const [po2Res]: any = await connection.query(`
      INSERT INTO purchase_orders (
        po_number, po_date, project_id, wbs_id, indent_id, vendor_name, expected_delivery_date,
        subtotal_amount, tax_amount, total_amount, payment_terms, delivery_address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'PO-2026-002', '2026-09-20', projectId, wbs2Id, ind2Id, 'Havells & Polycab Electrical Traders', '2026-09-25',
      262500.00, 47250.00, 309750.00, '15 days net from GRN date', 'Chakan Electrical Store, Pune Warehouse Project', 'completed'
    ]);
    const po2Id = po2Res.insertId;

    await connection.query(`
      INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_rate, discount_amount, tax_percentage, tax_amount, total_amount) VALUES
      (?, ?, 2000, 120.00, 0.00, 18.00, 43200.00, 283200.00),
      (?, ?, 500, 45.00, 0.00, 18.00, 4050.00, 26550.00)
    `, [po2Id, matIdMap['MAT-003'], po2Id, matIdMap['MAT-005']]);

    // 10. Insert Goods Receipt Notes (GRNs)
    const [grn1Res]: any = await connection.query(`
      INSERT INTO goods_receipt_notes (
        grn_number, po_id, project_id, wbs_id, vendor_name, delivery_date, delivery_challan_number,
        invoice_number, store_location, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'GRN-2026-001', po1Id, projectId, wbs1Id, 'UltraTech & Tata Steel Authorized Distributors', '2026-09-10',
      'DC-98124', 'INV-UT-8120', 'Civil Main Warehouse', 'Received cement and steel in good condition. 10 cement bags damaged in transit.'
    ]);
    const grn1Id = grn1Res.insertId;

    await connection.query(`
      INSERT INTO grn_items (grn_id, material_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, damaged_quantity) VALUES
      (?, ?, 500, 500, 490, 10, 10),
      (?, ?, 2000, 2000, 2000, 0, 0),
      (?, ?, 100, 100, 100, 0, 0)
    `, [grn1Id, matIdMap['MAT-001'], grn1Id, matIdMap['MAT-002'], grn1Id, matIdMap['MAT-006']]);

    const [grn2Res]: any = await connection.query(`
      INSERT INTO goods_receipt_notes (
        grn_number, po_id, project_id, wbs_id, vendor_name, delivery_date, delivery_challan_number,
        invoice_number, store_location, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'GRN-2026-002', po2Id, projectId, wbs2Id, 'Havells & Polycab Electrical Traders', '2026-09-22',
      'DC-HV-4412', 'INV-HV-9912', 'Electrical Yard Store', 'Cables and conduits verified and stored in electrical yard.'
    ]);
    const grn2Id = grn2Res.insertId;

    await connection.query(`
      INSERT INTO grn_items (grn_id, material_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, damaged_quantity) VALUES
      (?, ?, 2000, 2000, 2000, 0, 0),
      (?, ?, 500, 500, 500, 0, 0)
    `, [grn2Id, matIdMap['MAT-003'], grn2Id, matIdMap['MAT-005']]);

    // 11. Insert Material Issues / Usage
    await connection.query(`
      INSERT INTO material_transactions (txn_type, project_wbs_id, task_id, material_id, qty, rate, amount, txn_date, reference_number, notes) VALUES
      ('usage', ?, ?, ?, 320, 400.00, 128000.00, '2026-09-12', 'ISS-2026-001', 'Cement used for footing RCC pour'),
      ('usage', ?, ?, ?, 1200, 65.00, 78000.00, '2026-09-14', 'ISS-2026-002', 'TMT steel binding for foundation footings'),
      ('usage', ?, ?, ?, 1400, 120.00, 168000.00, '2026-09-24', 'ISS-2026-003', 'High voltage main feeder cable pulling')
    `, [
      wbs1Id, t1Id, matIdMap['MAT-001'],
      wbs1Id, t1Id, matIdMap['MAT-002'],
      wbs2Id, t3Id, matIdMap['MAT-003']
    ]);

    // 12. Insert Vendor Invoices & Payments
    const [vinv1Res]: any = await connection.query(`
      INSERT INTO vendor_invoices (
        invoice_number, invoice_date, po_id, grn_id, project_id, wbs_id, vendor_name,
        invoice_amount, tax_amount, payable_amount, paid_amount, balance_amount, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'VINV-2026-001', '2026-09-12', po1Id, grn1Id, projectId, wbs1Id, 'UltraTech & Tata Steel Authorized Distributors',
      480000.00, 86400.00, 566400.00, 350000.00, 216400.00, 'partially_paid'
    ]);
    const vinv1Id = vinv1Res.insertId;

    await connection.query(`
      INSERT INTO vendor_payments (vendor_invoice_id, payment_date, amount, payment_mode, reference_number, remarks) VALUES
      (?, '2026-09-20', 350000.00, 'Bank Transfer', 'UTR-HDFC-991823', 'Part payment for civil PO-001')
    `, [vinv1Id]);

    const [vinv2Res]: any = await connection.query(`
      INSERT INTO vendor_invoices (
        invoice_number, invoice_date, po_id, grn_id, project_id, wbs_id, vendor_name,
        invoice_amount, tax_amount, payable_amount, paid_amount, balance_amount, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'VINV-2026-002', '2026-09-24', po2Id, grn2Id, projectId, wbs2Id, 'Havells & Polycab Electrical Traders',
      262500.00, 47250.00, 309750.00, 309750.00, 0.00, 'paid'
    ]);
    const vinv2Id = vinv2Res.insertId;

    await connection.query(`
      INSERT INTO vendor_payments (vendor_invoice_id, payment_date, amount, payment_mode, reference_number, remarks) VALUES
      (?, '2026-09-28', 309750.00, 'Bank Transfer', 'UTR-ICICI-441290', 'Full payment for electrical PO-002')
    `, [vinv2Id]);

    // 13. Insert Customer Billing Schedule, Monthly Completed Work, Customer Invoice & Payment
    const [bsRes]: any = await connection.query(`
      INSERT INTO billing_schedules (
        project_id, quotation_id, billing_month, expected_amount, status
      ) VALUES (?, ?, ?, ?, ?)
    `, [projectId, quotationId, '2026-09-01', 5000000.00, 'invoiced']);
    const scheduleId = bsRes.insertId;

    const [cwRes]: any = await connection.query(`
      INSERT INTO monthly_completed_work (
        schedule_id, project_id, completion_percentage, approved_amount, status, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [scheduleId, projectId, 100.00, 5000000.00, 'approved', mainEmpId]);
    const completedWorkId = cwRes.insertId;

    const [invRes]: any = await connection.query(`
      INSERT INTO invoices (
        invoice_number, customer_id, project_id, quotation_id, schedule_id, currency_id, tax_id, tax_type,
        cgst_amount, sgst_amount, igst_amount, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'INV-PRJ1-202609', customerId, projectId, quotationId, scheduleId, 1, defaultTaxId, 'CGST_SGST',
      450000.00, 450000.00, 0.00, '2026-09-15', '2026-10-15', 5000000.00, 900000.00, 5900000.00, 'partially_paid'
    ]);
    const invoiceId = invRes.insertId;

    await connection.query(`
      INSERT INTO invoice_items (invoice_id, discipline_id, description, amount, is_extra_work) VALUES
      (?, 1, 'Civil & Substructure Completed Work Billing (Sept 2026)', 3000000.00, 0),
      (?, 2, 'Electrical Main Cable Installation Billing (Sept 2026)', 2000000.00, 0)
    `, [invoiceId, invoiceId]);

    await connection.query(`
      INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, status) VALUES
      (?, '2026-09-25', 4000000.00, 'Bank Transfer', 'TXN-HDFC-99120', 'completed')
    `, [invoiceId]);

    console.log('--- CLEAN DEMO DATASET SEED COMPLETE ---');
    console.log(`Demo Project ID: ${projectId}, Customer ID: ${customerId}, Quotation ID: ${quotationId}`);
  } catch (error) {
    console.error('Demo seed error:', error);
    throw error;
  } finally {
    connection.release();
  }
}
