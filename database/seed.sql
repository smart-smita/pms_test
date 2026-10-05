-- HTCO Employee GPS Attendance & Project Task Management System
-- Seed SQL Data

USE `eth_htco_db`;

-- 1. Insert Roles
INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Employee')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- 2. Insert Seed Users (Password: Admin@123 / Manager@123 / Employee@123)
-- bcrypt hash for 'Admin@123' / 'Manager@123' / 'Employee@123': $2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG
INSERT INTO `employees` (`employee_id`, `employee_code`, `name`, `email`, `password_hash`, `role_id`, `hourly_rate`, `status`) VALUES
(1, 'ADMIN001', 'System Administrator', 'admin@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 1, 50.00, 'active'),
(2, 'MGR001', 'Sarah Jenkins', 'sjenkins@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 2, 40.00, 'active'),
(3, 'EMP001', 'John Doe', 'jdoe@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 25.00, 'active'),
(4, 'EMP002', 'Alice Smith', 'asmith@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 30.00, 'active'),
(5, 'EMP003', 'Robert Brown', 'rbrown@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 22.50, 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Insert Projects
INSERT INTO `projects` (`project_id`, `project_code`, `project_name`, `client_name`, `latitude`, `longitude`, `radius_meters`, `status`) VALUES
(1, 'PRJ-2026-01', 'Metropolitan Water Pipeline Expansion', 'City Municipal Board', 18.52043030, 73.85674370, 500, 'active'),
(2, 'PRJ-2026-02', 'Substation Electrical Grid Upgrade', 'National Power Corp', 19.07609000, 72.87742600, 750, 'active'),
(3, 'PRJ-2026-03', 'Highway Bridge Reinforcement', 'Department of Transportation', 12.97159800, 77.59456200, 1000, 'active')
ON DUPLICATE KEY UPDATE `project_name` = VALUES(`project_name`);

-- 4. Insert Tasks
INSERT INTO `tasks` (`task_id`, `project_id`, `task_name`, `description`, `required_worker_count`, `estimated_hours`, `start_date`, `target_date`, `status`) VALUES
(1, 1, 'Trenching & Pipe Bedding', 'Excavate 500m trench and lay gravel bedding', 3, 80.00, '2026-08-01', '2026-08-30', 'in-progress'),
(2, 1, 'Pipe Welding & Pressure Test', 'Weld steel pipe joints and conduct hydro testing', 2, 40.00, '2026-08-15', '2026-09-10', 'pending'),
(3, 2, 'Transformer Foundation Concrete Pour', 'Pour heavy duty concrete foundation pad for transformer', 2, 50.00, '2026-08-10', '2026-08-25', 'completed'),
(4, 2, 'High Voltage Cable Routing', 'Install tray systems and pull HV transmission cables', 3, 60.00, '2026-08-20', '2026-09-15', 'in-progress')
ON DUPLICATE KEY UPDATE `task_name` = VALUES(`task_name`);

-- 5. Insert Task Assignments
INSERT INTO `task_assignments` (`task_id`, `employee_id`) VALUES
(1, 3),
(1, 4),
(2, 4),
(3, 3),
(3, 5),
(4, 3),
(4, 4),
(4, 5)
ON DUPLICATE KEY UPDATE `assigned_at` = CURRENT_TIMESTAMP;

-- 6. Insert Sample Attendance Logs
INSERT INTO `attendance_logs` (`employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`) VALUES
(3, 3, '2026-08-20', '2026-08-20 08:00:00', '2026-08-20 17:00:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed'),
(5, 3, '2026-08-20', '2026-08-20 08:15:00', '2026-08-20 17:15:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed'),
(3, 1, '2026-08-26', '2026-08-26 08:30:00', '2026-08-26 16:30:00', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 8.00, 'completed'),
(4, 1, '2026-08-27', '2026-08-27 08:00:00', NULL, 18.52043030, 73.85674370, 'City Water Pipeline Site B', NULL, NULL, NULL, 0.00, 'open')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);
