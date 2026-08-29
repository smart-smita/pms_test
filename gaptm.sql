-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 27, 2026 at 12:45 PM
-- Server version: 9.1.0
-- PHP Version: 8.4.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gaptm`
--
CREATE DATABASE IF NOT EXISTS `gaptm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `gaptm`;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `task_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` datetime NOT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text COLLATE utf8mb4_unicode_ci,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('open','completed','missing_checkout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_attendance_emp_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_task` (`task_id`),
  KEY `idx_attendance_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`attendance_id`, `employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 3, '2026-08-20', '2026-08-20 08:00:00', '2026-08-20 17:00:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(2, 5, 3, '2026-08-20', '2026-08-20 08:15:00', '2026-08-20 17:15:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(3, 3, 1, '2026-08-26', '2026-08-26 08:30:00', '2026-08-26 16:30:00', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 8.00, 'completed', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(4, 4, 1, '2026-08-27', '2026-08-27 08:00:00', NULL, 18.52043030, 73.85674370, 'City Water Pipeline Site B', NULL, NULL, NULL, 0.00, 'open', '2026-08-27 12:41:13', '2026-08-27 12:41:13');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT '25.00',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employees_roles` (`role_id`),
  KEY `idx_employees_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `employee_code`, `name`, `email`, `password_hash`, `role_id`, `hourly_rate`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ADMIN001', 'System Administrator', 'admin@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 1, 50.00, 'active', '2026-08-27 12:41:12', '2026-08-27 12:41:12'),
(2, 'MGR001', 'Sarah Jenkins', 'sjenkins@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 2, 40.00, 'active', '2026-08-27 12:41:12', '2026-08-27 12:41:12'),
(3, 'EMP001', 'John Doe', 'jdoe@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 25.00, 'active', '2026-08-27 12:41:12', '2026-08-27 12:41:12'),
(4, 'EMP002', 'Alice Smith', 'asmith@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 30.00, 'active', '2026-08-27 12:41:12', '2026-08-27 12:41:12'),
(5, 'EMP003', 'Robert Brown', 'rbrown@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 22.50, 'active', '2026-08-27 12:41:12', '2026-08-27 12:41:12');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  KEY `fk_prt_employees` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `radius_meters` int DEFAULT '500',
  `status` enum('active','inactive','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `project_code` (`project_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`project_id`, `project_code`, `project_name`, `client_name`, `latitude`, `longitude`, `radius_meters`, `status`, `created_at`, `updated_at`) VALUES
(1, 'PRJ-2026-01', 'Metropolitan Water Pipeline Expansion', 'City Municipal Board', 18.52043030, 73.85674370, 500, 'active', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(2, 'PRJ-2026-02', 'Substation Electrical Grid Upgrade', 'National Power Corp', 19.07609000, 72.87742600, 750, 'active', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(3, 'PRJ-2026-03', 'Highway Bridge Reinforcement', 'Department of Transportation', 12.97159800, 77.59456200, 1000, 'active', '2026-08-27 12:41:13', '2026-08-27 12:41:13');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES
(1, 'Admin', '2026-08-27 12:41:12'),
(2, 'Manager', '2026-08-27 12:41:12'),
(3, 'Employee', '2026-08-27 12:41:12');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE IF NOT EXISTS `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `task_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `required_worker_count` int NOT NULL DEFAULT '1',
  `estimated_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `status` enum('pending','in-progress','completed','delayed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `idx_tasks_project` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `project_id`, `task_name`, `description`, `required_worker_count`, `estimated_hours`, `start_date`, `target_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Trenching & Pipe Bedding', 'Excavate 500m trench and lay gravel bedding', 3, 80.00, '2026-08-01', '2026-08-30', 'in-progress', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(2, 1, 'Pipe Welding & Pressure Test', 'Weld steel pipe joints and conduct hydro testing', 2, 40.00, '2026-08-15', '2026-09-10', 'pending', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(3, 2, 'Transformer Foundation Concrete Pour', 'Pour heavy duty concrete foundation pad for transformer', 2, 50.00, '2026-08-10', '2026-08-25', 'completed', '2026-08-27 12:41:13', '2026-08-27 12:41:13'),
(4, 2, 'High Voltage Cable Routing', 'Install tray systems and pull HV transmission cables', 3, 60.00, '2026-08-20', '2026-09-15', 'in-progress', '2026-08-27 12:41:13', '2026-08-27 12:41:13');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

DROP TABLE IF EXISTS `task_assignments`;
CREATE TABLE IF NOT EXISTS `task_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_task_employee` (`task_id`,`employee_id`),
  KEY `fk_ta_employees` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`assignment_id`, `task_id`, `employee_id`, `assigned_at`) VALUES
(1, 1, 3, '2026-08-27 12:41:13'),
(2, 1, 4, '2026-08-27 12:41:13'),
(3, 2, 4, '2026-08-27 12:41:13'),
(4, 3, 3, '2026-08-27 12:41:13'),
(5, 3, 5, '2026-08-27 12:41:13'),
(6, 4, 3, '2026-08-27 12:41:13'),
(7, 4, 4, '2026-08-27 12:41:13'),
(8, 4, 5, '2026-08-27 12:41:13');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `fk_att_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_att_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_prt_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `fk_ta_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ta_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
