import { dbPool } from '../config/db';

export async function migratePlanningComplete() {
  console.log('🚀 Running Complete Planning & Workflow Schema Migrations...');

  const connection = await dbPool.getConnection();
  try {
    // 1. Company Calendar & Holidays
    await connection.query(`
      CREATE TABLE IF NOT EXISTS company_calendar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NULL COMMENT 'If null, this is the company default calendar',
        calendar_name VARCHAR(150) NOT NULL,
        working_days_json JSON NOT NULL COMMENT 'Array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat) e.g., [1,2,3,4,5,6] for Mon-Sat',
        working_hours_per_day DECIMAL(4,2) DEFAULT 10.00,
        status TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        updated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        calendar_id INT NOT NULL,
        holiday_date DATE NOT NULL,
        description VARCHAR(255) NULL,
        type ENUM('public_holiday', 'site_shutdown', 'unavailable') DEFAULT 'public_holiday',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (calendar_id) REFERENCES company_calendar(id) ON DELETE CASCADE,
        UNIQUE KEY uk_calendar_date (calendar_id, holiday_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      INSERT IGNORE INTO company_calendar (id, calendar_name, working_days_json, working_hours_per_day) 
      VALUES (1, 'Default Company Calendar', '[1,2,3,4,5,6]', 10.00)
    `);

    // 2. Quotation Tables & Columns
    const quotationAlters = [
      `ALTER TABLE quotations ADD COLUMN new_project_name VARCHAR(255) DEFAULT NULL AFTER project_id`,
      `ALTER TABLE quotations ADD COLUMN project_type_id INT DEFAULT NULL AFTER new_project_name`,
      `ALTER TABLE quotations ADD COLUMN currency_id INT DEFAULT NULL AFTER project_type_id`,
      `ALTER TABLE quotations ADD COLUMN exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000 AFTER currency_id`,
      `ALTER TABLE quotations ADD COLUMN start_date DATE DEFAULT NULL AFTER quotation_date`,
      `ALTER TABLE quotations ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date`,
      `ALTER TABLE quotations ADD COLUMN validity_date DATE DEFAULT NULL AFTER end_date`,
      `ALTER TABLE quotations ADD COLUMN planning_required TINYINT(1) NOT NULL DEFAULT 1 AFTER status`,
      `ALTER TABLE quotation_terms_snapshots ADD COLUMN template_id INT NULL AFTER quotation_id`,
      `ALTER TABLE quotation_terms_snapshots ADD COLUMN template_name VARCHAR(255) NULL AFTER template_id`,
      `ALTER TABLE quotation_terms_snapshots ADD COLUMN is_mandatory TINYINT(1) DEFAULT 0 AFTER description`,
    ];
    for (const q of quotationAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // Quotation Disciplines alters
    const qdAlters = [
      `ALTER TABLE quotation_disciplines MODIFY COLUMN project_id INT NULL`,
      `ALTER TABLE quotation_disciplines MODIFY COLUMN discipline_id INT NULL`,
      `ALTER TABLE quotation_disciplines MODIFY COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour'`,
      `ALTER TABLE quotation_disciplines ADD COLUMN wbs_template_id INT DEFAULT NULL`,
      `ALTER TABLE quotation_disciplines ADD COLUMN wbs_id INT DEFAULT NULL`,
      `ALTER TABLE quotation_disciplines ADD COLUMN wbs_code VARCHAR(100) DEFAULT NULL`,
      `ALTER TABLE quotation_disciplines ADD COLUMN labour_hours DECIMAL(10,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN labour_rate DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN labour_cost DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN material_quantity DECIMAL(12,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN material_rate DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN material_cost DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE quotation_disciplines ADD COLUMN start_date DATE DEFAULT NULL`,
      `ALTER TABLE quotation_disciplines ADD COLUMN end_date DATE DEFAULT NULL`,
    ];
    for (const q of qdAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // Quotation WBS Labour & Material child tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_wbs_labour (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        quotation_discipline_id INT NOT NULL,
        labour_id INT NULL,
        labour_name VARCHAR(255) NOT NULL,
        labour_type VARCHAR(100) NULL,
        hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_discipline_id) REFERENCES quotation_disciplines(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_wbs_material (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        quotation_discipline_id INT NOT NULL,
        material_id INT NULL,
        material_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(30) NULL,
        rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_discipline_id) REFERENCES quotation_disciplines(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_terms_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        template_id INT NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_taxes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        tax_id INT NOT NULL,
        tax_name VARCHAR(100) NOT NULL,
        tax_code VARCHAR(50) NULL,
        tax_type VARCHAR(50) NULL,
        tax_percentage DECIMAL(5,2) NOT NULL,
        taxable_amount DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        snapshot_hash VARCHAR(255) NOT NULL,
        snapshot_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Planning Core Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        project_id INT NULL,
        customer_id INT NULL,
        project_type_id INT NULL,
        new_project_name VARCHAR(255) NULL,
        calendar_id INT NULL,
        status ENUM('draft', 'in_review', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
        version INT NOT NULL DEFAULT 1,
        start_date DATE NULL,
        end_date DATE NULL,
        total_duration INT NOT NULL DEFAULT 0,
        total_budget DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        terms_conditions LONGTEXT NULL,
        rejection_reason TEXT NULL,
        created_by INT NULL,
        submitted_by INT NULL,
        submitted_at DATETIME NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
        FOREIGN KEY (calendar_id) REFERENCES company_calendar(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure planning columns exist if table was already created
    const planningAlters = [
      `ALTER TABLE planning ADD COLUMN project_id INT NULL AFTER quotation_id`,
      `ALTER TABLE planning ADD COLUMN customer_id INT NULL AFTER project_id`,
      `ALTER TABLE planning ADD COLUMN project_type_id INT NULL AFTER customer_id`,
      `ALTER TABLE planning ADD COLUMN new_project_name VARCHAR(255) NULL AFTER project_type_id`,
      `ALTER TABLE planning ADD COLUMN calendar_id INT NULL AFTER new_project_name`,
      `ALTER TABLE planning ADD COLUMN start_date DATE NULL AFTER version`,
      `ALTER TABLE planning ADD COLUMN end_date DATE NULL AFTER start_date`,
      `ALTER TABLE planning ADD COLUMN total_duration INT NOT NULL DEFAULT 0 AFTER end_date`,
      `ALTER TABLE planning ADD COLUMN total_budget DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER total_duration`,
      `ALTER TABLE planning ADD COLUMN total_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER total_budget`,
      `ALTER TABLE planning ADD COLUMN total_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER total_labour_cost`,
      `ALTER TABLE planning ADD COLUMN total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER total_material_cost`,
      `ALTER TABLE planning ADD COLUMN terms_conditions LONGTEXT NULL AFTER total_tax_amount`,
      `ALTER TABLE planning ADD COLUMN rejection_reason TEXT NULL AFTER terms_conditions`,
      `ALTER TABLE planning ADD COLUMN submitted_by INT NULL AFTER created_by`,
      `ALTER TABLE planning ADD COLUMN submitted_at DATETIME NULL AFTER submitted_by`,
      `ALTER TABLE planning ADD COLUMN approved_by INT NULL AFTER submitted_at`,
      `ALTER TABLE planning ADD COLUMN approved_at DATETIME NULL AFTER approved_by`,
    ];
    for (const q of planningAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // 4. Planning WBS Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_wbs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        quotation_discipline_id INT NULL,
        wbs_id INT NULL,
        wbs_template_id INT NULL,
        parent_id INT NULL,
        wbs_name VARCHAR(255) NOT NULL,
        wbs_code VARCHAR(100) NULL,
        wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour',
        level INT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        unit VARCHAR(30) NOT NULL DEFAULT 'hours',
        planned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        budget_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        planned_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        baseline_start DATE NULL,
        baseline_end DATE NULL,
        baseline_duration INT NOT NULL DEFAULT 0,
        start_date DATE NULL,
        end_date DATE NULL,
        duration INT NOT NULL DEFAULT 0,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const pwbsAlters = [
      `ALTER TABLE planning_wbs ADD COLUMN quotation_discipline_id INT NULL AFTER planning_id`,
      `ALTER TABLE planning_wbs ADD COLUMN wbs_id INT NULL AFTER quotation_discipline_id`,
      `ALTER TABLE planning_wbs ADD COLUMN wbs_template_id INT NULL AFTER wbs_id`,
      `ALTER TABLE planning_wbs ADD COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour' AFTER wbs_code`,
      `ALTER TABLE planning_wbs ADD COLUMN unit VARCHAR(30) NOT NULL DEFAULT 'hours' AFTER sort_order`,
      `ALTER TABLE planning_wbs ADD COLUMN planned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER unit`,
      `ALTER TABLE planning_wbs ADD COLUMN rate DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_quantity`,
      `ALTER TABLE planning_wbs ADD COLUMN budget_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER rate`,
      `ALTER TABLE planning_wbs ADD COLUMN planned_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER budget_amount`,
      `ALTER TABLE planning_wbs ADD COLUMN planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_hours`,
      `ALTER TABLE planning_wbs ADD COLUMN planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_labour_cost`,
      `ALTER TABLE planning_wbs ADD COLUMN planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_material_cost`,
      `ALTER TABLE planning_wbs ADD COLUMN baseline_duration INT NOT NULL DEFAULT 0 AFTER baseline_end`,
      `ALTER TABLE planning_wbs ADD COLUMN start_date DATE NULL AFTER baseline_duration`,
      `ALTER TABLE planning_wbs ADD COLUMN end_date DATE NULL AFTER start_date`,
      `ALTER TABLE planning_wbs ADD COLUMN duration INT NOT NULL DEFAULT 0 AFTER end_date`,
    ];
    for (const q of pwbsAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // 5. Planning Tasks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_wbs_id INT NOT NULL,
        task_name VARCHAR(255) NOT NULL,
        task_code VARCHAR(100) NULL,
        description TEXT NULL,
        priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
        baseline_start DATE NULL,
        baseline_end DATE NULL,
        baseline_duration INT NOT NULL DEFAULT 0,
        start_date DATE NULL,
        end_date DATE NULL,
        duration INT NOT NULL DEFAULT 1,
        planned_hours DECIMAL(10,2) NOT NULL DEFAULT 8.00,
        planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        manually_adjusted TINYINT(1) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_wbs_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const ptaskAlters = [
      `ALTER TABLE planning_tasks ADD COLUMN task_code VARCHAR(100) NULL AFTER task_name`,
      `ALTER TABLE planning_tasks ADD COLUMN priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium' AFTER description`,
      `ALTER TABLE planning_tasks ADD COLUMN baseline_start DATE NULL AFTER priority`,
      `ALTER TABLE planning_tasks ADD COLUMN baseline_end DATE NULL AFTER baseline_start`,
      `ALTER TABLE planning_tasks ADD COLUMN baseline_duration INT NOT NULL DEFAULT 0 AFTER baseline_end`,
      `ALTER TABLE planning_tasks ADD COLUMN planned_hours DECIMAL(10,2) NOT NULL DEFAULT 8.00 AFTER duration`,
      `ALTER TABLE planning_tasks ADD COLUMN planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_hours`,
      `ALTER TABLE planning_tasks ADD COLUMN planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_labour_cost`,
      `ALTER TABLE planning_tasks ADD COLUMN planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER planned_material_cost`,
    ];
    for (const q of ptaskAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // 6. Planning Task Dependencies Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_task_dependencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        predecessor_task_id INT NOT NULL,
        dependency_type ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS',
        lag_days INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_plan_task_pred (task_id, predecessor_task_id),
        FOREIGN KEY (task_id) REFERENCES planning_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (predecessor_task_id) REFERENCES planning_tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Planning Labour & Material Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_wbs_labour (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        planning_wbs_id INT NOT NULL,
        quotation_labour_id INT NULL,
        labour_id INT NULL,
        labour_name VARCHAR(255) NOT NULL,
        labour_type VARCHAR(100) NULL,
        worker_count INT NOT NULL DEFAULT 1,
        hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        start_date DATE NULL,
        end_date DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
        FOREIGN KEY (planning_wbs_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_wbs_material (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        planning_wbs_id INT NOT NULL,
        quotation_material_id INT NULL,
        material_id INT NULL,
        material_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(30) NULL,
        rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        start_date DATE NULL,
        end_date DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
        FOREIGN KEY (planning_wbs_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Planning Terms & Taxes Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_terms_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        template_id INT NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_terms_snapshots (
        snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        template_id INT NULL,
        template_name VARCHAR(255) NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT DEFAULT 0,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_taxes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        tax_id INT NOT NULL,
        tax_name VARCHAR(100) NOT NULL,
        tax_code VARCHAR(50) NULL,
        tax_type VARCHAR(50) NULL,
        tax_percentage DECIMAL(5,2) NOT NULL,
        taxable_amount DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS planning_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        version INT NOT NULL,
        reason VARCHAR(255) NULL,
        change_summary TEXT NULL,
        snapshot_data JSON NOT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Project Tables & Columns
    const projAlters = [
      `ALTER TABLE projects ADD COLUMN planning_id INT DEFAULT NULL`,
      `ALTER TABLE projects ADD COLUMN planning_required TINYINT(1) NOT NULL DEFAULT 1`,
      `ALTER TABLE projects ADD COLUMN quotation_reference VARCHAR(100) DEFAULT NULL`,
      `ALTER TABLE projects ADD COLUMN terms_conditions LONGTEXT DEFAULT NULL`,
      `ALTER TABLE projects ADD COLUMN currency_id INT DEFAULT NULL`,
      `ALTER TABLE projects ADD COLUMN exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000`,
      `ALTER TABLE projects ADD COLUMN start_date DATE DEFAULT NULL`,
      `ALTER TABLE projects ADD COLUMN end_date DATE DEFAULT NULL`,
    ];
    for (const q of projAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // Project WBS columns
    const pwAlters = [
      `ALTER TABLE project_wbs ADD COLUMN wbs_code VARCHAR(100) DEFAULT NULL AFTER wbs_id`,
      `ALTER TABLE project_wbs ADD COLUMN wbs_name VARCHAR(255) DEFAULT NULL AFTER wbs_code`,
      `ALTER TABLE project_wbs ADD COLUMN parent_id INT DEFAULT NULL AFTER id`,
      `ALTER TABLE project_wbs ADD COLUMN level INT NOT NULL DEFAULT 1 AFTER parent_id`,
      `ALTER TABLE project_wbs ADD COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour'`,
      `ALTER TABLE project_wbs ADD COLUMN unit VARCHAR(30) NOT NULL DEFAULT 'hours'`,
      `ALTER TABLE project_wbs ADD COLUMN planned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN actual_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN rate DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN baseline_start DATE DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN baseline_end DATE DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN baseline_duration INT NOT NULL DEFAULT 0`,
      `ALTER TABLE project_wbs ADD COLUMN current_start DATE DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN current_end DATE DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN current_duration INT NOT NULL DEFAULT 0`,
      `ALTER TABLE project_wbs ADD COLUMN planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN quotation_discipline_id INT DEFAULT NULL`,
    ];
    for (const q of pwAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // Project Tasks columns
    const taskAlters = [
      `ALTER TABLE tasks ADD COLUMN planning_task_id INT DEFAULT NULL`,
      `ALTER TABLE tasks ADD COLUMN baseline_start DATE DEFAULT NULL`,
      `ALTER TABLE tasks ADD COLUMN baseline_end DATE DEFAULT NULL`,
      `ALTER TABLE tasks ADD COLUMN baseline_duration INT NOT NULL DEFAULT 0`,
      `ALTER TABLE tasks ADD COLUMN current_start DATE DEFAULT NULL`,
      `ALTER TABLE tasks ADD COLUMN current_end DATE DEFAULT NULL`,
      `ALTER TABLE tasks ADD COLUMN current_duration INT NOT NULL DEFAULT 0`,
      `ALTER TABLE tasks ADD COLUMN manually_adjusted TINYINT(1) NOT NULL DEFAULT 0`,
      `ALTER TABLE tasks ADD COLUMN planned_labour_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE tasks ADD COLUMN planned_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
      `ALTER TABLE tasks ADD COLUMN planned_other_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00`,
    ];
    for (const q of taskAlters) {
      try { await connection.query(q); } catch (e) {}
    }

    // Project Materials, Taxes & Terms
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        wbs_id INT NULL,
        material_name VARCHAR(255) NOT NULL,
        unit VARCHAR(30) NOT NULL DEFAULT 'Nos',
        planned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        unit_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        received_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        used_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        remaining_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        extra_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        planned_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        actual_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        remaining_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_terms_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        template_id INT NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_terms_snapshots (
        snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        template_id INT NULL,
        template_name VARCHAR(255) NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT DEFAULT 0,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_taxes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        tax_id INT NOT NULL,
        tax_name VARCHAR(100) NOT NULL,
        tax_code VARCHAR(50) NULL,
        tax_type VARCHAR(50) NULL,
        tax_percentage DECIMAL(5,2) NOT NULL,
        taxable_amount DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Complete Planning & Workflow Schema Migrations completed successfully!');
  } finally {
    connection.release();
  }
}
