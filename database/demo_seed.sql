SET FOREIGN_KEY_CHECKS = 0;

-- Clear Transactional & Demo Data
TRUNCATE TABLE `vendor_payments`;
TRUNCATE TABLE `vendor_invoices`;
TRUNCATE TABLE `material_issues`;
TRUNCATE TABLE `grn_items`;
TRUNCATE TABLE `goods_receipt_notes`;
TRUNCATE TABLE `purchase_order_items`;
TRUNCATE TABLE `purchase_orders`;
TRUNCATE TABLE `material_indent_items`;
TRUNCATE TABLE `material_indents`;
TRUNCATE TABLE `attendance_logs`;
TRUNCATE TABLE `labour_work_logs`;
TRUNCATE TABLE `task_assignments`;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `project_wbs`;
TRUNCATE TABLE `projects`;
TRUNCATE TABLE `invoices`;
TRUNCATE TABLE `quotations`;
TRUNCATE TABLE `materials`;
TRUNCATE TABLE `vendors`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `labours`;
TRUNCATE TABLE `work_breakdown_structures`;

-- Seed Customers
INSERT INTO `customers` (`customer_id`, `customer_code`, `customer_name`, `email`, `phone`, `address`, `status`) VALUES
(1, 'CUST-001', 'Acme Real Estate', 'contact@acme.com', '+919876543210', '123 Acme Tower, Mumbai', 'active');

-- Seed Vendors
INSERT INTO `vendors` (`vendor_id`, `vendor_code`, `vendor_name`, `contact_person`, `email`, `phone`, `address`, `status`) VALUES
(1, 'VEN-001', 'UltraTech Cement Ltd', 'Rajesh Kumar', 'sales@ultratech.demo', '+918888888881', 'Mumbai, India', 'active'),
(2, 'VEN-002', 'Tata Steel Ltd', 'Suresh Singh', 'sales@tatasteel.demo', '+918888888882', 'Jamshedpur, India', 'active'),
(3, 'VEN-003', 'Finolex Cables', 'Amit Patel', 'sales@finolex.demo', '+918888888883', 'Pune, India', 'active');

-- Seed Materials
INSERT INTO `materials` (`material_id`, `material_code`, `material_name`, `category`, `unit`, `rate`, `tax_percentage`, `status`) VALUES
(1, 'MAT-CEM-01', 'Portland Cement 53G', 'Civil', 'Bag', 400.00, 18.00, 'active'),
(2, 'MAT-STL-01', 'TMT Steel Bar 12mm', 'Civil', 'Kg', 65.00, 18.00, 'active'),
(3, 'MAT-SND-01', 'River Sand', 'Civil', 'Ton', 1200.00, 5.00, 'active'),
(4, 'MAT-CBL-01', 'Copper Cable 2.5sqmm', 'Electrical', 'Meter', 45.00, 18.00, 'active'),
(5, 'MAT-PIP-01', 'PVC Pipe 4 inch', 'Plumbing', 'Meter', 150.00, 18.00, 'active');

-- Seed Labours
INSERT INTO `labours` (`labour_id`, `name`, `contact_number`, `labour_type`, `status`) VALUES
(1, 'Ramesh Worker', '9999999901', 'direct_labour', 'active'),
(2, 'Suresh Helper', '9999999902', 'direct_labour', 'active'),
(3, 'Mahesh Electrician', '9999999903', 'direct_labour', 'active');

-- Seed WBS Master
INSERT INTO `work_breakdown_structures` (`id`, `wbs_code`, `wbs_name`, `status`) VALUES
(1, 'WBS-CVL', 'Civil Work', 1),
(2, 'WBS-ELE', 'Electrical Work', 1),
(3, 'WBS-PLM', 'Plumbing Work', 1);

-- Seed Projects
INSERT INTO `projects` (`project_id`, `project_code`, `project_name`, `customer_id`, `status`, `budget_amount`, `latitude`, `longitude`, `radius_meters`) VALUES
(1, 'PRJ-DEMO-001', 'Pune Warehouse Construction', 1, 'active', 5000000.00, 18.5204, 73.8567, 500);

-- Seed Project WBS
INSERT INTO `project_wbs` (`id`, `project_id`, `wbs_id`, `budget_amount`, `status`) VALUES
(1, 1, 1, 2000000.00, 1),
(2, 1, 2, 800000.00, 1),
(3, 1, 3, 500000.00, 1);

-- Seed Tasks
INSERT INTO `tasks` (`task_id`, `project_id`, `wbs_id`, `task_name`, `estimated_hours`, `budget_amount`, `status`) VALUES
(1, 1, 1, 'Foundation concrete pouring', 120.00, 500000.00, 'in-progress'),
(2, 1, 1, 'Column reinforcements', 160.00, 600000.00, 'pending'),
(3, 1, 2, 'Main distribution wiring', 80.00, 200000.00, 'pending');

-- Seed Task Assignments (Assigning employee_id 1 just for demo)
INSERT INTO `task_assignments` (`task_id`, `employee_id`) VALUES
(1, 1), (2, 1);

-- Seed Quotations
INSERT INTO `quotations` (`quotation_id`, `quotation_code`, `customer_id`, `project_id`, `quotation_date`, `subtotal_amount`, `tax_percentage`, `tax_amount`, `discount_amount`, `total_amount`, `status`, `revision_number`) VALUES
(1, 'QT-DEMO-001', 1, 1, '2026-09-01', 3300000.00, 18.00, 594000.00, 0.00, 3894000.00, 'approved', 0);

