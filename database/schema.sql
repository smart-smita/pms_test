-- HTCO Employee GPS Attendance & Project Task Management System
-- Database Schema SQL

CREATE DATABASE IF NOT EXISTS `eth_htco_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `eth_htco_db`;

-- Drop tables in reverse dependency order if needed
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `attendance_logs`;
DROP TABLE IF EXISTS `task_assignments`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `roles`;

-- 1. Roles Table
CREATE TABLE `roles` (
  `role_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Employees Table
CREATE TABLE `employees` (
  `employee_id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_employees_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Projects Table
CREATE TABLE `projects` (
  `project_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE,
  `project_name` VARCHAR(150) NOT NULL,
  `client_name` VARCHAR(150) DEFAULT NULL,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `radius_meters` INT DEFAULT 500,
  `status` ENUM('active', 'inactive', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tasks Table
CREATE TABLE `tasks` (
  `task_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `task_name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `required_worker_count` INT NOT NULL DEFAULT 1,
  `estimated_hours` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `start_date` DATE DEFAULT NULL,
  `start_time` TIME DEFAULT NULL,
  `target_date` DATE DEFAULT NULL,
  `target_time` TIME DEFAULT NULL,
  `status` ENUM('pending', 'in-progress', 'completed', 'delayed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tasks_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Task Assignments (Many-to-Many Employees <-> Tasks)
CREATE TABLE `task_assignments` (
  `assignment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_task_employee` (`task_id`, `employee_id`),
  CONSTRAINT `fk_ta_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ta_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attendance Logs Table (GPS Check-In / Check-Out)
CREATE TABLE `attendance_logs` (
  `attendance_id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `task_id` INT DEFAULT NULL,
  `attendance_date` DATE NOT NULL,
  `check_in_time` DATETIME NOT NULL,
  `check_out_time` DATETIME DEFAULT NULL,
  `in_latitude` DECIMAL(10,8) DEFAULT NULL,
  `in_longitude` DECIMAL(11,8) DEFAULT NULL,
  `in_address` TEXT DEFAULT NULL,
  `out_latitude` DECIMAL(10,8) DEFAULT NULL,
  `out_longitude` DECIMAL(11,8) DEFAULT NULL,
  `out_address` TEXT DEFAULT NULL,
  `total_working_hours` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('open', 'completed', 'missing_checkout') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_att_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Password Reset Tokens
CREATE TABLE `password_reset_tokens` (
  `token_id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_prt_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for fast filtering and reports
CREATE INDEX `idx_employees_code` ON `employees` (`employee_code`);
CREATE INDEX `idx_tasks_project` ON `tasks` (`project_id`);
CREATE INDEX `idx_attendance_emp_date` ON `attendance_logs` (`employee_id`, `attendance_date`);
CREATE INDEX `idx_attendance_task` ON `attendance_logs` (`task_id`);
CREATE INDEX `idx_attendance_status` ON `attendance_logs` (`status`);
