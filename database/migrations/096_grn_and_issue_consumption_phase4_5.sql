-- Migration 096: Phase 4 & Phase 5 - GRN Receiving, Posting, Reversals, Material Reservations, Issue, Consumption & Transfers
-- UP

-- 1. Extend goods_receipt_notes for Phase 4 GRN
SET @exist_store_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND COLUMN_NAME = 'store_id'
);
SET @sql_grn_store := IF(@exist_store_id = 0,
  'ALTER TABLE goods_receipt_notes ADD COLUMN store_id INT NOT NULL DEFAULT 1 AFTER store_location',
  'SELECT 1'
);
PREPARE stmt FROM @sql_grn_store; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_challan_date := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND COLUMN_NAME = 'challan_date'
);
SET @sql_challan_date := IF(@exist_challan_date = 0,
  'ALTER TABLE goods_receipt_notes ADD COLUMN challan_date DATE DEFAULT NULL AFTER delivery_challan_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql_challan_date; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_inv_date := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND COLUMN_NAME = 'invoice_date'
);
SET @sql_inv_date := IF(@exist_inv_date = 0,
  'ALTER TABLE goods_receipt_notes ADD COLUMN invoice_date DATE DEFAULT NULL AFTER invoice_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql_inv_date; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_attachments := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND COLUMN_NAME = 'attachments'
);
SET @sql_attachments := IF(@exist_attachments = 0,
  'ALTER TABLE goods_receipt_notes ADD COLUMN attachments JSON DEFAULT NULL AFTER remarks',
  'SELECT 1'
);
PREPARE stmt FROM @sql_attachments; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_rev_reason := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND COLUMN_NAME = 'reversal_reason'
);
SET @sql_rev_reason := IF(@exist_rev_reason = 0,
  'ALTER TABLE goods_receipt_notes ADD COLUMN reversal_reason TEXT DEFAULT NULL, ADD COLUMN reversed_by INT DEFAULT NULL, ADD COLUMN reversed_at DATETIME DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_rev_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Update status enum in goods_receipt_notes to include 'reversed'
ALTER TABLE goods_receipt_notes 
  MODIFY COLUMN status ENUM('draft', 'posted', 'cancelled', 'reversed') NOT NULL DEFAULT 'draft';

-- Foreign key for store_id in goods_receipt_notes
SET @fk_grn_store := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'goods_receipt_notes' AND CONSTRAINT_NAME = 'fk_grn_store'
);
SET @sql_fk_store := IF(@fk_grn_store = 0,
  'ALTER TABLE goods_receipt_notes ADD CONSTRAINT fk_grn_store FOREIGN KEY (store_id) REFERENCES stores(store_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_fk_store; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Extend grn_items with short_quantity
SET @exist_short_qty := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grn_items' AND COLUMN_NAME = 'short_quantity'
);
SET @sql_short_qty := IF(@exist_short_qty = 0,
  'ALTER TABLE grn_items ADD COLUMN short_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER damaged_quantity',
  'SELECT 1'
);
PREPARE stmt FROM @sql_short_qty; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Extend material_issues with consumed_quantity and returned_quantity
SET @exist_consumed_qty := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'material_issues' AND COLUMN_NAME = 'consumed_quantity'
);
SET @sql_consumed_qty := IF(@exist_consumed_qty = 0,
  'ALTER TABLE material_issues ADD COLUMN consumed_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER quantity, ADD COLUMN returned_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER consumed_quantity',
  'SELECT 1'
);
PREPARE stmt FROM @sql_consumed_qty; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Extend stock_ledger for transfer destinations
SET @exist_dest_store := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_ledger' AND COLUMN_NAME = 'dest_store_id'
);
SET @sql_dest_store := IF(@exist_dest_store = 0,
  'ALTER TABLE stock_ledger ADD COLUMN dest_store_id INT DEFAULT NULL AFTER store_id, ADD COLUMN dest_project_id INT DEFAULT NULL AFTER project_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql_dest_store; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Create material_reservations table
CREATE TABLE IF NOT EXISTS material_reservations (
  reservation_id  INT AUTO_INCREMENT PRIMARY KEY,
  project_id      INT NOT NULL,
  wbs_id          INT NOT NULL,
  task_id         INT DEFAULT NULL,
  material_id     INT NOT NULL,
  store_id        INT NOT NULL DEFAULT 1,
  reserved_qty    DECIMAL(12,2) NOT NULL,
  status          ENUM('active', 'issued', 'cancelled') NOT NULL DEFAULT 'active',
  created_by      INT DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mres_project  FOREIGN KEY (project_id)  REFERENCES projects(project_id) ON DELETE CASCADE,
  CONSTRAINT fk_mres_wbs      FOREIGN KEY (wbs_id)      REFERENCES project_wbs(id) ON DELETE CASCADE,
  CONSTRAINT fk_mres_task     FOREIGN KEY (task_id)     REFERENCES tasks(task_id) ON DELETE SET NULL,
  CONSTRAINT fk_mres_material FOREIGN KEY (material_id) REFERENCES materials(material_id),
  CONSTRAINT fk_mres_store    FOREIGN KEY (store_id)    REFERENCES stores(store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Seed Phase 4 & Phase 5 Permissions
INSERT IGNORE INTO permissions (module, action, permission_code) VALUES
  ('grn',             'reverse',  'grn_reverse'),
  ('material_issue',  'consume',  'material_issue_consume'),
  ('material_issue',  'transfer', 'material_issue_transfer'),
  ('vendor_invoices', 'view',     'vendor_invoices_view'),
  ('vendor_invoices', 'create',   'vendor_invoices_create'),
  ('vendor_invoices', 'update',   'vendor_invoices_update');

-- Assign to Admin (1) and Super Admin (4)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_id IN (1, 4)
  AND p.permission_code IN ('grn_reverse', 'material_issue_consume', 'material_issue_transfer', 'vendor_invoices_view', 'vendor_invoices_create', 'vendor_invoices_update');

-- Assign view permissions to Manager (2)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, p.id
FROM permissions p
WHERE p.permission_code IN ('vendor_invoices_view');

-- DOWN
