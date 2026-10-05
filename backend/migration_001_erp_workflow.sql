-- ============================================================
-- HTCO ERP Workflow Migration
-- Safe, additive migrations only. No tables dropped.
-- Run: mysql -u root gaptm < migration_001_erp_workflow.sql
-- ============================================================

-- 1. Add 'both' to wbs_type enum in work_breakdown_structures
ALTER TABLE work_breakdown_structures
  MODIFY COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour';

-- 2. Create wbs_templates table
CREATE TABLE IF NOT EXISTS wbs_templates (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  template_code   VARCHAR(50) NOT NULL,
  template_name   VARCHAR(255) NOT NULL,
  project_type_id INT NOT NULL,
  description     TEXT,
  status          TINYINT(1) NOT NULL DEFAULT 1,
  created_by      INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME DEFAULT NULL,
  UNIQUE KEY uq_template_code (template_code),
  KEY idx_project_type (project_type_id),
  CONSTRAINT fk_wbs_template_project_type FOREIGN KEY (project_type_id) REFERENCES project_types(type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create wbs_template_details table
CREATE TABLE IF NOT EXISTS wbs_template_details (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  template_id      INT NOT NULL,
  wbs_id           INT NOT NULL,
  wbs_type         ENUM('labour','material','both') NOT NULL DEFAULT 'labour',
  description      TEXT,
  planned_hours    DECIMAL(10,2) NOT NULL DEFAULT 0,
  planned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit             VARCHAR(30) NOT NULL DEFAULT 'hours',
  rate             DECIMAL(15,2) NOT NULL DEFAULT 0,
  planned_cost     DECIMAL(15,2) NOT NULL DEFAULT 0,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tpl_detail_template (template_id),
  KEY idx_tpl_detail_wbs (wbs_id),
  CONSTRAINT fk_tpl_detail_template FOREIGN KEY (template_id) REFERENCES wbs_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_tpl_detail_wbs FOREIGN KEY (wbs_id) REFERENCES work_breakdown_structures(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add project_type_id to projects (safe: IF NOT EXISTS equivalent via ALTER IGNORE)
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'project_type_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE projects ADD COLUMN project_type_id INT NULL AFTER project_code',
  'SELECT 1 -- project_type_id already exists'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add start_date to projects
SET @col_exists2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'start_date'
);
SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE projects ADD COLUMN start_date DATE NULL',
  'SELECT 1 -- start_date already exists'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Add end_date to projects
SET @col_exists3 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'end_date'
);
SET @sql3 = IF(@col_exists3 = 0,
  'ALTER TABLE projects ADD COLUMN end_date DATE NULL',
  'SELECT 1 -- end_date already exists'
);
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- Add currency_id to projects
SET @col_exists4 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'currency_id'
);
SET @sql4 = IF(@col_exists4 = 0,
  'ALTER TABLE projects ADD COLUMN currency_id INT NULL',
  'SELECT 1 -- currency_id already exists'
);
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- Fix projects.status enum
ALTER TABLE projects
  MODIFY COLUMN status ENUM('draft','active','on_hold','completed','cancelled','inactive') NOT NULL DEFAULT 'draft';

-- 5. Add project_type_id, start_date, end_date to quotations
SET @q1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotations' AND COLUMN_NAME='project_type_id');
SET @sql_q1 = IF(@q1=0, 'ALTER TABLE quotations ADD COLUMN project_type_id INT NULL', 'SELECT 1');
PREPARE sq1 FROM @sql_q1; EXECUTE sq1; DEALLOCATE PREPARE sq1;

SET @q2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotations' AND COLUMN_NAME='start_date');
SET @sql_q2 = IF(@q2=0, 'ALTER TABLE quotations ADD COLUMN start_date DATE NULL', 'SELECT 1');
PREPARE sq2 FROM @sql_q2; EXECUTE sq2; DEALLOCATE PREPARE sq2;

SET @q3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotations' AND COLUMN_NAME='end_date');
SET @sql_q3 = IF(@q3=0, 'ALTER TABLE quotations ADD COLUMN end_date DATE NULL', 'SELECT 1');
PREPARE sq3 FROM @sql_q3; EXECUTE sq3; DEALLOCATE PREPARE sq3;

-- 6. Alter quotation_disciplines to support 'both' type + separate labour/material fields
ALTER TABLE quotation_disciplines
  MODIFY COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour';

SET @qd1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='labour_hours');
SET @sql_qd1 = IF(@qd1=0, 'ALTER TABLE quotation_disciplines ADD COLUMN labour_hours DECIMAL(10,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd1 FROM @sql_qd1; EXECUTE sqd1; DEALLOCATE PREPARE sqd1;

SET @qd2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='labour_rate');
SET @sql_qd2 = IF(@qd2=0, 'ALTER TABLE quotation_disciplines ADD COLUMN labour_rate DECIMAL(15,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd2 FROM @sql_qd2; EXECUTE sqd2; DEALLOCATE PREPARE sqd2;

SET @qd3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='labour_cost');
SET @sql_qd3 = IF(@qd3=0, 'ALTER TABLE quotation_disciplines ADD COLUMN labour_cost DECIMAL(15,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd3 FROM @sql_qd3; EXECUTE sqd3; DEALLOCATE PREPARE sqd3;

SET @qd4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='material_quantity');
SET @sql_qd4 = IF(@qd4=0, 'ALTER TABLE quotation_disciplines ADD COLUMN material_quantity DECIMAL(12,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd4 FROM @sql_qd4; EXECUTE sqd4; DEALLOCATE PREPARE sqd4;

SET @qd5 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='material_rate');
SET @sql_qd5 = IF(@qd5=0, 'ALTER TABLE quotation_disciplines ADD COLUMN material_rate DECIMAL(15,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd5 FROM @sql_qd5; EXECUTE sqd5; DEALLOCATE PREPARE sqd5;

SET @qd6 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='material_cost');
SET @sql_qd6 = IF(@qd6=0, 'ALTER TABLE quotation_disciplines ADD COLUMN material_cost DECIMAL(15,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd6 FROM @sql_qd6; EXECUTE sqd6; DEALLOCATE PREPARE sqd6;

SET @qd7 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='wbs_template_id');
SET @sql_qd7 = IF(@qd7=0, 'ALTER TABLE quotation_disciplines ADD COLUMN wbs_template_id INT NULL', 'SELECT 1');
PREPARE sqd7 FROM @sql_qd7; EXECUTE sqd7; DEALLOCATE PREPARE sqd7;

