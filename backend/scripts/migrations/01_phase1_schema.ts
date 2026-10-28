import { PoolConnection } from 'mysql2/promise';

export async function up(db: PoolConnection) {
  const queries = [
    // ── QUOTATIONS ──
    `ALTER TABLE quotations 
     ADD COLUMN converted_project_id INT DEFAULT NULL,
     ADD COLUMN place_of_supply_state VARCHAR(100) DEFAULT NULL,
     ADD COLUMN currency_id INT DEFAULT NULL,
     ADD COLUMN converted_at DATETIME DEFAULT NULL,
     ADD COLUMN is_converted TINYINT(1) DEFAULT 0;`,
    
    // Convert 'status' ENUM to include 'converted' if not already
    `ALTER TABLE quotations MODIFY COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'revised', 'converted') NOT NULL DEFAULT 'draft';`,

    // ── QUOTATION DISCIPLINES ──
    `ALTER TABLE quotation_disciplines 
     ADD COLUMN wbs_code VARCHAR(100) DEFAULT NULL,
     ADD COLUMN planned_start_date DATE DEFAULT NULL,
     ADD COLUMN planned_end_date DATE DEFAULT NULL,
     ADD COLUMN planned_hours DECIMAL(10,2) DEFAULT 0.00,
     ADD COLUMN planned_labour_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_employee_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_material_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_other_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN tax_id INT DEFAULT NULL,
     ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00,
     ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN line_total DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN sort_order INT DEFAULT 0;`,

    // ── QUOTATION WBS ITEMS ──
    `CREATE TABLE IF NOT EXISTS quotation_wbs_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quotation_discipline_id INT NOT NULL,
      item_type ENUM('labour', 'material', 'other') NOT NULL,
      material_id INT DEFAULT NULL,
      description TEXT,
      unit VARCHAR(50) DEFAULT 'lump_sum',
      qty DECIMAL(10,2) NOT NULL DEFAULT 1.00,
      rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      tax_percentage DECIMAL(5,2) DEFAULT 0.00,
      tax_amount DECIMAL(15,2) DEFAULT 0.00,
      discount_amount DECIMAL(15,2) DEFAULT 0.00,
      line_total DECIMAL(15,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_discipline_id) REFERENCES quotation_disciplines(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // ── PROJECTS ──
    // Note: source_quotation_id and some fields added in Phase 7. Adding the rest.
    `ALTER TABLE projects 
     ADD COLUMN project_manager_id INT DEFAULT NULL,
     ADD COLUMN start_date DATE DEFAULT NULL,
     ADD COLUMN end_date DATE DEFAULT NULL,
     ADD COLUMN planned_hours DECIMAL(10,2) DEFAULT 0.00,
     ADD COLUMN planned_labour_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_employee_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_material_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN planned_other_cost DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN is_legacy TINYINT(1) DEFAULT 0;`,

    // Clean up customer_id FK if it's missing (MyISAM ignores it initially)
    `ALTER TABLE projects DROP FOREIGN KEY IF EXISTS fk_projects_customer_id;`,
    `ALTER TABLE projects ADD CONSTRAINT fk_projects_customer_id FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL;`,
    
    // Add missing indexes (using CREATE INDEX instead of IF NOT EXISTS since MySQL 5.7 doesn't support IF NOT EXISTS for index directly, will wrap in TRY block)

    // ── PROJECT WBS ──
    // quotation_discipline_id added in Phase 7
    `ALTER TABLE project_wbs ADD COLUMN progress_percent DECIMAL(5,2) DEFAULT 0.00;`,
    // Drop actual_hours? Will just ignore it in code.

    // ── TASKS ──
    // is_billable (priority was added in Phase 7, estimated_hours exists)
    `ALTER TABLE tasks ADD COLUMN is_billable TINYINT(1) DEFAULT 1;`,

    // ── TASK ASSIGNMENTS ──
    `ALTER TABLE task_assignments 
     ADD COLUMN planned_hours DECIMAL(10,2) DEFAULT 0.00,
     ADD COLUMN actual_hours DECIMAL(10,2) DEFAULT 0.00;`,

    // ── MATERIAL MODULE ──
    // Create new material tables matching Phase 1 spec
    `CREATE TABLE IF NOT EXISTS materials (
      material_id INT AUTO_INCREMENT PRIMARY KEY,
      material_code VARCHAR(50) UNIQUE,
      material_name VARCHAR(255) NOT NULL,
      description TEXT,
      unit VARCHAR(50) NOT NULL,
      default_rate DECIMAL(15,2) DEFAULT 0.00,
      category VARCHAR(100),
      is_deleted TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS material_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_wbs_id INT NOT NULL,
      task_id INT DEFAULT NULL,
      material_id INT NOT NULL,
      planned_qty DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      planned_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      planned_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_wbs_id) REFERENCES project_wbs(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL,
      FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS material_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      txn_type ENUM('receipt', 'usage', 'return', 'wastage', 'adjustment') NOT NULL,
      project_wbs_id INT DEFAULT NULL,
      task_id INT DEFAULT NULL,
      material_id INT NOT NULL,
      qty DECIMAL(10,2) NOT NULL,
      rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      txn_date DATE NOT NULL,
      reference_number VARCHAR(100) DEFAULT NULL,
      notes TEXT,
      created_by INT DEFAULT NULL,
      is_deleted TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL,
      FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS material_surveys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      wbs_id INT NOT NULL,
      survey_date DATE NOT NULL,
      survey_period_start DATE,
      survey_period_end DATE,
      status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
      approved_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      -- WBS ID is left without strict FK here due to the ongoing WBS normalisation
    ) ENGINE=InnoDB;`,

    // ── FINANCE ──
    `ALTER TABLE invoices MODIFY COLUMN schedule_id INT DEFAULT NULL;`,
    `ALTER TABLE invoices 
     ADD COLUMN invoice_type ENUM('schedule', 'progress') DEFAULT 'schedule',
     ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN pending_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN cgst_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN sgst_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN igst_amount DECIMAL(15,2) DEFAULT 0.00;`,

    `ALTER TABLE invoice_items 
     ADD COLUMN project_wbs_id INT DEFAULT NULL,
     ADD COLUMN task_id INT DEFAULT NULL,
     ADD COLUMN quantity DECIMAL(10,2) DEFAULT 1.00,
     ADD COLUMN rate DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN discount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00,
     ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN cgst_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN sgst_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD COLUMN igst_amount DECIMAL(15,2) DEFAULT 0.00,
     ADD FOREIGN KEY (project_wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
     ADD FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;`,

    // ── TAXES ──
    `ALTER TABLE taxes 
     ADD COLUMN tax_type ENUM('GST', 'CGST', 'SGST', 'IGST', 'VAT') DEFAULT 'GST',
     ADD COLUMN component VARCHAR(50) DEFAULT NULL;`
  ];

  for (const query of queries) {
    try {
      await db.query(query);
    } catch (e: any) {
      // Ignore Duplicate column errors safely to keep migration idempotent
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.code === 'ER_TABLE_EXISTS_ERROR') {
        // Ignored
      } else {
        console.warn(`Query warning: ${query.substring(0, 50)}... -> ${e.message}`);
      }
    }
  }

  // Seed GST Slabs idempotently
  const gstSlabs = [
    [5, 'GST 5%', 'GST', 'India'],
    [12, 'GST 12%', 'GST', 'India'],
    [18, 'GST 18%', 'GST', 'India'],
    [28, 'GST 28%', 'GST', 'India'],
  ];
  for (const slab of gstSlabs) {
    await db.query(
      `INSERT INTO taxes (tax_percentage, tax_name, tax_type, is_split, cgst_percentage, sgst_percentage)
       SELECT ?, ?, ?, 1, ?/2, ?/2 
       FROM DUAL 
       WHERE NOT EXISTS (SELECT 1 FROM taxes WHERE tax_percentage = ? AND tax_name = ?)`,
      [slab[0], slab[1], slab[2], slab[0], slab[0], slab[0], slab[1]]
    );
  }

  // Create indexes safely
  const indexQueries = [
    `CREATE INDEX idx_projects_customer ON projects(customer_id);`,
    `CREATE INDEX idx_projects_quotation ON projects(source_quotation_id);`,
    `CREATE INDEX idx_tasks_pw ON tasks(project_id, wbs_id);`
  ];
  for (const q of indexQueries) {
    try {
      await db.query(q);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_KEYNAME') console.warn(e.message);
    }
  }
}
