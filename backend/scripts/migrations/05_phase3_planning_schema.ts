import { PoolConnection } from 'mysql2/promise';

export async function up(connection: PoolConnection) {
  const queries = [
    // ── 1. QUOTATION & PROJECT UPDATES ──
    `ALTER TABLE quotations 
     ADD COLUMN IF NOT EXISTS planning_required TINYINT(1) DEFAULT 1;`,
     
    `ALTER TABLE projects
     ADD COLUMN IF NOT EXISTS planning_required TINYINT(1) DEFAULT 1,
     ADD COLUMN IF NOT EXISTS planning_id INT DEFAULT NULL;`,

    // ── 2. PROJECT WBS UPDATES (Hierarchy & Baseline) ──
    `ALTER TABLE project_wbs
     ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
     ADD COLUMN IF NOT EXISTS wbs_code VARCHAR(100) DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS baseline_start DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS baseline_end DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS current_start DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS current_end DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS baseline_duration INT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS current_duration INT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS quality_standard TEXT DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT DEFAULT NULL;`,

    // ── 3. TASKS UPDATES (Baseline & Planning Link) ──
    `ALTER TABLE tasks
     ADD COLUMN IF NOT EXISTS baseline_start DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS baseline_end DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS current_start DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS current_end DATE DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS baseline_duration INT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS current_duration INT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00,
     ADD COLUMN IF NOT EXISTS manually_adjusted TINYINT(1) DEFAULT 0,
     ADD COLUMN IF NOT EXISTS planning_task_id INT DEFAULT NULL;`,

    // ── 4. NEW PLANNING TABLES ──
    `CREATE TABLE IF NOT EXISTS planning (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quotation_id INT NOT NULL,
      project_type_id INT NULL,
      customer_id INT NULL,
      calendar_id INT NULL,
      status ENUM('draft', 'in_review', 'approved', 'rejected') DEFAULT 'draft',
      version INT DEFAULT 1,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
      FOREIGN KEY (calendar_id) REFERENCES company_calendar(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS planning_wbs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      planning_id INT NOT NULL,
      parent_id INT NULL,
      wbs_name VARCHAR(255) NOT NULL,
      wbs_code VARCHAR(100) NULL,
      level INT DEFAULT 1,
      sort_order INT DEFAULT 0,
      baseline_start DATE NULL,
      baseline_end DATE NULL,
      duration INT DEFAULT 0,
      description TEXT NULL,
      FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS planning_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      planning_wbs_id INT NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      duration INT DEFAULT 0,
      manually_adjusted TINYINT(1) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      sort_order INT DEFAULT 0,
      FOREIGN KEY (planning_wbs_id) REFERENCES planning_wbs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS planning_task_dependencies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      predecessor_task_id INT NOT NULL,
      dependency_type ENUM('FS', 'SS', 'FF', 'SF') DEFAULT 'FS',
      lag_days INT DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES planning_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (predecessor_task_id) REFERENCES planning_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS planning_resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      planning_task_id INT NOT NULL,
      resource_type ENUM('labour', 'employee', 'material', 'equipment') NOT NULL,
      resource_id INT NOT NULL,
      quantity DECIMAL(10,2) DEFAULT 1.00,
      planned_cost DECIMAL(15,2) DEFAULT 0.00,
      FOREIGN KEY (planning_task_id) REFERENCES planning_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS planning_revisions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      planning_id INT NOT NULL,
      version INT NOT NULL,
      snapshot_data JSON NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS quotation_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quotation_id INT NOT NULL,
      snapshot_hash VARCHAR(255) NOT NULL,
      snapshot_data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  for (const q of queries) {
    try {
      await connection.query(q);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        // Ignore duplicate column errors during ADD COLUMN
        console.log(`Column already exists, skipping...`);
      } else {
        throw e;
      }
    }
  }

  console.log('✅ Phase 3 Planning Schema modifications completed.');
}
