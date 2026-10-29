-- Migration: 103_photographic_report_metadata.sql
-- Description: Add Photographic Report metadata fields to site_surveys table (Report No, Period, Signatories, Doc Control)

SET @dbname = DATABASE();

-- 1. report_number
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'report_number'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN report_number VARCHAR(50) NULL AFTER survey_code', 'SELECT "Column report_number already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. period_from
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'period_from'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN period_from DATE NULL AFTER survey_date', 'SELECT "Column period_from already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. period_to
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'period_to'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN period_to DATE NULL AFTER period_from', 'SELECT "Column period_to already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. prepared_by_name
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'prepared_by_name'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN prepared_by_name VARCHAR(150) NULL AFTER conducted_by', 'SELECT "Column prepared_by_name already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. verified_by_name
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'verified_by_name'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN verified_by_name VARCHAR(150) NULL AFTER prepared_by_name', 'SELECT "Column verified_by_name already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. endorsed_by_name
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'endorsed_by_name'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN endorsed_by_name VARCHAR(150) NULL AFTER verified_by_name', 'SELECT "Column endorsed_by_name already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. document_number
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'document_number'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN document_number VARCHAR(50) DEFAULT "PLN-03-F04" AFTER endorsed_by_name', 'SELECT "Column document_number already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. revision_number
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'revision_number'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN revision_number VARCHAR(20) DEFAULT "R1" AFTER document_number', 'SELECT "Column revision_number already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 9. cover_image_path
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_surveys' AND COLUMN_NAME = 'cover_image_path'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_surveys ADD COLUMN cover_image_path VARCHAR(255) NULL AFTER revision_number', 'SELECT "Column cover_image_path already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. photo_sequence in site_survey_photos
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'site_survey_photos' AND COLUMN_NAME = 'display_order'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE site_survey_photos ADD COLUMN display_order INT DEFAULT 1 AFTER caption', 'SELECT "Column display_order already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
