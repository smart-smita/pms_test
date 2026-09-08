-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 08, 2026 at 07:05 AM
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
  `status` enum('open','completed','outside_area','missing_checkout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `in_distance_meters` decimal(10,2) DEFAULT NULL,
  `out_distance_meters` decimal(10,2) DEFAULT NULL,
  `project_radius_meters` int DEFAULT '500',
  `in_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `out_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_attendance_emp_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_task` (`task_id`),
  KEY `idx_attendance_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`attendance_id`, `employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`, `created_at`, `updated_at`, `in_distance_meters`, `out_distance_meters`, `project_radius_meters`, `in_status`, `out_status`, `is_deleted`, `deleted_at`) VALUES
(1, 3, 3, '2026-08-20', '2026-08-20 08:00:00', '2026-08-20 17:00:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed', '2026-08-31 10:40:58', '2026-08-31 10:40:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(2, 5, 3, '2026-08-20', '2026-08-20 08:15:00', '2026-08-20 17:15:00', 19.07609000, 72.87742600, 'National Power Substation, Site A', 19.07609000, 72.87742600, 'National Power Substation, Site A', 9.00, 'completed', '2026-08-31 10:40:58', '2026-08-31 10:40:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(3, 3, 1, '2026-08-26', '2026-08-26 08:30:00', '2026-08-26 16:30:00', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 18.52043030, 73.85674370, 'City Water Pipeline Site B', 8.00, 'completed', '2026-08-31 10:40:58', '2026-08-31 10:40:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(4, 4, 1, '2026-08-27', '2026-08-27 08:00:00', NULL, 18.52043030, 73.85674370, 'City Water Pipeline Site B', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-08-31 10:40:58', '2026-08-31 11:04:08', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(5, 1, 1, '2026-08-31', '2026-08-31 16:49:37', '2026-08-31 16:57:01', 18.64307723, 73.79688903, 'Site GPS: 18.643077, 73.796889', 18.64306585, 73.79690595, 'Check-out GPS: 18.643066, 73.796906', 5.00, 'completed', '2026-08-31 11:19:37', '2026-08-31 11:28:40', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(6, 2, NULL, '2026-09-02', '2026-09-02 17:37:46', NULL, 0.00000000, 0.00000000, 'Test Manager Punch', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-02 12:07:46', '2026-09-03 04:19:38', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(7, 3, NULL, '2026-09-02', '2026-09-02 17:37:47', NULL, 0.00000000, 0.00000000, 'Test Employee Punch', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-02 12:07:47', '2026-09-03 04:19:38', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(8, 2, NULL, '2026-09-02', '2026-09-02 17:37:47', NULL, 0.00000000, 0.00000000, 'Test Manager Punch', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-02 12:07:47', '2026-09-03 04:19:38', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(9, 3, NULL, '2026-09-02', '2026-09-02 17:37:47', NULL, 0.00000000, 0.00000000, 'Test Employee Punch', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-02 12:07:47', '2026-09-03 04:19:38', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(10, 1003, 1001, '2026-08-31', '2026-08-31 08:00:00', '2026-08-31 16:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 8.50, 'completed', '2026-09-02 12:30:13', '2026-09-02 12:30:13', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(11, 1004, 1001, '2026-08-31', '2026-08-31 08:15:00', '2026-08-31 17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, 8.75, 'completed', '2026-09-02 12:30:13', '2026-09-02 12:30:13', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(12, 1005, 1003, '2026-08-31', '2026-08-31 09:00:00', '2026-08-31 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, 9.00, 'completed', '2026-09-02 12:30:13', '2026-09-02 12:30:13', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(13, 1003, 1001, '2026-09-02', '2026-09-02 08:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-02 12:30:13', '2026-09-03 04:19:38', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(14, 102, 1001, '2026-08-02', '2026-08-02 08:00:00', '2026-08-02 17:00:00', 19.12300000, 72.12300000, 'Site Alpha', 19.12300000, 72.12300000, 'Site Alpha', 9.00, 'completed', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(15, 103, 1001, '2026-08-02', '2026-08-02 08:30:00', '2026-08-02 16:30:00', 19.12300000, 72.12300000, 'Site Alpha', 19.12300000, 72.12300000, 'Site Alpha', 8.00, 'completed', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(16, 102, 1001, '2026-08-03', '2026-08-03 08:15:00', '2026-08-03 18:15:00', 19.12300000, 72.12300000, 'Site Alpha', 19.12300000, 72.12300000, 'Site Alpha', 10.00, 'completed', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(17, 103, 1001, '2026-08-03', '2026-08-03 08:00:00', '2026-08-03 17:00:00', 19.12300000, 72.12300000, 'Site Alpha', 19.12300000, 72.12300000, 'Site Alpha', 9.00, 'completed', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(18, 102, 1002, '2026-08-16', '2026-08-16 09:00:00', '2026-08-16 17:00:00', 19.12300000, 72.12300000, 'Site Alpha', 19.12300000, 72.12300000, 'Site Alpha', 8.00, 'completed', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(19, 103, 1002, '2026-08-16', '2026-08-16 08:00:00', NULL, 19.12300000, 72.12300000, 'Site Alpha', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-03 04:17:58', '2026-09-03 04:17:58', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(20, 1, NULL, '2026-09-03', '2026-09-03 10:33:06', NULL, 18.64307814, 73.79689354, 'Site GPS: 18.643078, 73.796894', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-03 05:03:06', '2026-09-07 06:18:01', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(21, 1006, 1004, '2026-09-07', '2026-09-07 12:53:22', NULL, 18.64300653, 73.79688327, 'Site GPS: 18.643007, 73.796883', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-07 07:23:22', '2026-09-07 07:23:22', 14562.73, NULL, 500, 'outside', 'inside', 0, NULL),
(22, 1007, NULL, '2026-09-07', '2026-09-07 14:57:11', '2026-09-07 14:59:20', 18.64304990, 73.79690030, 'Site GPS: 18.643050, 73.796900', NULL, NULL, 'Site GPS: 18.643050, 73.796900', 0.04, 'completed', '2026-09-07 09:27:11', '2026-09-07 09:29:20', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(23, 1007, 1005, '2026-09-07', '2026-09-07 14:59:23', NULL, 18.64304990, 73.79690030, 'Site GPS: 18.643050, 73.796900', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-07 09:29:23', '2026-09-07 09:29:23', 14566.34, NULL, 500, 'outside', 'inside', 0, NULL),
(24, 1007, 1005, '2026-09-07', '2026-09-07 18:32:26', NULL, 18.64306053, 73.79690407, 'Site GPS: 18.643061, 73.796904', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-07 13:02:26', '2026-09-07 13:02:26', 14567.24, NULL, 500, 'outside', 'inside', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `description` text,
  `record_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `module`, `description`, `record_id`, `ip_address`, `created_at`) VALUES
(1, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 10:53:14'),
(2, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 11:08:49'),
(3, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-08-31 11:19:37'),
(4, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 11:24:23'),
(5, NULL, 'check-out', 'attendance', 'GPS Check-Out recorded', NULL, '::1', '2026-08-31 11:27:01'),
(6, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 11:59:13'),
(7, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:14:17'),
(8, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:21:14'),
(9, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:38:03'),
(10, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:39:13'),
(11, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:40:35'),
(12, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:43:38'),
(13, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:52:55'),
(14, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:53:21'),
(15, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:53:23'),
(16, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:53:37'),
(17, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:54:15'),
(18, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:54:36'),
(19, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 12:56:32'),
(20, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 12:56:50'),
(21, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-08-31 13:12:09'),
(22, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 13:12:55'),
(23, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-08-31 13:15:53'),
(24, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-01 06:03:59'),
(25, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-01 06:04:11'),
(26, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-01 11:38:50'),
(27, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-01 11:41:17'),
(28, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 04:50:22'),
(29, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 05:06:30'),
(30, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 05:24:36'),
(31, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 07:41:56'),
(32, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 08:36:44'),
(33, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 08:52:04'),
(34, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 09:37:02'),
(35, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 09:52:21'),
(36, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 10:07:47'),
(37, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 10:24:07'),
(38, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 10:39:18'),
(39, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 10:54:30'),
(40, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 11:13:59'),
(41, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 11:29:16'),
(42, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 11:31:21'),
(43, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 11:31:37'),
(44, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 11:31:53'),
(45, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 11:34:20'),
(46, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 11:45:50'),
(47, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 11:50:27'),
(48, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 12:05:34'),
(49, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-02 12:05:49'),
(50, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-02 12:16:32'),
(51, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 04:18:58'),
(52, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 04:45:31'),
(53, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 05:00:44'),
(54, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-03 05:03:06'),
(55, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-03 05:03:28'),
(56, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 05:26:24'),
(57, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 05:37:39'),
(58, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-03 05:38:41'),
(59, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 05:53:10'),
(60, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-03 07:10:11'),
(61, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 07:10:22'),
(62, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 07:41:59'),
(63, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-03 07:42:16'),
(64, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 07:42:32'),
(65, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-03 07:58:21'),
(66, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 06:17:40'),
(67, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 06:37:33'),
(68, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 07:15:30'),
(69, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-07 07:23:22'),
(70, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 07:23:48'),
(71, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-07 07:24:00'),
(72, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-07 07:24:44'),
(73, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 07:30:42'),
(74, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 07:49:27'),
(75, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-07 07:50:50'),
(76, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 08:04:42'),
(77, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 08:15:37'),
(78, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-07 08:15:54'),
(79, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 08:21:47'),
(80, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 08:21:52'),
(81, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 09:12:53'),
(82, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 09:12:55'),
(83, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 09:25:46'),
(84, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-07 09:27:11'),
(85, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 09:27:57'),
(86, NULL, 'check-out', 'attendance', 'GPS Check-Out recorded', NULL, '::1', '2026-09-07 09:29:20'),
(87, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-07 09:29:23'),
(88, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 09:41:51'),
(89, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 09:43:35'),
(90, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 09:58:39'),
(91, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 10:01:41'),
(92, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 10:13:52'),
(93, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 10:21:50'),
(94, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 10:37:04'),
(95, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 10:52:52'),
(96, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 11:08:16'),
(97, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 11:24:31'),
(98, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 11:34:41'),
(99, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 11:51:43'),
(100, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 12:08:26'),
(101, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 12:30:24'),
(102, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 13:01:29'),
(103, 1007, 'login', 'auth', 'User logged in: EMP539', 1007, '::1', '2026-09-07 13:01:46'),
(104, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-07 13:02:26'),
(105, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-07 13:36:25'),
(106, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-08 05:47:03'),
(107, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-08 05:48:10'),
(108, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-08 06:57:41'),
(109, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-08 07:01:18');

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
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `reporting_to_id` int DEFAULT NULL,
  `assigned_project_id` int DEFAULT NULL,
  `assigned_wbs_id` int DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employees_roles` (`role_id`),
  KEY `idx_employees_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1008 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `employee_code`, `name`, `email`, `password_hash`, `role_id`, `hourly_rate`, `status`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `reporting_to_id`, `assigned_project_id`, `assigned_wbs_id`) VALUES
(1, 'ADMIN001', 'System Administrator', 'admin@htco.com', '$2b$10$EoXPgN7Z4OFpoLfyglsX7eRato2giwvLA6s3wM77l48URyXZG83/q', 1, 50.00, 'active', '2026-08-31 10:40:58', '2026-08-31 10:41:32', 0, NULL, NULL, NULL, NULL),
(2, 'MGR001', 'Sarah Jenkins', 'sjenkins@htco.com', '$2b$10$oQdH9gs1JZmSMPcovVsYNOk8ioLoyf3dznnv86UhkcOxlgjmSdC8i', 2, 40.00, 'active', '2026-08-31 10:40:58', '2026-09-07 07:24:44', 0, NULL, NULL, NULL, NULL),
(3, 'EMP001', 'John Doe', 'jdoe@htco.com', '$2b$10$HEfM1fGlASNZ5BrLbv4rluspCYXwuRZh4KLx76k4mJivAK3hk0zkm', 3, 25.00, 'active', '2026-08-31 10:40:58', '2026-08-31 12:21:14', 0, NULL, NULL, NULL, NULL),
(4, 'EMP002', 'Alice Smith', 'asmith@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 30.00, 'active', '2026-08-31 10:40:58', '2026-08-31 10:40:58', 0, NULL, NULL, NULL, NULL),
(5, 'EMP003', 'Robert Brown', 'rbrown@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 22.50, 'active', '2026-08-31 10:40:58', '2026-08-31 10:40:58', 0, NULL, NULL, NULL, NULL),
(101, 'MGR-DEMO-01', 'David Manager', 'david.m@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 50.00, 'active', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL, NULL, NULL, NULL),
(102, 'EMP-DEMO-01', 'Michael Field', 'michael.f@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 4, 30.00, 'active', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL, NULL, NULL, NULL),
(103, 'EMP-DEMO-02', 'Sarah Tech', 'sarah.t@htco.com', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 4, 35.00, 'active', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL, NULL, NULL, NULL),
(1001, 'MGR-TEST-01', 'Demo Manager One', 'manager1@htco.demo', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 2, 45.00, 'active', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL, NULL, NULL, NULL),
(1002, 'MGR-TEST-02', 'Demo Manager Two', 'manager2@htco.demo', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 2, 45.00, 'active', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL, NULL, NULL, NULL),
(1003, 'EMP-TEST-01', 'Demo Worker Alpha', 'worker1@htco.demo', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 20.00, 'active', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL, NULL, NULL, NULL),
(1004, 'EMP-TEST-02', 'Demo Worker Beta', 'worker2@htco.demo', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 25.00, 'active', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL, NULL, NULL, NULL),
(1005, 'EMP-TEST-03', 'Demo Worker Gamma', 'worker3@htco.demo', '$2b$10$gP77uP3aP76Zq/Xh0mGqcegqQyD/kI.N5f6m4O5S/3s1k8K5v0qKG', 3, 30.00, 'active', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL, NULL, NULL, NULL),
(1006, 'EMP619', 'Kartik', 'kartik@gmail.com', '$2b$10$KCYEdOaUvStjn8qnr.tLqerknEJ.NdifRrWxDy9GSp8vtxzjzYtOS', 3, 25.00, 'active', '2026-09-03 04:56:54', '2026-09-07 07:30:56', 0, NULL, 2, 1002, 1001),
(1007, 'EMP539', 'smita', 'smita@gmail.com', '$2b$10$IF7rnYkC0JS.fPnM85bddeeFrVMICJawVjvdqYIKInzkX9TA5NLyC', 3, 100.00, 'active', '2026-09-07 09:18:07', '2026-09-07 09:18:07', 0, NULL, 2, 1003, 102);

-- --------------------------------------------------------

--
-- Table structure for table `labours`
--

DROP TABLE IF EXISTS `labours`;
CREATE TABLE IF NOT EXISTS `labours` (
  `labour_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `aadhar_id` varchar(20) DEFAULT NULL,
  `labour_type` enum('contractor','direct_labour') NOT NULL DEFAULT 'direct_labour',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `contractor_id` int DEFAULT NULL,
  PRIMARY KEY (`labour_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labours`
--

INSERT INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`) VALUES
(1, 'unitglo', '1234567890', '123456789123', 'contractor', '2026-09-02 08:49:57', '2026-09-02 08:49:57', NULL),
(1001, 'Ramesh Kumar', '9998887771', 'AADHAR-1001', 'direct_labour', '2026-09-02 12:30:13', '2026-09-03 04:17:58', NULL),
(1002, 'Suresh Patel', '9998887772', 'AADHAR-1002', 'direct_labour', '2026-09-02 12:30:13', '2026-09-03 04:17:58', NULL),
(1003, 'Contractor Team A', '9998887773', 'AADHAR-1003', 'contractor', '2026-09-02 12:30:13', '2026-09-03 04:17:58', NULL),
(1004, 'ss', '1234567895', '12345678929', 'direct_labour', '2026-09-03 04:57:46', '2026-09-03 04:57:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance`
--

DROP TABLE IF EXISTS `labour_attendance`;
CREATE TABLE IF NOT EXISTS `labour_attendance` (
  `labour_attendance_id` int NOT NULL AUTO_INCREMENT,
  `labour_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `daily_pay_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `worker_count` int NOT NULL DEFAULT '1',
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `calculated_payment` decimal(10,2) NOT NULL DEFAULT '0.00',
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text,
  PRIMARY KEY (`labour_attendance_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labour_attendance`
--

INSERT INTO `labour_attendance` (`labour_attendance_id`, `labour_id`, `project_id`, `wbs_id`, `task_id`, `attendance_date`, `in_time`, `out_time`, `daily_pay_amount`, `worker_count`, `comment`, `created_at`, `is_deleted`, `deleted_at`, `hourly_rate`, `calculated_payment`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`) VALUES
(1, 1001, 1001, 1001, 1001, '2026-09-01', '08:00:00', '17:00:00', 500.00, 1, NULL, '2026-09-02 12:30:13', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1002, 1001, 1001, 1001, '2026-09-01', '08:15:00', '17:30:00', 500.00, 1, NULL, '2026-09-02 12:30:13', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1003, 1002, 1002, 1003, '2026-08-31', '09:00:00', '18:00:00', 650.00, 2, NULL, '2026-09-02 12:30:13', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 1001, 1001, 1001, 1001, '2026-08-02', '08:00:00', '17:00:00', 800.00, 1, 'Standard day', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 1002, 1001, 1001, 1001, '2026-08-02', '08:00:00', '17:00:00', 850.00, 1, 'Standard day', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 1003, 1001, 1001, 1001, '2026-08-02', '09:00:00', '18:00:00', 4500.00, 5, 'Contractor gang of 5', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1001, 1001, 1001, 1001, '2026-08-03', '08:00:00', '17:00:00', 800.00, 1, 'Standard day', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 1002, 1001, 1001, 1001, '2026-08-03', '08:00:00', '17:00:00', 850.00, 1, 'Standard day', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 1003, 1001, 1001, 1001, '2026-08-03', '09:00:00', '18:00:00', 4500.00, 5, 'Contractor gang of 5', '2026-09-03 04:17:58', 0, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 1004, 1003, 1001, 1004, '2026-09-07', '09:00:00', '18:00:00', 400.00, 4, 'test', '2026-09-07 06:38:20', 0, NULL, NULL, 1600.00, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 1, 1003, 102, 1005, '2026-09-07', '09:00:00', '18:00:00', 300.00, 4, 'smita test', '2026-09-07 09:48:52', 0, NULL, NULL, 1200.00, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `manager_employees`
--

DROP TABLE IF EXISTS `manager_employees`;
CREATE TABLE IF NOT EXISTS `manager_employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `manager_id` int NOT NULL,
  `employee_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_manager_employee` (`manager_id`,`employee_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `manager_employees`
--

INSERT INTO `manager_employees` (`id`, `manager_id`, `employee_id`) VALUES
(1, 1001, 1003),
(2, 1001, 1004),
(3, 1002, 1005),
(4, 101, 102),
(5, 101, 103);

-- --------------------------------------------------------

--
-- Table structure for table `manager_projects`
--

DROP TABLE IF EXISTS `manager_projects`;
CREATE TABLE IF NOT EXISTS `manager_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `manager_id` int NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_manager_project` (`manager_id`,`project_id`),
  KEY `project_id` (`project_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `manager_projects`
--

INSERT INTO `manager_projects` (`id`, `manager_id`, `project_id`) VALUES
(1, 1001, 1001),
(2, 1002, 1002),
(3, 101, 1001);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `permission_code` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES
(1, 'employees', 'view', 'employees_view'),
(2, 'employees', 'create', 'employees_create'),
(3, 'employees', 'update', 'employees_update'),
(4, 'employees', 'delete', 'employees_delete'),
(5, 'projects', 'view', 'projects_view'),
(6, 'projects', 'create', 'projects_create'),
(7, 'projects', 'update', 'projects_update'),
(8, 'projects', 'delete', 'projects_delete'),
(9, 'tasks', 'view', 'tasks_view'),
(10, 'tasks', 'create', 'tasks_create'),
(11, 'tasks', 'update', 'tasks_update'),
(12, 'tasks', 'delete', 'tasks_delete'),
(13, 'tasks', 'assign', 'tasks_assign'),
(14, 'attendance', 'view', 'attendance_view'),
(15, 'attendance', 'create', 'attendance_create'),
(16, 'attendance', 'update', 'attendance_update'),
(17, 'payments', 'view', 'payments_view'),
(18, 'payments', 'create', 'payments_create'),
(19, 'payments', 'update', 'payments_update'),
(20, 'reports', 'view', 'reports_view'),
(21, 'reports', 'export', 'reports_export'),
(22, 'profile', 'view', 'profile_view'),
(23, 'profile', 'update', 'profile_update'),
(24, 'settings', 'manage', 'settings_manage'),
(25, 'labours', 'view', 'labours_view'),
(26, 'labours', 'create', 'labours_create'),
(27, 'labours', 'update', 'labours_update'),
(28, 'labours', 'delete', 'labours_delete'),
(29, 'timesheets', 'view', 'timesheets_view'),
(30, 'timesheets', 'create', 'timesheets_create'),
(31, 'timesheets', 'update', 'timesheets_update'),
(32, 'timesheets', 'delete', 'timesheets_delete');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_address` text COLLATE utf8mb4_unicode_ci,
  `client_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `radius_meters` int DEFAULT '500',
  `project_date` date DEFAULT NULL,
  `status` enum('active','inactive','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `project_code` (`project_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`project_id`, `project_code`, `project_name`, `project_address`, `client_name`, `client_code`, `latitude`, `longitude`, `radius_meters`, `project_date`, `status`, `note`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(1, 'PRJ-2026-01', 'Metropolitan Water Pipeline Expansion', NULL, 'City Municipal Board', NULL, 18.52043030, 73.85674370, 500, NULL, 'active', NULL, '2026-08-31 10:40:58', '2026-08-31 10:40:58', 0, NULL),
(2, 'PRJ-2026-02', 'Substation Electrical Grid Upgrade', NULL, 'National Power Corp', NULL, 19.07609000, 72.87742600, 750, NULL, 'active', NULL, '2026-08-31 10:40:58', '2026-08-31 10:40:58', 0, NULL),
(3, 'PRJ-2026-03', 'Highway Bridge Reinforcement', '', 'Department of Transportation', '', 12.97159800, 77.59456200, 1000, '2026-08-31', 'active', '', '2026-08-31 10:40:58', '2026-08-31 10:54:32', 0, NULL),
(1001, 'PRJ-DEMO-CIVIL', 'Mega Highway Interchange', NULL, 'Municipal Corporation', NULL, 18.52043000, 73.85674300, 1000, NULL, 'active', NULL, '2026-09-02 12:30:13', '2026-09-03 04:17:58', 0, NULL),
(1002, 'PRJ-DEMO-ELEC', 'Solar Farm Installation', NULL, 'Green Energy Ltd', NULL, 19.07609000, 72.87742600, 1500, NULL, 'active', NULL, '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL),
(1003, 'PRJ-2026-70', 'test project', 'Pune', 'test client', 'ASD0001', 18.52434600, 73.85535500, 500, '2026-09-03', 'active', 'test project', '2026-09-03 04:59:54', '2026-09-07 07:19:33', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_wbs`
--

DROP TABLE IF EXISTS `project_wbs`;
CREATE TABLE IF NOT EXISTS `project_wbs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `wbs_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_hours` decimal(10,2) DEFAULT '0.00',
  `note` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_wbs_id` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1010 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_wbs`
--

INSERT INTO `project_wbs` (`id`, `project_id`, `wbs_id`, `start_date`, `end_date`, `total_hours`, `note`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, '2026-08-01', '2026-08-30', 80.00, NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(2, 1, 2, '2026-08-15', '2026-09-10', 40.00, NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(3, 2, 3, '2026-08-10', '2026-08-25', 50.00, NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(4, 2, 4, '2026-08-20', '2026-09-15', 60.00, NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(8, 3, 4, '2026-08-31', '2026-09-04', 50.00, NULL, 1, NULL, NULL, NULL, '2026-08-31 16:24:32', '2026-08-31 16:24:32', NULL),
(9, 3, 2, '2026-09-02', '2026-10-02', 320.00, 'test', 1, NULL, NULL, NULL, '2026-09-02 16:05:34', '2026-09-02 16:05:34', NULL),
(1001, 1001, 1001, '2026-08-23', '2026-09-22', 500.00, NULL, 1, NULL, NULL, NULL, '2026-09-02 18:00:13', '2026-09-02 18:00:13', NULL),
(1002, 1002, 1002, '2026-08-28', '2026-10-02', 800.00, NULL, 1, NULL, NULL, NULL, '2026-09-02 18:00:13', '2026-09-02 18:00:13', NULL),
(1003, 1003, 1001, '2026-09-03', '2026-09-03', 10.00, 'test', 1, NULL, NULL, NULL, '2026-09-03 10:29:54', '2026-09-07 13:02:37', NULL),
(1004, 1003, 101, '2026-09-04', '2026-09-04', 10.00, NULL, 1, NULL, NULL, NULL, '2026-09-03 10:29:54', '2026-09-03 10:29:54', NULL),
(1005, 1003, 1002, '2026-09-05', '2026-09-05', 10.00, NULL, 1, NULL, NULL, NULL, '2026-09-03 10:29:54', '2026-09-03 10:29:54', NULL),
(1006, 1003, 102, '2026-09-06', '2026-09-06', 8.00, NULL, 1, NULL, NULL, NULL, '2026-09-03 10:29:54', '2026-09-03 10:29:54', NULL),
(1007, 1002, 102, '2026-09-07', '2026-09-07', 5.00, 'test', 1, NULL, NULL, NULL, '2026-09-07 12:15:20', '2026-09-07 12:15:20', NULL),
(1008, 1003, 103, '2026-09-07', '2026-09-13', 60.00, 'test project', 1, NULL, NULL, NULL, '2026-09-07 13:37:01', '2026-09-07 13:37:01', NULL),
(1009, 1003, 4, '2026-09-07', '2026-09-07', 20.00, 'test', 1, NULL, NULL, NULL, '2026-09-07 14:44:09', '2026-09-07 14:44:09', NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=468 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES
(1, 'Admin', '2026-08-31 10:40:58'),
(2, 'Manager', '2026-08-31 10:40:58'),
(3, 'Employee', '2026-08-31 10:40:58'),
(4, 'Super Admin', '2026-09-01 11:44:51');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_perm` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`)
) ENGINE=MyISAM AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 1, 5),
(6, 1, 6),
(7, 1, 7),
(8, 1, 8),
(9, 1, 9),
(10, 1, 10),
(11, 1, 11),
(12, 1, 12),
(13, 1, 13),
(14, 1, 14),
(15, 1, 15),
(16, 1, 16),
(17, 1, 17),
(18, 1, 18),
(19, 1, 19),
(20, 1, 20),
(21, 1, 21),
(22, 1, 22),
(23, 1, 23),
(24, 1, 24),
(25, 1, 25),
(26, 1, 26),
(27, 1, 27),
(28, 1, 28),
(29, 2, 1),
(30, 2, 5),
(31, 2, 7),
(32, 2, 9),
(33, 2, 10),
(34, 2, 11),
(35, 2, 13),
(36, 2, 14),
(37, 2, 17),
(38, 2, 20),
(39, 2, 21),
(40, 2, 22),
(41, 2, 23),
(42, 2, 25),
(43, 2, 26),
(44, 2, 27),
(45, 3, 22),
(46, 3, 23),
(47, 3, 14),
(48, 3, 15),
(49, 3, 9),
(50, 3, 11),
(51, 3, 5),
(52, 3, 17),
(53, 3, 20),
(54, 3, 21),
(55, 3, 25),
(56, 4, 1),
(57, 4, 2),
(58, 4, 3),
(59, 4, 4),
(60, 4, 5),
(61, 4, 6),
(62, 4, 7),
(63, 4, 8),
(64, 4, 9),
(65, 4, 10),
(66, 4, 11),
(67, 4, 12),
(68, 4, 13),
(69, 4, 14),
(70, 4, 15),
(71, 4, 16),
(72, 4, 17),
(73, 4, 18),
(74, 4, 19),
(75, 4, 20),
(76, 4, 21),
(77, 4, 22),
(78, 4, 23),
(79, 4, 24),
(80, 4, 25),
(81, 4, 26),
(82, 4, 27),
(83, 4, 28),
(84, 4, 29),
(85, 4, 30),
(86, 4, 31),
(87, 4, 32),
(88, 1, 29),
(89, 1, 30),
(90, 1, 31),
(91, 1, 32),
(92, 2, 29),
(93, 2, 30),
(94, 2, 31),
(95, 3, 29),
(96, 3, 30),
(97, 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE IF NOT EXISTS `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `required_worker_count` int NOT NULL DEFAULT '1',
  `estimated_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `target_time` time DEFAULT NULL,
  `status` enum('pending','in-progress','completed','delayed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`task_id`),
  KEY `idx_tasks_project` (`project_id`),
  KEY `fk_tasks_pwbs` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `project_id`, `wbs_id`, `task_name`, `description`, `required_worker_count`, `estimated_hours`, `start_date`, `start_time`, `target_date`, `target_time`, `status`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(1, 1, 1, 'Trenching & Pipe Bedding', 'Excavate 500m trench and lay gravel bedding', 3, 80.00, '2026-08-01', NULL, '2026-08-30', NULL, 'in-progress', '2026-08-31 10:40:58', '2026-08-31 10:41:18', 0, NULL),
(2, 1, 2, 'Pipe Welding & Pressure Test', 'Weld steel pipe joints and conduct hydro testing', 2, 40.00, '2026-08-15', NULL, '2026-09-10', NULL, 'pending', '2026-08-31 10:40:58', '2026-08-31 10:41:18', 0, NULL),
(3, 2, 3, 'Transformer Foundation Concrete Pour', 'Pour heavy duty concrete foundation pad for transformer', 2, 50.00, '2026-08-10', NULL, '2026-08-25', NULL, 'completed', '2026-08-31 10:40:58', '2026-08-31 10:41:18', 0, NULL),
(4, 2, 4, 'High Voltage Cable Routing', 'Install tray systems and pull HV transmission cables', 3, 60.00, '2026-08-20', NULL, '2026-09-15', NULL, 'in-progress', '2026-08-31 10:40:58', '2026-08-31 10:41:18', 0, NULL),
(5, 3, 8, 'test', 'test', 2, 9.00, '2026-08-31', '10:25:00', '2026-08-31', '18:25:00', 'pending', '2026-08-31 10:59:15', '2026-08-31 10:59:15', 0, NULL),
(1001, 1001, 1001, 'Excavate North Pillar', 'Level the main pathway', 2, 40.00, '2026-08-28', NULL, '2026-09-07', NULL, 'in-progress', '2026-09-02 12:30:13', '2026-09-03 04:17:58', 0, NULL),
(1002, 1001, 1001, 'Pour Concrete Base', 'Initial layer of asphalt', 3, 60.00, '2026-08-31', NULL, '2026-09-12', NULL, 'pending', '2026-09-02 12:30:13', '2026-09-03 04:17:58', 0, NULL),
(1003, 1002, 1002, 'Install Streetlights', 'Mount 500 panels', 4, 120.00, '2026-08-26', NULL, '2026-09-16', NULL, 'in-progress', '2026-09-02 12:30:13', '2026-09-03 04:17:58', 0, NULL),
(1004, 1003, 1003, 'civil work', 'test', 1, 10.00, '2026-09-03', '10:30:00', '2026-09-03', '18:30:00', 'completed', '2026-09-03 05:01:59', '2026-09-07 07:21:55', 0, NULL),
(1005, 1003, 1006, 'test smita task', 'test', 4, 8.00, '2026-09-07', '09:00:00', '2026-09-07', '18:00:00', 'pending', '2026-09-07 09:29:05', '2026-09-07 09:29:05', 0, NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`assignment_id`, `task_id`, `employee_id`, `assigned_at`) VALUES
(1, 1, 3, '2026-08-31 10:40:58'),
(2, 1, 4, '2026-08-31 10:40:58'),
(4, 3, 3, '2026-08-31 10:40:58'),
(5, 3, 5, '2026-08-31 10:40:58'),
(6, 4, 3, '2026-08-31 10:40:58'),
(7, 4, 4, '2026-08-31 10:40:58'),
(8, 4, 5, '2026-08-31 10:40:58'),
(11, 5, 4, '2026-08-31 12:38:32'),
(12, 5, 5, '2026-08-31 12:38:32'),
(13, 5, 3, '2026-08-31 12:38:32'),
(14, 2, 4, '2026-08-31 12:38:49'),
(15, 2, 3, '2026-08-31 12:38:49'),
(16, 1001, 1003, '2026-09-02 12:30:13'),
(17, 1001, 1004, '2026-09-02 12:30:13'),
(18, 1002, 1003, '2026-09-02 12:30:13'),
(20, 1001, 102, '2026-09-03 04:17:58'),
(21, 1001, 103, '2026-09-03 04:17:58'),
(22, 1002, 102, '2026-09-03 04:17:58'),
(24, 1004, 1006, '2026-09-03 05:01:59'),
(25, 1003, 103, '2026-09-07 08:05:17'),
(26, 1003, 1005, '2026-09-07 08:05:17'),
(27, 1003, 3, '2026-09-07 08:05:17'),
(28, 1005, 1, '2026-09-07 09:29:05'),
(29, 1005, 1007, '2026-09-07 09:29:05');

-- --------------------------------------------------------

--
-- Table structure for table `task_labour_assignments`
--

DROP TABLE IF EXISTS `task_labour_assignments`;
CREATE TABLE IF NOT EXISTS `task_labour_assignments` (
  `task_id` int NOT NULL,
  `labour_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`,`labour_id`),
  KEY `labour_id` (`labour_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_labour_assignments`
--

INSERT INTO `task_labour_assignments` (`task_id`, `labour_id`, `assigned_at`) VALUES
(1005, 1, '2026-09-07 09:29:05');

-- --------------------------------------------------------

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
CREATE TABLE IF NOT EXISTS `timesheets` (
  `timesheet_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `employee_id` int NOT NULL,
  `log_date` date NOT NULL,
  `working_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`timesheet_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `timesheets`
--

INSERT INTO `timesheets` (`timesheet_id`, `project_id`, `wbs_id`, `task_id`, `employee_id`, `log_date`, `working_hours`, `comment`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(1, 1001, 1001, 1001, 1003, '2026-08-31', 8.50, 'Graded Sector A', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL),
(2, 1001, 1001, 1001, 1004, '2026-08-31', 8.75, 'Graded Sector B', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL),
(3, 1002, 1002, 1003, 1005, '2026-08-31', 9.00, 'Installed 50 panels', '2026-09-02 12:30:13', '2026-09-02 12:30:13', 0, NULL),
(4, 1001, 1001, 1001, 102, '2026-08-02', 8.00, 'Digging phase 1', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL),
(5, 1001, 1001, 1001, 103, '2026-08-02', 8.00, 'Assisting excavator', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL),
(6, 1001, 1001, 1001, 102, '2026-08-03', 10.00, 'Digging phase 2 (overtime)', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL),
(7, 1001, 1001, 1001, 103, '2026-08-03', 9.00, 'Assisting excavator', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL),
(8, 1001, 1001, 1002, 102, '2026-08-16', 8.00, 'Formwork for concrete', '2026-09-03 04:17:58', '2026-09-03 04:17:58', 0, NULL),
(9, 1001, 1001, 1002, 1006, '2026-09-07', 6.10, NULL, '2026-09-07 06:50:17', '2026-09-07 06:50:17', 0, NULL),
(10, 1003, 1003, 1004, 2, '2026-09-07', 5.60, NULL, '2026-09-07 07:21:33', '2026-09-07 07:21:33', 0, NULL),
(11, 1003, 1006, 1004, 1006, '2026-09-07', 6.10, NULL, '2026-09-07 07:35:46', '2026-09-07 07:35:46', 0, NULL),
(12, 1003, 1005, 1003, 1005, '2026-09-07', 8.10, NULL, '2026-09-07 07:36:15', '2026-09-07 07:36:15', 0, NULL),
(13, 1003, 1005, 1003, 3, '2026-09-07', 6.10, NULL, '2026-09-07 08:05:17', '2026-09-07 08:05:17', 0, NULL),
(14, 1003, 1008, 1, 3, '2026-09-07', 1.60, NULL, '2026-09-07 08:18:23', '2026-09-07 08:18:23', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `work_breakdown_structures`
--

DROP TABLE IF EXISTS `work_breakdown_structures`;
CREATE TABLE IF NOT EXISTS `work_breakdown_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wbs_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wbs_code` (`wbs_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_breakdown_structures`
--

INSERT INTO `work_breakdown_structures` (`id`, `wbs_code`, `wbs_name`, `description`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'WBS-TRENCHING&PIPEBEDDING', 'Trenching & Pipe Bedding', NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(2, 'WBS-PIPEWELDING&PRESSURETEST', 'Pipe Welding & Pressure Test', NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(3, 'WBS-TRANSFORMERFOUNDATIONCONCRETEPOUR', 'Transformer Foundation Concrete Pour', NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(4, 'WBS-HIGHVOLTAGECABLEROUTING', 'High Voltage Cable Routing', NULL, 1, NULL, NULL, NULL, '2026-08-31 16:11:18', '2026-08-31 16:11:18', NULL),
(101, 'CIVIL-01', 'Civil Works', 'Earthwork, foundations, concrete', 1, NULL, NULL, NULL, '2026-09-03 09:47:58', '2026-09-03 09:47:58', NULL),
(102, 'ELEC-01', 'Electrical Works', 'Wiring, substations, lighting', 1, NULL, NULL, NULL, '2026-09-03 09:47:58', '2026-09-03 09:47:58', NULL),
(103, 'MECH-01', 'Mechanical Works', 'Piping, HVAC, heavy machinery', 1, NULL, NULL, NULL, '2026-09-03 09:47:58', '2026-09-03 09:47:58', NULL),
(1001, 'WBS-CIV-01', 'Civil & Earthworks', 'Excavation, trenching, and grading', 1, NULL, NULL, NULL, '2026-09-02 18:00:13', '2026-09-02 18:00:13', NULL),
(1002, 'WBS-ELC-01', 'Electrical Installations', 'Wiring, panels, and transformers', 1, NULL, NULL, NULL, '2026-09-02 18:00:13', '2026-09-02 18:00:13', NULL);

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
-- Constraints for table `project_wbs`
--
ALTER TABLE `project_wbs`
  ADD CONSTRAINT `fk_pwbs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pwbs_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tasks_pwbs` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE;

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
