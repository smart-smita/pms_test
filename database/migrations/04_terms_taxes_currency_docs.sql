-- ============================================================
-- Migration 04: Terms & Conditions, Multiple Taxes, Currency, and Document Enhancements
-- Safe, additive migrations only.
-- ============================================================

-- 1. Add description to terms_templates if missing
SET @col_tt_desc = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'terms_templates' AND COLUMN_NAME = 'description');
SET @sql_tt_desc = IF(@col_tt_desc = 0, 'ALTER TABLE terms_templates ADD COLUMN description TEXT NULL AFTER template_name', 'SELECT 1');
PREPARE stmt_tt_desc FROM @sql_tt_desc; EXECUTE stmt_tt_desc; DEALLOCATE PREPARE stmt_tt_desc;

-- 2. Add is_mandatory to quotation_terms_template_items if missing
SET @col_qtti_mand = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotation_terms_template_items' AND COLUMN_NAME = 'is_mandatory');
SET @sql_qtti_mand = IF(@col_qtti_mand = 0, 'ALTER TABLE quotation_terms_template_items ADD COLUMN is_mandatory TINYINT(1) NOT NULL DEFAULT 0 AFTER description', 'SELECT 1');
PREPARE stmt_qtti_mand FROM @sql_qtti_mand; EXECUTE stmt_qtti_mand; DEALLOCATE PREPARE stmt_qtti_mand;

-- 3. Add is_mandatory to quotation_terms_snapshots if missing
SET @col_qts_mand = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotation_terms_snapshots' AND COLUMN_NAME = 'is_mandatory');
SET @sql_qts_mand = IF(@col_qts_mand = 0, 'ALTER TABLE quotation_terms_snapshots ADD COLUMN is_mandatory TINYINT(1) NOT NULL DEFAULT 0 AFTER description', 'SELECT 1');
PREPARE stmt_qts_mand FROM @sql_qts_mand; EXECUTE stmt_qts_mand; DEALLOCATE PREPARE stmt_qts_mand;

-- 4. Add currency_id and exchange_rate to quotations if missing
SET @col_q_curr = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotations' AND COLUMN_NAME = 'currency_id');
SET @sql_q_curr = IF(@col_q_curr = 0, 'ALTER TABLE quotations ADD COLUMN currency_id INT NULL AFTER project_id', 'SELECT 1');
PREPARE stmt_q_curr FROM @sql_q_curr; EXECUTE stmt_q_curr; DEALLOCATE PREPARE stmt_q_curr;

SET @col_q_rate = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotations' AND COLUMN_NAME = 'exchange_rate');
SET @sql_q_rate = IF(@col_q_rate = 0, 'ALTER TABLE quotations ADD COLUMN exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000 AFTER currency_id', 'SELECT 1');
PREPARE stmt_q_rate FROM @sql_q_rate; EXECUTE stmt_q_rate; DEALLOCATE PREPARE stmt_q_rate;

-- 5. Add exchange_rate to projects if missing
SET @col_p_rate = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'exchange_rate');
SET @sql_p_rate = IF(@col_p_rate = 0, 'ALTER TABLE projects ADD COLUMN exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000 AFTER currency_id', 'SELECT 1');
PREPARE stmt_p_rate FROM @sql_p_rate; EXECUTE stmt_p_rate; DEALLOCATE PREPARE stmt_p_rate;

-- 6. Add country_id and decimal_places to currencies if missing
SET @col_c_country = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'currencies' AND COLUMN_NAME = 'country_id');
SET @sql_c_country = IF(@col_c_country = 0, 'ALTER TABLE currencies ADD COLUMN country_id INT NULL AFTER currency_name', 'SELECT 1');
PREPARE stmt_c_country FROM @sql_c_country; EXECUTE stmt_c_country; DEALLOCATE PREPARE stmt_c_country;

SET @col_c_dp = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'currencies' AND COLUMN_NAME = 'decimal_places');
SET @sql_c_dp = IF(@col_c_dp = 0, 'ALTER TABLE currencies ADD COLUMN decimal_places INT NOT NULL DEFAULT 2 AFTER exchange_rate', 'SELECT 1');
PREPARE stmt_c_dp FROM @sql_c_dp; EXECUTE stmt_c_dp; DEALLOCATE PREPARE stmt_c_dp;

-- 7. Create quotation_taxes table for multi-tax support
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
  KEY idx_qt_quote (quotation_id),
  KEY idx_qt_tax (tax_id),
  CONSTRAINT fk_qt_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
  CONSTRAINT fk_qt_tax FOREIGN KEY (tax_id) REFERENCES taxes(tax_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Create project_taxes table for carrying multiple taxes to project
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
  KEY idx_pt_project (project_id),
  KEY idx_pt_tax (tax_id),
  CONSTRAINT fk_pt_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tax FOREIGN KEY (tax_id) REFERENCES taxes(tax_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Seed common currencies if missing
INSERT IGNORE INTO currencies (currency_code, currency_name, symbol, exchange_rate, is_base, status)
VALUES 
  ('INR', 'Indian Rupee', '₹', 1.000000, 1, 1),
  ('AED', 'UAE Dirham', 'AED', 0.044000, 0, 1),
  ('USD', 'US Dollar', '$', 0.012000, 0, 1),
  ('EUR', 'Euro', '€', 0.011000, 0, 1),
  ('GBP', 'British Pound', '£', 0.009500, 0, 1);

-- 10. Seed common taxes if missing
INSERT IGNORE INTO taxes (tax_name, tax_code, tax_type, tax_percentage, status, is_split, cgst_percentage, sgst_percentage)
VALUES
  ('GST 18%', 'GST-18', 'GST', 18.00, 1, 0, 0.00, 0.00),
  ('CGST 9%', 'CGST-9', 'CGST_SGST', 9.00, 1, 0, 9.00, 0.00),
  ('SGST 9%', 'SGST-9', 'CGST_SGST', 9.00, 1, 0, 0.00, 9.00),
  ('IGST 18%', 'IGST-18', 'IGST', 18.00, 1, 0, 0.00, 0.00),
  ('VAT 5%', 'VAT-5', 'VAT', 5.00, 1, 0, 0.00, 0.00),
  ('VAT 10%', 'VAT-10', 'VAT', 10.00, 1, 0, 0.00, 0.00);

-- Backfill default INR currency to existing quotations and projects where currency_id is NULL
UPDATE quotations q
JOIN currencies c ON c.currency_code = 'INR'
SET q.currency_id = c.currency_id, q.exchange_rate = 1.000000
WHERE q.currency_id IS NULL;

UPDATE projects p
JOIN currencies c ON c.currency_code = 'INR'
SET p.currency_id = c.currency_id, p.exchange_rate = 1.000000
WHERE p.currency_id IS NULL;
