-- Migration for WBS Template Tree Structure
-- Removes execution/planning fields from template details
-- Adds parent_id, wbs_name, and wbs_code for hierarchy

ALTER TABLE wbs_template_details
  DROP COLUMN wbs_type,
  DROP COLUMN planned_hours,
  DROP COLUMN planned_quantity,
  DROP COLUMN unit,
  DROP COLUMN rate,
  DROP COLUMN planned_cost;

ALTER TABLE wbs_template_details
  ADD COLUMN parent_id int(11) DEFAULT NULL AFTER template_id,
  ADD COLUMN wbs_name varchar(255) DEFAULT NULL AFTER wbs_id,
  ADD COLUMN wbs_code varchar(100) DEFAULT NULL AFTER wbs_name,
  MODIFY COLUMN wbs_id int(11) NULL;

ALTER TABLE wbs_template_details
  ADD CONSTRAINT fk_wbs_template_parent 
  FOREIGN KEY (parent_id) REFERENCES wbs_template_details(id) ON DELETE CASCADE;
