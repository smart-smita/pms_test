-- Migration 105: Allow NULL wbs_id on purchase_orders for general procurement
-- Forward-only, idempotent

ALTER TABLE purchase_orders MODIFY COLUMN wbs_id INT(11) NULL;
