-- Migration 098: Global Work Category Configuration
-- Creates system_settings table and seeds the work_category setting

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
  description VARCHAR(255) NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
VALUES ('work_category', 'both', 'project_configuration', 'Global Work Category: material, labour, or both')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

