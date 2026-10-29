-- Migration 104: Allow NULL quotation_id on invoices for ad-hoc billing
-- Forward-only, idempotent

ALTER TABLE invoices MODIFY COLUMN quotation_id INT(11) NULL;
