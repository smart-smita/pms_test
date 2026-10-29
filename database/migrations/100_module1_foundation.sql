-- Migration 100: Module 1 Foundation — Number Series, Measurement Units, Audit Log Extension, Roles & Permissions
-- Forward-only, idempotent migration

-- 1. Number Series Table
CREATE TABLE IF NOT EXISTS number_series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_code VARCHAR(50) NOT NULL UNIQUE,
  prefix VARCHAR(20) NOT NULL,
  suffix VARCHAR(20) NULL,
  next_number INT NOT NULL DEFAULT 1,
  padding INT NOT NULL DEFAULT 4,
  fiscal_year_enabled TINYINT(1) DEFAULT 1,
  delimiter_char VARCHAR(5) DEFAULT '/',
  description VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default number series if empty
INSERT IGNORE INTO number_series (series_code, prefix, next_number, padding, fiscal_year_enabled, delimiter_char, description) VALUES
('QUOTATION', 'QUO', 1, 4, 1, '/', 'Customer Quotation / Cost Sheet Series'),
('INVOICE', 'DEM', 1, 4, 1, '/', 'Customer Demand / Tax Invoice Series'),
('RECEIPT', 'RCP', 1, 4, 1, '/', 'Customer Receipt Voucher Series'),
('PURCHASE_ORDER', 'PO', 1, 4, 1, '/', 'Material Purchase Order Series'),
('GRN', 'GRN', 1, 4, 1, '/', 'Goods Receipt Note Series'),
('WORK_ORDER', 'WO', 1, 4, 1, '/', 'Contractor Work Order Series'),
('SITE_SURVEY', 'SURV', 1, 4, 1, '/', 'Site Survey Measurement Series'),
('PROJECT', 'PRJ', 1, 4, 1, '/', 'Project Code Series');

-- 2. Measurement Units Master Table
CREATE TABLE IF NOT EXISTS measurement_units (
  unit_id INT AUTO_INCREMENT PRIMARY KEY,
  unit_code VARCHAR(20) NOT NULL UNIQUE,
  unit_name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_decimal_allowed TINYINT(1) DEFAULT 1,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed standard construction measurement units
INSERT IGNORE INTO measurement_units (unit_code, unit_name, symbol, is_decimal_allowed) VALUES
('NOS', 'Numbers / Pieces', 'Nos', 0),
('SQFT', 'Square Feet', 'sq.ft', 1),
('SQM', 'Square Meters', 'sq.m', 1),
('CUM', 'Cubic Meters', 'cu.m', 1),
('CFT', 'Cubic Feet', 'cu.ft', 1),
('BRASS', 'Brass (100 cu.ft)', 'brass', 1),
('MT', 'Metric Ton', 'MT', 1),
('KG', 'Kilogram', 'kg', 1),
('BAG', 'Cement Bag (50kg)', 'bag', 0),
('LTR', 'Litre', 'ltr', 1),
('HRS', 'Hours', 'hrs', 1),
('DAYS', 'Days', 'days', 1),
('MONTHS', 'Months', 'months', 1),
('LS', 'Lump Sum', 'LS', 0);

-- 3. Extend audit_logs table with old_value and new_value for financial tracking
SET @exist_old = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'audit_logs' AND column_name = 'old_value');
SET @sql_old = IF(@exist_old = 0, 'ALTER TABLE audit_logs ADD COLUMN old_value LONGTEXT NULL AFTER description', 'SELECT 1');
PREPARE stmt_old FROM @sql_old;
EXECUTE stmt_old;
DEALLOCATE PREPARE stmt_old;

SET @exist_new = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'audit_logs' AND column_name = 'new_value');
SET @sql_new = IF(@exist_new = 0, 'ALTER TABLE audit_logs ADD COLUMN new_value LONGTEXT NULL AFTER old_value', 'SELECT 1');
PREPARE stmt_new FROM @sql_new;
EXECUTE stmt_new;
DEALLOCATE PREPARE stmt_new;

-- 4. Extend entity_documents table with all PMS entity types
ALTER TABLE entity_documents MODIFY COLUMN entity_type ENUM(
  'employee','labour','project','quotation','discipline',
  'customer','vendor','invoice','receipt','contractor','equipment','site_survey'
) DEFAULT 'project';

-- 5. Extend vendors table with vendor_type and pan_number
SET @exist_vt = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'vendors' AND column_name = 'vendor_type');
SET @sql_vt = IF(@exist_vt = 0, "ALTER TABLE vendors ADD COLUMN vendor_type ENUM('material', 'equipment', 'contractor', 'general') DEFAULT 'material' AFTER vendor_name", 'SELECT 1');
PREPARE stmt_vt FROM @sql_vt;
EXECUTE stmt_vt;
DEALLOCATE PREPARE stmt_vt;

SET @exist_pan = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'vendors' AND column_name = 'pan_number');
SET @sql_pan = IF(@exist_pan = 0, "ALTER TABLE vendors ADD COLUMN pan_number VARCHAR(20) NULL AFTER gst_number", 'SELECT 1');
PREPARE stmt_pan FROM @sql_pan;
EXECUTE stmt_pan;
DEALLOCATE PREPARE stmt_pan;

-- 6. Seed Required Core Roles
INSERT IGNORE INTO roles (role_name) VALUES
('Project Manager'),
('Site Engineer'),
('Store Keeper'),
('Accounts Manager'),
('Customer Portal');

-- 7. Seed Granular Permissions for Foundation Masters
INSERT IGNORE INTO permissions (module, action) VALUES
('number_series', 'view'),
('number_series', 'manage'),
('units', 'view'),
('units', 'manage'),
('equipment', 'view'),
('equipment', 'create'),
('equipment', 'update'),
('equipment', 'delete'),
('equipment', 'log_usage'),
('contractors', 'view'),
('contractors', 'create'),
('contractors', 'update'),
('contractors', 'delete'),
('cash_control', 'view'),
('cash_control', 'override');

-- Grant all permissions to Admin and Super Admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name IN ('Admin', 'Super Admin');
