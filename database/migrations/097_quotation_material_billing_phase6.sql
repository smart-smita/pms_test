-- ============================================================================
-- Migration 097: Phase 6 — Quotation Material Billing, Billed Qty Tracking,
-- Immutable Invoices, Credit Notes & Revision Flow
-- ============================================================================

-- 1. Add billed_qty tracker to stock_ledger
SET @exist_billed_qty := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stock_ledger' 
    AND COLUMN_NAME = 'billed_qty'
);

SET @sql := IF(@exist_billed_qty = 0,
  'ALTER TABLE stock_ledger ADD COLUMN billed_qty DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER qty_out',
  'SELECT "Column billed_qty already exists on stock_ledger"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- 2. Add tracking & procurement cost separation columns to invoice_items
SET @exist_qwm_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'invoice_items' 
    AND COLUMN_NAME = 'quotation_wbs_material_id'
);

SET @sql := IF(@exist_qwm_id = 0,
  'ALTER TABLE invoice_items 
     ADD COLUMN quotation_wbs_material_id INT NULL AFTER task_id,
     ADD COLUMN project_material_id INT NULL AFTER quotation_wbs_material_id,
     ADD COLUMN consumption_log_id INT NULL AFTER project_material_id,
     ADD COLUMN cost_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER rate,
     ADD COLUMN cost_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER amount,
     ADD CONSTRAINT fk_inv_item_qwm FOREIGN KEY (quotation_wbs_material_id) REFERENCES quotation_wbs_material(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_inv_item_pm FOREIGN KEY (project_material_id) REFERENCES project_materials(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_inv_item_cons_log FOREIGN KEY (consumption_log_id) REFERENCES stock_ledger(ledger_id) ON DELETE SET NULL',
  'SELECT "Tracking columns already exist on invoice_items"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- 3. Add invoice_type, revision and credit note fields to invoices table
SET @exist_inv_type := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'invoices' 
    AND COLUMN_NAME = 'invoice_type'
);

SET @sql := IF(@exist_inv_type = 0,
  'ALTER TABLE invoices ADD COLUMN invoice_type ENUM(\'combined\', \'labour\', \'material\', \'credit_note\') NOT NULL DEFAULT \'combined\' AFTER total_amount',
  'SELECT "Column invoice_type already exists on invoices"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_orig_inv := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'invoices' 
    AND COLUMN_NAME = 'original_invoice_id'
);

SET @sql := IF(@exist_orig_inv = 0,
  'ALTER TABLE invoices 
     ADD COLUMN original_invoice_id INT NULL AFTER project_id,
     ADD COLUMN is_credit_note TINYINT(1) NOT NULL DEFAULT 0 AFTER invoice_type,
     ADD COLUMN revision_number INT NOT NULL DEFAULT 0 AFTER is_credit_note,
     ADD COLUMN credit_note_reason TEXT NULL AFTER revision_number,
     ADD COLUMN billed_by INT NULL AFTER approved_by,
     ADD CONSTRAINT fk_invoices_original FOREIGN KEY (original_invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL',
  'SELECT "Revision/Credit Note columns already exist on invoices"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- 4. Create invoice_item_sources table for granular traceability & double-billing prevention
CREATE TABLE IF NOT EXISTS invoice_item_sources (
  source_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  invoice_item_id INT NOT NULL,
  source_type ENUM('material_consumption', 'labour_work_log') NOT NULL,
  consumption_log_id INT NULL,
  labour_work_log_id INT NULL,
  project_material_id INT NULL,
  quotation_wbs_material_id INT NULL,
  project_wbs_id INT NULL,
  task_id INT NULL,
  billed_qty DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  billing_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  billed_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cost_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cost_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_iis_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  CONSTRAINT fk_iis_item FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(item_id) ON DELETE CASCADE,
  CONSTRAINT fk_iis_cons_log FOREIGN KEY (consumption_log_id) REFERENCES stock_ledger(ledger_id) ON DELETE SET NULL,
  CONSTRAINT fk_iis_qwm FOREIGN KEY (quotation_wbs_material_id) REFERENCES quotation_wbs_material(id) ON DELETE SET NULL,
  CONSTRAINT fk_iis_pm FOREIGN KEY (project_material_id) REFERENCES project_materials(id) ON DELETE SET NULL,
  CONSTRAINT fk_iis_pw FOREIGN KEY (project_wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
  CONSTRAINT fk_iis_task FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL,
  INDEX idx_iis_cons_log (consumption_log_id),
  INDEX idx_iis_labour_log (labour_work_log_id),
  INDEX idx_iis_inv_item (invoice_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
