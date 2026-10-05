-- Migration: 05_add_new_project_name.sql
-- Description: Add new_project_name column to quotations table for project name proposal

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS new_project_name VARCHAR(255) NULL AFTER project_id;