-- Seed Material Indents
INSERT INTO `material_indents` (`indent_id`, `indent_code`, `project_id`, `wbs_id`, `required_date`, `priority`, `required_by`, `status`) VALUES
(1, 'IND-001', 1, 1, '2026-09-15', 'high', 1, 'po_created'),
(2, 'IND-002', 1, 2, '2026-09-20', 'medium', 1, 'po_created');

-- Seed Material Indent Items
INSERT INTO `material_indent_items` (`item_id`, `indent_id`, `material_id`, `required_quantity`, `estimated_rate`, `estimated_amount`) VALUES
(1, 1, 1, 500.00, 400.00, 200000.00), -- Cement
(2, 1, 2, 2000.00, 65.00, 130000.00), -- Steel
(3, 2, 4, 1000.00, 45.00, 45000.00); -- Cable

-- Seed Purchase Orders
INSERT INTO `purchase_orders` (`po_id`, `po_number`, `po_date`, `project_id`, `wbs_id`, `indent_id`, `vendor_id`, `vendor_name`, `subtotal_amount`, `tax_amount`, `total_amount`, `status`, `created_by`) VALUES
(1, 'PO-001', '2026-09-12', 1, 1, 1, 1, 'UltraTech Cement Ltd', 200000.00, 36000.00, 236000.00, 'completed', 1),
(2, 'PO-002', '2026-09-12', 1, 1, 1, 2, 'Tata Steel Ltd', 130000.00, 23400.00, 153400.00, 'partially_received', 1),
(3, 'PO-003', '2026-09-13', 1, 2, 2, 3, 'Finolex Cables', 45000.00, 8100.00, 53100.00, 'issued', 1);

-- Seed Purchase Order Items
INSERT INTO `purchase_order_items` (`po_item_id`, `po_id`, `material_id`, `quantity`, `unit_rate`, `tax_percentage`, `tax_amount`, `total_amount`) VALUES
(1, 1, 1, 500.00, 400.00, 18.00, 36000.00, 236000.00),
(2, 2, 2, 2000.00, 65.00, 18.00, 23400.00, 153400.00),
(3, 3, 4, 1000.00, 45.00, 18.00, 8100.00, 53100.00);

-- Seed Goods Receipt Notes (GRN)
INSERT INTO `goods_receipt_notes` (`grn_id`, `grn_number`, `po_id`, `project_id`, `wbs_id`, `vendor_name`, `delivery_date`, `created_by`) VALUES
(1, 'GRN-001', 1, 1, 1, 'UltraTech Cement Ltd', '2026-09-15', 1),
(2, 'GRN-002', 2, 1, 1, 'Tata Steel Ltd', '2026-09-16', 1);

-- Seed GRN Items
INSERT INTO `grn_items` (`grn_item_id`, `grn_id`, `material_id`, `ordered_quantity`, `received_quantity`, `accepted_quantity`, `rejected_quantity`) VALUES
(1, 1, 1, 500.00, 500.00, 490.00, 10.00), -- 10 bags rejected
(2, 2, 2, 2000.00, 1000.00, 1000.00, 0.00);

-- Seed Material Issues
INSERT INTO `material_issues` (`issue_id`, `issue_code`, `project_id`, `wbs_id`, `task_id`, `material_id`, `issue_date`, `quantity`, `unit_rate`, `total_cost`) VALUES
(1, 'ISS-001', 1, 1, 1, 1, '2026-09-17', 200.00, 400.00, 80000.00),
(2, 'ISS-002', 1, 1, 1, 2, '2026-09-17', 500.00, 65.00, 32500.00);

-- Seed Vendor Invoices
INSERT INTO `vendor_invoices` (`vendor_invoice_id`, `invoice_number`, `vendor_id`, `po_id`, `grn_id`, `project_id`, `wbs_id`, `vendor_name`, `invoice_date`, `invoice_amount`, `tax_amount`, `payable_amount`, `paid_amount`, `balance_amount`, `payment_status`) VALUES
(1, 'INV-ULT-991', 1, 1, 1, 1, 1, 'UltraTech Cement Ltd', '2026-09-16', 200000.00, 36000.00, 236000.00, 200000.00, 36000.00, 'partially_paid');

-- Seed Vendor Payments
INSERT INTO `vendor_payments` (`payment_id`, `vendor_invoice_id`, `payment_date`, `amount`, `payment_mode`, `reference_number`) VALUES
(1, 1, '2026-09-18', 200000.00, 'NEFT', 'TXN-987654321');

-- Seed Labour Work Logs
INSERT INTO `labour_work_logs` (`work_log_id`, `labour_id`, `project_id`, `wbs_id`, `task_id`, `work_date`, `total_working_hours`, `rate_type`, `rate`, `amount`, `work_status`, `payment_status`, `labour_count`, `rate_per_labour`) VALUES
(1, 1, 1, 1, 1, '2026-09-15', 8.00, 'daily', 800.00, 800.00, 'completed', 'approved', 1, 800.00),
(2, 2, 1, 1, 1, '2026-09-15', 8.00, 'daily', 600.00, 600.00, 'completed', 'approved', 1, 600.00);

SET FOREIGN_KEY_CHECKS = 1;
