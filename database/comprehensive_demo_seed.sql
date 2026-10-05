-- HTCO ERP Comprehensive Demo Data Seed
-- This script safely inserts realistic mock data across all modules for testing reports and analytics.
-- Uses INSERT IGNORE and ON DUPLICATE KEY to avoid conflicts with existing data.

USE `eth_htco_db`;

-- ==========================================
-- 1. EXTENDED ROLES & USERS
-- ==========================================
-- Add default roles
INSERT IGNORE INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Employee');

-- Insert Additional Test Employees (Password: password123 -> $2b$10$xyz...)
-- Using a standard bcrypt hash for 'password123': $2b$10$k1w.5t1nB5Z/o3R/t/Cq.OIfHh4m51s6rO5w7D1A9e1TzPq2B4S0C
INSERT INTO `employees` (`employee_id`, `employee_code`, `name`, `email`, `password_hash`, `role_id`, `hourly_rate`, `status`) VALUES
(101, 'MGR-DEMO-01', 'David Manager', 'david.m@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 50.00, 'active'),
(102, 'EMP-DEMO-01', 'Michael Field', 'michael.f@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 4, 30.00, 'active'),
(103, 'EMP-DEMO-02', 'Sarah Tech', 'sarah.t@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 4, 35.00, 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Assign manager hierarchy (David manages Michael and Sarah)
INSERT IGNORE INTO `manager_employees` (`manager_id`, `employee_id`) VALUES
(101, 102),
(101, 103);


-- ==========================================
-- 2. PROJECTS & DISCIPLINES (WBS)
-- ==========================================
INSERT INTO `projects` (`project_id`, `project_code`, `project_name`, `client_name`, `latitude`, `longitude`, `radius_meters`, `status`) VALUES
(1001, 'PRJ-DEMO-X', 'Mega Highway Interchange', 'State Transport Dept', 19.123456, 72.123456, 1000, 'active')
ON DUPLICATE KEY UPDATE `project_name` = VALUES(`project_name`);

-- Assign Manager to Project
INSERT IGNORE INTO `manager_projects` (`manager_id`, `project_id`) VALUES
(101, 1001);

-- Create Master Disciplines (WBS)
INSERT INTO `work_breakdown_structures` (`id`, `wbs_code`, `wbs_name`, `description`) VALUES
(101, 'CIVIL-01', 'Civil Works', 'Earthwork, foundations, concrete'),
(102, 'ELEC-01', 'Electrical Works', 'Wiring, substations, lighting'),
(103, 'MECH-01', 'Mechanical Works', 'Piping, HVAC, heavy machinery')
ON DUPLICATE KEY UPDATE `wbs_name` = VALUES(`wbs_name`);

-- Allocate Disciplines to Project
INSERT IGNORE INTO `project_wbs` (`id`, `project_id`, `wbs_id`, `start_date`, `end_date`, `total_hours`, `note`) VALUES
(1001, 1001, 101, '2026-08-01', '2026-12-31', 2000, 'Main civil phase'),
(1002, 1001, 102, '2026-09-01', '2026-11-30', 1000, 'Highway lighting installation');


-- ==========================================
-- 3. TASKS & ASSIGNMENTS
-- ==========================================
INSERT INTO `tasks` (`task_id`, `project_id`, `wbs_id`, `task_name`, `description`, `required_worker_count`, `estimated_hours`, `start_date`, `target_date`, `status`) VALUES
(1001, 1001, 1001, 'Excavate North Pillar', 'Dig 20m foundation for north bridge pillar', 4, 120.00, '2026-08-01', '2026-08-15', 'completed'),
(1002, 1001, 1001, 'Pour Concrete Base', 'Pour 500 cubic meters of concrete', 3, 80.00, '2026-08-16', '2026-08-25', 'in-progress'),
(1003, 1001, 1002, 'Install Streetlights', 'Erect 50 street light poles', 2, 60.00, '2026-09-01', '2026-09-15', 'pending')
ON DUPLICATE KEY UPDATE `task_name` = VALUES(`task_name`);

-- Assign Employees to Tasks
INSERT IGNORE INTO `task_assignments` (`task_id`, `employee_id`) VALUES
(1001, 102),
(1001, 103),
(1002, 102),
(1003, 103);


-- ==========================================
-- 4. EMPLOYEE ATTENDANCE & TIMESHEETS
-- ==========================================
-- Simulate 3 days of attendance for Michael and Sarah
INSERT INTO `attendance_logs` (`employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`) VALUES
-- Day 1
(102, 1001, '2026-08-02', '2026-08-02 08:00:00', '2026-08-02 17:00:00', 19.123, 72.123, 'Site Alpha', 19.123, 72.123, 'Site Alpha', 9.00, 'completed'),
(103, 1001, '2026-08-02', '2026-08-02 08:30:00', '2026-08-02 16:30:00', 19.123, 72.123, 'Site Alpha', 19.123, 72.123, 'Site Alpha', 8.00, 'completed'),
-- Day 2
(102, 1001, '2026-08-03', '2026-08-03 08:15:00', '2026-08-03 18:15:00', 19.123, 72.123, 'Site Alpha', 19.123, 72.123, 'Site Alpha', 10.00, 'completed'),
(103, 1001, '2026-08-03', '2026-08-03 08:00:00', '2026-08-03 17:00:00', 19.123, 72.123, 'Site Alpha', 19.123, 72.123, 'Site Alpha', 9.00, 'completed'),
-- Day 3 (Sarah forgot to checkout)
(102, 1002, '2026-08-16', '2026-08-16 09:00:00', '2026-08-16 17:00:00', 19.123, 72.123, 'Site Alpha', 19.123, 72.123, 'Site Alpha', 8.00, 'completed'),
(103, 1002, '2026-08-16', '2026-08-16 08:00:00', NULL, 19.123, 72.123, 'Site Alpha', NULL, NULL, NULL, 0.00, 'missing_checkout')
ON DUPLICATE KEY UPDATE `total_working_hours` = VALUES(`total_working_hours`);

-- Timesheets (Logged work hours against tasks)
INSERT IGNORE INTO `timesheets` (`project_id`, `wbs_id`, `task_id`, `employee_id`, `log_date`, `working_hours`, `comment`) VALUES
(1001, 1001, 1001, 102, '2026-08-02', 8.00, 'Digging phase 1'),
(1001, 1001, 1001, 103, '2026-08-02', 8.00, 'Assisting excavator'),
(1001, 1001, 1001, 102, '2026-08-03', 10.00, 'Digging phase 2 (overtime)'),
(1001, 1001, 1001, 103, '2026-08-03', 9.00, 'Assisting excavator'),
(1001, 1001, 1002, 102, '2026-08-16', 8.00, 'Formwork for concrete');


-- ==========================================
-- 5. LABOURERS, ATTENDANCE & PAYMENTS
-- ==========================================
-- Insert Labourers
INSERT INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `contractor_id`) VALUES
(1001, 'Ramesh Kumar', '9876543210', '123456789012', 'direct_labour', NULL),
(1002, 'Suresh Patel', '9876543211', '123456789013', 'direct_labour', NULL),
(1003, 'Contractor Team A', '9876543212', '123456789014', 'contractor', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Labour Attendance & Cost Booking
INSERT IGNORE INTO `labour_attendance` (`labour_id`, `project_id`, `wbs_id`, `task_id`, `attendance_date`, `in_time`, `out_time`, `daily_pay_amount`, `worker_count`, `comment`) VALUES
-- Day 1
(1001, 1001, 1001, 1001, '2026-08-02', '08:00:00', '17:00:00', 800.00, 1, 'Standard day'),
(1002, 1001, 1001, 1001, '2026-08-02', '08:00:00', '17:00:00', 850.00, 1, 'Standard day'),
(1003, 1001, 1001, 1001, '2026-08-02', '09:00:00', '18:00:00', 4500.00, 5, 'Contractor gang of 5'),
-- Day 2
(1001, 1001, 1001, 1001, '2026-08-03', '08:00:00', '17:00:00', 800.00, 1, 'Standard day'),
(1002, 1001, 1001, 1001, '2026-08-03', '08:00:00', '17:00:00', 850.00, 1, 'Standard day'),
(1003, 1001, 1001, 1001, '2026-08-03', '09:00:00', '18:00:00', 4500.00, 5, 'Contractor gang of 5');
