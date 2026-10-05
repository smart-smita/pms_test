import { dbPool } from './config/db';

async function resetAndSeed() {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('--- Disabling Foreign Key Checks ---');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('--- Truncating Transaction Tables ---');
    const tablesToTruncate = [
      'invoice_items', 'invoice_payments', 'invoices',
      'monthly_completed_work', 'billing_schedules',
      'purchase_order_items', 'purchase_orders',
      'grn_items', 'grns',
      'material_issues', 'material_requirements',
      'task_labour', 'employee_attendance', 'labour_attendance', 'tasks',
      'wbs',
      'quotation_disciplines', 'quotation_terms_snapshots', 'quotations',
      'project_disciplines', 'projects',
      'customers', 'site_surveys'
    ];

    for (const table of tablesToTruncate) {
      await connection.query(`TRUNCATE TABLE ${table}`);
      console.log(`Truncated ${table}`);
    }

    console.log('--- Re-enabling Foreign Key Checks ---');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('--- Seeding Realistic Demo Data ---');
    // Seed Customer
    const [custRes]: any = await connection.query(
      `INSERT INTO customers (customer_name, customer_code, email, phone, address, gst_number) 
       VALUES ('Tech Logistics Ltd', 'TECH-LOG', 'info@techlogistics.com', '9876543210', 'Mumbai, India', '27AABCU9603R1Z2')`
    );
    const customerId = custRes.insertId;

    // Seed Project
    const [projRes]: any = await connection.query(
      `INSERT INTO projects (project_name, project_code, customer_id, location, start_date, expected_end_date, status, budget_amount, current_phase)
       VALUES ('Pune Warehouse Construction', 'PWC-001', ?, 'Pune, Maharashtra', '2026-01-01', '2026-12-31', 'active', 50000000.00, 'planning')`,
      [customerId]
    );
    const projectId = projRes.insertId;

    // Seed Quotation
    const [quotRes]: any = await connection.query(
      `INSERT INTO quotations (quotation_code, customer_id, project_id, quotation_date, validity_date, description, subtotal_amount, tax_percentage, tax_amount, total_amount, status)
       VALUES ('QT-PWC-01', ?, ?, '2025-12-15', '2026-01-15', 'Quotation for Pune Warehouse', 40000000.00, 18, 7200000.00, 47200000.00, 'approved')`,
      [customerId, projectId]
    );
    const quotationId = quotRes.insertId;

    // Seed WBS
    const wbsData = [
      { code: 'WBS-01', name: 'Civil Work', desc: 'Foundation, structural frame, masonry', start: '2026-01-15', end: '2026-05-30', status: 'in_progress' },
      { code: 'WBS-02', name: 'Electrical Work', desc: 'Wiring, fixtures, panels', start: '2026-06-01', end: '2026-08-30', status: 'pending' },
      { code: 'WBS-03', name: 'Plumbing Work', desc: 'Piping, drainage, sanitary fixtures', start: '2026-06-15', end: '2026-09-15', status: 'pending' }
    ];
    const wbsIds = [];
    for (const w of wbsData) {
      const [wRes]: any = await connection.query(
        `INSERT INTO wbs (project_id, wbs_code, wbs_name, description, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [projectId, w.code, w.name, w.desc, w.start, w.end, w.status]
      );
      wbsIds.push(wRes.insertId);
    }

    // Seed Tasks for Civil Work
    const tasks = [
      { wbsId: wbsIds[0], name: 'Excavation & Foundation', start: '2026-01-15', end: '2026-02-15', status: 'completed', completion: 100 },
      { wbsId: wbsIds[0], name: 'Column Erection', start: '2026-02-16', end: '2026-03-30', status: 'in_progress', completion: 50 },
      { wbsId: wbsIds[0], name: 'Roof Truss & Sheeting', start: '2026-04-01', end: '2026-05-30', status: 'pending', completion: 0 }
    ];
    for (const t of tasks) {
      await connection.query(
        `INSERT INTO tasks (wbs_id, task_name, start_date, end_date, status, completion_percentage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [t.wbsId, t.name, t.start, t.end, t.status, t.completion]
      );
    }

    // Fetch Material Master
    const [materials]: any = await connection.query('SELECT material_id, material_name FROM materials');
    let cementId = materials.find((m: any) => m.material_name.toLowerCase().includes('cement'))?.material_id;
    let steelId = materials.find((m: any) => m.material_name.toLowerCase().includes('steel'))?.material_id;
    let cableId = materials.find((m: any) => m.material_name.toLowerCase().includes('cable'))?.material_id;
    let pvcId = materials.find((m: any) => m.material_name.toLowerCase().includes('pvc'))?.material_id;

    if (!cementId) {
       const [mat1]: any = await connection.query(`INSERT INTO materials (material_code, material_name, category, uom, standard_rate, tax_percentage) VALUES ('MAT-CEMENT', 'Cement', 'Civil', 'Bag', 400.00, 18)`); cementId = mat1.insertId;
    }
    if (!steelId) {
       const [mat2]: any = await connection.query(`INSERT INTO materials (material_code, material_name, category, uom, standard_rate, tax_percentage) VALUES ('MAT-STEEL', 'TMT Steel 12mm', 'Civil', 'Kg', 65.00, 18)`); steelId = mat2.insertId;
    }
    if (!cableId) {
       const [mat3]: any = await connection.query(`INSERT INTO materials (material_code, material_name, category, uom, standard_rate, tax_percentage) VALUES ('MAT-CABLE', 'Copper Cable 4sqmm', 'Electrical', 'Meter', 120.00, 18)`); cableId = mat3.insertId;
    }
    if (!pvcId) {
       const [mat4]: any = await connection.query(`INSERT INTO materials (material_code, material_name, category, uom, standard_rate, tax_percentage) VALUES ('MAT-PVC', 'PVC Pipe 4 inch', 'Plumbing', 'Meter', 180.00, 18)`); pvcId = mat4.insertId;
    }

    // Material Requirements for Civil Work
    await connection.query(
      `INSERT INTO material_requirements (project_id, wbs_id, material_id, estimated_quantity, rate_budgeted) VALUES (?, ?, ?, ?, ?)`,
      [projectId, wbsIds[0], cementId, 500, 400.00]
    );
    await connection.query(
      `INSERT INTO material_requirements (project_id, wbs_id, material_id, estimated_quantity, rate_budgeted) VALUES (?, ?, ?, ?, ?)`,
      [projectId, wbsIds[0], steelId, 2000, 65.00]
    );

    // Purchase Order
    const [supplierRes]: any = await connection.query('SELECT supplier_id FROM suppliers LIMIT 1');
    let supplierId = supplierRes[0]?.supplier_id;
    if(!supplierId) {
       const [sup]: any = await connection.query(`INSERT INTO suppliers (supplier_name) VALUES ('Mega Build Supplies')`);
       supplierId = sup.insertId;
    }
    
    const [poRes]: any = await connection.query(
      `INSERT INTO purchase_orders (po_number, project_id, supplier_id, po_date, expected_delivery_date, status, total_amount)
       VALUES ('PO-PWC-001', ?, ?, '2026-01-05', '2026-01-10', 'approved', 389400.00)`,
      [projectId, supplierId]
    );
    const poId = poRes.insertId;

    await connection.query(`INSERT INTO purchase_order_items (po_id, material_id, order_quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`, [poId, cementId, 500, 400.00, 200000.00]);
    await connection.query(`INSERT INTO purchase_order_items (po_id, material_id, order_quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`, [poId, steelId, 2000, 65.00, 130000.00]);

    // GRN (Material Receipt)
    const [grnRes]: any = await connection.query(
      `INSERT INTO grns (grn_number, po_id, project_id, supplier_id, receipt_date, status, received_by)
       VALUES ('GRN-001', ?, ?, ?, '2026-01-10', 'approved', 1)`,
      [poId, projectId, supplierId]
    );
    const grnId = grnRes.insertId;

    await connection.query(`INSERT INTO grn_items (grn_id, po_item_id, material_id, received_quantity, accepted_quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)`, [grnId, 1, cementId, 500, 500, 400.00]);
    await connection.query(`INSERT INTO grn_items (grn_id, po_item_id, material_id, received_quantity, accepted_quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)`, [grnId, 2, steelId, 2000, 2000, 65.00]);

    // Material Issue
    await connection.query(
      `INSERT INTO material_issues (issue_number, project_id, wbs_id, material_id, issue_date, quantity, issued_to_name, notes)
       VALUES ('ISS-001', ?, ?, ?, '2026-01-20', 100, 'Site Supervisor', 'For foundation base')`,
      [projectId, wbsIds[0], cementId]
    );

    // Billing Schedule & Invoice
    const [schRes]: any = await connection.query(
      `INSERT INTO billing_schedules (project_id, quotation_id, billing_month, expected_amount, status)
       VALUES (?, ?, '2026-01-01', 3500000.00, 'invoiced')`,
      [projectId, quotationId]
    );
    const scheduleId = schRes.insertId;

    // Base Currency & Default Tax
    const [currRes]: any = await connection.query(`SELECT currency_id FROM currencies WHERE is_base = 1 LIMIT 1`);
    const currId = currRes[0]?.currency_id || 1;
    const [taxRes]: any = await connection.query(`SELECT tax_id FROM taxes LIMIT 1`);
    const taxId = taxRes[0]?.tax_id || null;

    const [invRes]: any = await connection.query(
      `INSERT INTO invoices (invoice_number, customer_id, project_id, quotation_id, schedule_id, currency_id, tax_id, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status)
       VALUES ('INV-PWC-Jan26', ?, ?, ?, ?, ?, ?, '2026-01-31', '2026-02-28', 3500000.00, 630000.00, 4130000.00, 'sent')`,
      [customerId, projectId, quotationId, scheduleId, currId, taxId]
    );
    const invId = invRes.insertId;

    await connection.query(`INSERT INTO invoice_items (invoice_id, description, amount, is_extra_work) VALUES (?, 'Jan Billing Phase', 3500000.00, 0)`, [invId]);

    // Invoice Payment
    await connection.query(
      `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, status)
       VALUES (?, '2026-02-15', 2000000.00, 'Bank Transfer', 'TXN-998811', 'completed')`,
      [invId]
    );
    await connection.query(`UPDATE invoices SET status = 'partially_paid' WHERE invoice_id = ?`, [invId]);

    await connection.commit();
    console.log('--- Demo Data Seeded Successfully ---');

  } catch (error) {
    await connection.rollback();
    console.error('Error seeding demo data:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

resetAndSeed();
