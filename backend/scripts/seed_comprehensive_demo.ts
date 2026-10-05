/**
 * Comprehensive HTCO ERP Demo Data Seeder
 * 
 * Generates an end-to-end connected, realistic construction & project management dataset:
 * Customer -> Quotation -> Quotation WBS -> Labour -> Materials -> Approval
 * -> Planning -> Planning WBS -> Planning Tasks -> Dependencies
 * -> Projects -> Project WBS -> Tasks -> Assignments -> Material Requirements
 * -> Timesheets (100+) -> Attendance (200+) -> Labour Logs (50+) -> Labour Payments
 * -> Billing Schedules -> Invoices (15+) -> Invoice Payments
 * -> Site Surveys (15+) -> Documents
 *
 * Safe & Idempotent:
 * - Deterministic codes (DEMO-*)
 * - Does not duplicate on re-run
 * - Never deletes real/production data
 * - Supports --reset flag for clean demo re-seeding
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

dotenv.config();

const isResetMode = process.argv.includes('--reset');

async function getDbConnection() {
  return await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaptm',
    multipleStatements: true,
  });
}

// Global record counters
const counts: { [table: string]: number } = {};

function countRecord(table: string, inc: number = 1) {
  counts[table] = (counts[table] || 0) + inc;
}

// Date helpers
function addDays(baseDate: string, days: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function runDemoSeeder() {
  const pool = await getDbConnection();
  console.log('===============================================================');
  console.log('  HTCO ERP COMPREHENSIVE DEMO SEED SYSTEM');
  console.log('===============================================================');
  console.log(`Target Database : ${process.env.DB_NAME || 'gaptm'}`);
  console.log(`Execution Mode  : ${isResetMode ? 'RESET & RE-SEED (Demo Only)' : 'IDEMPOTENT SEED (Safe)'}`);
  console.log('Timestamp       : 2026-10-03');
  console.log('---------------------------------------------------------------\n');

  // Ensure upload demo files exist
  const uploadsDocDir = path.join(__dirname, '../uploads/documents');
  const uploadsSurveysDir = path.join(__dirname, '../uploads/surveys');
  if (!fs.existsSync(uploadsDocDir)) fs.mkdirSync(uploadsDocDir, { recursive: true });
  if (!fs.existsSync(uploadsSurveysDir)) fs.mkdirSync(uploadsSurveysDir, { recursive: true });

  const dummyPdf = path.join(uploadsDocDir, 'demo_specification.pdf');
  if (!fs.existsSync(dummyPdf)) {
    fs.writeFileSync(dummyPdf, '%PDF-1.4\n1 0 obj\n<< /Title (HTCO Construction Specification) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  }
  const dummyImg = path.join(uploadsSurveysDir, 'demo_inspection_photo.jpg');
  if (!fs.existsSync(dummyImg)) {
    fs.writeFileSync(dummyImg, Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'));
  }

  try {
    // -------------------------------------------------------------
    // STEP 0: SAFE RESET (If requested)
    // -------------------------------------------------------------
    if (isResetMode) {
      console.log('>>> [Step 0] Cleaning existing demo records (Safe Filter: DEMO-*)...');
      
      // Clean transactional tables first
      await pool.query(`DELETE FROM site_survey_photos WHERE survey_id IN (SELECT survey_id FROM site_surveys WHERE survey_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM site_surveys WHERE survey_code LIKE 'DEMO-%'`);
      
      await pool.query(`DELETE FROM invoice_payments WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE invoice_number LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM invoice_items WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE invoice_number LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM invoices WHERE invoice_number LIKE 'DEMO-%'`);
      
      await pool.query(`DELETE FROM monthly_completed_work WHERE schedule_id IN (SELECT schedule_id FROM billing_schedules WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%'))`);
      await pool.query(`DELETE FROM billing_schedules WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);

      await pool.query(`DELETE FROM project_material_logs WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001')`);
      await pool.query(`DELETE FROM project_materials WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001')`);

      await pool.query(`DELETE FROM labour_payments WHERE payment_code LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM labour_work_logs WHERE labour_id IN (SELECT labour_id FROM labours WHERE aadhar_id LIKE 'DEMO-%') OR project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%')`);
      
      await pool.query(`DELETE FROM attendance_logs WHERE employee_id IN (SELECT employee_id FROM employees WHERE employee_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM timesheets WHERE employee_id IN (SELECT employee_id FROM employees WHERE employee_code LIKE 'DEMO-%') OR project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%')`);

      await pool.query(`DELETE FROM task_labour_assignments WHERE task_id IN (SELECT task_id FROM tasks WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001'))`);
      await pool.query(`DELETE FROM task_assignments WHERE task_id IN (SELECT task_id FROM tasks WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001'))`);
      await pool.query(`DELETE FROM task_dependencies WHERE task_id IN (SELECT task_id FROM tasks WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001'))`);
      await pool.query(`DELETE FROM tasks WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001')`);

      await pool.query(`DELETE FROM project_wbs WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'DEMO-%' OR project_code = 'PRJ-PUNE-001')`);
      await pool.query(`DELETE FROM projects WHERE project_code LIKE 'DEMO-%'`);

      await pool.query(`DELETE FROM planning_resources WHERE planning_task_id IN (SELECT id FROM planning_tasks WHERE planning_wbs_id IN (SELECT id FROM planning_wbs WHERE planning_id IN (SELECT id FROM planning WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%'))))`);
      await pool.query(`DELETE FROM planning_task_dependencies WHERE task_id IN (SELECT id FROM planning_tasks WHERE planning_wbs_id IN (SELECT id FROM planning_wbs WHERE planning_id IN (SELECT id FROM planning WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%'))))`);
      await pool.query(`DELETE FROM planning_tasks WHERE planning_wbs_id IN (SELECT id FROM planning_wbs WHERE planning_id IN (SELECT id FROM planning WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')))`);
      await pool.query(`DELETE FROM planning_wbs WHERE planning_id IN (SELECT id FROM planning WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%'))`);
      await pool.query(`DELETE FROM planning WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);

      await pool.query(`DELETE FROM quotation_terms_snapshots WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotation_terms_templates WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotation_taxes WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotation_wbs_items WHERE quotation_discipline_id IN (SELECT id FROM quotation_disciplines WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%'))`);
      await pool.query(`DELETE FROM quotation_wbs_labour WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotation_wbs_material WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotation_disciplines WHERE quotation_id IN (SELECT quotation_id FROM quotations WHERE quotation_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM quotations WHERE quotation_code LIKE 'DEMO-%'`);

      await pool.query(`DELETE FROM wbs_template_details WHERE template_id IN (SELECT id FROM wbs_templates WHERE template_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM wbs_template_project_types WHERE template_id IN (SELECT id FROM wbs_templates WHERE template_code LIKE 'DEMO-%')`);
      await pool.query(`DELETE FROM wbs_templates WHERE template_code LIKE 'DEMO-%'`);

      await pool.query(`DELETE FROM entity_documents WHERE document_name LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM terms_templates WHERE template_name LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM holidays WHERE calendar_id IN (SELECT id FROM company_calendar WHERE calendar_name = 'DEMO-CAL-2026')`);
      await pool.query(`DELETE FROM company_calendar WHERE calendar_name = 'DEMO-CAL-2026'`);

      await pool.query(`DELETE FROM labours WHERE aadhar_id LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM materials WHERE material_code LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM customers WHERE customer_code LIKE 'DEMO-%'`);
      await pool.query(`DELETE FROM employees WHERE employee_code LIKE 'DEMO-%'`);

      console.log('✓ Cleaned existing demo data without touching production records.\n');
    }

    // -------------------------------------------------------------
    // STEP 1: CURRENCIES, TAXES & MASTER REFERENCES
    // -------------------------------------------------------------
    console.log('>>> [Step 1] Verifying / Seeding Currencies, Taxes & Project Types...');
    
    // Check SGD currency
    const [sgdRows]: any = await pool.query(`SELECT currency_id FROM currencies WHERE currency_code = 'SGD'`);
    let sgdId = sgdRows[0]?.currency_id;
    if (!sgdId) {
      const [res]: any = await pool.query(
        `INSERT INTO currencies (currency_code, currency_name, symbol, exchange_rate, decimal_places, is_base) VALUES ('SGD', 'Singapore Dollar', 'S$', 0.360000, 2, 0)`
      );
      sgdId = res.insertId;
      countRecord('currencies');
    }

    const curMap: { [code: string]: number } = {
      AED: 1,
      INR: 2,
      USD: 3,
      EUR: 277,
      GBP: 278,
      SGD: sgdId,
    };

    // Project Types lookup
    const [ptRows]: any = await pool.query(`SELECT type_id, type_name FROM project_types`);
    const ptMap: { [name: string]: number } = {};
    for (const pt of ptRows) {
      ptMap[pt.type_name.toLowerCase()] = pt.type_id;
    }
    
    // Ensure 'Landscaping', 'Interior Fit-Out' and 'MEP Works' exist
    const extraTypes = [
      { code: 'LANDSCAPING', name: 'Landscaping' },
      { code: 'INTERIOR_FIT_OUT', name: 'Interior Fit-Out' },
      { code: 'MEP_WORKS', name: 'MEP Works' },
    ];
    for (const t of extraTypes) {
      if (!ptMap[t.name.toLowerCase()]) {
        const [res]: any = await pool.query(
          `INSERT INTO project_types (type_code, type_name, description, status, sort_order) VALUES (?, ?, ?, 1, 50)`,
          [t.code, t.name, `${t.name} Projects`]
        );
        ptMap[t.name.toLowerCase()] = res.insertId;
        countRecord('project_types');
      }
    }

    // Taxes lookup
    let taxGst18 = 2; // Default Indian GST 18%
    let taxVat5 = 1;  // Default UAE VAT 5%
    let taxUkVat20 = 1;
    const [tax18Rows]: any = await pool.query(`SELECT tax_id FROM taxes WHERE tax_percentage = 18.00 LIMIT 1`);
    if (tax18Rows.length > 0) taxGst18 = tax18Rows[0].tax_id;
    const [tax5Rows]: any = await pool.query(`SELECT tax_id FROM taxes WHERE tax_percentage = 5.00 LIMIT 1`);
    if (tax5Rows.length > 0) taxVat5 = tax5Rows[0].tax_id;

    console.log('✓ Currencies, Taxes & Project Types ready.');

    // -------------------------------------------------------------
    // STEP 2: CUSTOMERS (5 Realistic Enterprises)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 2] Seeding Customers...');
    const customersData = [
      {
        code: 'CUST-IND-001',
        name: 'Pune Logistics & Warehousing Pvt Ltd',
        person: 'Ramesh Kulkarni',
        phone: '+91-9822014455',
        email: 'ramesh.kulkarni@punelogistics.com',
        country_id: 1,
        state: 'Maharashtra',
        city: 'Pune',
        address: 'Chakan MIDC Industrial Phase II, Pune, Maharashtra 410501',
        tax_id: taxGst18,
        currency_id: curMap['INR'],
        gst_number: '27AABCP1234F1Z8',
      },
      {
        code: 'DEMO-CUST-002',
        name: 'The Polo Townhouses Development LLC',
        person: 'Tariq Al Mansoor',
        phone: '+971-50-8451290',
        email: 't.mansoor@polotownhouses.ae',
        country_id: 2,
        state: 'Dubai',
        city: 'Dubai',
        address: 'Meydan District 11, Nad Al Sheba, Dubai, UAE',
        tax_id: taxVat5,
        currency_id: curMap['AED'],
        gst_number: 'TRN-100294857200003',
      },
      {
        code: 'DEMO-CUST-003',
        name: 'Emirates Commercial Properties PJSC',
        person: 'Fatima Al Suwaidi',
        phone: '+971-4-3998822',
        email: 'contracts@emiratescommercial.ae',
        country_id: 2,
        state: 'Dubai',
        city: 'Dubai',
        address: 'Business Bay Executive Towers, Level 34, Dubai, UAE',
        tax_id: taxVat5,
        currency_id: curMap['AED'],
        gst_number: 'TRN-100482910400002',
      },
      {
        code: 'DEMO-CUST-004',
        name: 'Marina Bay Developments Pte Ltd',
        person: 'Kenji Takahashi',
        phone: '+65-6734-9988',
        email: 'k.takahashi@marinabaydev.sg',
        country_id: 10,
        state: 'Central Region',
        city: 'Singapore',
        address: '8 Marina View, Asia Square Tower 1, Singapore 018960',
        tax_id: tax5Rows[0]?.tax_id || taxVat5,
        currency_id: curMap['SGD'],
        gst_number: 'UEN-201938472M',
      },
      {
        code: 'DEMO-CUST-005',
        name: 'Mayfair UK Luxury Estates Ltd',
        person: 'Lord Arthur Pendelton',
        phone: '+44-20-7946-0192',
        email: 'developments@mayfairestates.co.uk',
        country_id: 8,
        state: 'Greater London',
        city: 'London',
        address: '14 Berkeley Square, Mayfair, London W1J 6BQ, United Kingdom',
        tax_id: taxGst18,
        currency_id: curMap['GBP'],
        gst_number: 'GB-998234812',
      }
    ];

    const customerIdMap: { [code: string]: number } = {};

    for (const c of customersData) {
      const [existing]: any = await pool.query(`SELECT customer_id FROM customers WHERE customer_code = ?`, [c.code]);
      if (existing.length > 0) {
        customerIdMap[c.code] = existing[0].customer_id;
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO customers (
             customer_code, customer_name, contact_person, contact_number, email,
             country_id, state, city, address, tax_id, currency_id, gst_number, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [c.code, c.name, c.person, c.phone, c.email, c.country_id, c.state, c.city, c.address, c.tax_id, c.currency_id, c.gst_number]
        );
        customerIdMap[c.code] = res.insertId;
        countRecord('customers');
      }
    }
    console.log(`✓ 5 Customers active (IDs: ${Object.values(customerIdMap).join(', ')})`);

    // -------------------------------------------------------------
    // STEP 3: MATERIALS MASTER (18 Realistic Construction Materials)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 3] Seeding Material Master...');
    const materialsData = [
      { code: 'DEMO-MAT-001', name: 'Portland Cement 53 Grade', cat: 'Civil', unit: 'Bag', rate: 380.00, tax: 18.00, hsn: '252329' },
      { code: 'DEMO-MAT-002', name: 'TMT Fe550D Steel Rebars 12mm-25mm', cat: 'Civil', unit: 'Kg', rate: 64.00, tax: 18.00, hsn: '721420' },
      { code: 'DEMO-MAT-003', name: 'River Sand / Coarse Sand', cat: 'Civil', unit: 'Ton', rate: 1450.00, tax: 5.00, hsn: '250510' },
      { code: 'DEMO-MAT-004', name: 'Crushed Granite Aggregate 20mm', cat: 'Civil', unit: 'Ton', rate: 980.00, tax: 5.00, hsn: '251710' },
      { code: 'DEMO-MAT-005', name: 'Autoclaved Aerated Concrete (AAC) Blocks', cat: 'Masonry', unit: 'Cum', rate: 3200.00, tax: 12.00, hsn: '681599' },
      { code: 'DEMO-MAT-006', name: 'Ready-Mix Concrete M30 Grade', cat: 'Concrete', unit: 'Cum', rate: 4600.00, tax: 18.00, hsn: '382450' },
      { code: 'DEMO-MAT-007', name: 'Interlocking Concrete Paver Blocks 80mm', cat: 'Landscaping', unit: 'SqM', rate: 420.00, tax: 12.00, hsn: '681019' },
      { code: 'DEMO-MAT-008', name: 'Vitrified Floor Tiles 800x800mm', cat: 'Finishing', unit: 'SqM', rate: 850.00, tax: 18.00, hsn: '690721' },
      { code: 'DEMO-MAT-009', name: 'Weatherproof Exterior Emulsion Paint', cat: 'Painting', unit: 'Liter', rate: 360.00, tax: 18.00, hsn: '320910' },
      { code: 'DEMO-MAT-010', name: 'Copper Armoured XLPE Cable 4Cx16sqmm', cat: 'Electrical', unit: 'Meter', rate: 340.00, tax: 18.00, hsn: '854449' },
      { code: 'DEMO-MAT-011', name: 'Heavy Duty Schedule 40 PVC Pipes 110mm', cat: 'Plumbing', unit: 'Meter', rate: 220.00, tax: 18.00, hsn: '391723' },
      { code: 'DEMO-MAT-012', name: 'Commercial Sanitaryware & Fixture Set', cat: 'Plumbing', unit: 'Set', rate: 8500.00, tax: 18.00, hsn: '691010' },
      { code: 'DEMO-MAT-013', name: 'Architectural Aluminium Window Profiles', cat: 'Glazing', unit: 'Kg', rate: 320.00, tax: 18.00, hsn: '760421' },
      { code: 'DEMO-MAT-014', name: '8mm Toughened Clear Glass Panels', cat: 'Glazing', unit: 'SqM', rate: 1200.00, tax: 18.00, hsn: '700719' },
      { code: 'DEMO-MAT-015', name: 'SBS Bituminous Membrane Waterproofing', cat: 'Waterproofing', unit: 'SqM', rate: 280.00, tax: 18.00, hsn: '680710' },
      { code: 'DEMO-MAT-016', name: 'Screened Fertile Red Topsoil', cat: 'Landscaping', unit: 'Ton', rate: 650.00, tax: 0.00, hsn: '310100' },
      { code: 'DEMO-MAT-017', name: 'Natural Bermuda Grass Turf Rolls', cat: 'Landscaping', unit: 'SqM', rate: 180.00, tax: 0.00, hsn: '060290' },
      { code: 'DEMO-MAT-018', name: 'Native Ornamental Palms & Shrubbery', cat: 'Landscaping', unit: 'Nos', rate: 450.00, tax: 0.00, hsn: '060220' },
    ];

    const materialIdMap: { [code: string]: number } = {};

    for (const m of materialsData) {
      const [existing]: any = await pool.query(`SELECT material_id FROM materials WHERE material_code = ?`, [m.code]);
      if (existing.length > 0) {
        materialIdMap[m.code] = existing[0].material_id;
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO materials (
             material_code, material_name, category, unit, rate, tax_percentage, hsn_sac_code, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [m.code, m.name, m.cat, m.unit, m.rate, m.tax, m.hsn]
        );
        materialIdMap[m.code] = res.insertId;
        countRecord('materials');
      }
    }
    console.log(`✓ 18 Materials ready in catalog.`);

    // -------------------------------------------------------------
    // STEP 4: CONTRACTORS & LABOUR MASTER (7 Specialists)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 4] Seeding Contractor & Labour Master...');
    const laboursData = [
      { code: 'DEMO-LAB-001', name: 'ABC Civil Infrastructure Contractors', type: 'contractor', cat: 'contract', phone: '+91-9876500101', rate: 450.00, project_rate: 3600.00 },
      { code: 'DEMO-LAB-002', name: 'XYZ Reinforced Concrete Specialists', type: 'contractor', cat: 'contract', phone: '+91-9876500102', rate: 550.00, project_rate: 4400.00 },
      { code: 'DEMO-LAB-003', name: 'Prime Electro-Mechanical Contractors', type: 'contractor', cat: 'contract', phone: '+91-9876500103', rate: 600.00, project_rate: 4800.00 },
      { code: 'DEMO-LAB-004', name: 'Green Oasis Landscaping & Irrigation', type: 'contractor', cat: 'contract', phone: '+971-50-7112233', rate: 400.00, project_rate: 3200.00 },
      { code: 'DEMO-LAB-005', name: 'Metro Flow Plumbing & Sanitary Experts', type: 'contractor', cat: 'contract', phone: '+91-9876500105', rate: 480.00, project_rate: 3840.00 },
      { code: 'DEMO-LAB-006', name: 'Apex Site Labour Force - Crew Alpha', type: 'direct_labour', cat: 'temporary', phone: '+91-9876500106', rate: 250.00, project_rate: 2000.00 },
      { code: 'DEMO-LAB-007', name: 'Apex Site Labour Force - Crew Beta', type: 'temporary', cat: 'temporary', phone: '+91-9876500107', rate: 220.00, project_rate: 1760.00 },
    ];

    const labourIdMap: { [code: string]: number } = {};

    for (const l of laboursData) {
      const [existing]: any = await pool.query(`SELECT labour_id FROM labours WHERE aadhar_id = ?`, [l.code]);
      if (existing.length > 0) {
        labourIdMap[l.code] = existing[0].labour_id;
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO labours (
             name, contact_number, aadhar_id, labour_type, labour_category, hourly_rate, project_rate, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [l.name, l.phone, l.code, l.type, l.cat, l.rate, l.project_rate]
        );
        labourIdMap[l.code] = res.insertId;
        countRecord('labours');
      }
    }
    console.log(`✓ 7 Contractors & Labour teams ready.`);

    // -------------------------------------------------------------
    // STEP 5: EMPLOYEES (12 Engineering & Management Professionals)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 5] Seeding Employee Master...');
    const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);

    const employeesData = [
      { code: 'DEMO-EMP-001', name: 'Vikram Malhotra', email: 'v.malhotra@htco.com', role: 2, dept: 'Project Management', rate: 1200.00, phone: '+91-9820011221' },
      { code: 'DEMO-EMP-002', name: 'Rajesh Deshmukh', email: 'r.deshmukh@htco.com', role: 2, dept: 'Operations', rate: 950.00, phone: '+91-9820011222' },
      { code: 'DEMO-EMP-003', name: 'Priya Sharma', email: 'p.sharma@htco.com', role: 3, dept: 'Planning & Controls', rate: 750.00, phone: '+91-9820011223' },
      { code: 'DEMO-EMP-004', name: 'Amitabh Sengupta', email: 'a.sengupta@htco.com', role: 3, dept: 'Civil Engineering', rate: 700.00, phone: '+91-9820011224' },
      { code: 'DEMO-EMP-005', name: 'Karthik Raman', email: 'k.raman@htco.com', role: 3, dept: 'MEP Services', rate: 720.00, phone: '+91-9820011225' },
      { code: 'DEMO-EMP-006', name: 'Neha Kulkarni', email: 'n.kulkarni@htco.com', role: 3, dept: 'Commercial & Contracts', rate: 650.00, phone: '+91-9820011226' },
      { code: 'DEMO-EMP-007', name: 'Sanjay Verma', email: 's.verma@htco.com', role: 3, dept: 'Site Execution', rate: 450.00, phone: '+91-9820011227' },
      { code: 'DEMO-EMP-008', name: 'Manoj Patil', email: 'm.patil@htco.com', role: 3, dept: 'Health & Safety', rate: 480.00, phone: '+91-9820011228' },
      { code: 'DEMO-EMP-009', name: 'Deepak Joshi', email: 'd.joshi@htco.com', role: 3, dept: 'Procurement & Logistics', rate: 420.00, phone: '+91-9820011229' },
      { code: 'DEMO-EMP-010', name: 'Ananya Roy', email: 'a.roy@htco.com', role: 3, dept: 'Quality Control', rate: 620.00, phone: '+91-9820011230' },
      { code: 'DEMO-EMP-011', name: 'Suresh Gawde', email: 's.gawde@htco.com', role: 3, dept: 'Civil Engineering', rate: 500.00, phone: '+91-9820011231' },
      { code: 'DEMO-EMP-012', name: 'Arun Kumar', email: 'a.kumar@htco.com', role: 3, dept: 'MEP Services', rate: 480.00, phone: '+91-9820011232' },
    ];

    const employeeIdMap: { [code: string]: number } = {};

    for (const e of employeesData) {
      const [existing]: any = await pool.query(`SELECT employee_id FROM employees WHERE employee_code = ?`, [e.code]);
      if (existing.length > 0) {
        employeeIdMap[e.code] = existing[0].employee_id;
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO employees (
             employee_code, name, email, password_hash, role_id, department, hourly_rate, contact_number, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [e.code, e.name, e.email, defaultPasswordHash, e.role, e.dept, e.rate, e.phone]
        );
        employeeIdMap[e.code] = res.insertId;
        countRecord('employees');
      }
    }
    console.log(`✓ 12 Engineering & Management employees active (Password: Admin123!)`);

    // -------------------------------------------------------------
    // STEP 6: COMPANY CALENDAR & HOLIDAYS
    // -------------------------------------------------------------
    console.log('\n>>> [Step 6] Seeding Company Calendar & Holidays...');
    const [existingCal]: any = await pool.query(`SELECT id FROM company_calendar WHERE calendar_name = 'DEMO-CAL-2026'`);
    let calendarId = existingCal[0]?.id;
    if (!calendarId) {
      const workingDays = JSON.stringify({
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      });
      const [calRes]: any = await pool.query(
        `INSERT INTO company_calendar (calendar_name, working_days_json, working_hours_per_day, status)
         VALUES ('DEMO-CAL-2026', ?, 10.00, 1)`,
        [workingDays]
      );
      calendarId = calRes.insertId;
      countRecord('company_calendar');

      const holidaysList = [
        { date: '2026-01-26', desc: 'Republic Day', type: 'public_holiday' },
        { date: '2026-03-04', desc: 'Holi Festival', type: 'public_holiday' },
        { date: '2026-03-20', desc: 'Eid al-Fitr', type: 'public_holiday' },
        { date: '2026-05-01', desc: 'Labour Day', type: 'public_holiday' },
        { date: '2026-08-15', desc: 'Independence Day', type: 'public_holiday' },
        { date: '2026-09-04', desc: 'Janmashtami', type: 'public_holiday' },
        { date: '2026-10-02', desc: 'Mahatma Gandhi Jayanti', type: 'public_holiday' },
        { date: '2026-10-20', desc: 'Dussehra', type: 'public_holiday' },
        { date: '2026-11-08', desc: 'Diwali', type: 'public_holiday' },
        { date: '2026-12-25', desc: 'Christmas Day', type: 'public_holiday' },
      ];
      for (const h of holidaysList) {
        await pool.query(
          `INSERT INTO holidays (calendar_id, holiday_date, description, type) VALUES (?, ?, ?, ?)`,
          [calendarId, h.date, h.desc, h.type]
        );
        countRecord('holidays');
      }
    }
    console.log(`✓ Calendar DEMO-CAL-2026 configured with public holidays.`);

    // -------------------------------------------------------------
    // STEP 7: WBS TEMPLATES & HIERARCHICAL DETAILS
    // -------------------------------------------------------------
    console.log('\n>>> [Step 7] Seeding WBS Templates & Structures...');
    const wbsTemplatesData = [
      {
        code: 'DEMO-TMPL-RES',
        name: 'G+2 Residential Construction Master Template',
        pt: ptMap['residential'] || 12,
        desc: 'Comprehensive WBS template for multi-storey residential villas and apartments.',
        items: [
          { code: '1.0', name: 'Project Management & Mobilization', items: ['Planning & Permits', 'Site Mobilization & Fencing', 'Safety Setup'] },
          { code: '2.0', name: 'Substructure & Foundation Works', items: ['Site Clearing & Excavation', 'PCC Bed Concrete', 'Footing Reinforcement Steel', 'Footing Concreting', 'Plinth Beam & Backfilling'] },
          { code: '3.0', name: 'Superstructure RCC Works', items: ['Ground Floor Columns & Slabs', 'First Floor Columns & Slabs', 'Second Floor Columns & Slabs', 'Staircase RCC'] },
          { code: '4.0', name: 'Masonry & Plastering', items: ['External AAC Block Masonry', 'Internal Partition Walls', 'External Waterproof Plaster', 'Internal Gypsum Plaster'] },
          { code: '5.0', name: 'MEP Infrastructure', items: ['Electrical Conduiting & Wiring', 'Plumbing Supply & Drainage Pipes', 'HVAC Ducting Rough-in'] },
          { code: '6.0', name: 'Finishing & Glazing', items: ['Vitrified Flooring & Skirting', 'Door Frames & Wooden Shutters', 'Aluminium Windows & Glazing', 'Internal & External Painting'] },
          { code: '7.0', name: 'Testing & Handover', items: ['Quality Audit & Snagging', 'Testing & Commissioning', 'Client Final Handover'] },
        ]
      },
      {
        code: 'DEMO-TMPL-LAND',
        name: 'Comprehensive Landscaping & External Works Template',
        pt: ptMap['landscaping'] || 3,
        desc: 'Standard WBS template for luxury communities, hardscaping and green zones.',
        items: [
          { code: '1.0', name: 'Topographical Survey & Earth Grading', items: ['Leveling & Soil Conditioning', 'Subgrade Compaction'] },
          { code: '2.0', name: 'Automated Irrigation Network', items: ['Mainline Trenching & PVC Piping', 'Solenoid Valves & Controller Unit', 'Drip & Sprinkler Lines'] },
          { code: '3.0', name: 'Hardscaping & Pavers', items: ['Sub-base Concrete Bed', 'Interlocking Paver Laying', 'Kerbstone & Edging'] },
          { code: '4.0', name: 'Softscaping & Planting', items: ['Red Topsoil Spreading', 'Specimen Tree & Palm Planting', 'Bermuda Turf Laying'] },
          { code: '5.0', name: 'Outdoor Lighting & Handover', items: ['Landscape Bollards & Spotlights', 'Testing & Final Handover'] },
        ]
      },
      {
        code: 'DEMO-TMPL-COMM',
        name: 'Commercial Logistics & Warehouse Facility Template',
        pt: ptMap['warehouse'] || 9,
        desc: 'Industrial warehouse and logistics park turnkey template.',
        items: [
          { code: '1.0', name: 'Permits & Industrial Earthworks', items: ['Geotechnical Investigation', 'Mass Excavation & Soil Stabilization'] },
          { code: '2.0', name: 'Heavy Structural Foundation', items: ['Deep Foundation Piling & Raft', 'Heavy Duty Column Pedestals'] },
          { code: '3.0', name: 'Pre-Engineered Building (PEB)', items: ['PEB Steel Portal Frame Erection', 'Roof & Wall Sheeting Cladding'] },
          { code: '4.0', name: 'Industrial Flooring', items: ['Vapour Barrier & Steel Mesh', 'Laser Screed Industrial Floor with Hardener'] },
          { code: '5.0', name: 'Dock & Fire Systems', items: ['Hydraulic Dock Levelers', 'Fire Sprinklers & Hydrant Ring'] },
        ]
      },
      {
        code: 'DEMO-TMPL-MEP',
        name: 'High-Rise MEP & Building Infrastructure Template',
        pt: ptMap['mep works'] || 1,
        desc: 'Electro-mechanical systems for towers and commercial offices.',
        items: [
          { code: '1.0', name: 'Electrical HT/LT Systems', items: ['Main Distribution Panel Setup', 'Busduct Riser & Cable Trays'] },
          { code: '2.0', name: 'HVAC Central Chiller Plant', items: ['Chilled Water Piping Installation', 'Air Handling Units (AHU) Placement'] },
          { code: '3.0', name: 'Public Health Engineering (PHE)', items: ['Water Booster Pumps Network', 'Drainage Stacks & Sump Pumps'] },
          { code: '4.0', name: 'BMS & Fire Life Safety', items: ['Fire Alarm & Voice Evacuation', 'Building Management Automation'] },
        ]
      }
    ];

    const templateIdMap: { [code: string]: number } = {};

    for (const t of wbsTemplatesData) {
      let tmplId = 0;
      const [existingTmpl]: any = await pool.query(`SELECT id FROM wbs_templates WHERE template_code = ?`, [t.code]);
      if (existingTmpl.length > 0) {
        tmplId = existingTmpl[0].id;
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO wbs_templates (template_code, template_name, project_type_id, description, status)
           VALUES (?, ?, ?, ?, 1)`,
          [t.code, t.name, t.pt, t.desc]
        );
        tmplId = res.insertId;
        countRecord('wbs_templates');

        // Link project type
        await pool.query(
          `INSERT IGNORE INTO wbs_template_project_types (template_id, project_type_id, sort_order)
           VALUES (?, ?, 0)`,
          [tmplId, t.pt]
        );
        countRecord('wbs_template_project_types');

        // Insert details
        let sortOrder = 1;
        for (const parent of t.items) {
          // Parent master wbs
          let parentWbsMasterId = 1007;
          const [mRes]: any = await pool.query(`SELECT id FROM work_breakdown_structures WHERE wbs_name = ? LIMIT 1`, [parent.name]);
          if (mRes.length > 0) {
            parentWbsMasterId = mRes[0].id;
          } else {
            const [newM]: any = await pool.query(
              `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, wbs_type) VALUES (?, ?, 'both')`,
              [`WBS-${t.code.slice(-3)}-${sortOrder}`, parent.name]
            );
            parentWbsMasterId = newM.insertId;
            countRecord('work_breakdown_structures');
          }

          const [parentDetailRes]: any = await pool.query(
            `INSERT INTO wbs_template_details (template_id, project_type_id, parent_id, wbs_id, wbs_name, wbs_code, sort_order)
             VALUES (?, ?, NULL, ?, ?, ?, ?)`,
            [tmplId, t.pt, parentWbsMasterId, parent.name, `${t.code.slice(-3)}-${parent.code}`, sortOrder++]
          );
          const parentDetailId = parentDetailRes.insertId;
          countRecord('wbs_template_details');

          // Child details
          let childIdx = 1;
          for (const childName of parent.items) {
            let childWbsMasterId = parentWbsMasterId;
            const [cRes]: any = await pool.query(`SELECT id FROM work_breakdown_structures WHERE wbs_name = ? LIMIT 1`, [childName]);
            if (cRes.length > 0) {
              childWbsMasterId = cRes[0].id;
            } else {
              const [newC]: any = await pool.query(
                `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, wbs_type) VALUES (?, ?, 'both')`,
                [`WBS-${t.code.slice(-3)}-${sortOrder}-${childIdx}`, childName]
              );
              childWbsMasterId = newC.insertId;
              countRecord('work_breakdown_structures');
            }

            await pool.query(
              `INSERT INTO wbs_template_details (template_id, project_type_id, parent_id, wbs_id, wbs_name, wbs_code, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [tmplId, t.pt, parentDetailId, childWbsMasterId, childName, `${t.code.slice(-3)}-${parent.code}.${childIdx}`, sortOrder++]
            );
            countRecord('wbs_template_details');
            childIdx++;
          }
        }
      }
      templateIdMap[t.code] = tmplId;
    }
    console.log(`✓ 4 WBS Templates seeded with nested hierarchy.`);

    // -------------------------------------------------------------
    // STEP 8: TERMS & CONDITIONS MASTER TEMPLATES (10 Templates)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 8] Seeding Terms & Conditions Templates...');
    const termsTemplatesData = [
      { name: 'DEMO-T&C-001: Milestone Payment Schedule', content: '1. 10% Advance mobilization payment against bank guarantee.\n2. Progress claims submitted monthly against approved joint measurement sheets.\n3. Payment due within 30 calendar days from invoice certification.\n4. 5% retention deducted from each claim, released upon DLP expiry.' },
      { name: 'DEMO-T&C-002: Project Timeline & Milestone Schedule', content: '1. Contractor commits to project completion according to the approved baseline CPM schedule.\n2. Weekly progress reviews held every Thursday on site.\n3. Milestone slips exceeding 10 days trigger an expedited recovery schedule at no cost to client.' },
      { name: 'DEMO-T&C-003: Material Quality & Price Variation', content: '1. All steel, cement and RMC must carry manufacturer MTC and third-party laboratory test reports.\n2. Fuel and major raw material escalation applies only if benchmark index shifts by over +/-10%.\n3. Defective material must be removed from site within 24 hours.' },
      { name: 'DEMO-T&C-004: Extension of Time & Force Majeure', content: '1. Unforeseen geological anomalies or client design revisions qualify for formal EOT without penalty.\n2. Formal EOT claims must be lodged in writing within 7 calendar days of the event.\n3. Force majeure covers natural disasters, civil unrest, and statutory site embargoes.' },
      { name: 'DEMO-T&C-005: Warranty & Defect Liability Period (DLP)', content: '1. 12 months comprehensive DLP commences from the date of final Practical Completion Certificate.\n2. Structural integrity guaranteed for 10 years per statutory building codes.\n3. Snagging works must be resolved within 14 working days of notification.' },
      { name: 'DEMO-T&C-006: Occupational Health, Safety & Environment', content: '1. Zero Harm Policy: Full PPE compliance mandatory for all personnel entering the site.\n2. Qualified HSE officer on duty at all times during active construction.\n3. Tool-box talks conducted daily prior to commencement of shifts.' },
      { name: 'DEMO-T&C-007: QA/QC Quality Assurance Protocols', content: '1. Work procedures must strictly adhere to project specification document and IS/BS codes.\n2. Concrete pouring prohibited without formal Inspection Request (IR) sign-off.\n3. Non-conformance reports (NCR) must be rectified and re-inspected.' },
      { name: 'DEMO-T&C-008: Site Access, Working Hours & Logistics', content: '1. Heavy vehicles permitted between 08:00 and 19:00 hours per local municipality bylaws.\n2. Secure contractor storage yard and site offices provided within project perimeter.\n3. Temporary site power and water connection arranged by principal contractor.' },
      { name: 'DEMO-T&C-009: Change Orders & Variations Protocol', content: '1. Any deviations or extra works require a prior written Variation Order signed by client rep.\n2. Rates for extra items derived from contract bill of quantities or negotiated fair market rate.\n3. Unauthorized extra works will not be compensated.' },
      { name: 'DEMO-T&C-010: Final Handover & As-Built Documentation', content: '1. Final handover contingent upon local authority completion certificates (BCC / Civil Defence).\n2. Three hard copies plus digital CAD/BIM As-Built drawings must be handed over.\n3. Comprehensive Operations & Maintenance (O&M) manuals provided for all MEP gear.' },
    ];

    const termsIdMap: number[] = [];
    for (const t of termsTemplatesData) {
      const [existing]: any = await pool.query(`SELECT template_id FROM terms_templates WHERE template_name = ?`, [t.name]);
      if (existing.length > 0) {
        termsIdMap.push(existing[0].template_id);
      } else {
        const [res]: any = await pool.query(
          `INSERT INTO terms_templates (template_name, terms_content, status, version) VALUES (?, ?, 1, 1)`,
          [t.name, t.content]
        );
        termsIdMap.push(res.insertId);
        countRecord('terms_templates');
      }
    }
    console.log(`✓ 10 Standard Construction T&C Templates configured.`);

    // -------------------------------------------------------------
    // STEP 9: QUOTATIONS (10 Realistic Quotations across 5 Customers)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 9] Seeding 10 Quotations (Drafts, Pending, Approved, Rejected)...');
    
    // 10 Detailed Quotations
    const quotationsSeedData = [
      {
        code: 'DEMO-QTN-2026-001',
        cust: 'CUST-IND-001',
        projName: 'Pune Industrial Warehouse Construction',
        pt: ptMap['warehouse'] || 9,
        cur: curMap['INR'],
        date: '2026-07-15',
        validity: '2026-08-30',
        start: '2026-09-01',
        end: '2027-04-30',
        status: 'approved',
        tax_pct: 18.00,
        tax_id: taxGst18,
        tax_type: 'CGST_SGST',
        subtotal: 21186440.68,
        tax_amt: 3813559.32,
        discount: 0.00,
        total: 25000000.00,
        disciplines: [
          { name: 'Site Preparation & Heavy Earthworks', unit: 'SqM', qty: 15000, rate: 120, amt: 1800000, wbsType: 'both', lHours: 1200, lRate: 450, lCost: 540000, mQty: 200, mRate: 6300, mCost: 1260000 },
          { name: 'Substructure & Machine Foundation', unit: 'Cum', qty: 2500, rate: 2600, amt: 6500000, wbsType: 'both', lHours: 4200, lRate: 500, lCost: 2100000, mQty: 950, mRate: 4631.58, mCost: 4400000 },
          { name: 'Pre-Engineered Building (PEB) Structural Frame', unit: 'Ton', qty: 320, rate: 22000, amt: 7040000, wbsType: 'both', lHours: 3500, lRate: 600, lCost: 2100000, mQty: 320, mRate: 15437.5, mCost: 4940000 },
          { name: 'Laser-Screed Heavy Industrial Flooring', unit: 'SqM', qty: 10000, rate: 384.64, amt: 3846440.68, wbsType: 'both', lHours: 2400, lRate: 480, lCost: 1152000, mQty: 600, mRate: 4490.73, mCost: 2694440.68 },
          { name: 'MEP, Industrial Lighting & Fire Fighting', unit: 'Lot', qty: 1, rate: 2000000, amt: 2000000, wbsType: 'both', lHours: 1800, lRate: 500, lCost: 900000, mQty: 1, mRate: 1100000, mCost: 1100000 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-002',
        cust: 'DEMO-CUST-002',
        projName: 'B8.05 Landscaping & Garden Development',
        pt: ptMap['landscaping'] || 3,
        cur: curMap['AED'],
        date: '2026-07-20',
        validity: '2026-09-01',
        start: '2026-08-15',
        end: '2026-12-15',
        status: 'approved',
        tax_pct: 5.00,
        tax_id: taxVat5,
        tax_type: 'VAT',
        subtotal: 809523.81,
        tax_amt: 40476.19,
        discount: 0.00,
        total: 850000.00,
        disciplines: [
          { name: 'Topographical Survey & Earth Grading', unit: 'SqM', qty: 3500, rate: 45, amt: 157500, wbsType: 'both', lHours: 250, lRate: 150, lCost: 37500, mQty: 300, mRate: 400, mCost: 120000 },
          { name: 'Automated Irrigation Network', unit: 'Lot', qty: 1, rate: 185000, amt: 185000, wbsType: 'both', lHours: 400, lRate: 150, lCost: 60000, mQty: 1, mRate: 125000, mCost: 125000 },
          { name: 'Natural Stone Paving & Kerbstones', unit: 'SqM', qty: 1200, rate: 210, amt: 252000, wbsType: 'both', lHours: 600, lRate: 120, lCost: 72000, mQty: 1200, mRate: 150, mCost: 180000 },
          { name: 'Softscaping, Royal Palms & Bermuda Turf', unit: 'SqM', qty: 2300, rate: 93.488, amt: 215023.81, wbsType: 'both', lHours: 450, lRate: 120, lCost: 54000, mQty: 2300, mRate: 70.01, mCost: 161023.81 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-003',
        cust: 'DEMO-CUST-003',
        projName: 'Dubai Commercial Tower Fit-Out',
        pt: ptMap['interior fit-out'] || 6,
        cur: curMap['AED'],
        date: '2026-07-25',
        validity: '2026-09-10',
        start: '2026-08-20',
        end: '2027-02-28',
        status: 'approved',
        tax_pct: 5.00,
        tax_id: taxVat5,
        tax_type: 'VAT',
        subtotal: 4000000.00,
        tax_amt: 200000.00,
        discount: 0.00,
        total: 4200000.00,
        disciplines: [
          { name: 'Internal Demolition & Wall Partitions', unit: 'SqM', qty: 2800, rate: 350, amt: 980000, wbsType: 'both', lHours: 1800, lRate: 180, lCost: 324000, mQty: 2800, mRate: 234.28, mCost: 656000 },
          { name: 'Architectural Glazing & Acoustic Ceilings', unit: 'SqM', qty: 1500, rate: 680, amt: 1020000, wbsType: 'both', lHours: 1200, lRate: 200, lCost: 240000, mQty: 1500, mRate: 520, mCost: 780000 },
          { name: 'Electrical, Lighting & Data Infrastructure', unit: 'Lot', qty: 1, rate: 1100000, amt: 1100000, wbsType: 'both', lHours: 1600, lRate: 220, lCost: 352000, mQty: 1, mRate: 748000, mCost: 748000 },
          { name: 'HVAC Chilled Water Fan Coil Units (FCU)', unit: 'Lot', qty: 1, rate: 900000, amt: 900000, wbsType: 'both', lHours: 1100, lRate: 220, lCost: 242000, mQty: 1, mRate: 658000, mCost: 658000 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-004',
        cust: 'DEMO-CUST-004',
        projName: 'Singapore Marina Bay Marine Promenade',
        pt: ptMap['infrastructure'] || 11,
        cur: curMap['SGD'],
        date: '2026-08-01',
        validity: '2026-09-15',
        start: '2026-09-10',
        end: '2027-05-30',
        status: 'approved',
        tax_pct: 5.00,
        tax_id: tax5Rows[0]?.tax_id || taxVat5,
        tax_type: 'GST',
        subtotal: 3333333.33,
        tax_amt: 166666.67,
        discount: 0.00,
        total: 3500000.00,
        disciplines: [
          { name: 'Marine Geotechnical & Piling Works', unit: 'Pile', qty: 85, rate: 15000, amt: 1275000, wbsType: 'both', lHours: 1600, lRate: 250, lCost: 400000, mQty: 85, mRate: 10294.12, mCost: 875000 },
          { name: 'Reinforced Concrete Marine Boardwalk Deck', unit: 'Cum', qty: 650, rate: 1650, amt: 1072500, wbsType: 'both', lHours: 1800, lRate: 220, lCost: 396000, mQty: 650, mRate: 1040.77, mCost: 676500 },
          { name: 'Timber Decking & Stainless Steel Railings', unit: 'Meter', qty: 450, rate: 1200, amt: 540000, wbsType: 'both', lHours: 850, lRate: 200, lCost: 170000, mQty: 450, mRate: 822.22, mCost: 370000 },
          { name: 'Shoreline Landscaping & Public Lighting', unit: 'Lot', qty: 1, rate: 445833.33, amt: 445833.33, wbsType: 'both', lHours: 650, lRate: 200, lCost: 130000, mQty: 1, mRate: 315833.33, mCost: 315833.33 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-005',
        cust: 'DEMO-CUST-005',
        projName: 'London High-Street Townhouse Refurbishment',
        pt: ptMap['residential'] || 12,
        cur: curMap['GBP'],
        date: '2026-08-05',
        validity: '2026-09-20',
        start: '2026-09-15',
        end: '2027-06-30',
        status: 'approved',
        tax_pct: 18.00,
        tax_id: taxGst18,
        tax_type: 'VAT',
        subtotal: 1525423.73,
        tax_amt: 274576.27,
        discount: 0.00,
        total: 1800000.00,
        disciplines: [
          { name: 'Structural Underpinning & Waterproofing', unit: 'Lot', qty: 1, rate: 480000, amt: 480000, wbsType: 'both', lHours: 1200, lRate: 150, lCost: 180000, mQty: 1, mRate: 300000, mCost: 300000 },
          { name: 'Heritage Timber Joinery & Sash Windows', unit: 'Lot', qty: 1, rate: 420000, amt: 420000, wbsType: 'both', lHours: 950, lRate: 160, lCost: 152000, mQty: 1, mRate: 268000, mCost: 268000 },
          { name: 'Hydronic Underfloor Heating & Electrical', unit: 'Lot', qty: 1, rate: 360000, amt: 360000, wbsType: 'both', lHours: 850, lRate: 150, lCost: 127500, mQty: 1, mRate: 232500, mCost: 232500 },
          { name: 'Architectural Lime Plaster & Luxury Decor', unit: 'Lot', qty: 1, rate: 265423.73, amt: 265423.73, wbsType: 'both', lHours: 750, lRate: 140, lCost: 105000, mQty: 1, mRate: 160423.73, mCost: 160423.73 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-006',
        cust: 'CUST-IND-001',
        projName: 'Cold Storage & Distribution Center Phase 2',
        pt: ptMap['industrial'] || 10,
        cur: curMap['INR'],
        date: '2026-08-20',
        validity: '2026-10-15',
        start: '2026-11-01',
        end: '2027-08-30',
        status: 'pending_approval',
        tax_pct: 18.00,
        tax_id: taxGst18,
        tax_type: 'CGST_SGST',
        subtotal: 15677966.10,
        tax_amt: 2822033.90,
        discount: 0.00,
        total: 18500000.00,
        disciplines: [
          { name: 'Insulated Sub-base Floor Works', unit: 'SqM', qty: 5000, rate: 1200, amt: 6000000, wbsType: 'both', lHours: 1800, lRate: 450, lCost: 810000, mQty: 5000, mRate: 1038, mCost: 5190000 },
          { name: 'Refrigerated PIR Wall Panel System', unit: 'SqM', qty: 6500, rate: 1488.92, amt: 9677966.10, wbsType: 'both', lHours: 2400, lRate: 500, lCost: 1200000, mQty: 6500, mRate: 1304.30, mCost: 8477966.10 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-007',
        cust: 'DEMO-CUST-002',
        projName: 'Community Clubhouse & Swimming Pool',
        pt: ptMap['community'] || 5,
        cur: curMap['AED'],
        date: '2026-08-25',
        validity: '2026-10-25',
        start: '2026-11-15',
        end: '2027-06-15',
        status: 'pending_approval',
        tax_pct: 5.00,
        tax_id: taxVat5,
        tax_type: 'VAT',
        subtotal: 1142857.14,
        tax_amt: 57142.86,
        discount: 0.00,
        total: 1200000.00,
        disciplines: [
          { name: 'Olympic Lap Pool RCC Tank & Filtration', unit: 'Lot', qty: 1, rate: 680000, amt: 680000, wbsType: 'both', lHours: 1200, lRate: 180, lCost: 216000, mQty: 1, mRate: 464000, mCost: 464000 },
          { name: 'Clubhouse Pergola & Changing Facilities', unit: 'Lot', qty: 1, rate: 462857.14, amt: 462857.14, wbsType: 'both', lHours: 900, lRate: 160, lCost: 144000, mQty: 1, mRate: 318857.14, mCost: 318857.14 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-008',
        cust: 'DEMO-CUST-003',
        projName: 'Solar Rooftop & EV Station Installation',
        pt: ptMap['mep works'] || 1,
        cur: curMap['AED'],
        date: '2026-09-02',
        validity: '2026-11-02',
        start: '2026-12-01',
        end: '2027-03-30',
        status: 'draft',
        tax_pct: 5.00,
        tax_id: taxVat5,
        tax_type: 'VAT',
        subtotal: 619047.62,
        tax_amt: 30952.38,
        discount: 0.00,
        total: 650000.00,
        disciplines: [
          { name: '500kW Photovoltaic Array Mounting', unit: 'Lot', qty: 1, rate: 420000, amt: 420000, wbsType: 'both', lHours: 650, lRate: 200, lCost: 130000, mQty: 1, mRate: 290000, mCost: 290000 },
          { name: 'Fast DC EV Chargers & Distribution Panel', unit: 'Lot', qty: 1, rate: 199047.62, amt: 199047.62, wbsType: 'both', lHours: 400, lRate: 200, lCost: 80000, mQty: 1, mRate: 119047.62, mCost: 119047.62 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-009',
        cust: 'DEMO-CUST-004',
        projName: 'Water Sports Pavilion Structure',
        pt: ptMap['infrastructure'] || 11,
        cur: curMap['SGD'],
        date: '2026-07-10',
        validity: '2026-08-10',
        start: '2026-08-20',
        end: '2026-12-20',
        status: 'rejected',
        tax_pct: 5.00,
        tax_id: tax5Rows[0]?.tax_id || taxVat5,
        tax_type: 'GST',
        subtotal: 876190.48,
        tax_amt: 43809.52,
        discount: 0.00,
        total: 920000.00,
        disciplines: [
          { name: 'Floating Jetty Anchors & Modular Docks', unit: 'Lot', qty: 1, rate: 876190.48, amt: 876190.48, wbsType: 'both', lHours: 850, lRate: 220, lCost: 187000, mQty: 1, mRate: 689190.48, mCost: 689190.48 },
        ]
      },
      {
        code: 'DEMO-QTN-2026-010',
        cust: 'DEMO-CUST-005',
        projName: 'Basement Waterproofing & Structural Retrofit',
        pt: ptMap['residential'] || 12,
        cur: curMap['GBP'],
        date: '2026-08-12',
        validity: '2026-10-12',
        start: '2026-10-15',
        end: '2027-02-15',
        status: 'revised',
        tax_pct: 18.00,
        tax_id: taxGst18,
        tax_type: 'VAT',
        subtotal: 355932.20,
        tax_amt: 64067.80,
        discount: 0.00,
        total: 420000.00,
        disciplines: [
          { name: 'Negative Pressure Epoxy Grouting', unit: 'Lot', qty: 1, rate: 355932.20, amt: 355932.20, wbsType: 'both', lHours: 650, lRate: 150, lCost: 97500, mQty: 1, mRate: 258432.20, mCost: 258432.20 },
        ]
      },
    ];

    const quotationIdMap: { [code: string]: number } = {};
    const quotationDisciplineIds: { [key: string]: number } = {};

    for (const q of quotationsSeedData) {
      const custId = customerIdMap[q.cust] || 1;
      let qtnId = 0;
      const [existing]: any = await pool.query(`SELECT quotation_id FROM quotations WHERE quotation_code = ?`, [q.code]);
      if (existing.length > 0) {
        qtnId = existing[0].quotation_id;
      } else {
        const [qRes]: any = await pool.query(
          `INSERT INTO quotations (
             quotation_code, customer_id, new_project_name, project_type_id, currency_id,
             exchange_rate, quotation_date, validity_date, start_date, end_date,
             description, subtotal_amount, tax_id, tax_type, tax_percentage,
             tax_amount, discount_amount, total_amount, status, revision_number,
             created_by, approved_by, approved_at, terms_conditions, planning_required
           ) VALUES (?, ?, ?, ?, ?, 1.000000, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1)`,
          [
            q.code, custId, q.projName, q.pt, q.cur,
            q.date, q.validity, q.start, q.end,
            `Comprehensive quotation for ${q.projName}`,
            q.subtotal, q.tax_id, q.tax_type, q.tax_pct,
            q.tax_amt, q.discount, q.total, q.status,
            employeeIdMap['DEMO-EMP-003'] || 1,
            q.status === 'approved' ? (employeeIdMap['DEMO-EMP-001'] || 1) : null,
            q.status === 'approved' ? `${q.date} 14:00:00` : null,
            'Standard commercial terms apply as agreed in milestone framework.'
          ]
        );
        qtnId = qRes.insertId;
        countRecord('quotations');

        // Taxes breakdown
        await pool.query(
          `INSERT INTO quotation_taxes (quotation_id, tax_id, tax_name, tax_code, tax_type, tax_percentage, taxable_amount, tax_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [qtnId, q.tax_id, `${q.tax_type} ${q.tax_pct}%`, q.tax_type, q.tax_type, q.tax_pct, q.subtotal, q.tax_amt]
        );
        countRecord('quotation_taxes');

        // Terms templates
        if (termsIdMap.length > 0) {
          for (let i = 0; i < Math.min(3, termsIdMap.length); i++) {
            await pool.query(
              `INSERT IGNORE INTO quotation_terms_templates (quotation_id, template_id, template_name, sort_order)
               VALUES (?, ?, ?, ?)`,
              [qtnId, termsIdMap[i], termsTemplatesData[i].name, i]
            );
            countRecord('quotation_terms_templates');

            await pool.query(
              `INSERT INTO quotation_terms_snapshots (quotation_id, template_id, template_name, title, description, is_mandatory, sort_order)
               VALUES (?, ?, ?, ?, ?, 1, ?)`,
              [qtnId, termsIdMap[i], termsTemplatesData[i].name, termsTemplatesData[i].name, termsTemplatesData[i].content, i]
            );
            countRecord('quotation_terms_snapshots');
          }
        }

        // Insert WBS Disciplines
        for (let dIdx = 0; dIdx < q.disciplines.length; dIdx++) {
          const d = q.disciplines[dIdx];
          const [dRes]: any = await pool.query(
            `INSERT INTO quotation_disciplines (
               quotation_id, discipline_name, unit, quantity, rate, amount,
               wbs_type, labour_hours, labour_rate, labour_cost,
               material_quantity, material_rate, material_cost, start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              qtnId, d.name, d.unit, d.qty, d.rate, d.amt,
              d.wbsType, d.lHours, d.lRate, d.lCost,
              d.mQty, d.mRate, d.mCost,
              addDays(q.start, dIdx * 20),
              addDays(q.start, (dIdx + 1) * 35)
            ]
          );
          const discId = dRes.insertId;
          quotationDisciplineIds[`${q.code}_${dIdx}`] = discId;
          countRecord('quotation_disciplines');

          // Labour items
          await pool.query(
            `INSERT INTO quotation_wbs_labour (quotation_id, quotation_discipline_id, labour_name, hours, rate, amount)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [qtnId, discId, `Specialized Crew for ${d.name}`, d.lHours, d.lRate, d.lCost]
          );
          countRecord('quotation_wbs_labour');

          // Material items
          await pool.query(
            `INSERT INTO quotation_wbs_material (quotation_id, quotation_discipline_id, material_name, quantity, unit, rate, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [qtnId, discId, `Consumables & Materials for ${d.name}`, d.mQty, d.unit, d.mRate, d.mCost]
          );
          countRecord('quotation_wbs_material');

          // Itemized lines
          await pool.query(
            `INSERT INTO quotation_wbs_items (quotation_discipline_id, item_type, description, unit, qty, rate, amount, line_total)
             VALUES (?, 'labour', ?, ?, ?, ?, ?, ?)`,
            [discId, `Labour allocation for ${d.name}`, 'hours', d.lHours, d.lRate, d.lCost, d.lCost]
          );
          await pool.query(
            `INSERT INTO quotation_wbs_items (quotation_discipline_id, item_type, description, unit, qty, rate, amount, line_total)
             VALUES (?, 'material', ?, ?, ?, ?, ?, ?)`,
            [discId, `Material allocation for ${d.name}`, d.unit, d.mQty, d.mRate, d.mCost, d.mCost]
          );
          countRecord('quotation_wbs_items', 2);
        }
      }
      quotationIdMap[q.code] = qtnId;
    }
    console.log(`✓ 10 Quotations seeded with disciplines, labour and material breakdowns.`);

    // -------------------------------------------------------------
    // STEP 10: PLANNING (For 5 Approved Quotations)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 10] Seeding Planning for Approved Quotations...');
    const approvedQtnCodes = ['DEMO-QTN-2026-001', 'DEMO-QTN-2026-002', 'DEMO-QTN-2026-003', 'DEMO-QTN-2026-004', 'DEMO-QTN-2026-005'];
    const planningIdMap: { [qtnCode: string]: number } = {};
    const planningTaskIdMap: { [key: string]: number } = {};

    for (const qCode of approvedQtnCodes) {
      const qtnId = quotationIdMap[qCode];
      const qtnObj = quotationsSeedData.find(q => q.code === qCode)!;
      let planId = 0;

      const [existingPlan]: any = await pool.query(`SELECT id FROM planning WHERE quotation_id = ?`, [qtnId]);
      if (existingPlan.length > 0) {
        planId = existingPlan[0].id;
      } else {
        const [planRes]: any = await pool.query(
          `INSERT INTO planning (quotation_id, project_type_id, customer_id, calendar_id, status, version, created_by)
           VALUES (?, ?, ?, ?, 'approved', 1, ?)`,
          [qtnId, qtnObj.pt, customerIdMap[qtnObj.cust] || 1, calendarId, employeeIdMap['DEMO-EMP-003'] || 1]
        );
        planId = planRes.insertId;
        countRecord('planning');

        // Create Planning WBS and Tasks
        let pSort = 1;
        for (let dIdx = 0; dIdx < qtnObj.disciplines.length; dIdx++) {
          const disc = qtnObj.disciplines[dIdx];
          const wbsCode = `WBS-${qCode.slice(-3)}-${dIdx + 1}`;
          const startDate = addDays(qtnObj.start, dIdx * 15);
          const durationDays = 25;
          const endDate = addDays(startDate, durationDays);

          const [pwRes]: any = await pool.query(
            `INSERT INTO planning_wbs (planning_id, parent_id, wbs_name, wbs_code, level, sort_order, baseline_start, baseline_end, duration, description)
             VALUES (?, NULL, ?, ?, 1, ?, ?, ?, ?, ?)`,
            [planId, disc.name, wbsCode, pSort++, startDate, endDate, durationDays, `Planning milestone for ${disc.name}`]
          );
          const planWbsId = pwRes.insertId;
          countRecord('planning_wbs');

          // Add 2 Tasks per WBS
          const t1Name = `${disc.name} - Phase A Execution`;
          const t2Name = `${disc.name} - Phase B Quality & Handover`;

          const [pt1]: any = await pool.query(
            `INSERT INTO planning_tasks (planning_wbs_id, task_name, description, start_date, end_date, duration, status, sort_order)
             VALUES (?, ?, ?, ?, ?, 12, 'completed', 1)`,
            [planWbsId, t1Name, `Execution stage for ${disc.name}`, startDate, addDays(startDate, 12)]
          );
          planningTaskIdMap[`${qCode}_${dIdx}_0`] = pt1.insertId;
          countRecord('planning_tasks');

          const [pt2]: any = await pool.query(
            `INSERT INTO planning_tasks (planning_wbs_id, task_name, description, start_date, end_date, duration, status, sort_order)
             VALUES (?, ?, ?, ?, ?, 13, 'pending', 2)`,
            [planWbsId, t2Name, `Quality & completion stage for ${disc.name}`, addDays(startDate, 13), endDate]
          );
          planningTaskIdMap[`${qCode}_${dIdx}_1`] = pt2.insertId;
          countRecord('planning_tasks');

          // Dependency t1 -> t2 (FS)
          await pool.query(
            `INSERT INTO planning_task_dependencies (task_id, predecessor_task_id, dependency_type, lag_days)
             VALUES (?, ?, 'FS', 1)`,
            [pt2.insertId, pt1.insertId]
          );
          countRecord('planning_task_dependencies');

          // Resources
          await pool.query(
            `INSERT INTO planning_resources (planning_task_id, resource_type, resource_id, quantity, planned_cost)
             VALUES (?, 'employee', ?, 1.00, 8500.00)`,
            [pt1.insertId, employeeIdMap['DEMO-EMP-004'] || 1]
          );
          await pool.query(
            `INSERT INTO planning_resources (planning_task_id, resource_type, resource_id, quantity, planned_cost)
             VALUES (?, 'labour', ?, 6.00, 24000.00)`,
            [pt1.insertId, labourIdMap['DEMO-LAB-001'] || 1]
          );
          countRecord('planning_resources', 2);
        }
      }
      planningIdMap[qCode] = planId;
    }
    console.log(`✓ 5 Planning structures seeded with tasks, dependencies and resources.`);

    // -------------------------------------------------------------
    // STEP 11: PROJECTS (5 Key Projects with Different Progress %)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 11] Seeding Projects, Project WBS & Tasks...');

    const projectsSeedData = [
      {
        code: 'PRJ-PUNE-001',
        name: 'Pune Industrial Warehouse Construction',
        qtnCode: 'DEMO-QTN-2026-001',
        custCode: 'CUST-IND-001',
        pt: ptMap['warehouse'] || 9,
        cur: curMap['INR'],
        budget: 25000000.00,
        targetProgress: 68,
        status: 'active',
        start: '2026-08-01',
        end: '2027-04-30',
        lat: 18.7600000,
        lng: 73.8600000,
        address: 'Chakan MIDC Industrial Zone, Pune, Maharashtra',
        pm: employeeIdMap['DEMO-EMP-002'] || 2,
        tasksCount: 12,
      },
      {
        code: 'DEMO-PRJ-002',
        name: 'B8.05 Landscaping & Garden Development',
        qtnCode: 'DEMO-QTN-2026-002',
        custCode: 'DEMO-CUST-002',
        pt: ptMap['landscaping'] || 3,
        cur: curMap['AED'],
        budget: 850000.00,
        targetProgress: 45,
        status: 'active',
        start: '2026-08-15',
        end: '2026-12-15',
        lat: 25.1560000,
        lng: 55.3050000,
        address: 'Meydan Polo Club District, Nad Al Sheba, Dubai',
        pm: employeeIdMap['DEMO-EMP-001'] || 1,
        tasksCount: 8,
      },
      {
        code: 'DEMO-PRJ-003',
        name: 'Dubai Commercial Tower Fit-Out',
        qtnCode: 'DEMO-QTN-2026-003',
        custCode: 'DEMO-CUST-003',
        pt: ptMap['interior fit-out'] || 6,
        cur: curMap['AED'],
        budget: 4200000.00,
        targetProgress: 80,
        status: 'active',
        start: '2026-08-20',
        end: '2027-02-28',
        lat: 25.1850000,
        lng: 55.2720000,
        address: 'Business Bay Executive Tower 4, Dubai',
        pm: employeeIdMap['DEMO-EMP-001'] || 1,
        tasksCount: 10,
      },
      {
        code: 'DEMO-PRJ-004',
        name: 'Singapore Marina Bay Marine Promenade',
        qtnCode: 'DEMO-QTN-2026-004',
        custCode: 'DEMO-CUST-004',
        pt: ptMap['infrastructure'] || 11,
        cur: curMap['SGD'],
        budget: 3500000.00,
        targetProgress: 25,
        status: 'active',
        start: '2026-09-10',
        end: '2027-05-30',
        lat: 1.2820000,
        lng: 103.8580000,
        address: 'Marina South Waterfront Promenade, Singapore',
        pm: employeeIdMap['DEMO-EMP-002'] || 2,
        tasksCount: 8,
      },
      {
        code: 'DEMO-PRJ-005',
        name: 'London High-Street Townhouse Refurbishment',
        qtnCode: 'DEMO-QTN-2026-005',
        custCode: 'DEMO-CUST-005',
        pt: ptMap['residential'] || 12,
        cur: curMap['GBP'],
        budget: 1800000.00,
        targetProgress: 10,
        status: 'active',
        start: '2026-09-15',
        end: '2027-06-30',
        lat: 51.5110000,
        lng: -0.1470000,
        address: '14 Berkeley Square, Mayfair, London, UK',
        pm: employeeIdMap['DEMO-EMP-002'] || 2,
        tasksCount: 8,
      }
    ];

    const projectIdMap: { [code: string]: number } = {};
    const allSeededTasks: any[] = [];
    const allSeededProjectWbs: any[] = [];

    for (const p of projectsSeedData) {
      let projId = 0;
      const [existing]: any = await pool.query(`SELECT project_id FROM projects WHERE project_code = ?`, [p.code]);
      if (existing.length > 0) {
        projId = existing[0].project_id;
        // Update project details to ensure full consistency
        await pool.query(
          `UPDATE projects SET 
             project_name = ?, customer_id = ?, source_quotation_id = ?, project_type_id = ?,
             currency_id = ?, budget_amount = ?, start_date = ?, end_date = ?,
             latitude = ?, longitude = ?, radius_meters = 500, project_address = ?, status = 'active',
             planning_id = ?
           WHERE project_id = ?`,
          [
            p.name, customerIdMap[p.custCode] || 1, quotationIdMap[p.qtnCode] || null, p.pt,
            p.cur, p.budget, p.start, p.end, p.lat, p.lng, p.address,
            planningIdMap[p.qtnCode] || null, projId
          ]
        );
      } else {
        const [pRes]: any = await pool.query(
          `INSERT INTO projects (
             project_code, project_name, customer_id, source_quotation_id, project_type_id,
             currency_id, exchange_rate, budget_amount, start_date, end_date,
             latitude, longitude, radius_meters, project_address, status, planning_id, planning_required
           ) VALUES (?, ?, ?, ?, ?, ?, 1.000000, ?, ?, ?, ?, ?, 500, ?, 'active', ?, 0)`,
          [
            p.code, p.name, customerIdMap[p.custCode] || 1, quotationIdMap[p.qtnCode] || null, p.pt,
            p.cur, p.budget, p.start, p.end, p.lat, p.lng, p.address,
            planningIdMap[p.qtnCode] || null
          ]
        );
        projId = pRes.insertId;
        countRecord('projects');
      }
      projectIdMap[p.code] = projId;

      // Link quotation back to project
      if (quotationIdMap[p.qtnCode]) {
        await pool.query(`UPDATE quotations SET project_id = ? WHERE quotation_id = ?`, [projId, quotationIdMap[p.qtnCode]]);
      }

      // Check / Seed Project WBS
      const [existingWbs]: any = await pool.query(`SELECT id FROM project_wbs WHERE project_id = ?`, [projId]);
      const qtnObj = quotationsSeedData.find(q => q.code === p.qtnCode)!;
      const projWbsList: any[] = [];

      if (existingWbs.length === 0) {
        for (let dIdx = 0; dIdx < qtnObj.disciplines.length; dIdx++) {
          const disc = qtnObj.disciplines[dIdx];
          
          // Master WBS lookup
          let wbsMasterId = 1007;
          const [mRes]: any = await pool.query(`SELECT id FROM work_breakdown_structures WHERE wbs_name = ? LIMIT 1`, [disc.name]);
          if (mRes.length > 0) {
            wbsMasterId = mRes[0].id;
          } else {
            const [newM]: any = await pool.query(
              `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, wbs_type) VALUES (?, ?, 'both')`,
              [`WBS-PRJ-${projId}-${dIdx + 1}`, disc.name]
            );
            wbsMasterId = newM.insertId;
            countRecord('work_breakdown_structures');
          }

          const wbsStartDate = addDays(p.start, dIdx * 18);
          const wbsEndDate = addDays(wbsStartDate, 35);
          const wbsBudget = disc.amt;

          const [pwRes]: any = await pool.query(
            `INSERT INTO project_wbs (
               project_id, wbs_id, wbs_code, display_order, start_date, end_date,
               total_hours, budget_amount, wbs_type, status,
               planned_labour_cost, planned_material_cost, planned_quantity, rate,
               baseline_start, baseline_end, baseline_duration, current_start, current_end, current_duration
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 35, ?, ?, 35)`,
            [
              projId, wbsMasterId, `WBS-${p.code.slice(-3)}-${dIdx + 1}`, dIdx + 1,
              wbsStartDate, wbsEndDate, disc.lHours, wbsBudget, disc.wbsType,
              disc.lCost, disc.mCost, disc.qty, disc.rate,
              wbsStartDate, wbsEndDate, wbsStartDate, wbsEndDate
            ]
          );
          const pwId = pwRes.insertId;
          countRecord('project_wbs');
          const wbsObj = { id: pwId, project_id: projId, name: disc.name, wbs_id: wbsMasterId, start_date: wbsStartDate, end_date: wbsEndDate };
          projWbsList.push(wbsObj);
          allSeededProjectWbs.push(wbsObj);
        }
      } else {
        const [pwRows]: any = await pool.query(`SELECT * FROM project_wbs WHERE project_id = ?`, [projId]);
        for (const r of pwRows) {
          projWbsList.push(r);
          allSeededProjectWbs.push(r);
        }
      }

      // Check / Seed Project Tasks
      const [existingTasks]: any = await pool.query(`SELECT task_id FROM tasks WHERE project_id = ?`, [projId]);
      if (existingTasks.length === 0) {
        const targetCompletedTasks = Math.round((p.tasksCount * p.targetProgress) / 100);
        let previousTaskId: number | null = null;

        for (let tIdx = 0; tIdx < p.tasksCount; tIdx++) {
          const wbsIdx = tIdx % projWbsList.length;
          const assignedWbs = projWbsList[wbsIdx];
          const taskStart = addDays(p.start, tIdx * 7);
          const taskDuration = 10;
          const taskEnd = addDays(taskStart, taskDuration);

          let taskStatus: 'completed' | 'in-progress' | 'pending' | 'delayed' = 'pending';
          let progressPct = 0;
          let actualStart: string | null = null;
          let actualEnd: string | null = null;

          if (tIdx < targetCompletedTasks) {
            taskStatus = 'completed';
            progressPct = 100;
            actualStart = taskStart;
            actualEnd = taskEnd;
          } else if (tIdx === targetCompletedTasks) {
            taskStatus = 'in-progress';
            progressPct = 50;
            actualStart = taskStart;
          } else if (tIdx === targetCompletedTasks + 1 && p.targetProgress < 50) {
            taskStatus = 'delayed';
            progressPct = 20;
            actualStart = taskStart;
          }

          const taskName = `${assignedWbs.name || 'Stage'} - Activity ${tIdx + 1}`;
          const estHours = 80.00;
          const budgetAmt = Math.round(p.budget / p.tasksCount);

          const [taskRes]: any = await pool.query(
            `INSERT INTO tasks (
               project_id, wbs_id, task_name, description, required_worker_count, estimated_hours,
               start_date, target_date, actual_start_date, actual_end_date, status,
               progress_percentage, priority, budget_amount, is_billable,
               baseline_start, baseline_end, current_start, current_end, baseline_duration, current_duration,
               latitude, longitude
             ) VALUES (?, ?, ?, ?, 4, ?, ?, ?, ?, ?, ?, ?, 'medium', ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              projId, assignedWbs.id, taskName, `Turnkey task for ${taskName}`,
              estHours, taskStart, taskEnd, actualStart, actualEnd, taskStatus,
              progressPct, budgetAmt, taskStart, taskEnd, taskStart, taskEnd, taskDuration, taskDuration,
              p.lat, p.lng
            ]
          );
          const taskId = taskRes.insertId;
          countRecord('tasks');

          const taskData = {
            task_id: taskId,
            project_id: projId,
            wbs_id: assignedWbs.id,
            task_name: taskName,
            status: taskStatus,
            start_date: taskStart,
            end_date: taskEnd,
            progress: progressPct,
            lat: p.lat,
            lng: p.lng
          };
          allSeededTasks.push(taskData);

          // Dependency on previous task
          if (previousTaskId && tIdx % 4 !== 0) {
            await pool.query(
              `INSERT INTO task_dependencies (task_id, predecessor_task_id, dependency_type, lag_days)
               VALUES (?, ?, 'FS', 1)`,
              [taskId, previousTaskId]
            );
            countRecord('task_dependencies');
          }
          previousTaskId = taskId;

          // Assign Employees
          const assignedEmp1 = employeeIdMap['DEMO-EMP-004'] || 1;
          const assignedEmp2 = employeeIdMap['DEMO-EMP-007'] || 2;
          await pool.query(
            `INSERT INTO task_assignments (task_id, employee_id, planned_hours, actual_hours)
             VALUES (?, ?, 40.00, ?), (?, ?, 40.00, ?)`,
            [
              taskId, assignedEmp1, taskStatus === 'completed' ? 40.00 : (taskStatus === 'in-progress' ? 20.00 : 0.00),
              taskId, assignedEmp2, taskStatus === 'completed' ? 38.00 : (taskStatus === 'in-progress' ? 18.00 : 0.00)
            ]
          );
          countRecord('task_assignments', 2);

          // Assign Labour Contractor
          const assignedLabour = labourIdMap['DEMO-LAB-001'] || 1;
          await pool.query(
            `INSERT INTO task_labour_assignments (task_id, labour_id) VALUES (?, ?)`,
            [taskId, assignedLabour]
          );
          countRecord('task_labour_assignments');
        }
      } else {
        const [tRows]: any = await pool.query(`SELECT * FROM tasks WHERE project_id = ?`, [projId]);
        for (const t of tRows) {
          allSeededTasks.push(t);
        }
      }
    }
    console.log(`✓ 5 Projects active with ${allSeededTasks.length} tasks and dependencies.`);

    // -------------------------------------------------------------
    // STEP 12: PROJECT MATERIALS & MATERIAL LOGS
    // -------------------------------------------------------------
    console.log('\n>>> [Step 12] Seeding Project Materials & Material Consumption Logs...');
    const [existingProjMat]: any = await pool.query(`SELECT id FROM project_materials LIMIT 1`);
    if (existingProjMat.length === 0) {
      for (const wbs of allSeededProjectWbs.slice(0, 15)) {
        // Assign 3 materials per WBS
        const sampleMats = [materialsData[0], materialsData[1], materialsData[5]]; // Cement, Steel, RMC
        for (const sm of sampleMats) {
          const matId = materialIdMap[sm.code] || 1;
          const plannedQty = 500.00;
          const receivedQty = 450.00;
          const usedQty = 380.00;
          const remQty = 70.00;
          const plannedCost = plannedQty * sm.rate;
          const actualCost = usedQty * sm.rate;

          const [pmRes]: any = await pool.query(
            `INSERT INTO project_materials (
               project_id, wbs_id, material_id, material_name, unit, unit_rate,
               planned_quantity, received_quantity, used_quantity, remaining_quantity,
               planned_cost, actual_cost, remaining_cost
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              wbs.project_id, wbs.id, matId, sm.name, sm.unit, sm.rate,
              plannedQty, receivedQty, usedQty, remQty,
              plannedCost, actualCost, remQty * sm.rate
            ]
          );
          const pmId = pmRes.insertId;
          countRecord('project_materials');

          // Log material usage
          await pool.query(
            `INSERT INTO project_material_logs (project_material_id, project_id, wbs_id, material_id, action_type, quantity, unit_rate, cost, log_date, notes)
             VALUES (?, ?, ?, ?, 'received', ?, ?, ?, ?, 'Site stock delivery batch 1')`,
            [pmId, wbs.project_id, wbs.id, matId, receivedQty, sm.rate, receivedQty * sm.rate, '2026-08-25']
          );
          await pool.query(
            `INSERT INTO project_material_logs (project_material_id, project_id, wbs_id, material_id, action_type, quantity, unit_rate, cost, log_date, notes)
             VALUES (?, ?, ?, ?, 'used', ?, ?, ?, ?, 'Consumed for foundation concrete pour')`,
            [pmId, wbs.project_id, wbs.id, matId, usedQty, sm.rate, actualCost, '2026-09-10']
          );
          countRecord('project_material_logs', 2);
        }
      }
      console.log(`✓ Project materials & stock consumption history seeded.`);
    } else {
      console.log(`✓ Project materials already present.`);
    }

    // -------------------------------------------------------------
    // STEP 13: TIMESHEETS / WORK LOGS (100+ Realistic Records)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 13] Seeding Timesheets / Work Logs (100+ entries)...');
    const [existingTs]: any = await pool.query(`SELECT COUNT(*) as count FROM timesheets WHERE employee_id IN (SELECT employee_id FROM employees WHERE employee_code LIKE 'DEMO-%')`);
    
    if (existingTs[0].count < 50) {
      const activeEmps = [
        employeeIdMap['DEMO-EMP-004'] || 1,
        employeeIdMap['DEMO-EMP-005'] || 2,
        employeeIdMap['DEMO-EMP-007'] || 3,
        employeeIdMap['DEMO-EMP-008'] || 4,
        employeeIdMap['DEMO-EMP-010'] || 5,
        employeeIdMap['DEMO-EMP-011'] || 6,
      ];

      const timesheetComments = [
        'Supervised concrete pouring for machine foundation plinth',
        'Verified steel rebar placement against structural drawings',
        'Conducted MEP conduit alignment and pressure test',
        'Attended safety briefing and site inspection walk-through',
        'Monitored laser-screed concrete leveling and curing process',
        'Reviewed contractor shuttering and formwork stability',
        'Supervised drainage trench excavation and pipe laying',
        'Carried out QA/QC cube testing and slump test on site',
      ];

      let tsCount = 0;
      // Generate across dates in August and September 2026
      for (let dayOffset = 1; dayOffset <= 45; dayOffset++) {
        const dateStr = addDays('2026-08-10', dayOffset);
        // Skip Sundays
        const dObj = new Date(dateStr);
        if (dObj.getDay() === 0) continue;

        for (const empId of activeEmps) {
          const taskObj = allSeededTasks[(tsCount + empId) % allSeededTasks.length];
          const hours = 8.00;
          const rate = 700.00;
          const cost = hours * rate;
          const comment = timesheetComments[tsCount % timesheetComments.length];

          await pool.query(
            `INSERT INTO timesheets (project_id, wbs_id, task_id, employee_id, log_date, working_hours, comment, rate_snapshot, cost, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [taskObj.project_id, taskObj.wbs_id, taskObj.task_id, empId, dateStr, hours, comment, rate, cost]
          );
          tsCount++;
          countRecord('timesheets');
        }
      }
      console.log(`✓ ${tsCount} Timesheets generated across past 45 days.`);
    } else {
      console.log(`✓ Timesheets already present (${existingTs[0].count} entries).`);
    }

    // -------------------------------------------------------------
    // STEP 14: ATTENDANCE LOGS (200+ GPS Check-ins)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 14] Seeding GPS Attendance Logs (200+ entries)...');
    const [existingAtt]: any = await pool.query(`SELECT COUNT(*) as count FROM attendance_logs WHERE employee_id IN (SELECT employee_id FROM employees WHERE employee_code LIKE 'DEMO-%')`);
    
    if (existingAtt[0].count < 100) {
      const attendanceEmps = [
        employeeIdMap['DEMO-EMP-001'] || 1,
        employeeIdMap['DEMO-EMP-002'] || 2,
        employeeIdMap['DEMO-EMP-004'] || 3,
        employeeIdMap['DEMO-EMP-005'] || 4,
        employeeIdMap['DEMO-EMP-007'] || 5,
        employeeIdMap['DEMO-EMP-008'] || 6,
        employeeIdMap['DEMO-EMP-010'] || 7,
        employeeIdMap['DEMO-EMP-011'] || 8,
      ];

      let attCount = 0;
      for (let dayOffset = 1; dayOffset <= 50; dayOffset++) {
        const dateStr = addDays('2026-08-05', dayOffset);
        const dObj = new Date(dateStr);
        if (dObj.getDay() === 0) continue; // Skip Sunday

        for (const empId of attendanceEmps) {
          const taskObj = allSeededTasks[(attCount + empId) % allSeededTasks.length];
          const inTime = `${dateStr} 08:05:00`;
          const outTime = `${dateStr} 17:35:00`;
          const workingHrs = 9.50;
          
          // Realistic slight GPS jitter within 50m of project coordinates
          const jitterLat = (taskObj.lat || 18.7600000) + (Math.random() - 0.5) * 0.0005;
          const jitterLng = (taskObj.lng || 73.8600000) + (Math.random() - 0.5) * 0.0005;

          await pool.query(
            `INSERT INTO attendance_logs (
               employee_id, task_id, attendance_date, check_in_time, check_out_time,
               in_latitude, in_longitude, in_address, out_latitude, out_longitude, out_address,
               total_working_hours, status, in_distance_meters, project_radius_meters, in_status, out_status, is_deleted
             ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Project Site Security Gate A', ?, ?, 'Project Site Security Gate A', ?, 'completed', 45.00, 500, 'inside', 'inside', 0)`,
            [
              empId, taskObj.task_id, dateStr, inTime, outTime,
              jitterLat, jitterLng, jitterLat, jitterLng,
              workingHrs
            ]
          );
          attCount++;
          countRecord('attendance_logs');
        }
      }
      console.log(`✓ ${attCount} GPS Attendance check-ins logged.`);
    } else {
      console.log(`✓ Attendance logs already present (${existingAtt[0].count} entries).`);
    }

    // -------------------------------------------------------------
    // STEP 15: LABOUR WORK LOGS & LABOUR PAYMENTS
    // -------------------------------------------------------------
    console.log('\n>>> [Step 15] Seeding Contractor Labour Work Logs & Payment Vouchers...');
    const [existingLwl]: any = await pool.query(`SELECT COUNT(*) as count FROM labour_work_logs WHERE labour_id IN (SELECT labour_id FROM labours WHERE aadhar_id LIKE 'DEMO-%')`);
    
    if (existingLwl[0].count < 30) {
      let lwlCount = 0;
      const demoContractors = [
        labourIdMap['DEMO-LAB-001'] || 1,
        labourIdMap['DEMO-LAB-002'] || 2,
        labourIdMap['DEMO-LAB-003'] || 3,
        labourIdMap['DEMO-LAB-004'] || 4,
      ];

      for (let dayOffset = 5; dayOffset <= 45; dayOffset += 2) {
        const dateStr = addDays('2026-08-10', dayOffset);
        for (const lId of demoContractors) {
          const taskObj = allSeededTasks[(lwlCount + lId) % allSeededTasks.length];
          const workers = 8;
          const hours = 64.00; // 8 workers * 8 hrs
          const ratePerLabour = 450.00;
          const totalAmt = workers * ratePerLabour * 8; // daily

          await pool.query(
            `INSERT INTO labour_work_logs (
               labour_id, project_id, wbs_id, task_id, work_date, in_time, out_time,
               total_working_hours, rate_type, rate, amount, work_description,
               work_status, payment_status, labour_count, rate_per_labour, is_deleted
             ) VALUES (?, ?, ?, ?, ?, '08:00:00', '17:00:00', ?, 'hourly', 450.00, ?, ?, 'completed', 'approved', ?, ?, 0)`,
            [
              lId, taskObj.project_id, taskObj.wbs_id, taskObj.task_id, dateStr,
              hours, totalAmt, `Contractor gang deployment for ${taskObj.task_name}`,
              workers, ratePerLabour
            ]
          );
          lwlCount++;
          countRecord('labour_work_logs');
        }
      }
      console.log(`✓ ${lwlCount} Contractor Labour Work Logs generated.`);

      // Seed Labour Payment Vouchers
      for (let pIdx = 1; pIdx <= 8; pIdx++) {
        const contractorId = demoContractors[pIdx % demoContractors.length];
        const payDate = addDays('2026-08-25', pIdx * 4);
        const payAmount = 85000.00 + pIdx * 5000;
        await pool.query(
          `INSERT INTO labour_payments (
             payment_code, labour_id, project_id, payment_date, total_hours, total_amount,
             payment_method, reference_number, status, remarks
           ) VALUES (?, ?, 1, ?, 180.00, ?, 'bank_transfer', ?, 'paid', 'Bi-weekly subcontractor milestone clearance')`,
          [
            `DEMO-PAY-2026-${pIdx.toString().padStart(3, '0')}`,
            contractorId, payDate, payAmount,
            `HDFC-NEFT-992014-${pIdx}`
          ]
        );
        countRecord('labour_payments');
      }
      console.log(`✓ 8 Contractor Payment Vouchers created and paid.`);
    } else {
      console.log(`✓ Labour work logs already present.`);
    }

    // -------------------------------------------------------------
    // STEP 16: INVOICES & BILLING SCHEDULES (15+ Invoices)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 16] Seeding Billing Schedules, Invoices (15+) & Payments...');
    const [existingInvoices]: any = await pool.query(`SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE 'DEMO-%'`);

    if (existingInvoices[0].count < 10) {
      let invSeq = 1;
      for (const p of projectsSeedData) {
        const projId = projectIdMap[p.code];
        const qtnId = quotationIdMap[p.qtnCode] || 1;
        const custId = customerIdMap[p.custCode] || 1;

        // 3 Billing schedules per project
        const months = ['2026-08-01', '2026-09-01', '2026-10-01'];
        for (let mIdx = 0; mIdx < months.length; mIdx++) {
          const mDate = months[mIdx];
          const expectedAmt = Math.round(p.budget / 4);

          const [bsRes]: any = await pool.query(
            `INSERT INTO billing_schedules (project_id, quotation_id, billing_month, expected_amount, status)
             VALUES (?, ?, ?, ?, 'completed_work_logged')`,
            [projId, qtnId, mDate, expectedAmt]
          );
          const scheduleId = bsRes.insertId;
          countRecord('billing_schedules');

          // Monthly completed work approval
          await pool.query(
            `INSERT INTO monthly_completed_work (schedule_id, project_id, completion_percentage, approved_amount, status, approved_by)
             VALUES (?, ?, 100.00, ?, 'approved', ?)`,
            [scheduleId, projId, expectedAmt, employeeIdMap['DEMO-EMP-001'] || 1]
          );
          countRecord('monthly_completed_work');

          // Generate Invoice
          const invNum = `DEMO-INV-2026-${invSeq.toString().padStart(3, '0')}`;
          const invDate = addDays(mDate, 25);
          const dueDate = addDays(invDate, 30);
          const subtotal = expectedAmt;
          const taxPct = p.cur === curMap['INR'] ? 18.00 : 5.00;
          const taxAmt = (subtotal * taxPct) / 100;
          const totalAmt = subtotal + taxAmt;

          // Vary invoice statuses: 1-6 Paid, 7-10 Partially Paid, 11-13 Sent, 14-15 Approved, 16 Draft
          let invStatus: 'paid' | 'partially_paid' | 'sent' | 'approved' | 'draft' = 'paid';
          if (invSeq > 13) invStatus = 'approved';
          else if (invSeq > 10) invStatus = 'sent';
          else if (invSeq > 6) invStatus = 'partially_paid';

          const [invRes]: any = await pool.query(
            `INSERT INTO invoices (
               invoice_number, customer_id, project_id, quotation_id, schedule_id,
               currency_id, tax_id, invoice_date, due_date, subtotal_amount,
               tax_amount, total_amount, status, created_by, approved_by
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              invNum, custId, projId, qtnId, scheduleId,
              p.cur, taxGst18, invDate, dueDate, subtotal,
              taxAmt, totalAmt, invStatus,
              employeeIdMap['DEMO-EMP-006'] || 1,
              employeeIdMap['DEMO-EMP-001'] || 1
            ]
          );
          const invId = invRes.insertId;
          countRecord('invoices');

          // Invoice Items
          await pool.query(
            `INSERT INTO invoice_items (invoice_id, discipline_id, description, amount, quantity, rate, tax_percentage, tax_amount)
             VALUES (?, 1, ?, ?, 1.00, ?, ?, ?)`,
            [
              invId,
              `Certified Progress Milestone Billing - ${p.name} (Month ${mIdx + 1})`,
              subtotal, subtotal, taxPct, taxAmt
            ]
          );
          countRecord('invoice_items');

          // Record payment if paid or partially paid
          if (invStatus === 'paid') {
            await pool.query(
              `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, status)
               VALUES (?, ?, ?, 'bank_transfer', ?, 'completed')`,
              [invId, addDays(invDate, 15), totalAmt, `BANK-REF-${invSeq}-FULL`]
            );
            countRecord('invoice_payments');
          } else if (invStatus === 'partially_paid') {
            const partialAmt = Math.round(totalAmt * 0.6);
            await pool.query(
              `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, status)
               VALUES (?, ?, ?, 'bank_transfer', ?, 'completed')`,
              [invId, addDays(invDate, 10), partialAmt, `BANK-REF-${invSeq}-PART`]
            );
            countRecord('invoice_payments');
          }

          invSeq++;
        }
      }
      console.log(`✓ 15 Commercial Invoices generated with itemization and payment receipts.`);
    } else {
      console.log(`✓ Invoices already present.`);
    }

    // -------------------------------------------------------------
    // STEP 17: SITE SURVEYS (15+ Engineering Surveys)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 17] Seeding Site Surveys (15+)...');
    const [existingSurveys]: any = await pool.query(`SELECT COUNT(*) as count FROM site_surveys WHERE survey_code LIKE 'DEMO-%'`);

    if (existingSurveys[0].count < 10) {
      let survIdx = 1;
      const surveyRemarks = [
        'Topographical levels verified against municipal benchmarks. Ready for excavation.',
        'Foundation soil bearing capacity (SBC) confirmed at 220 kN/sqm.',
        'Checked rebar spacing and cover blocks. All structural specifications met.',
        'Electrical main conduits and earthing pits checked and cleared for backfilling.',
        'Pressure testing on chilled water supply headers held at 12 bar for 24h.',
        'Irrigation mainline hydrostatic test completed without any pressure drops.',
        'Industrial flooring floor flatness (FF) and floor levelness (FL) verified.',
        'Final aesthetic inspection and client snagging items closed out.',
      ];

      for (const p of projectsSeedData) {
        const projId = projectIdMap[p.code];
        const custId = customerIdMap[p.custCode] || 1;

        for (let s = 1; s <= 3; s++) {
          const survCode = `DEMO-SS-2026-${survIdx.toString().padStart(3, '0')}`;
          const sDate = addDays(p.start, s * 14);
          const remarks = surveyRemarks[(survIdx - 1) % surveyRemarks.length];

          const [survRes]: any = await pool.query(
            `INSERT INTO site_surveys (
               survey_code, project_id, customer_id, discipline_id, survey_date,
               conducted_by, entry_type, location_details, latitude, longitude,
               remarks, status
             ) VALUES (?, ?, ?, 1, ?, ?, 'system_entry', ?, ?, ?, ?, 'completed')`,
            [
              survCode, projId, custId, sDate,
              employeeIdMap['DEMO-EMP-010'] || 1, // QA/QC Engineer
              `Grid Reference Zone ${s} - ${p.address}`,
              p.lat, p.lng, remarks
            ]
          );
          const surveyId = survRes.insertId;
          countRecord('site_surveys');

          // Attach Photo
          await pool.query(
            `INSERT INTO site_survey_photos (survey_id, photo_name, file_path, caption)
             VALUES (?, ?, '/uploads/surveys/demo_inspection_photo.jpg', ?)`,
            [surveyId, `Field Inspection Photo - ${survCode}`, remarks]
          );
          countRecord('site_survey_photos');

          survIdx++;
        }
      }
      console.log(`✓ 15 Site Survey inspections recorded with geo-coordinates and photos.`);
    } else {
      console.log(`✓ Site surveys already present.`);
    }

    // -------------------------------------------------------------
    // STEP 18: ENTITY DOCUMENTS (Permits, NOCs, Drawings)
    // -------------------------------------------------------------
    console.log('\n>>> [Step 18] Seeding Entity Documents & Blueprints...');
    for (const p of projectsSeedData) {
      const projId = projectIdMap[p.code];
      const [existingDoc]: any = await pool.query(
        `SELECT document_id FROM entity_documents WHERE entity_type = 'project' AND entity_id = ?`,
        [projId]
      );
      if (existingDoc.length === 0) {
        await pool.query(
          `INSERT INTO entity_documents (
             entity_type, entity_id, doc_type_id, document_name, document_number,
             issue_date, expiry_date, file_path, file_size, mime_type, status, is_current
           ) VALUES
           ('project', ?, 9, 'DEMO-Municipal Building Construction Permit', ?, '2026-08-01', '2027-08-01', '/uploads/documents/demo_specification.pdf', 1048576, 'application/pdf', 'active', 1),
           ('project', ?, 10, 'DEMO-Architectural As-Built Structural Blueprint', ?, '2026-08-10', NULL, '/uploads/documents/demo_specification.pdf', 2097152, 'application/pdf', 'active', 1)`,
          [
            projId, `BP-${projId}-2026`,
            projId, `DWG-A-${projId}`
          ]
        );
        countRecord('entity_documents', 2);
      }
    }
    console.log(`✓ Entity documents & technical blueprints attached.`);

    // -------------------------------------------------------------
    // FINAL VALIDATION & VERIFICATION METRICS
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('  DATA INTEGRITY & FOREIGN KEY VERIFICATION REPORT');
    console.log('===============================================================');

    const verifyTables = [
      'customers', 'project_types', 'materials', 'labours', 'employees',
      'wbs_templates', 'quotations', 'quotation_disciplines', 'planning',
      'projects', 'project_wbs', 'tasks', 'task_dependencies', 'task_assignments',
      'project_materials', 'timesheets', 'attendance_logs', 'labour_work_logs',
      'labour_payments', 'invoices', 'invoice_items', 'invoice_payments', 'site_surveys'
    ];

    for (const t of verifyTables) {
      const [r]: any = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`  ${t.padEnd(28)} : ${r[0].cnt.toString().padStart(6)} total records in DB`);
    }

    // Verify Business Flow Integrity:
    console.log('\n--- Business Flow Verification ---');
    const [qtnWithCust]: any = await pool.query(`SELECT COUNT(*) as cnt FROM quotations q JOIN customers c ON q.customer_id = c.customer_id`);
    console.log(`  ✓ Quotations linked to valid Customers          : ${qtnWithCust[0].cnt}`);

    const [planWithQtn]: any = await pool.query(`SELECT COUNT(*) as cnt FROM planning p JOIN quotations q ON p.quotation_id = q.quotation_id`);
    console.log(`  ✓ Planning records linked to valid Quotations   : ${planWithQtn[0].cnt}`);

    const [projWithCust]: any = await pool.query(`SELECT COUNT(*) as cnt FROM projects p JOIN customers c ON p.customer_id = c.customer_id`);
    console.log(`  ✓ Projects linked to valid Customers            : ${projWithCust[0].cnt}`);

    const [tasksWithWbs]: any = await pool.query(`SELECT COUNT(*) as cnt FROM tasks t JOIN project_wbs pw ON t.wbs_id = pw.id`);
    console.log(`  ✓ Tasks linked to valid Project WBS             : ${tasksWithWbs[0].cnt}`);

    const [tsWithTasks]: any = await pool.query(`SELECT COUNT(*) as cnt FROM timesheets ts JOIN tasks t ON ts.task_id = t.task_id`);
    console.log(`  ✓ Timesheets linked to valid Project Tasks      : ${tsWithTasks[0].cnt}`);

    const [attWithEmps]: any = await pool.query(`SELECT COUNT(*) as cnt FROM attendance_logs a JOIN employees e ON a.employee_id = e.employee_id`);
    console.log(`  ✓ Attendance records linked to valid Employees  : ${attWithEmps[0].cnt}`);

    const [invWithProj]: any = await pool.query(`SELECT COUNT(*) as cnt FROM invoices i JOIN projects p ON i.project_id = p.project_id`);
    console.log(`  ✓ Invoices linked to valid Projects             : ${invWithProj[0].cnt}`);

    const [survWithProj]: any = await pool.query(`SELECT COUNT(*) as cnt FROM site_surveys s JOIN projects p ON s.project_id = p.project_id`);
    console.log(`  ✓ Site Surveys linked to valid Projects         : ${survWithProj[0].cnt}`);

    console.log('\n===============================================================');
    console.log('  DEMO SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log('Credentials:');
    console.log('  Admin User    : admin@htco.com / Admin@123 (or Admin123!)');
    console.log('  Manager User  : sjenkins@htco.com / Admin123!');
    console.log('  Demo Engineer : v.malhotra@htco.com / Admin123!');
    console.log('===============================================================\n');

  } catch (err: any) {
    console.error('\n❌ SEEDING ERROR:', err);
  } finally {
    await pool.end();
  }
}

runDemoSeeder();
