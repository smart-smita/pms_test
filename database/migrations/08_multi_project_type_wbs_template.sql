-- Migration: Multi-Project-Type WBS Template Hierarchy
-- Allows 1 WBS Template to contain MULTIPLE Project Types, each with its own WBS tree hierarchy.

-- 1. Modify wbs_templates table to allow project_type_id to be NULL (no longer single-select at template root)
ALTER TABLE wbs_templates MODIFY COLUMN project_type_id INT NULL;

-- 2. Create junction table for WBS Template <-> Project Types
CREATE TABLE IF NOT EXISTS wbs_template_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  project_type_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_template_project_type (template_id, project_type_id),
  KEY idx_wtpt_template (template_id),
  KEY idx_wtpt_project_type (project_type_id),
  CONSTRAINT fk_wtpt_template FOREIGN KEY (template_id) REFERENCES wbs_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_wtpt_project_type FOREIGN KEY (project_type_id) REFERENCES project_types(type_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add project_type_id to wbs_template_details if not exists
SET @col_pt = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbs_template_details' AND COLUMN_NAME = 'project_type_id');
SET @sql_pt = IF(@col_pt = 0, 'ALTER TABLE wbs_template_details ADD COLUMN project_type_id INT NULL AFTER template_id', 'SELECT 1');
PREPARE stmt_pt FROM @sql_pt;
EXECUTE stmt_pt;
DEALLOCATE PREPARE stmt_pt;

-- 4. Add parent_id to wbs_template_details if not exists
SET @col_pid = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbs_template_details' AND COLUMN_NAME = 'parent_id');
SET @sql_pid = IF(@col_pid = 0, 'ALTER TABLE wbs_template_details ADD COLUMN parent_id INT NULL AFTER project_type_id', 'SELECT 1');
PREPARE stmt_pid FROM @sql_pid;
EXECUTE stmt_pid;
DEALLOCATE PREPARE stmt_pid;

-- 5. Add wbs_name to wbs_template_details if not exists
SET @col_wn = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbs_template_details' AND COLUMN_NAME = 'wbs_name');
SET @sql_wn = IF(@col_wn = 0, 'ALTER TABLE wbs_template_details ADD COLUMN wbs_name VARCHAR(255) NULL AFTER wbs_id', 'SELECT 1');
PREPARE stmt_wn FROM @sql_wn;
EXECUTE stmt_wn;
DEALLOCATE PREPARE stmt_wn;

-- 6. Add wbs_code to wbs_template_details if not exists
SET @col_wc = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbs_template_details' AND COLUMN_NAME = 'wbs_code');
SET @sql_wc = IF(@col_wc = 0, 'ALTER TABLE wbs_template_details ADD COLUMN wbs_code VARCHAR(100) NULL AFTER wbs_name', 'SELECT 1');
PREPARE stmt_wc FROM @sql_wc;
EXECUTE stmt_wc;
DEALLOCATE PREPARE stmt_wc;

-- 7. Ensure wbs_id is nullable
ALTER TABLE wbs_template_details MODIFY COLUMN wbs_id INT NULL;

-- 8. Backfill wbs_template_project_types from existing wbs_templates
INSERT IGNORE INTO wbs_template_project_types (template_id, project_type_id, sort_order)
SELECT id, project_type_id, 0 
FROM wbs_templates 
WHERE project_type_id IS NOT NULL AND deleted_at IS NULL;

-- 9. Backfill wbs_template_details.project_type_id from wbs_templates
UPDATE wbs_template_details d
JOIN wbs_templates t ON d.template_id = t.id
SET d.project_type_id = t.project_type_id
WHERE d.project_type_id IS NULL AND t.project_type_id IS NOT NULL;
