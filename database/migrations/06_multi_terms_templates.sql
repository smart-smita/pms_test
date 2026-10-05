-- Migration: 06_multi_terms_templates.sql
-- Description: Multi-template Terms & Conditions support for quotations and projects

ALTER TABLE quotation_terms_snapshots 
  ADD COLUMN IF NOT EXISTS template_id INT NULL AFTER quotation_id,
  ADD COLUMN IF NOT EXISTS template_name VARCHAR(255) NULL AFTER template_id;

CREATE TABLE IF NOT EXISTS quotation_terms_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  template_id INT NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quotation_template (quotation_id, template_id),
  INDEX idx_quotation_id (quotation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_terms_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  template_id INT NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_project_template (project_id, template_id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_terms_snapshots (
  snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  template_id INT NULL,
  template_name VARCHAR(255) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT NULL,
  ADD COLUMN IF NOT EXISTS quotation_reference VARCHAR(50) NULL;

