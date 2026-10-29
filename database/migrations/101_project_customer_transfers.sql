-- Migration 101: Project Manager, Multi-Customer Transfers, and Invoice Allotment Linkage
-- Forward-only, idempotent migration

-- 1. Extend project_customers with transfer audit fields
SET @exist_trans_to = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'project_customers' AND column_name = 'transferred_to_id');
SET @sql_trans_to = IF(@exist_trans_to = 0, 'ALTER TABLE project_customers ADD COLUMN transferred_to_id INT NULL AFTER status', 'SELECT 1');
PREPARE stmt_trans_to FROM @sql_trans_to;
EXECUTE stmt_trans_to;
DEALLOCATE PREPARE stmt_trans_to;

SET @exist_trans_at = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'project_customers' AND column_name = 'transferred_at');
SET @sql_trans_at = IF(@exist_trans_at = 0, 'ALTER TABLE project_customers ADD COLUMN transferred_at TIMESTAMP NULL AFTER transferred_to_id', 'SELECT 1');
PREPARE stmt_trans_at FROM @sql_trans_at;
EXECUTE stmt_trans_at;
DEALLOCATE PREPARE stmt_trans_at;

SET @exist_trans_rs = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'project_customers' AND column_name = 'transfer_reason');
SET @sql_trans_rs = IF(@exist_trans_rs = 0, 'ALTER TABLE project_customers ADD COLUMN transfer_reason TEXT NULL AFTER transferred_at', 'SELECT 1');
PREPARE stmt_trans_rs FROM @sql_trans_rs;
EXECUTE stmt_trans_rs;
DEALLOCATE PREPARE stmt_trans_rs;

-- 2. Extend projects with project_manager_id and approved_quotation_value
SET @exist_pm = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'project_manager_id');
SET @sql_pm = IF(@exist_pm = 0, 'ALTER TABLE projects ADD COLUMN project_manager_id INT NULL AFTER client_code', 'SELECT 1');
PREPARE stmt_pm FROM @sql_pm;
EXECUTE stmt_pm;
DEALLOCATE PREPARE stmt_pm;

SET @exist_aqv = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'approved_quotation_value');
SET @sql_aqv = IF(@exist_aqv = 0, 'ALTER TABLE projects ADD COLUMN approved_quotation_value DECIMAL(15,2) DEFAULT 0.00 AFTER budget_amount', 'SELECT 1');
PREPARE stmt_aqv FROM @sql_aqv;
EXECUTE stmt_aqv;
DEALLOCATE PREPARE stmt_aqv;

-- 3. Extend invoices with project_customer_id
SET @exist_pcid = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'project_customer_id');
SET @sql_pcid = IF(@exist_pcid = 0, 'ALTER TABLE invoices ADD COLUMN project_customer_id INT NULL AFTER project_id', 'SELECT 1');
PREPARE stmt_pcid FROM @sql_pcid;
EXECUTE stmt_pcid;
DEALLOCATE PREPARE stmt_pcid;

-- 4. Backfill invoices.project_customer_id from project_customers
UPDATE invoices inv
JOIN project_customers pc ON inv.project_id = pc.project_id AND inv.customer_id = pc.customer_id
SET inv.project_customer_id = pc.id
WHERE inv.project_customer_id IS NULL;
