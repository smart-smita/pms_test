-- =====================================================================
-- Migration 102: Vendor & Company Configuration Masters
-- Forward-only, idempotent migration
-- =====================================================================

-- 1. Extend vendors table with bank details and credit terms if missing
SET @dbname = DATABASE();

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'bank_name'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE vendors ADD COLUMN bank_name VARCHAR(100) NULL AFTER address', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'account_number'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE vendors ADD COLUMN account_number VARCHAR(50) NULL AFTER bank_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'ifsc_code'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE vendors ADD COLUMN ifsc_code VARCHAR(30) NULL AFTER account_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'payment_terms_days'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE vendors ADD COLUMN payment_terms_days INT DEFAULT 30 AFTER ifsc_code', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Seed initial Company Settings into system_settings
INSERT INTO system_settings (setting_key, setting_value, setting_group, description, updated_by)
VALUES
  ('company_name', 'HTCO Infrastructure & Constructions', 'company_profile', 'Official Trading Brand Name', 1),
  ('legal_name', 'HTCO Infrastructure Private Limited', 'company_profile', 'Registered Corporate Name', 1),
  ('gst_number', '27AAACH1234F1Z5', 'company_profile', 'Statutory GSTIN Identification', 1),
  ('pan_number', 'AAACH1234F', 'company_profile', 'Corporate PAN Number', 1),
  ('cin_number', 'U45200MH2020PTC123456', 'company_profile', 'Corporate Identity Number (CIN)', 1),
  ('email', 'corporate@htco-construction.com', 'company_profile', 'Official Corporate Email', 1),
  ('phone', '+91 22 2876 5432', 'company_profile', 'Corporate Contact Number', 1),
  ('address', 'Plot 45, Commercial Business District, BKC', 'company_profile', 'Registered Office Address', 1),
  ('city', 'Mumbai', 'company_profile', 'City of Operation', 1),
  ('state', 'Maharashtra', 'company_profile', 'State of Operation', 1),
  ('pincode', '400051', 'company_profile', 'Postal Code', 1),
  ('country', 'India', 'company_profile', 'Country of Registration', 1),
  ('currency_code', 'INR', 'company_profile', 'Base Accounting Currency', 1),
  ('financial_year_start', '04-01', 'company_profile', 'Financial Year Start (MM-DD)', 1),
  ('date_format', 'DD/MM/YYYY', 'company_profile', 'Preferred System Display Date Format', 1),
  ('timezone', 'Asia/Kolkata', 'company_profile', 'Standard Timezone', 1)
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = CURRENT_TIMESTAMP;

-- 3. Register permissions for vendors and company settings if missing
INSERT IGNORE INTO permissions (module, action, permission_code) VALUES
  ('vendors', 'view', 'vendors_view'),
  ('vendors', 'create', 'vendors_create'),
  ('vendors', 'update', 'vendors_update'),
  ('vendors', 'delete', 'vendors_delete'),
  ('company_settings', 'view', 'company_settings_view'),
  ('company_settings', 'manage', 'company_settings_manage');

-- Grant permissions to Admin role (role_id = 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE module IN ('vendors', 'company_settings');
