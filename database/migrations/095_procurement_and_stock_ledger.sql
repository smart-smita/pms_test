-- Migration 095: Procurement Core, Stores, Stock Ledger, and Granular Permissions
-- UP

-- 1. Pre-migration cleanup: Remove orphan project_materials referencing nonexistent project_ids
DELETE FROM project_materials WHERE project_id NOT IN (SELECT project_id FROM projects);

-- 2. Convert transactional tables from MyISAM to InnoDB
ALTER TABLE audit_logs ENGINE=InnoDB;
ALTER TABLE permissions ENGINE=InnoDB;
ALTER TABLE role_permissions ENGINE=InnoDB;

-- 3. Create Stores table
CREATE TABLE IF NOT EXISTS stores (
  store_id      INT AUTO_INCREMENT PRIMARY KEY,
  store_code    VARCHAR(50) NOT NULL UNIQUE,
  store_name    VARCHAR(150) NOT NULL,
  project_id    INT DEFAULT NULL,
  location      VARCHAR(255) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default central store
INSERT INTO stores (store_id, store_code, store_name, location, is_active)
SELECT 1, 'MAIN-01', 'Main Central Store', 'Head Office / Central Warehouse', 1
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_id = 1);

-- 4. Create Material Store Balances Table (for atomic row-locking & high concurrency)
CREATE TABLE IF NOT EXISTS material_store_balances (
  material_id   INT NOT NULL,
  store_id      INT NOT NULL,
  on_hand_qty   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reserved_qty  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (material_id, store_id),
  CONSTRAINT fk_msb_material FOREIGN KEY (material_id) REFERENCES materials(material_id),
  CONSTRAINT fk_msb_store    FOREIGN KEY (store_id)    REFERENCES stores(store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Append-Only Stock Ledger Table
CREATE TABLE IF NOT EXISTS stock_ledger (
  ledger_id       INT AUTO_INCREMENT PRIMARY KEY,
  material_id     INT NOT NULL,
  store_id        INT NOT NULL,
  txn_type        ENUM(
                    'opening',
                    'grn_receipt',
                    'issue',
                    'consumption',
                    'return',
                    'transfer_out',
                    'transfer_in',
                    'adjustment',
                    'reversal',
                    'damage'
                  ) NOT NULL,
  qty_in          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  qty_out         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rate            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  txn_date        DATE NOT NULL,
  ref_type        VARCHAR(50) DEFAULT NULL,
  ref_id          INT DEFAULT NULL,
  project_id      INT DEFAULT NULL,
  wbs_id          INT DEFAULT NULL,
  task_id         INT DEFAULT NULL,
  reversal_of_id  INT DEFAULT NULL,
  remarks         TEXT DEFAULT NULL,
  created_by      INT DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sl_material FOREIGN KEY (material_id) REFERENCES materials(material_id),
  CONSTRAINT fk_sl_store    FOREIGN KEY (store_id)    REFERENCES stores(store_id),
  CONSTRAINT fk_sl_project  FOREIGN KEY (project_id)  REFERENCES projects(project_id) ON DELETE SET NULL,
  CONSTRAINT fk_sl_wbs      FOREIGN KEY (wbs_id)      REFERENCES project_wbs(id) ON DELETE SET NULL,
  CONSTRAINT fk_sl_task     FOREIGN KEY (task_id)     REFERENCES tasks(task_id) ON DELETE SET NULL,
  CONSTRAINT fk_sl_reversal FOREIGN KEY (reversal_of_id) REFERENCES stock_ledger(ledger_id),
  CONSTRAINT uq_stock_idempotency UNIQUE KEY (ref_type, ref_id, material_id, txn_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Ensure material_issues has store_id
SET @exist_store_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'material_issues' 
    AND COLUMN_NAME = 'store_id'
);
SET @alter_issues_sql := IF(
  @exist_store_col = 0,
  'ALTER TABLE material_issues ADD COLUMN store_id INT NOT NULL DEFAULT 1 AFTER issue_code, ADD CONSTRAINT fk_mi_store FOREIGN KEY (store_id) REFERENCES stores(store_id)',
  'SELECT 1'
);
PREPARE stmt FROM @alter_issues_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Seed Granular Permissions for Procurement Modules
INSERT IGNORE INTO permissions (module, action, permission_code) VALUES
  ('purchase_orders', 'view',     'purchase_orders_view'),
  ('purchase_orders', 'create',   'purchase_orders_create'),
  ('purchase_orders', 'update',   'purchase_orders_update'),
  ('purchase_orders', 'approve',  'purchase_orders_approve'),
  ('purchase_orders', 'override', 'purchase_orders_override'),
  ('grn',             'view',     'grn_view'),
  ('grn',             'create',   'grn_create'),
  ('grn',             'post',     'grn_post'),
  ('grn',             'cancel',   'grn_cancel'),
  ('stock',           'view',     'stock_view'),
  ('stock',           'adjust',   'stock_adjust'),
  ('material_issue',  'view',     'material_issue_view'),
  ('material_issue',  'create',   'material_issue_create'),
  ('material_issue',  'return',   'material_issue_return');

-- 8. Assign new permissions to Admin (role_id 1) and Super Admin (role_id 4)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_id IN (1, 4)
  AND p.module IN ('purchase_orders', 'grn', 'stock', 'material_issue');

-- Assign view permissions to Manager (role_id 2)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, p.id
FROM permissions p
WHERE p.module IN ('purchase_orders', 'grn', 'stock', 'material_issue')
  AND p.action IN ('view');

-- DOWN
