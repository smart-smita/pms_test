-- Migration 099: Multi-Customer, Cost Sheet, Milestone Payment Schedules, Receipt Vouchers, Equipment and Cash Control Foundation
-- Forward-only, idempotent migration

-- 1. Project Customers (Multi-Entity & Co-Applicant Relationship)
CREATE TABLE IF NOT EXISTS project_customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  customer_id INT NOT NULL,
  unit_number VARCHAR(50) NULL,
  allocated_area_sqft DECIMAL(10,2) DEFAULT 0.00,
  ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
  split_rule ENUM('percentage', 'area_ratio', 'fixed_amount', 'custom_wbs') DEFAULT 'percentage',
  agreement_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  is_primary_billing_contact TINYINT(1) DEFAULT 1,
  status ENUM('active', 'transferred', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proj_cust_unit (project_id, customer_id, unit_number),
  INDEX idx_pc_customer (customer_id),
  INDEX idx_pc_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customer Co-Applicants
CREATE TABLE IF NOT EXISTS customer_co_applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_customer_id INT NOT NULL,
  co_applicant_name VARCHAR(150) NOT NULL,
  pan_number VARCHAR(20) NULL,
  aadhar_number VARCHAR(20) NULL,
  contact_number VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  relationship VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cca_proj_cust (project_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Quotation Cost Sheets (Reference Format: Basic Value, Development Charges, AV, Stamp Duty, Reg, GST)
CREATE TABLE IF NOT EXISTS quotation_cost_sheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  basic_construction_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  development_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  agreement_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  stamp_duty_percentage DECIMAL(5,2) DEFAULT 6.00,
  stamp_duty_amount DECIMAL(15,2) DEFAULT 0.00,
  registration_fee DECIMAL(15,2) DEFAULT 30000.00,
  gst_rate_percentage DECIMAL(5,2) DEFAULT 12.00,
  land_abatement_fraction DECIMAL(5,4) DEFAULT 0.3333,
  effective_gst_rate DECIMAL(5,2) DEFAULT 8.00,
  gst_amount DECIMAL(15,2) DEFAULT 0.00,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_qcs_quotation (quotation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Customer Milestone Payment Schedules (Linked to WBS & Incremental %)
CREATE TABLE IF NOT EXISTS customer_payment_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_customer_id INT NOT NULL,
  project_wbs_id INT NULL,
  milestone_name VARCHAR(150) NOT NULL,
  milestone_percentage DECIMAL(5,2) NOT NULL,
  trigger_progress_percentage DECIMAL(5,2) NOT NULL,
  installment_amount DECIMAL(15,2) NOT NULL,
  gst_amount DECIMAL(15,2) NOT NULL,
  tds_deductible_amount DECIMAL(15,2) DEFAULT 0.00,
  net_receivable_amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'ready_to_bill', 'billed', 'paid') DEFAULT 'pending',
  sort_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cps_proj_cust (project_customer_id),
  INDEX idx_cps_wbs (project_wbs_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Customer Receipt Vouchers (Towards Agreement Value + GST Split, Cheque/UTR, Bank, Words)
CREATE TABLE IF NOT EXISTS customer_receipt_vouchers (
  receipt_id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_id INT NOT NULL,
  project_customer_id INT NOT NULL,
  receipt_date DATE NOT NULL,
  payment_mode ENUM('cheque', 'neft_rtgs', 'upi', 'demand_draft') NOT NULL,
  instrument_reference VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  amount_towards_av DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  amount_towards_gst DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_amount_received DECIMAL(15,2) NOT NULL,
  amount_in_words TEXT NOT NULL,
  clearance_status ENUM('pending_clearance', 'realised', 'bounced') DEFAULT 'realised',
  realisation_date DATE NULL,
  authorised_signatory_id INT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crv_invoice (invoice_id),
  INDEX idx_crv_proj_cust (project_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Customer Section 194-IA TDS Credits
CREATE TABLE IF NOT EXISTS customer_tds_credits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  project_customer_id INT NOT NULL,
  tds_amount DECIMAL(15,2) NOT NULL,
  challan_bsr_code VARCHAR(50) NULL,
  challan_date DATE NULL,
  form_16b_ack_no VARCHAR(100) NULL,
  status ENUM('claimed_by_customer', 'verified_on_26as', 'rejected') DEFAULT 'claimed_by_customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ctc_invoice (invoice_id),
  INDEX idx_ctc_proj_cust (project_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Equipment Master (Own & Rented Assets)
CREATE TABLE IF NOT EXISTS equipment_master (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_code VARCHAR(50) NOT NULL UNIQUE,
  equipment_name VARCHAR(100) NOT NULL,
  ownership_type ENUM('own', 'rented') NOT NULL,
  vendor_id INT NULL,
  internal_hourly_rate DECIMAL(10,2) DEFAULT 0.00,
  rental_rate_unit ENUM('hour', 'day', 'month') NULL,
  rental_rate DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('available', 'deployed', 'breakdown', 'off_hired') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eq_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Equipment Usage Logs (Site Hour Meters & Fuel Allocation)
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  project_id INT NOT NULL,
  project_wbs_id INT NOT NULL,
  task_id INT NULL,
  log_date DATE NOT NULL,
  start_meter_hours DECIMAL(10,2) NOT NULL,
  end_meter_hours DECIMAL(10,2) NOT NULL,
  fuel_litres_consumed DECIMAL(10,2) DEFAULT 0.00,
  charged_rate DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  verified_by INT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eul_equipment (equipment_id),
  INDEX idx_eul_project (project_id),
  INDEX idx_eul_wbs (project_wbs_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Cash Deficit Overdraft Overrides
CREATE TABLE IF NOT EXISTS project_cash_overdraft_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  attempted_transaction_type ENUM('purchase_order', 'vendor_payment', 'contractor_bill', 'labour_payout') NOT NULL,
  transaction_reference_id INT NOT NULL,
  attempted_amount DECIMAL(15,2) NOT NULL,
  current_cash_inflow DECIMAL(15,2) NOT NULL,
  current_cash_outflow DECIMAL(15,2) NOT NULL,
  deficit_amount DECIMAL(15,2) NOT NULL,
  authorized_by INT NOT NULL,
  override_reason TEXT NOT NULL,
  authorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pcoo_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Backward Compatibility Backfill: Map existing projects to project_customers
INSERT IGNORE INTO project_customers (project_id, customer_id, unit_number, agreement_value, ownership_percentage)
SELECT 
  p.project_id, 
  p.customer_id, 
  COALESCE(p.project_code, CONCAT('UNIT-', p.project_id)), 
  COALESCE(p.budget_amount, 0.00), 
  100.00
FROM projects p
WHERE p.customer_id IS NOT NULL 
  AND p.customer_id > 0
  AND (p.is_deleted = 0 OR p.is_deleted IS NULL);