SET @qd8 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotation_disciplines' AND COLUMN_NAME='planned_hours');
SET @sql_qd8 = IF(@qd8=0, 'ALTER TABLE quotation_disciplines ADD COLUMN planned_hours DECIMAL(10,2) DEFAULT 0', 'SELECT 1');
PREPARE sqd8 FROM @sql_qd8; EXECUTE sqd8; DEALLOCATE PREPARE sqd8;

-- 7. Alter project_wbs to support 'both' type + remaining/extra hours
ALTER TABLE project_wbs
  MODIFY COLUMN wbs_type ENUM('labour','material','both') NOT NULL DEFAULT 'labour';

SET @pw1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='project_wbs' AND COLUMN_NAME='wbs_template_id');
SET @sql_pw1 = IF(@pw1=0, 'ALTER TABLE project_wbs ADD COLUMN wbs_template_id INT NULL AFTER wbs_id', 'SELECT 1');
PREPARE spw1 FROM @sql_pw1; EXECUTE spw1; DEALLOCATE PREPARE spw1;

SET @pw2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='project_wbs' AND COLUMN_NAME='actual_quantity');
SET @sql_pw2 = IF(@pw2=0, 'ALTER TABLE project_wbs ADD COLUMN actual_quantity DECIMAL(12,2) DEFAULT 0 AFTER planned_quantity', 'SELECT 1');
PREPARE spw2 FROM @sql_pw2; EXECUTE spw2; DEALLOCATE PREPARE spw2;

SET @pw3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='project_wbs' AND COLUMN_NAME='remaining_hours');
SET @sql_pw3 = IF(@pw3=0, 'ALTER TABLE project_wbs ADD COLUMN remaining_hours DECIMAL(10,2) DEFAULT 0', 'SELECT 1');
PREPARE spw3 FROM @sql_pw3; EXECUTE spw3; DEALLOCATE PREPARE spw3;

SET @pw4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='project_wbs' AND COLUMN_NAME='extra_hours');
SET @sql_pw4 = IF(@pw4=0, 'ALTER TABLE project_wbs ADD COLUMN extra_hours DECIMAL(10,2) DEFAULT 0', 'SELECT 1');
PREPARE spw4 FROM @sql_pw4; EXECUTE spw4; DEALLOCATE PREPARE spw4;

-- 8. Add labour_category to labours table
ALTER TABLE labours
  MODIFY COLUMN labour_type ENUM('contractor','direct_labour','temporary') NOT NULL DEFAULT 'direct_labour';

SET @l1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='labours' AND COLUMN_NAME='labour_category');
SET @sql_l1 = IF(@l1=0, "ALTER TABLE labours ADD COLUMN labour_category ENUM('employee','contract','temporary') DEFAULT 'contract'", 'SELECT 1');
PREPARE sl1 FROM @sql_l1; EXECUTE sl1; DEALLOCATE PREPARE sl1;

SET @l2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='labours' AND COLUMN_NAME='monthly_salary');
SET @sql_l2 = IF(@l2=0, 'ALTER TABLE labours ADD COLUMN monthly_salary DECIMAL(12,2) DEFAULT NULL', 'SELECT 1');
PREPARE sl2 FROM @sql_l2; EXECUTE sl2; DEALLOCATE PREPARE sl2;

SET @l3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='labours' AND COLUMN_NAME='project_rate');
SET @sql_l3 = IF(@l3=0, 'ALTER TABLE labours ADD COLUMN project_rate DECIMAL(12,2) DEFAULT NULL', 'SELECT 1');
PREPARE sl3 FROM @sql_l3; EXECUTE sl3; DEALLOCATE PREPARE sl3;

SET @l4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='labours' AND COLUMN_NAME='hourly_rate');
SET @sql_l4 = IF(@l4=0, 'ALTER TABLE labours ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT NULL', 'SELECT 1');
PREPARE sl4 FROM @sql_l4; EXECUTE sl4; DEALLOCATE PREPARE sl4;

-- 9. Add missing columns to tasks
SET @t1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tasks' AND COLUMN_NAME='wbs_template_id');
SET @sql_t1 = IF(@t1=0, 'ALTER TABLE tasks ADD COLUMN wbs_template_id INT NULL', 'SELECT 1');
PREPARE st1 FROM @sql_t1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- 10. Add project_type_id index to projects
ALTER TABLE projects ADD INDEX IF NOT EXISTS idx_proj_type (project_type_id);

SELECT 'Migration completed successfully.' AS result;
