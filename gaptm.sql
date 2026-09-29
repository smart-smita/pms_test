-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 29, 2026 at 07:51 AM
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
  `in_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('open','completed','outside_area','missing_checkout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `in_distance_meters` decimal(10,2) DEFAULT NULL,
  `out_distance_meters` decimal(10,2) DEFAULT NULL,
  `project_radius_meters` int DEFAULT '500',
  `in_status` enum('inside','outside') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `out_status` enum('inside','outside') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_attendance_emp_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_task` (`task_id`),
  KEY `idx_attendance_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`attendance_id`, `employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`, `created_at`, `updated_at`, `in_distance_meters`, `out_distance_meters`, `project_radius_meters`, `in_status`, `out_status`, `is_deleted`, `deleted_at`) VALUES
(1, 4, 1006, '2026-09-12', '2026-09-12 06:12:00', '2026-09-12 15:15:00', 18.64304990, 73.79690030, 'Site GPS: 18.643050, 73.796900', NULL, NULL, NULL, 9.05, 'completed', '2026-09-12 06:12:50', '2026-09-12 09:45:38', 15024.03, NULL, 500, 'outside', 'inside', 0, NULL),
(2, 2, NULL, '2026-09-12', '2026-09-12 15:04:59', NULL, 18.64306053, 73.79690407, 'Site GPS: 18.643061, 73.796904', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-12 09:34:59', '2026-09-17 10:30:09', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(3, 3, NULL, '2026-09-12', '2026-09-12 15:09:44', '2026-09-12 15:37:35', 18.64307723, 73.79688903, 'Site GPS: 18.643077, 73.796889', 18.64307723, 73.79688903, 'Site GPS: 18.643077, 73.796889', 0.46, 'completed', '2026-09-12 09:39:44', '2026-09-12 10:07:35', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(4, 4, NULL, '2026-09-12', '2026-09-12 15:38:22', NULL, 18.64307723, 73.79688903, 'Site GPS: 18.643077, 73.796889', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-12 10:08:22', '2026-09-17 10:30:09', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(5, 4, 1013, '2026-09-17', '2026-09-17 17:22:30', NULL, 18.64304990, 73.79692300, 'Site GPS: 18.643050, 73.796923', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-17 11:52:30', '2026-09-17 11:52:30', 15023.03, NULL, 500, 'outside', 'inside', 0, NULL),
(6, 3, NULL, '2026-09-18', '2026-09-18 13:36:11', NULL, 18.64257526, 73.79817995, 'Site GPS: 18.642575, 73.798180', NULL, NULL, NULL, 0.00, 'missing_checkout', '2026-09-18 08:06:11', '2026-09-19 08:27:43', NULL, NULL, 500, 'inside', 'inside', 0, NULL),
(7, 4, 1019, '2026-09-18', '2026-09-18 15:34:50', NULL, 18.64305376, 73.79689966, 'Site GPS: 18.643054, 73.796900', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-18 10:04:50', '2026-09-18 10:04:50', 15024.45, NULL, 500, 'outside', 'inside', 0, NULL),
(8, 1, 1019, '2026-09-18', '2026-09-18 15:51:59', NULL, 18.64304990, 73.79692300, 'Site GPS: 18.643050, 73.796923', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-18 10:21:59', '2026-09-18 10:21:59', 15023.03, NULL, 500, 'outside', 'inside', 0, NULL),
(9, 2, 1039, '2026-09-19', '2026-09-19 15:38:28', NULL, 18.64306240, 73.79691853, 'Site GPS: 18.643062, 73.796919', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-19 10:08:28', '2026-09-19 10:08:28', 15024.48, NULL, 500, 'outside', 'inside', 0, NULL),
(10, 2, 1039, '2026-09-19', '2026-09-19 15:40:30', NULL, 18.64257526, 73.79817995, 'Site GPS: 18.642575, 73.798180', NULL, NULL, NULL, 0.00, 'outside_area', '2026-09-19 10:10:30', '2026-09-19 10:10:30', 14919.88, NULL, 500, 'outside', 'inside', 0, NULL);

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
) ENGINE=MyISAM AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `module`, `description`, `record_id`, `ip_address`, `created_at`) VALUES
(1, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 05:20:11'),
(2, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 05:36:22'),
(3, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 05:59:28'),
(4, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 07:42:32'),
(5, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 08:31:22'),
(6, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 09:14:12'),
(7, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 09:31:36'),
(8, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 09:46:56'),
(9, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 10:04:28'),
(10, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 10:36:23'),
(11, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 11:01:50'),
(12, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 11:17:35'),
(13, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 11:50:40'),
(14, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-11 12:16:08'),
(15, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 06:02:34'),
(16, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-12 06:12:50'),
(17, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 06:19:13'),
(18, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 06:37:45'),
(19, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:01:17'),
(20, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:01:20'),
(21, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:07:51'),
(22, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:25:22'),
(23, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:40:50'),
(24, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 07:53:43'),
(25, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 08:10:29'),
(26, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 09:11:57'),
(27, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 09:20:10'),
(28, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-12 09:31:26'),
(29, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-12 09:34:59'),
(30, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 09:39:04'),
(31, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-12 09:39:20'),
(32, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-12 09:39:44'),
(33, 4, 'login', 'auth', 'User logged in: EMP004', 4, '::1', '2026-09-12 09:41:06'),
(34, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 09:42:46'),
(35, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:02:03'),
(36, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:03:15'),
(37, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:06:10'),
(38, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-12 10:06:29'),
(39, NULL, 'check-out', 'attendance', 'GPS Check-Out recorded', NULL, '::1', '2026-09-12 10:07:35'),
(40, 4, 'login', 'auth', 'User logged in: EMP004', 4, '::1', '2026-09-12 10:08:20'),
(41, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-12 10:08:22'),
(42, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:18:40'),
(43, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:34:19'),
(44, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 10:34:21'),
(45, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 11:11:28'),
(46, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 11:19:04'),
(47, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-12 11:37:29'),
(48, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 10:10:27'),
(49, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 10:25:29'),
(50, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 11:25:40'),
(51, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 11:40:45'),
(52, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-17 11:52:30'),
(53, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 11:56:06'),
(54, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 12:02:04'),
(55, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-17 12:19:19'),
(56, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 04:39:15'),
(57, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 05:03:07'),
(58, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 05:18:20'),
(59, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 05:36:44'),
(60, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 05:53:40'),
(61, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 06:09:36'),
(62, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 06:38:39'),
(63, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 06:51:27'),
(64, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 07:19:56'),
(65, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 07:37:08'),
(66, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 07:48:29'),
(67, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 08:03:33'),
(68, 3, 'login', 'auth', 'User logged in: EMP001', 3, '::1', '2026-09-18 08:06:00'),
(69, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-18 08:06:11'),
(70, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 09:46:35'),
(71, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 10:03:14'),
(72, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-18 10:04:50'),
(73, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 10:08:31'),
(74, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-18 10:21:59'),
(75, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 10:23:44'),
(76, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 10:39:11'),
(77, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 10:56:51'),
(78, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 11:12:59'),
(79, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 11:13:01'),
(80, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 11:29:34'),
(81, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 11:44:43'),
(82, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-18 12:09:49'),
(83, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 08:23:21'),
(84, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 08:25:29'),
(85, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 08:26:00'),
(86, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 09:00:41'),
(87, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 09:01:27'),
(88, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 09:08:34'),
(89, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 09:09:17'),
(90, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 09:28:12'),
(91, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 09:43:58'),
(92, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 09:44:23'),
(93, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 09:59:31'),
(94, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 10:00:24'),
(95, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 10:04:03'),
(96, 5, 'login', 'auth', 'User logged in: EMP203', 5, '::1', '2026-09-19 10:05:13'),
(97, 2, 'login', 'auth', 'User logged in: MGR001', 2, '::1', '2026-09-19 10:05:52'),
(98, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-19 10:08:28'),
(99, NULL, 'check-in', 'attendance', 'GPS Check-In recorded', NULL, '::1', '2026-09-19 10:10:30'),
(100, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 10:22:45'),
(101, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 10:41:21'),
(102, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-19 11:10:45'),
(103, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-22 11:44:32'),
(104, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-22 12:17:50'),
(105, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-22 12:36:40'),
(106, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-22 12:55:26'),
(107, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-22 13:10:30'),
(108, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-23 05:41:00'),
(109, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-23 06:38:09'),
(110, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 08:24:56'),
(111, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 09:11:27'),
(112, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 09:12:16'),
(113, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 09:26:37'),
(114, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 09:42:04'),
(115, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 09:58:16'),
(116, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 10:19:50'),
(117, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 10:34:57'),
(118, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-24 11:23:21'),
(119, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 07:59:18'),
(120, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 08:45:45'),
(121, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 08:46:15'),
(122, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 09:04:18'),
(123, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 09:46:06'),
(124, 1, 'CREATE_SITE_SURVEY', 'site_surveys', 'Recorded site survey SRV-202609-0001 for project #1015', 1, '::1', '2026-09-28 09:53:44'),
(125, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 10:01:33'),
(126, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 10:20:08'),
(127, 1, 'UPLOAD_DOCUMENT', 'documents', 'Document \'test labor - Passport\' (Passport) uploaded for labour #7', 2, '::1', '2026-09-28 10:32:04'),
(128, 1, 'UPLOAD_DOCUMENT', 'documents', 'Document \'test labor - Visa (Work Visa)\' (Visa) uploaded for labour #7', 3, '::1', '2026-09-28 10:32:04'),
(129, 1, 'UPLOAD_DOCUMENT', 'documents', 'Document \'test labor - Labour Card\' (Labour Card) uploaded for labour #7', 4, '::1', '2026-09-28 10:32:04'),
(130, 1, 'UPLOAD_DOCUMENT', 'documents', 'Document \'test labor - Contract (Direct Employment)\' (Labour Contract) uploaded for labour #7', 5, '::1', '2026-09-28 10:32:04'),
(131, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 10:35:15'),
(132, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 10:50:00'),
(133, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 11:05:23'),
(134, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 11:21:16'),
(135, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 12:54:00'),
(136, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-28 13:09:17'),
(137, 1, 'login', 'auth', 'User logged in: ADMIN001', 1, '::1', '2026-09-29 06:28:24');

-- --------------------------------------------------------

--
-- Table structure for table `billing_schedules`
--

DROP TABLE IF EXISTS `billing_schedules`;
CREATE TABLE IF NOT EXISTS `billing_schedules` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `quotation_id` int NOT NULL,
  `billing_month` date NOT NULL COMMENT 'e.g. 2026-01-01 for Jan 2026',
  `expected_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','completed_work_logged','invoiced','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `billing_schedules`
--

INSERT INTO `billing_schedules` (`schedule_id`, `project_id`, `quotation_id`, `billing_month`, `expected_amount`, `status`, `created_at`) VALUES
(1, 1004, 2, '2026-09-01', 131.25, 'completed_work_logged', '2026-09-28 09:54:39'),
(2, 1004, 2, '2026-10-01', 131.25, 'completed_work_logged', '2026-09-28 09:54:39'),
(3, 1004, 2, '2026-11-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(4, 1004, 2, '2026-12-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(5, 1004, 2, '2027-01-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(6, 1004, 2, '2027-02-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(7, 1004, 2, '2027-03-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(8, 1004, 2, '2027-04-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(9, 1004, 2, '2027-05-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(10, 1004, 2, '2027-06-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(11, 1004, 2, '2027-07-01', 131.25, 'pending', '2026-09-28 09:54:39'),
(12, 1004, 2, '2027-08-01', 131.25, 'pending', '2026-09-28 09:54:39');

-- --------------------------------------------------------

--
-- Table structure for table `communities`
--

DROP TABLE IF EXISTS `communities`;
CREATE TABLE IF NOT EXISTS `communities` (
  `community_id` int NOT NULL AUTO_INCREMENT,
  `community_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`community_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `communities`
--

INSERT INTO `communities` (`community_id`, `community_name`, `country_id`, `state`, `status`, `created_at`) VALUES
(1, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 09:14:08'),
(2, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 09:14:08'),
(3, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 09:14:08'),
(4, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 09:14:08'),
(5, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 09:14:08'),
(6, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 09:14:08'),
(7, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 09:14:08'),
(8, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 09:14:50'),
(9, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 09:14:50'),
(10, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 09:14:50'),
(11, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 09:14:50'),
(12, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 09:14:50'),
(13, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 09:14:50'),
(14, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 09:14:50'),
(15, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 09:15:23'),
(16, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 09:15:23'),
(17, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 09:15:23'),
(18, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 09:15:23'),
(19, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 09:15:23'),
(20, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 09:15:23'),
(21, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 09:15:23'),
(22, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 09:45:02'),
(23, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 09:45:02'),
(24, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 09:45:02'),
(25, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 09:45:02'),
(26, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 09:45:02'),
(27, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 09:45:02'),
(28, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 09:45:02'),
(29, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 10:51:07'),
(30, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 10:51:07'),
(31, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 10:51:07'),
(32, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 10:51:07'),
(33, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 10:51:07'),
(34, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 10:51:07'),
(35, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 10:51:07'),
(36, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 10:57:23'),
(37, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 10:57:23'),
(38, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 10:57:23'),
(39, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 10:57:23'),
(40, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 10:57:23'),
(41, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 10:57:23'),
(42, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 10:57:23'),
(43, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:16:03'),
(44, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:16:03'),
(45, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:16:03'),
(46, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:16:03'),
(47, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:16:03'),
(48, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:16:03'),
(49, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:16:03'),
(50, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:17:47'),
(51, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:17:47'),
(52, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:17:47'),
(53, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:17:47'),
(54, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:17:47'),
(55, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:17:47'),
(56, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:17:47'),
(57, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:19:37'),
(58, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:19:37'),
(59, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:19:37'),
(60, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:19:37'),
(61, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:19:37'),
(62, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:19:37'),
(63, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:19:37'),
(64, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:20:22'),
(65, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:20:22'),
(66, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:20:22'),
(67, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:20:22'),
(68, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:20:22'),
(69, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:20:22'),
(70, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:20:22'),
(71, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:40:39'),
(72, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:40:39'),
(73, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:40:39'),
(74, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:40:39'),
(75, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:40:39'),
(76, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:40:39'),
(77, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:40:39'),
(78, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:41:16'),
(79, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:41:16'),
(80, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:41:16'),
(81, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:41:16'),
(82, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:41:16'),
(83, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:41:16'),
(84, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:41:16'),
(85, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:43:14'),
(86, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:43:14'),
(87, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:43:14'),
(88, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:43:14'),
(89, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:43:14'),
(90, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:43:14'),
(91, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:43:14'),
(92, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:45:46'),
(93, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:45:46'),
(94, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:45:46'),
(95, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:45:46'),
(96, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:45:46'),
(97, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:45:46'),
(98, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:45:46'),
(99, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:46:38'),
(100, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:46:38'),
(101, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:46:38'),
(102, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:46:38'),
(103, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:46:38'),
(104, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:46:38'),
(105, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:46:38'),
(106, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-28 11:48:13'),
(107, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-28 11:48:13'),
(108, 'Business Bay', NULL, 'Dubai', 1, '2026-09-28 11:48:13'),
(109, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-28 11:48:13'),
(110, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-28 11:48:13'),
(111, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-28 11:48:13'),
(112, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-28 11:48:13'),
(113, 'Downtown Dubai', NULL, 'Dubai', 1, '2026-09-29 06:28:15'),
(114, 'Dubai Marina', NULL, 'Dubai', 1, '2026-09-29 06:28:15'),
(115, 'Business Bay', NULL, 'Dubai', 1, '2026-09-29 06:28:15'),
(116, 'Jumeirah Beach Residence', NULL, 'Dubai', 1, '2026-09-29 06:28:15'),
(117, 'Whitefield', NULL, 'Karnataka', 1, '2026-09-29 06:28:15'),
(118, 'Bandra West', NULL, 'Maharashtra', 1, '2026-09-29 06:28:15'),
(119, 'DLF Cyber City', NULL, 'Haryana', 1, '2026-09-29 06:28:15');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
CREATE TABLE IF NOT EXISTS `countries` (
  `country_id` int NOT NULL AUTO_INCREMENT,
  `country_code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISO 3166-1 alpha-2',
  `country_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`country_id`),
  UNIQUE KEY `country_code` (`country_code`)
) ENGINE=InnoDB AUTO_INCREMENT=961 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`country_id`, `country_code`, `country_name`, `phone_code`, `status`, `created_at`) VALUES
(1, 'IN', 'India', '+91', 1, '2026-09-22 12:20:31'),
(2, 'AE', 'United Arab Emirates', '+971', 1, '2026-09-22 12:20:31'),
(3, 'SA', 'Saudi Arabia', '+966', 1, '2026-09-22 12:20:32'),
(4, 'QA', 'Qatar', '+974', 1, '2026-09-22 12:20:32'),
(5, 'KW', 'Kuwait', '+965', 1, '2026-09-22 12:20:32'),
(6, 'BH', 'Bahrain', '+973', 1, '2026-09-22 12:20:32'),
(7, 'OM', 'Oman', '+968', 1, '2026-09-22 12:20:32'),
(8, 'GB', 'United Kingdom', '+44', 1, '2026-09-22 12:20:32'),
(9, 'US', 'United States', '+1', 1, '2026-09-22 12:20:32'),
(10, 'SG', 'Singapore', '+65', 1, '2026-09-22 12:20:33'),
(11, 'AU', 'Australia', '+61', 1, '2026-09-22 12:20:33'),
(12, 'NZ', 'New Zealand', '+64', 1, '2026-09-22 12:20:33'),
(13, 'PK', 'Pakistan', '+92', 1, '2026-09-22 12:20:33'),
(14, 'BD', 'Bangladesh', '+880', 1, '2026-09-22 12:20:33'),
(15, 'NP', 'Nepal', '+977', 1, '2026-09-22 12:20:33'),
(16, 'LK', 'Sri Lanka', '+94', 1, '2026-09-22 12:20:33');

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
CREATE TABLE IF NOT EXISTS `currencies` (
  `currency_id` int NOT NULL AUTO_INCREMENT,
  `currency_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exchange_rate` decimal(15,6) DEFAULT '1.000000',
  `is_base` tinyint(1) DEFAULT '0',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_code` (`currency_code`)
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`currency_id`, `currency_code`, `currency_name`, `symbol`, `exchange_rate`, `is_base`, `status`, `created_at`) VALUES
(1, 'AED', 'UAE Dirham', 'AED', 1.000000, 1, 1, '2026-09-23 05:40:51'),
(2, 'INR', 'Indian Rupee', '₹', 22.500000, 0, 1, '2026-09-23 05:40:51'),
(3, 'USD', 'US Dollar', '$', 0.270000, 0, 1, '2026-09-23 05:40:51');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community_id` int DEFAULT NULL,
  `nationality_id` int DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `customer_code` (`customer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `customer_code`, `customer_name`, `contact_person`, `contact_number`, `email`, `country_id`, `state`, `city`, `community_id`, `nationality_id`, `address`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'CUST001', 'Unitglo', 'Smita', '12345678945', 'client@gmail.com', 1, 'Maharashtra', 'Pune', NULL, 1, 'Pune - Satara Rd', 'active', 1, 1, '2026-09-22 12:56:26', '2026-09-24 09:42:27');

-- --------------------------------------------------------

--
-- Table structure for table `disciplines`
--

DROP TABLE IF EXISTS `disciplines`;
CREATE TABLE IF NOT EXISTS `disciplines` (
  `discipline_id` int NOT NULL AUTO_INCREMENT,
  `discipline_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discipline_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`discipline_id`),
  UNIQUE KEY `discipline_code` (`discipline_code`)
) ENGINE=InnoDB AUTO_INCREMENT=591 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disciplines`
--

INSERT INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'CIVIL', 'Civil Works', NULL, 1, 1, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(2, 'ELECTRICAL', 'Electrical Installation', NULL, 1, 2, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(3, 'PLUMBING', 'Plumbing & Drainage', NULL, 1, 3, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(4, 'HVAC', 'HVAC & Air Conditioning', NULL, 1, 4, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(5, 'CARPENTRY', 'Carpentry & Joinery', NULL, 1, 5, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(6, 'FINISHING', 'Interior & Exterior Finishing', NULL, 1, 6, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(7, 'STRUCTURAL', 'Structural Steelwork', NULL, 1, 7, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(8, 'PAINTING', 'Painting & Coating', NULL, 1, 8, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(9, 'MAINTENANCE', 'General Maintenance', NULL, 1, 9, '2026-09-22 12:38:53', '2026-09-22 12:38:53'),
(10, 'FIRE_SAFETY', 'Fire Fighting & Safety', NULL, 1, 10, '2026-09-22 12:38:53', '2026-09-22 12:38:53');

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
CREATE TABLE IF NOT EXISTS `document_types` (
  `doc_type_id` int NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('employee','labour','project','quotation','all') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `has_expiry` tinyint(1) NOT NULL DEFAULT '1',
  `has_number` tinyint(1) NOT NULL DEFAULT '1',
  `has_issue_date` tinyint(1) NOT NULL DEFAULT '1',
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `country_id` int DEFAULT NULL COMMENT 'NULL = universal',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`doc_type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=724 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`doc_type_id`, `type_code`, `type_name`, `applies_to`, `has_expiry`, `has_number`, `has_issue_date`, `is_required`, `country_id`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'PASSPORT', 'Passport', 'all', 1, 1, 1, 0, NULL, 1, 1, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(2, 'VISA', 'Visa', 'all', 1, 1, 1, 0, NULL, 1, 2, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(3, 'LABOUR_CARD', 'Labour Card', 'labour', 1, 1, 1, 0, NULL, 1, 3, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(4, 'CONTRACT', 'Employment Contract', 'all', 1, 1, 1, 0, NULL, 1, 4, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(5, 'NATIONAL_ID', 'National ID / Aadhaar', 'all', 0, 1, 0, 0, NULL, 1, 5, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(6, 'PAN_CARD', 'PAN Card', 'employee', 0, 1, 0, 0, NULL, 1, 6, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(7, 'EMIRATES_ID', 'Emirates ID', 'all', 1, 1, 1, 0, NULL, 1, 7, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(8, 'MEDICAL_FITNESS', 'Medical Fitness Certificate', 'all', 1, 1, 1, 0, NULL, 1, 8, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(9, 'PERMISSION_DOC', 'Permission Document', 'project', 1, 1, 1, 0, NULL, 1, 9, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(10, 'DRAWING', 'Drawing / Blueprint', 'project', 0, 1, 1, 0, NULL, 1, 10, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(11, 'INSURANCE', 'Insurance Certificate', 'project', 1, 1, 1, 0, NULL, 1, 11, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(12, 'NOC', 'No Objection Certificate', 'project', 1, 1, 1, 0, NULL, 1, 12, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(289, 'LABOUR_CONTRACT', 'Labour Contract', 'labour', 1, 1, 1, 0, NULL, 1, 0, '2026-09-24 11:29:58', '2026-09-24 11:29:58'),
(290, 'OTHER_GOV_DOC', 'Other Government Document', 'all', 1, 1, 1, 0, NULL, 1, 0, '2026-09-24 11:29:58', '2026-09-24 11:29:58'),
(291, 'OTHER', 'Other Document', 'all', 0, 0, 0, 0, NULL, 1, 0, '2026-09-24 11:29:58', '2026-09-24 11:29:58');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `department` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT '25.00',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `reporting_to_id` int DEFAULT NULL,
  `assigned_project_id` int DEFAULT NULL,
  `assigned_wbs_id` int DEFAULT NULL,
  `nationality_id` int DEFAULT NULL,
  `community_id` int DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `emreads_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employees_roles` (`role_id`),
  KEY `idx_employees_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `employee_code`, `name`, `email`, `password_hash`, `role_id`, `department`, `hourly_rate`, `status`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `reporting_to_id`, `assigned_project_id`, `assigned_wbs_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `contact_number`) VALUES
(1, 'ADMIN001', 'System Administrator', 'admin@htco.com', '$2b$10$EoXPgN7Z4OFpoLfyglsX7eRato2giwvLA6s3wM77l48URyXZG83/q', 1, NULL, 50.00, 'active', '2026-08-31 10:40:58', '2026-08-31 10:41:32', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'MGR001', 'Sarah Jenkins', 'sjenkins@htco.com', '$2b$10$oQdH9gs1JZmSMPcovVsYNOk8ioLoyf3dznnv86UhkcOxlgjmSdC8i', 2, NULL, 40.00, 'active', '2026-08-31 10:40:58', '2026-09-07 07:24:44', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'EMP001', 'John Doe', 'jdoe@htco.com', '$2b$10$HEfM1fGlASNZ5BrLbv4rluspCYXwuRZh4KLx76k4mJivAK3hk0zkm', 3, NULL, 25.00, 'active', '2026-08-31 10:40:58', '2026-09-12 11:21:00', 0, NULL, 2, 1004, 1011, NULL, NULL, NULL, NULL, NULL),
(4, 'EMP004', 'Smita', 'smita@gmail.com', '$2b$10$rnKj3eOglC6QPTxfr/L3N.5onfA/1d8gkF1u8bIeohBQ1HBSU.e/W', 3, NULL, 25.00, 'active', '2026-09-11 05:23:06', '2026-09-19 10:04:54', 0, NULL, 5, 1004, 1003, NULL, NULL, NULL, NULL, NULL),
(5, 'EMP203', 'Anmol', 'anmol@gmail.com', '$2b$10$YEhn0/cAdzNS1q64rd6RZu92H/vUwBgXXvXMla6N/4K5uU7YhAKcS', 2, NULL, 25.00, 'active', '2026-09-19 10:04:40', '2026-09-19 10:04:40', 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_documents`
--

DROP TABLE IF EXISTS `employee_documents`;
CREATE TABLE IF NOT EXISTS `employee_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `document_type` enum('passport','visa','national_id','labour_card','contract') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `issuing_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issuing_country_id` int DEFAULT NULL,
  `document_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT '0',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., visa_type or contract_type',
  `status` enum('active','expiring_soon','expired','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_emp_doc` (`employee_id`,`document_type`),
  KEY `idx_emp_expiry` (`expiry_date`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `entity_documents`
--

DROP TABLE IF EXISTS `entity_documents`;
CREATE TABLE IF NOT EXISTS `entity_documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `entity_type` enum('employee','labour','project','quotation','discipline') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `doc_type_id` int NOT NULL,
  `document_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT '0',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','expiring_soon','expired','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_current` tinyint(1) NOT NULL DEFAULT '1',
  `replaced_by_id` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `doc_type_id` (`doc_type_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_entity_doc` (`entity_type`,`entity_id`),
  KEY `idx_expiry` (`expiry_date`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `entity_documents`
--

INSERT INTO `entity_documents` (`document_id`, `entity_type`, `entity_id`, `doc_type_id`, `document_name`, `document_number`, `issue_date`, `expiry_date`, `file_path`, `file_size`, `mime_type`, `status`, `is_current`, `replaced_by_id`, `notes`, `uploaded_by`, `created_at`, `updated_at`) VALUES
(1, 'employee', 3, 1, 'retgretgtrr', 'A12345-X', '2026-09-01', '2026-10-11', '/uploads/documents/employee_3_1790242556976.png', 265114, 'image/png', 'active', 1, NULL, NULL, 1, '2026-09-24 09:35:56', '2026-09-24 09:35:56'),
(2, 'labour', 7, 1, 'test labor - Passport', 'N45678912389', '2026-01-01', '2035-12-01', '/uploads/documents/labour_7_1790591524245_662.jpg', 67673, 'image/jpeg', 'active', 1, NULL, NULL, 1, '2026-09-28 10:32:04', '2026-09-28 10:32:04'),
(3, 'labour', 7, 2, 'test labor - Visa (Work Visa)', '201/2026/123456', '2026-01-01', '2026-12-01', '/uploads/documents/sample_document.pdf', 0, 'application/pdf', 'active', 1, NULL, NULL, 1, '2026-09-28 10:32:04', '2026-09-28 10:32:04'),
(4, 'labour', 7, 3, 'test labor - Labour Card', 'LC-451263', '2026-03-01', '2026-12-01', '/uploads/documents/labour_7_1790591524363_863.jpg', 57673, 'image/jpeg', 'active', 1, NULL, NULL, 1, '2026-09-28 10:32:04', '2026-09-28 10:32:04'),
(5, 'labour', 7, 289, 'test labor - Contract (Direct Employment)', 'CON-12-4566', '2026-01-11', '2026-12-01', '/uploads/documents/sample_document.pdf', 0, 'application/pdf', 'active', 1, NULL, 'Direct Employment', 1, '2026-09-28 10:32:04', '2026-09-28 10:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `expiry_notifications_log`
--

DROP TABLE IF EXISTS `expiry_notifications_log`;
CREATE TABLE IF NOT EXISTS `expiry_notifications_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `entity_type` enum('employee','labour','project','quotation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `days_before` int NOT NULL COMMENT '10, 8, 5, 3, 2, 1, 0 (expired)',
  `recipient_user_id` int NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_status` enum('sent','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expiry_sent` (`document_id`,`days_before`,`recipient_user_id`),
  KEY `recipient_user_id` (`recipient_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipt_notes`
--

DROP TABLE IF EXISTS `goods_receipt_notes`;
CREATE TABLE IF NOT EXISTS `goods_receipt_notes` (
  `grn_id` int NOT NULL AUTO_INCREMENT,
  `grn_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_id` int NOT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_date` date NOT NULL,
  `delivery_challan_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`grn_id`),
  UNIQUE KEY `grn_number` (`grn_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `project_id` int NOT NULL,
  `quotation_id` int NOT NULL,
  `schedule_id` int NOT NULL,
  `survey_id` int DEFAULT NULL,
  `currency_id` int NOT NULL,
  `tax_id` int DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','pending_approval','approved','sent','partially_paid','paid','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `currency_id` (`currency_id`),
  KEY `tax_id` (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `discipline_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `is_extra_work` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`item_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `discipline_id` (`discipline_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_payments`
--

DROP TABLE IF EXISTS `invoice_payments`;
CREATE TABLE IF NOT EXISTS `invoice_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `assigned_project_id` int DEFAULT NULL,
  `nationality_id` int DEFAULT NULL,
  `community_id` int DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `emreads_id` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`labour_id`),
  KEY `fk_labour_assigned_project` (`assigned_project_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labours`
--

INSERT INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`) VALUES
(1, 'Shivani Shinde', '1234567890', '123456789012', 'direct_labour', '2026-09-11 09:14:50', '2026-09-11 09:14:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(2, 'Tejas', '1234569870', '562341789203563465', 'contractor', '2026-09-11 09:15:13', '2026-09-11 09:15:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(3, 'Ramesh Kumar', '9876543210', '123456789012', 'direct_labour', '2026-09-11 11:14:35', '2026-09-11 11:14:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(4, 'Suresh Patel', '9876543211', '123456789013', 'contractor', '2026-09-11 11:14:35', '2026-09-11 11:14:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(5, 'krishna', '1234567896', '123456789562', 'contractor', '2026-09-12 06:50:53', '2026-09-12 06:50:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(6, 'smita', '1234567895', '125647896325', 'direct_labour', '2026-09-17 12:22:49', '2026-09-17 12:22:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL),
(7, 'test labor', '661234567890', '123456789456', 'direct_labour', '2026-09-28 10:32:04', '2026-09-28 10:32:04', 5, 1008, 2, NULL, 2, '7894561230789456', NULL, 'active', 0, NULL);

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `labour_payments`
--

DROP TABLE IF EXISTS `labour_payments`;
CREATE TABLE IF NOT EXISTS `labour_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `payment_code` varchar(50) NOT NULL,
  `labour_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `total_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(50) DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','paid','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `remarks` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payment_code` (`payment_code`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labour_payments`
--

INSERT INTO `labour_payments` (`payment_id`, `payment_code`, `labour_id`, `project_id`, `payment_date`, `total_hours`, `total_amount`, `payment_method`, `reference_number`, `status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'PAY-TEST-001', 4, 1004, '2026-03-07', 10.00, 3000.00, 'bank_transfer', NULL, 'paid', 'Settlement for cable trenching log', NULL, '2026-09-11 11:14:35', '2026-09-11 11:14:35');

-- --------------------------------------------------------

--
-- Table structure for table `labour_payment_items`
--

DROP TABLE IF EXISTS `labour_payment_items`;
CREATE TABLE IF NOT EXISTS `labour_payment_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `work_log_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payment_log` (`payment_id`,`work_log_id`),
  KEY `work_log_id` (`work_log_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labour_payment_items`
--

INSERT INTO `labour_payment_items` (`id`, `payment_id`, `work_log_id`, `amount`) VALUES
(1, 1, 3, 3000.00);

-- --------------------------------------------------------

--
-- Table structure for table `labour_work_logs`
--

DROP TABLE IF EXISTS `labour_work_logs`;
CREATE TABLE IF NOT EXISTS `labour_work_logs` (
  `work_log_id` int NOT NULL AUTO_INCREMENT,
  `labour_id` int NOT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_id` int NOT NULL,
  `work_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rate_type` enum('hourly','daily') NOT NULL DEFAULT 'hourly',
  `rate` decimal(10,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `work_description` text,
  `work_status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'completed',
  `payment_status` enum('pending','approved','paid','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `in_address` text,
  `out_address` text,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `labour_count` int NOT NULL DEFAULT '1' COMMENT 'Number of labourers allocated from contractor for this task/date',
  `rate_per_labour` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Rate per individual labourer',
  PRIMARY KEY (`work_log_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labour_work_logs`
--

INSERT INTO `labour_work_logs` (`work_log_id`, `labour_id`, `project_id`, `wbs_id`, `task_id`, `work_date`, `in_time`, `out_time`, `total_working_hours`, `rate_type`, `rate`, `amount`, `work_description`, `work_status`, `payment_status`, `created_by`, `updated_by`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `in_address`, `out_address`, `in_latitude`, `in_longitude`, `out_latitude`, `out_longitude`, `labour_count`, `rate_per_labour`) VALUES
(5, 4, 1004, 1015, 1011, '2026-03-06', NULL, NULL, 8.00, 'hourly', 250.00, 2000.00, 'Foundation reinforcement', 'completed', 'paid', NULL, NULL, 0, NULL, '2026-09-11 11:14:35', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(6, 4, 1004, 1016, 1013, '2026-03-06', NULL, NULL, 10.00, 'hourly', 300.00, 3000.00, 'Cable trenching heavy duty', 'completed', 'paid', NULL, NULL, 0, NULL, '2026-09-11 11:14:35', '2026-09-11 11:16:32', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(4, 3, 1004, 1015, 1011, '2026-03-05', NULL, NULL, 8.00, 'hourly', 200.00, 1600.00, 'Foundation digging', 'completed', 'paid', NULL, NULL, 0, NULL, '2026-09-11 11:14:35', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(7, 5, 1004, 1016, 1014, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 500.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 09:46:57', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(8, 5, 1004, 1016, 1014, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 500.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 09:46:57', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(9, 5, 1004, 1018, 1016, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 500.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 11:18:17', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(10, 4, 1004, 1019, 1017, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 499.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 11:18:34', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(11, 3, 1004, 1014, 1008, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 200.00, 'ttt', 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 11:19:01', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(12, 2, 1004, 1014, 1008, '2026-09-12', NULL, NULL, 0.00, 'hourly', 0.00, 300.00, 'tttt', 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-12 11:19:01', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(13, 6, 1004, 1017, 1015, '2026-09-17', NULL, NULL, 0.00, 'hourly', 0.00, 600.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-17 12:23:36', '2026-09-18 07:53:50', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(14, 6, 1004, 1018, 1016, '2026-09-17', NULL, NULL, 0.00, 'hourly', 0.00, 60.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-17 12:25:06', '2026-09-18 06:44:37', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(15, 6, 1004, 1014, 1018, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 598.00, 'testr1', 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-18 05:17:41', '2026-09-18 08:02:29', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(16, 5, 1004, 1014, 1018, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 200.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-18 05:48:26', '2026-09-18 08:02:29', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(17, 3, 1004, 1014, 1018, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 500.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-18 05:49:18', '2026-09-18 06:45:24', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(18, 5, 1008, 1022, 1019, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 100.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-18 07:48:24', '2026-09-18 08:01:36', 'Pimpri Chinchwad Pune', 'Pimpri Chinchwad Pune', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(19, 4, 1008, 1022, 1019, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 200.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-18 07:48:24', '2026-09-18 08:01:15', 'Pimpri Chinchwad Pune', 'Pimpri Chinchwad Pune', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(20, 1, 1004, 1017, 1015, '2026-09-15', NULL, NULL, 0.00, 'hourly', 0.00, 100.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-18 07:53:50', '2026-09-18 07:53:50', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(21, 5, 1004, 1013, 1010, '2026-03-01', NULL, NULL, 0.00, 'hourly', 0.00, 600.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-18 07:54:02', '2026-09-18 07:54:02', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(22, 3, 1004, 1012, 1007, '2026-09-11', NULL, NULL, 0.00, 'hourly', 0.00, 600.00, NULL, 'pending', 'pending', NULL, NULL, 0, NULL, '2026-09-18 07:54:34', '2026-09-18 07:54:34', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00),
(23, 6, 1015, 1030, 1035, '2026-09-18', NULL, NULL, 0.00, 'hourly', 0.00, 300.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-18 12:14:07', '2026-09-18 12:14:07', 'HQ', 'HQ', NULL, NULL, NULL, NULL, 1, 0.00),
(24, 6, 1004, 1011, 1039, '2026-09-19', NULL, NULL, 0.00, 'hourly', 0.00, 100.00, NULL, 'pending', 'paid', NULL, NULL, 0, NULL, '2026-09-19 10:06:42', '2026-09-19 10:06:42', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Pune Solar Farm Site, Pune, Maharashtra, India', 18.52040000, 73.85670000, 18.52040000, 73.85670000, 1, 0.00);

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
CREATE TABLE IF NOT EXISTS `materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `material_name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `material_code` varchar(50) DEFAULT NULL,
  `brand_spec` varchar(150) DEFAULT NULL,
  `hsn_sac_code` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) DEFAULT '18.00',
  `min_stock_level` decimal(12,2) DEFAULT '0.00',
  `reorder_level` decimal(12,2) DEFAULT '0.00',
  `vendor_id` int DEFAULT NULL,
  PRIMARY KEY (`material_id`),
  UNIQUE KEY `material_code` (`material_code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `material_indents`
--

DROP TABLE IF EXISTS `material_indents`;
CREATE TABLE IF NOT EXISTS `material_indents` (
  `indent_id` int NOT NULL AUTO_INCREMENT,
  `indent_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `required_by` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','submitted','approved','rejected','ordered') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_code` (`indent_code`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `required_by` (`required_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `material_logs`
--

DROP TABLE IF EXISTS `material_logs`;
CREATE TABLE IF NOT EXISTS `material_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `material_id` int NOT NULL,
  `usage_date` date NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `actual_cost` decimal(15,2) NOT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `material_planning`
--

DROP TABLE IF EXISTS `material_planning`;
CREATE TABLE IF NOT EXISTS `material_planning` (
  `plan_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `material_id` int NOT NULL,
  `planned_date` date DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `planned_cost` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `material_requirements`
--

DROP TABLE IF EXISTS `material_requirements`;
CREATE TABLE IF NOT EXISTS `material_requirements` (
  `indent_id` int NOT NULL AUTO_INCREMENT,
  `indent_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int DEFAULT NULL,
  `indent_date` date NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `required_by_employee_id` int NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','submitted','approved','po_created','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_number` (`indent_number`),
  KEY `fk_indent_projects` (`project_id`),
  KEY `fk_indent_wbs` (`wbs_id`),
  KEY `fk_indent_required_emp` (`required_by_employee_id`),
  KEY `fk_indent_created_by` (`created_by`),
  KEY `fk_indent_approved_by` (`approved_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthly_completed_work`
--

DROP TABLE IF EXISTS `monthly_completed_work`;
CREATE TABLE IF NOT EXISTS `monthly_completed_work` (
  `completed_work_id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `project_id` int NOT NULL,
  `completion_percentage` decimal(5,2) DEFAULT '100.00',
  `approved_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','submitted','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`completed_work_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `approved_by` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monthly_completed_work`
--

INSERT INTO `monthly_completed_work` (`completed_work_id`, `schedule_id`, `project_id`, `completion_percentage`, `approved_amount`, `status`, `approved_by`, `created_at`) VALUES
(1, 1, 1004, 100.00, 131.25, 'draft', NULL, '2026-09-28 09:55:08'),
(2, 2, 1004, 50.00, 65.63, 'draft', NULL, '2026-09-28 09:55:16');

-- --------------------------------------------------------

--
-- Table structure for table `nationalities`
--

DROP TABLE IF EXISTS `nationalities`;
CREATE TABLE IF NOT EXISTS `nationalities` (
  `nationality_id` int NOT NULL AUTO_INCREMENT,
  `nationality_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`nationality_id`),
  UNIQUE KEY `nationality_name` (`nationality_name`)
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nationalities`
--

INSERT INTO `nationalities` (`nationality_id`, `nationality_name`, `country_id`, `status`, `created_at`) VALUES
(1, 'Indian', NULL, 1, '2026-09-22 12:20:33'),
(2, 'Emirati', NULL, 1, '2026-09-22 12:20:33'),
(3, 'Saudi', NULL, 1, '2026-09-22 12:20:33'),
(4, 'Qatari', NULL, 1, '2026-09-22 12:20:33'),
(5, 'Kuwaiti', NULL, 1, '2026-09-22 12:20:33'),
(6, 'Bahraini', NULL, 1, '2026-09-22 12:20:33'),
(7, 'Omani', NULL, 1, '2026-09-22 12:20:33'),
(8, 'British', NULL, 1, '2026-09-22 12:20:33'),
(9, 'American', NULL, 1, '2026-09-22 12:20:33'),
(10, 'Singaporean', NULL, 1, '2026-09-22 12:20:33'),
(11, 'Australian', NULL, 1, '2026-09-22 12:20:33'),
(12, 'Pakistani', NULL, 1, '2026-09-22 12:20:33'),
(13, 'Bangladeshi', NULL, 1, '2026-09-22 12:20:33'),
(14, 'Nepali', NULL, 1, '2026-09-22 12:20:33'),
(15, 'Sri Lankan', NULL, 1, '2026-09-22 12:20:33');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
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
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
) ENGINE=MyISAM AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(32, 'timesheets', 'delete', 'timesheets_delete'),
(33, 'labour_work_logs', 'view', 'labour_work_logs_view'),
(34, 'labour_work_logs', 'create', 'labour_work_logs_create'),
(35, 'labour_work_logs', 'update', 'labour_work_logs_update'),
(36, 'labour_work_logs', 'delete', 'labour_work_logs_delete'),
(37, 'labour_payments', 'view', 'labour_payments_view'),
(38, 'labour_payments', 'create', 'labour_payments_create'),
(39, 'labour_payments', 'update', 'labour_payments_update'),
(40, 'customers', 'view', 'customers_view'),
(41, 'customers', 'create', 'customers_create'),
(42, 'customers', 'update', 'customers_update'),
(43, 'customers', 'delete', 'customers_delete'),
(44, 'project_types', 'manage', 'project_types_manage'),
(45, 'document_types', 'manage', 'document_types_manage'),
(46, 'masters', 'view', 'masters_view'),
(47, 'disciplines', 'view', 'disciplines_view'),
(48, 'disciplines', 'manage', 'disciplines_manage'),
(49, 'terms_templates', 'view', 'terms_templates_view'),
(50, 'terms_templates', 'manage', 'terms_templates_manage'),
(51, 'quotations', 'view', 'quotations_view'),
(52, 'quotations', 'create', 'quotations_create'),
(53, 'quotations', 'update', 'quotations_update'),
(54, 'quotations', 'approve', 'quotations_approve'),
(55, 'quotations', 'delete', 'quotations_delete'),
(56, 'documents', 'view', 'documents_view'),
(57, 'documents', 'upload', 'documents_upload'),
(58, 'documents', 'delete', 'documents_delete'),
(59, 'currencies', 'view', 'currencies_view'),
(60, 'currencies', 'manage', 'currencies_manage'),
(61, 'taxes', 'view', 'taxes_view'),
(62, 'taxes', 'manage', 'taxes_manage'),
(63, 'invoices', 'view', 'invoices_view'),
(64, 'invoices', 'create', 'invoices_create'),
(65, 'invoices', 'update', 'invoices_update'),
(66, 'invoices', 'delete', 'invoices_delete'),
(67, 'invoices', 'approve', 'invoices_approve'),
(68, 'site_surveys', 'view', 'site_surveys_view'),
(69, 'site_surveys', 'create', 'site_surveys_create'),
(70, 'site_surveys', 'update', 'site_surveys_update'),
(71, 'site_surveys', 'delete', 'site_surveys_delete'),
(72, 'site_surveys', 'verify', 'site_surveys_verify'),
(73, 'materials', 'view', 'materials_view'),
(74, 'materials', 'create', 'materials_create'),
(75, 'materials', 'update', 'materials_update'),
(76, 'materials', 'delete', 'materials_delete'),
(77, 'materials', 'approve', 'materials_approve');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `project_type_id` int DEFAULT NULL,
  `emreads_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community_id` int DEFAULT NULL,
  `nationality_id` int DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `project_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `client_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `radius_meters` int DEFAULT '500',
  `project_date` date DEFAULT NULL,
  `status` enum('active','inactive','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `project_code` (`project_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1016 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`project_id`, `project_code`, `customer_id`, `project_type_id`, `emreads_id`, `contact_email`, `community_id`, `nationality_id`, `country_id`, `project_name`, `project_address`, `client_name`, `client_code`, `latitude`, `longitude`, `radius_meters`, `project_date`, `status`, `note`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `budget_amount`) VALUES
(1004, 'PRJ-2026-60', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Pune Solar Farm Installation', 'Pune Solar Farm Site, Pune, Maharashtra, India', 'Green Energy Solutions Pvt. Ltd.', 'CL-2026-001', 18.52040000, 73.85670000, 500, '2026-03-01', 'active', 'End-to-End Solar Farm Installation Project', '2026-09-11 05:48:53', '2026-09-17 10:33:08', 0, NULL, 500000.00),
(1008, 'PRJ-2026-59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Smita test', 'Pimpri Chinchwad Pune', 'Unitglo', 'CLD001', 18.52040000, 73.85670000, 500, '2026-09-17', 'active', '', '2026-09-17 10:28:15', '2026-09-17 11:35:09', 0, NULL, 0.00),
(1009, 'BM-001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', NULL, NULL, NULL, NULL, 500, NULL, 'active', NULL, '2026-09-18 11:40:46', '2026-09-18 11:40:46', 0, NULL, 0.00),
(1011, 'BM-1789731949814', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', NULL, NULL, NULL, NULL, 500, NULL, 'active', NULL, '2026-09-18 11:45:49', '2026-09-18 11:45:49', 0, NULL, 0.00),
(1012, 'BM-1789731961159', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', NULL, NULL, NULL, NULL, 500, NULL, 'active', NULL, '2026-09-18 11:46:01', '2026-09-18 11:46:01', 0, NULL, 0.00),
(1013, 'BM-1789731973071', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', NULL, NULL, NULL, NULL, 500, NULL, 'active', NULL, '2026-09-18 11:46:13', '2026-09-18 11:46:13', 0, NULL, 0.00),
(1014, 'BM-1789732072692', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', NULL, NULL, NULL, NULL, 500, NULL, 'active', NULL, '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, 0.00),
(1015, 'BM-1789732081587', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brooks Manufacturing', 'HQ', 'Unitglo', 'CUST001', 18.52040000, 73.85670000, 500, '2026-09-28', 'active', '', '2026-09-18 11:48:01', '2026-09-28 09:14:16', 0, NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `project_types`
--

DROP TABLE IF EXISTS `project_types`;
CREATE TABLE IF NOT EXISTS `project_types` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=721 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_types`
--

INSERT INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'MAIN_CONTRACT', 'Main Contract', NULL, 1, 1, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(2, 'APARTMENT', 'Apartment', NULL, 1, 2, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(3, 'TOWN_HOUSE', 'Town House', NULL, 1, 3, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(4, 'VILLA', 'Villa', NULL, 1, 4, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(5, 'COMMUNITY', 'Community', NULL, 1, 5, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(6, 'OFFICE', 'Office', NULL, 1, 6, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(7, 'CORPORATE', 'Corporate', NULL, 1, 7, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(8, 'HOTEL', 'Hotel', NULL, 1, 8, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(9, 'WAREHOUSE', 'Warehouse', NULL, 1, 9, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(10, 'INDUSTRIAL', 'Industrial', NULL, 1, 10, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(11, 'INFRASTRUCTURE', 'Infrastructure', NULL, 1, 11, '2026-09-22 12:20:33', '2026-09-22 12:20:33'),
(12, 'RESIDENTIAL', 'Residential', NULL, 1, 12, '2026-09-22 12:20:33', '2026-09-22 12:20:33');

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
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT '0.00',
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `actual_hours` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_wbs_id` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1033 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_wbs`
--

INSERT INTO `project_wbs` (`id`, `project_id`, `wbs_id`, `start_date`, `end_date`, `total_hours`, `note`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`, `budget_amount`, `actual_start_date`, `actual_end_date`, `actual_hours`) VALUES
(1011, 1004, 1003, '2026-09-11', '2026-09-20', 80.00, 'smile', 1, NULL, NULL, NULL, '2026-09-11 11:18:53', '2026-09-18 15:59:51', NULL, 0.00, '2026-09-13', '2026-09-22', 90.00),
(1012, 1004, 1004, '2026-09-15', '2026-09-30', 120.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', NULL, NULL, 0.00, NULL, NULL, 0.00),
(1013, 1004, 1005, '2026-09-18', '2026-10-05', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', NULL, NULL, 0.00, NULL, NULL, 0.00),
(1014, 1004, 1006, '2026-10-01', '2026-10-10', 60.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', NULL, NULL, 0.00, NULL, NULL, 0.00),
(1015, 1004, 1007, '2026-03-01', '2026-03-31', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 16:44:35', '2026-09-11 16:44:35', NULL, 100000.00, NULL, NULL, 0.00),
(1016, 1004, 1008, '2026-03-01', '2026-03-31', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 16:44:35', '2026-09-11 16:44:35', NULL, 120000.00, NULL, NULL, 0.00),
(1017, 1004, 1009, '2026-03-01', '2026-03-31', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 16:44:35', '2026-09-11 16:44:35', NULL, 100000.00, NULL, NULL, 0.00),
(1018, 1004, 1010, '2026-03-01', '2026-03-31', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 16:44:35', '2026-09-11 16:44:35', NULL, 90000.00, NULL, NULL, 0.00),
(1019, 1004, 1011, '2026-03-01', '2026-03-31', 100.00, NULL, 1, NULL, NULL, NULL, '2026-09-11 16:44:35', '2026-09-11 16:44:35', NULL, 90000.00, NULL, NULL, 0.00),
(1020, 1008, 1005, '2026-09-01', '2026-09-17', 90.00, NULL, 1, NULL, NULL, NULL, '2026-09-17 15:58:15', '2026-09-18 15:54:13', NULL, 0.00, '2026-09-01', '2026-09-17', 80.00),
(1021, 1008, 1003, '2026-09-01', '2026-09-30', 1000.00, NULL, 1, NULL, NULL, NULL, '2026-09-17 15:58:15', '2026-09-18 15:54:35', NULL, 0.00, '2026-09-18', '2026-11-21', 1000.00),
(1022, 1008, 1012, '2026-09-17', '2026-10-02', 600.00, NULL, 1, NULL, NULL, NULL, '2026-09-17 17:05:09', '2026-09-18 15:55:01', NULL, 0.00, '2026-09-01', '2026-09-30', 660.00),
(1023, 1004, 1012, '2026-09-17', '2026-09-30', 600.00, NULL, 1, NULL, NULL, NULL, '2026-09-17 17:05:39', '2026-09-17 17:05:39', NULL, 0.00, NULL, NULL, 0.00),
(1024, 1011, 1013, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:15:49', '2026-09-18 17:15:49', NULL, 0.00, NULL, NULL, 0.00),
(1025, 1014, 1016, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL, 0.00, NULL, NULL, 0.00),
(1026, 1014, 1017, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL, 0.00, NULL, NULL, 0.00),
(1027, 1014, 1018, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL, 0.00, NULL, NULL, 0.00),
(1028, 1014, 1019, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL, 0.00, NULL, NULL, 0.00),
(1029, 1015, 1020, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL, 0.00, NULL, NULL, 0.00),
(1030, 1015, 1021, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL, 0.00, NULL, NULL, 0.00),
(1031, 1015, 1022, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL, 0.00, NULL, NULL, 0.00),
(1032, 1015, 1023, NULL, NULL, 0.00, NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL, 0.00, NULL, NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `po_id` int NOT NULL AUTO_INCREMENT,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_date` date NOT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int NOT NULL,
  `indent_id` int DEFAULT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` int DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','issued','partially_received','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`po_id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
CREATE TABLE IF NOT EXISTS `quotations` (
  `quotation_id` int NOT NULL AUTO_INCREMENT,
  `quotation_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `project_id` int NOT NULL,
  `quotation_date` date NOT NULL,
  `validity_date` date DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `terms_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Snapshot of final T&C',
  `status` enum('draft','pending_approval','approved','rejected','revised') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `revision_number` int NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tax_id` int DEFAULT NULL,
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`quotation_id`),
  UNIQUE KEY `quotation_code` (`quotation_code`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` (`quotation_id`, `quotation_code`, `customer_id`, `project_id`, `quotation_date`, `validity_date`, `description`, `subtotal_amount`, `tax_percentage`, `tax_amount`, `discount_amount`, `total_amount`, `terms_conditions`, `status`, `revision_number`, `created_by`, `approved_by`, `approved_at`, `rejection_reason`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `tax_id`, `tax_type`, `cgst_amount`, `sgst_amount`, `igst_amount`) VALUES
(1, 'QT-202609-0001', 1, 1008, '2026-09-23', '2026-09-23', 'test', 0.00, 5.00, 0.00, 0.00, 0.00, NULL, 'approved', 1, 1, 1, '2026-09-24 09:42:34', NULL, 0, NULL, '2026-09-23 05:41:36', '2026-09-24 09:42:34', NULL, NULL, 0.00, 0.00, 0.00),
(2, 'QT-202609-0002', 1, 1004, '2026-09-24', '2027-10-24', 'test', 1500.00, 5.00, 75.00, 0.00, 1575.00, NULL, 'approved', 1, 1, 1, '2026-09-24 10:02:35', NULL, 0, NULL, '2026-09-24 09:44:00', '2026-09-24 10:02:35', NULL, NULL, 0.00, 0.00, 0.00),
(3, 'QT-202609-0003', 1, 1009, '2026-09-24', '2027-09-24', 'drfdxderdctgc', 820.00, 5.00, 41.00, 0.00, 861.00, NULL, 'draft', 1, 1, NULL, NULL, NULL, 0, NULL, '2026-09-24 10:47:55', '2026-09-24 10:47:55', NULL, NULL, 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `quotation_disciplines`
--

DROP TABLE IF EXISTS `quotation_disciplines`;
CREATE TABLE IF NOT EXISTS `quotation_disciplines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `project_id` int NOT NULL,
  `discipline_id` int NOT NULL,
  `discipline_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unit` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'lump_sum',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `rate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `terms_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `project_id` (`project_id`),
  KEY `discipline_id` (`discipline_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_disciplines`
--

INSERT INTO `quotation_disciplines` (`id`, `quotation_id`, `project_id`, `discipline_id`, `discipline_name`, `description`, `unit`, `quantity`, `rate`, `amount`, `terms_conditions`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1008, 1, 'Civil Works', NULL, 'lump_sum', -6.00, 0.00, 0.00, NULL, 'active', '2026-09-23 05:41:36', '2026-09-23 05:41:36'),
(2, 2, 1004, 1, 'Civil Works', NULL, 'lump_sum', 10.00, 10.00, 100.00, NULL, 'active', '2026-09-24 09:44:00', '2026-09-24 09:44:00'),
(3, 2, 1004, 2, 'Electrical Installation', NULL, 'lump_sum', 9.00, 100.00, 900.00, NULL, 'active', '2026-09-24 09:44:00', '2026-09-24 09:44:00'),
(4, 2, 1004, 3, 'Plumbing & Drainage', NULL, 'lump_sum', 5.00, 100.00, 500.00, NULL, 'active', '2026-09-24 09:44:00', '2026-09-24 09:44:00'),
(5, 3, 1009, 1, 'Civil Works', NULL, 'lump_sum', 10.00, 82.00, 820.00, NULL, 'active', '2026-09-24 10:47:55', '2026-09-24 10:47:55');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_required_documents`
--

DROP TABLE IF EXISTS `quotation_required_documents`;
CREATE TABLE IF NOT EXISTS `quotation_required_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `document_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `document_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotation_terms_snapshots`
--

DROP TABLE IF EXISTS `quotation_terms_snapshots`;
CREATE TABLE IF NOT EXISTS `quotation_terms_snapshots` (
  `snapshot_id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int DEFAULT '0',
  `status` int DEFAULT '1',
  PRIMARY KEY (`snapshot_id`),
  KEY `quotation_id` (`quotation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_terms_snapshots`
--

INSERT INTO `quotation_terms_snapshots` (`snapshot_id`, `quotation_id`, `title`, `description`, `sort_order`, `status`) VALUES
(1, 3, 'test', 'sldjodsw diowjodiwjd owdijwdo wdowdiuw odwj dpowidjw odiewdew doewid ewidewjodi wdjwodijewodi ewdoiew dowqid wqdowdoiew oewidewidewod ewdiewjdowiedewojdwodwoidjewodiewdoewij ewdiewd oewid ewoewoidewd ewd ewoid edew jewoidew odewid ewoidiewj dewp dewo', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `quotation_terms_template_items`
--

DROP TABLE IF EXISTS `quotation_terms_template_items`;
CREATE TABLE IF NOT EXISTS `quotation_terms_template_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int DEFAULT '0',
  `status` int DEFAULT '1',
  PRIMARY KEY (`item_id`),
  KEY `template_id` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1392 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=MyISAM AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(97, 3, 1),
(98, 4, 33),
(99, 4, 34),
(100, 4, 35),
(101, 4, 36),
(102, 4, 37),
(103, 4, 38),
(104, 4, 39),
(105, 1, 33),
(106, 1, 34),
(107, 1, 35),
(108, 1, 36),
(109, 1, 37),
(110, 1, 38),
(111, 1, 39),
(112, 2, 33),
(113, 2, 34),
(114, 2, 35),
(115, 2, 37),
(116, 4, 40),
(117, 4, 41),
(118, 4, 42),
(119, 4, 43),
(120, 4, 44),
(121, 4, 45),
(122, 4, 46),
(123, 1, 40),
(124, 1, 41),
(125, 1, 42),
(126, 1, 43),
(127, 1, 44),
(128, 1, 45),
(129, 1, 46),
(130, 2, 40),
(131, 2, 46),
(132, 4, 47),
(133, 4, 48),
(134, 4, 49),
(135, 4, 50),
(136, 4, 51),
(137, 4, 52),
(138, 4, 53),
(139, 4, 54),
(140, 4, 55),
(141, 4, 56),
(142, 4, 57),
(143, 4, 58),
(144, 1, 47),
(145, 1, 48),
(146, 1, 49),
(147, 1, 50),
(148, 1, 51),
(149, 1, 52),
(150, 1, 53),
(151, 1, 54),
(152, 1, 55),
(153, 1, 56),
(154, 1, 57),
(155, 1, 58),
(156, 2, 51),
(157, 2, 47),
(158, 2, 56),
(159, 4, 59),
(160, 4, 60),
(161, 4, 61),
(162, 4, 62),
(163, 4, 63),
(164, 4, 64),
(165, 4, 65),
(166, 4, 66),
(167, 4, 67),
(168, 1, 59),
(169, 1, 60),
(170, 1, 61),
(171, 1, 62),
(172, 1, 63),
(173, 1, 64),
(174, 1, 65),
(175, 1, 66),
(176, 1, 67),
(177, 2, 63),
(178, 4, 68),
(179, 4, 69),
(180, 4, 70),
(181, 4, 71),
(182, 4, 72),
(183, 1, 68),
(184, 1, 69),
(185, 1, 70),
(186, 1, 71),
(187, 1, 72),
(188, 2, 68),
(189, 2, 69),
(190, 2, 70),
(191, 2, 72);

-- --------------------------------------------------------

--
-- Table structure for table `site_surveys`
--

DROP TABLE IF EXISTS `site_surveys`;
CREATE TABLE IF NOT EXISTS `site_surveys` (
  `survey_id` int NOT NULL AUTO_INCREMENT,
  `survey_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `discipline_id` int DEFAULT NULL,
  `survey_date` date NOT NULL,
  `conducted_by` int NOT NULL,
  `entry_type` enum('system_entry','report_attachment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system_entry',
  `location_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `attached_report_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','completed','verified','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `survey_code` (`survey_code`),
  KEY `project_id` (`project_id`),
  KEY `conducted_by` (`conducted_by`),
  KEY `discipline_id` (`discipline_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_surveys`
--

INSERT INTO `site_surveys` (`survey_id`, `survey_code`, `project_id`, `customer_id`, `discipline_id`, `survey_date`, `conducted_by`, `entry_type`, `location_details`, `latitude`, `longitude`, `comments`, `remarks`, `attached_report_path`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'SRV-202609-0001', 1015, NULL, 1, '2026-09-28', 4, 'system_entry', 'mohannagar chinchwad pune', 18.52040000, 73.85670000, NULL, NULL, NULL, 'completed', 1, '2026-09-28 09:53:44', '2026-09-28 09:53:44');

-- --------------------------------------------------------

--
-- Table structure for table `site_survey_photos`
--

DROP TABLE IF EXISTS `site_survey_photos`;
CREATE TABLE IF NOT EXISTS `site_survey_photos` (
  `photo_id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `photo_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photo_id`),
  KEY `survey_id` (`survey_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_survey_photos`
--

INSERT INTO `site_survey_photos` (`photo_id`, `survey_id`, `photo_name`, `file_path`, `caption`, `created_at`) VALUES
(1, 1, 'album-image', '/uploads/surveys/survey_1_1790589224966_500.jpg', NULL, '2026-09-28 09:53:44');

-- --------------------------------------------------------

--
-- Table structure for table `site_survey_photo_disciplines`
--

DROP TABLE IF EXISTS `site_survey_photo_disciplines`;
CREATE TABLE IF NOT EXISTS `site_survey_photo_disciplines` (
  `photo_id` int NOT NULL,
  `discipline_id` int NOT NULL,
  PRIMARY KEY (`photo_id`,`discipline_id`),
  KEY `discipline_id` (`discipline_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE IF NOT EXISTS `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `quotation_id` int DEFAULT NULL,
  `discipline_id` int DEFAULT NULL,
  `wbs_id` int DEFAULT NULL,
  `task_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `required_worker_count` int NOT NULL DEFAULT '1',
  `estimated_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `target_time` time DEFAULT NULL,
  `status` enum('pending','in-progress','completed','delayed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `task_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT '0.00',
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `actual_cost` decimal(15,2) DEFAULT '0.00',
  `progress_percentage` int DEFAULT '0',
  `priority` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  PRIMARY KEY (`task_id`),
  KEY `idx_tasks_project` (`project_id`),
  KEY `fk_tasks_pwbs` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1040 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `project_id`, `quotation_id`, `discipline_id`, `wbs_id`, `task_name`, `description`, `required_worker_count`, `estimated_hours`, `start_date`, `start_time`, `target_date`, `target_time`, `status`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `task_address`, `latitude`, `longitude`, `budget_amount`, `actual_start_date`, `actual_end_date`, `actual_cost`, `progress_percentage`, `priority`) VALUES
(1006, 1004, NULL, NULL, 1011, 'Civil & Earthworks - WBS-01', 'Auto-created task for Civil & Earthworks - WBS-01 from timesheet log on 2026-09-11', 1, 4.00, '2026-09-11', '09:00:00', '2026-09-11', '18:00:00', 'completed', '2026-09-11 05:49:21', '2026-09-12 07:29:30', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1007, 1004, NULL, NULL, 1012, 'Electrical Installation - WBS-02', 'Auto-created task for Electrical Installation - WBS-02 from timesheet log on 2026-09-11', 1, 2.00, '2026-09-11', '09:00:00', '2026-09-11', '18:00:00', 'in-progress', '2026-09-11 09:32:14', '2026-09-11 09:32:14', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1008, 1004, NULL, NULL, 1014, 'Testing & Commissioning - WBS-04', 'Auto-created task for Testing & Commissioning - WBS-04 from timesheet log on 2026-09-11', 2, 2.00, '2026-09-11', '09:00:00', '2026-09-11', '18:00:00', 'completed', '2026-09-11 09:32:27', '2026-09-18 07:52:40', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1009, 1004, NULL, NULL, 1011, 'test', NULL, 1, 8.00, '2026-09-11', '09:00:00', '2026-09-11', '18:00:00', 'completed', '2026-09-11 09:34:58', '2026-09-12 07:29:22', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1010, 1004, NULL, NULL, 1013, 'Mechanical Works or WBS-03', 'Auto-created task for Mechanical Works or WBS-03 from timesheet log on 2026-09-11', 1, 1.00, '2026-09-11', '09:00:00', '2026-09-11', '18:00:00', 'in-progress', '2026-09-11 09:38:26', '2026-09-11 09:38:26', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1011, 1004, NULL, NULL, 1015, 'Excavation & Foundation', 'Test task description', 2, 60.00, '2026-03-01', NULL, '2026-03-31', NULL, 'in-progress', '2026-09-11 11:14:35', '2026-09-11 11:14:35', 0, NULL, NULL, NULL, NULL, 60000.00, NULL, NULL, 0.00, 0, 'medium'),
(1012, 1004, NULL, NULL, 1015, 'Concrete Slab Pouring', 'Test task description', 2, 40.00, '2026-03-01', NULL, '2026-03-31', NULL, 'completed', '2026-09-11 11:14:35', '2026-09-12 07:27:48', 0, NULL, NULL, NULL, NULL, 40000.00, NULL, NULL, 0.00, 0, 'medium'),
(1013, 1004, NULL, NULL, 1016, 'Cable Trenching', 'Test task description', 1, 50.00, '2026-03-01', '09:17:00', '2026-03-31', '19:17:00', 'completed', '2026-09-11 11:14:35', '2026-09-12 09:47:30', 0, NULL, NULL, NULL, NULL, 60000.00, NULL, NULL, 0.00, 0, 'medium'),
(1014, 1004, NULL, NULL, 1016, 'Panel Wiring & Distribution', 'Test task description', 2, 50.00, '2026-03-01', '10:00:00', '2026-03-31', '15:00:00', 'completed', '2026-09-11 11:14:35', '2026-09-12 09:46:57', 0, NULL, NULL, NULL, NULL, 60000.00, NULL, NULL, 0.00, 0, 'medium'),
(1015, 1004, NULL, NULL, 1017, 'Steel Structure Assembly', 'Test task description', 2, 100.00, '2026-03-01', '13:23:00', '2026-09-30', '13:23:00', 'pending', '2026-09-11 11:14:35', '2026-09-18 07:53:50', 0, NULL, NULL, NULL, NULL, 100000.00, NULL, NULL, 0.00, 0, 'medium'),
(1016, 1004, NULL, NULL, 1018, 'Solar Inverter Mounting', 'Test task description', 2, 100.00, '2026-03-01', '17:53:00', '2026-03-31', '19:53:00', 'pending', '2026-09-11 11:14:35', '2026-09-17 12:25:06', 0, NULL, NULL, NULL, NULL, 90000.00, NULL, NULL, 0.00, 0, 'medium'),
(1017, 1004, NULL, NULL, 1019, 'Grid Synchronization Test', 'Test task description', 1, 100.00, '2026-03-01', NULL, '2026-03-31', NULL, 'in-progress', '2026-09-11 11:14:35', '2026-09-12 11:18:33', 0, NULL, NULL, NULL, NULL, 90000.00, NULL, NULL, 0.00, 0, 'medium'),
(1018, 1004, NULL, NULL, 1014, 'Smita test task', '', 3, 0.00, '2026-09-18', '10:44:00', '2026-09-30', '10:44:00', 'pending', '2026-09-17 11:38:37', '2026-09-18 05:49:18', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1019, 1008, NULL, NULL, 1022, 'teste test', 'test', 2, 8.00, '2026-09-18', '09:00:00', '2026-09-18', '18:00:00', 'pending', '2026-09-18 07:48:24', '2026-09-18 07:48:24', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1020, 1011, NULL, NULL, 1024, 'Market Research', NULL, 1, 6.00, '2024-03-24', NULL, '2024-03-27', NULL, 'completed', '2026-09-18 11:45:49', '2026-09-18 11:45:49', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1021, 1014, NULL, NULL, 1025, 'Market Research', NULL, 1, 6.00, '2024-03-24', NULL, '2024-03-27', NULL, 'completed', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1022, 1014, NULL, NULL, 1025, 'Feasibility Analysis', NULL, 1, 0.50, '2024-03-28', NULL, '2024-03-30', NULL, 'completed', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1023, 1014, NULL, NULL, 1025, 'Stakeholder Feedback', NULL, 1, 8.00, '2024-03-30', NULL, '2024-04-01', NULL, 'completed', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1024, 1014, NULL, NULL, 1026, 'Engineering Drawings', NULL, 1, 8.00, '2024-04-02', NULL, '2024-04-05', NULL, '', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1025, 1014, NULL, NULL, 1026, '3D Printed Prototyping', NULL, 1, 12.00, '2024-04-06', NULL, '2024-04-10', NULL, 'pending', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1026, 1014, NULL, NULL, 1026, 'Stakeholder Feedback', NULL, 1, 8.00, '2024-04-11', NULL, '2024-04-14', NULL, 'pending', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1027, 1014, NULL, NULL, 1027, 'CNC Part Creation', NULL, 1, 4.00, '2024-04-15', NULL, '2024-04-17', NULL, 'pending', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1028, 1014, NULL, NULL, 1027, 'Durability & Stress Testing', NULL, 1, 8.00, '2024-04-18', NULL, '2024-04-22', NULL, 'pending', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1029, 1014, NULL, NULL, 1028, 'New Production Equip', NULL, 1, 24.00, '2024-04-23', NULL, '2024-04-30', NULL, 'pending', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1030, 1015, NULL, NULL, 1029, 'Market Research', NULL, 1, 6.00, '2024-03-24', NULL, '2024-03-27', NULL, 'completed', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1031, 1015, NULL, NULL, 1029, 'Feasibility Analysis', NULL, 1, 0.50, '2024-03-28', NULL, '2024-03-30', NULL, 'completed', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1032, 1015, NULL, NULL, 1029, 'Stakeholder Feedback', NULL, 1, 8.00, '2024-03-30', NULL, '2024-04-01', NULL, 'completed', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1033, 1015, NULL, NULL, 1030, 'Engineering Drawings', NULL, 1, 8.00, '2024-04-02', NULL, '2024-04-05', NULL, '', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1034, 1015, NULL, NULL, 1030, '3D Printed Prototyping', NULL, 1, 12.00, '2024-04-06', NULL, '2024-04-10', NULL, 'pending', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1035, 1015, NULL, NULL, 1030, 'Stakeholder Feedback', '', 1, 8.00, '2024-04-11', NULL, '2024-04-14', NULL, 'pending', '2026-09-18 11:48:01', '2026-09-18 12:14:07', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1036, 1015, NULL, NULL, 1031, 'CNC Part Creation', NULL, 1, 4.00, '2024-04-15', NULL, '2024-04-17', NULL, 'completed', '2026-09-18 11:48:01', '2026-09-18 12:12:38', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1037, 1015, NULL, NULL, 1031, 'Durability & Stress Testing', NULL, 1, 8.00, '2024-04-18', NULL, '2024-04-22', NULL, 'pending', '2026-09-18 11:48:01', '2026-09-18 12:12:30', 1, '2026-09-18 17:42:30', NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1038, 1015, NULL, NULL, 1032, 'New Production Equip', NULL, 1, 24.00, '2024-04-23', NULL, '2024-04-30', NULL, 'completed', '2026-09-18 11:48:01', '2026-09-18 12:12:26', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium'),
(1039, 1004, NULL, NULL, 1011, 'testtest', 'testtest', 1, 8.00, '2026-09-19', '09:00:00', '2026-09-19', '18:00:00', 'pending', '2026-09-19 10:06:42', '2026-09-19 10:06:42', 0, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0, 'medium');

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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`assignment_id`, `task_id`, `employee_id`, `assigned_at`) VALUES
(4, 1006, 1, '2026-09-11 09:32:51'),
(5, 1006, 4, '2026-09-11 09:32:51'),
(7, 1009, 4, '2026-09-11 09:37:55'),
(8, 1009, 1, '2026-09-11 09:37:55'),
(11, 1014, 4, '2026-09-12 09:46:57'),
(12, 1013, 4, '2026-09-12 09:47:30'),
(14, 1008, 4, '2026-09-12 11:19:01'),
(20, 1016, 4, '2026-09-17 12:25:06'),
(34, 1015, 4, '2026-09-18 07:53:50'),
(35, 1010, 1, '2026-09-18 07:54:02'),
(36, 1007, 4, '2026-09-18 07:54:34'),
(38, 1017, 4, '2026-09-18 08:00:30'),
(40, 1019, 4, '2026-09-18 08:01:36'),
(41, 1018, 1, '2026-09-18 08:02:29'),
(42, 1039, 3, '2026-09-19 10:06:42');

-- --------------------------------------------------------

--
-- Table structure for table `task_dependencies`
--

DROP TABLE IF EXISTS `task_dependencies`;
CREATE TABLE IF NOT EXISTS `task_dependencies` (
  `dependency_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `predecessor_task_id` int NOT NULL,
  `dependency_type` enum('FS','SS','FF','SF') DEFAULT 'FS',
  `lag_days` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dependency_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `taxes`
--

DROP TABLE IF EXISTS `taxes`;
CREATE TABLE IF NOT EXISTS `taxes` (
  `tax_id` int NOT NULL AUTO_INCREMENT,
  `tax_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `country_id` int DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_type` enum('VAT','GST','CGST_SGST','IGST','SALES_TAX','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VAT',
  `is_split` tinyint(1) DEFAULT '0',
  `cgst_percentage` decimal(5,2) DEFAULT '0.00',
  `sgst_percentage` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`tax_id`),
  KEY `country_id` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=179 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `taxes`
--

INSERT INTO `taxes` (`tax_id`, `tax_name`, `tax_percentage`, `country_id`, `status`, `created_at`, `tax_code`, `tax_type`, `is_split`, `cgst_percentage`, `sgst_percentage`) VALUES
(1, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-23 05:40:51', NULL, 'VAT', 0, 0.00, 0.00),
(2, 'Indian GST 18%', 18.00, 1, 1, '2026-09-23 05:40:51', NULL, 'VAT', 0, 0.00, 0.00),
(3, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:37:11', NULL, 'VAT', 0, 0.00, 0.00),
(4, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:37:11', NULL, 'VAT', 0, 0.00, 0.00),
(5, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:37:24', NULL, 'VAT', 0, 0.00, 0.00),
(6, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:37:24', NULL, 'VAT', 0, 0.00, 0.00),
(7, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:37:33', NULL, 'VAT', 0, 0.00, 0.00),
(8, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:37:33', NULL, 'VAT', 0, 0.00, 0.00),
(9, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:38:23', NULL, 'VAT', 0, 0.00, 0.00),
(10, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:38:23', NULL, 'VAT', 0, 0.00, 0.00),
(11, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:39:02', NULL, 'VAT', 0, 0.00, 0.00),
(12, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:39:02', NULL, 'VAT', 0, 0.00, 0.00),
(13, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 08:39:23', NULL, 'VAT', 0, 0.00, 0.00),
(14, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 08:39:23', NULL, 'VAT', 0, 0.00, 0.00),
(15, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 09:16:36', NULL, 'VAT', 0, 0.00, 0.00),
(16, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 09:16:36', NULL, 'VAT', 0, 0.00, 0.00),
(17, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 09:22:41', NULL, 'VAT', 0, 0.00, 0.00),
(18, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 09:22:41', NULL, 'VAT', 0, 0.00, 0.00),
(19, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 09:23:06', NULL, 'VAT', 0, 0.00, 0.00),
(20, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 09:23:06', NULL, 'VAT', 0, 0.00, 0.00),
(21, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 09:23:39', NULL, 'VAT', 0, 0.00, 0.00),
(22, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 09:23:39', NULL, 'VAT', 0, 0.00, 0.00),
(23, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 09:24:56', NULL, 'VAT', 0, 0.00, 0.00),
(24, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 09:24:56', NULL, 'VAT', 0, 0.00, 0.00),
(25, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:19:49', NULL, 'VAT', 0, 0.00, 0.00),
(26, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:19:49', NULL, 'VAT', 0, 0.00, 0.00),
(27, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:20:00', NULL, 'VAT', 0, 0.00, 0.00),
(28, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:20:00', NULL, 'VAT', 0, 0.00, 0.00),
(29, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:20:25', NULL, 'VAT', 0, 0.00, 0.00),
(30, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:20:25', NULL, 'VAT', 0, 0.00, 0.00),
(31, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:23:46', NULL, 'VAT', 0, 0.00, 0.00),
(32, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:23:46', NULL, 'VAT', 0, 0.00, 0.00),
(33, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:27:18', NULL, 'VAT', 0, 0.00, 0.00),
(34, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:27:18', NULL, 'VAT', 0, 0.00, 0.00),
(35, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:28:36', NULL, 'VAT', 0, 0.00, 0.00),
(36, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:28:36', NULL, 'VAT', 0, 0.00, 0.00),
(37, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:30:45', NULL, 'VAT', 0, 0.00, 0.00),
(38, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:30:45', NULL, 'VAT', 0, 0.00, 0.00),
(39, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 10:32:04', NULL, 'VAT', 0, 0.00, 0.00),
(40, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 10:32:04', NULL, 'VAT', 0, 0.00, 0.00),
(41, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:30:55', NULL, 'VAT', 0, 0.00, 0.00),
(42, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:30:55', NULL, 'VAT', 0, 0.00, 0.00),
(43, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:31:48', NULL, 'VAT', 0, 0.00, 0.00),
(44, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:31:48', NULL, 'VAT', 0, 0.00, 0.00),
(45, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:32:00', NULL, 'VAT', 0, 0.00, 0.00),
(46, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:32:00', NULL, 'VAT', 0, 0.00, 0.00),
(47, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:32:21', NULL, 'VAT', 0, 0.00, 0.00),
(48, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:32:21', NULL, 'VAT', 0, 0.00, 0.00),
(49, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:32:33', NULL, 'VAT', 0, 0.00, 0.00),
(50, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:32:33', NULL, 'VAT', 0, 0.00, 0.00),
(51, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:32:48', NULL, 'VAT', 0, 0.00, 0.00),
(52, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:32:48', NULL, 'VAT', 0, 0.00, 0.00),
(53, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:33:05', NULL, 'VAT', 0, 0.00, 0.00),
(54, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:33:05', NULL, 'VAT', 0, 0.00, 0.00),
(55, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:33:18', NULL, 'VAT', 0, 0.00, 0.00),
(56, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:33:18', NULL, 'VAT', 0, 0.00, 0.00),
(57, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:34:09', NULL, 'VAT', 0, 0.00, 0.00),
(58, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:34:09', NULL, 'VAT', 0, 0.00, 0.00),
(59, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:34:22', NULL, 'VAT', 0, 0.00, 0.00),
(60, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:34:22', NULL, 'VAT', 0, 0.00, 0.00),
(61, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:34:42', NULL, 'VAT', 0, 0.00, 0.00),
(62, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:34:42', NULL, 'VAT', 0, 0.00, 0.00),
(63, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:35:04', NULL, 'VAT', 0, 0.00, 0.00),
(64, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:35:04', NULL, 'VAT', 0, 0.00, 0.00),
(65, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:35:12', NULL, 'VAT', 0, 0.00, 0.00),
(66, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:35:12', NULL, 'VAT', 0, 0.00, 0.00),
(67, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-24 11:35:24', NULL, 'VAT', 0, 0.00, 0.00),
(68, 'Indian GST 18%', 18.00, 1, 1, '2026-09-24 11:35:24', NULL, 'VAT', 0, 0.00, 0.00),
(69, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 08:02:00', NULL, 'VAT', 0, 0.00, 0.00),
(70, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 08:02:00', NULL, 'VAT', 0, 0.00, 0.00),
(71, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 08:10:56', NULL, 'VAT', 0, 0.00, 0.00),
(72, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 08:10:56', NULL, 'VAT', 0, 0.00, 0.00),
(73, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 08:11:04', NULL, 'VAT', 0, 0.00, 0.00),
(74, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 08:11:04', NULL, 'VAT', 0, 0.00, 0.00),
(75, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 08:11:51', NULL, 'VAT', 0, 0.00, 0.00),
(76, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 08:11:51', NULL, 'VAT', 0, 0.00, 0.00),
(77, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 08:12:48', NULL, 'VAT', 0, 0.00, 0.00),
(78, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 08:12:48', NULL, 'VAT', 0, 0.00, 0.00),
(79, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 09:14:08', NULL, 'VAT', 0, 0.00, 0.00),
(80, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 09:14:08', NULL, 'VAT', 0, 0.00, 0.00),
(81, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 09:14:51', NULL, 'VAT', 0, 0.00, 0.00),
(82, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 09:14:51', NULL, 'VAT', 0, 0.00, 0.00),
(83, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 09:15:24', NULL, 'VAT', 0, 0.00, 0.00),
(84, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 09:15:24', NULL, 'VAT', 0, 0.00, 0.00),
(85, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 09:45:02', NULL, 'VAT', 0, 0.00, 0.00),
(86, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 09:45:02', NULL, 'VAT', 0, 0.00, 0.00),
(87, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 10:51:07', NULL, 'VAT', 0, 0.00, 0.00),
(88, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 10:51:07', NULL, 'VAT', 0, 0.00, 0.00),
(89, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 10:57:23', NULL, 'VAT', 0, 0.00, 0.00),
(90, 'Indian GST 18%', 18.00, 1, 1, '2026-09-28 10:57:23', NULL, 'VAT', 0, 0.00, 0.00),
(91, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:16:04', 'VAT5', 'VAT', 0, 0.00, 0.00),
(92, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:16:04', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(93, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:16:04', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(94, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:16:04', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(95, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:16:04', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(96, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:16:04', 'VAT15', 'VAT', 0, 0.00, 0.00),
(97, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:16:04', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(98, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:16:04', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(99, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:17:47', 'VAT5', 'VAT', 0, 0.00, 0.00),
(100, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:17:47', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(101, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:17:47', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(102, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:17:47', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(103, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:17:47', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(104, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:17:47', 'VAT15', 'VAT', 0, 0.00, 0.00),
(105, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:17:47', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(106, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:17:47', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(107, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:19:37', 'VAT5', 'VAT', 0, 0.00, 0.00),
(108, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:19:37', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(109, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:19:37', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(110, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:19:37', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(111, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:19:37', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(112, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:19:37', 'VAT15', 'VAT', 0, 0.00, 0.00),
(113, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:19:37', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(114, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:19:37', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(115, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:20:22', 'VAT5', 'VAT', 0, 0.00, 0.00),
(116, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:20:22', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(117, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:20:22', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(118, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:20:22', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(119, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:20:22', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(120, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:20:22', 'VAT15', 'VAT', 0, 0.00, 0.00),
(121, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:20:22', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(122, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:20:22', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(123, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:40:39', 'VAT5', 'VAT', 0, 0.00, 0.00),
(124, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:40:39', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(125, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:40:39', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(126, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:40:39', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(127, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:40:39', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(128, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:40:39', 'VAT15', 'VAT', 0, 0.00, 0.00),
(129, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:40:39', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(130, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:40:39', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(131, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:41:16', 'VAT5', 'VAT', 0, 0.00, 0.00),
(132, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:41:16', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(133, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:41:16', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(134, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:41:16', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(135, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:41:16', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(136, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:41:16', 'VAT15', 'VAT', 0, 0.00, 0.00),
(137, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:41:16', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(138, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:41:16', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(139, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:43:14', 'VAT5', 'VAT', 0, 0.00, 0.00),
(140, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:43:14', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(141, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:43:14', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(142, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:43:14', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(143, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:43:14', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(144, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:43:14', 'VAT15', 'VAT', 0, 0.00, 0.00),
(145, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:43:14', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(146, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:43:14', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(147, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:45:46', 'VAT5', 'VAT', 0, 0.00, 0.00),
(148, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:45:46', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(149, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:45:46', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(150, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:45:46', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(151, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:45:46', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(152, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:45:46', 'VAT15', 'VAT', 0, 0.00, 0.00),
(153, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:45:46', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(154, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:45:46', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(155, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:46:38', 'VAT5', 'VAT', 0, 0.00, 0.00),
(156, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:46:38', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(157, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:46:38', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(158, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:46:38', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(159, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:46:38', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(160, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:46:38', 'VAT15', 'VAT', 0, 0.00, 0.00),
(161, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:46:38', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(162, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:46:38', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(163, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-28 11:48:13', 'VAT5', 'VAT', 0, 0.00, 0.00),
(164, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-28 11:48:13', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(165, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-28 11:48:13', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(166, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-28 11:48:13', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(167, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-28 11:48:13', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(168, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-28 11:48:13', 'VAT15', 'VAT', 0, 0.00, 0.00),
(169, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-28 11:48:13', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(170, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-28 11:48:13', 'VAT20_UK', 'VAT', 0, 0.00, 0.00),
(171, 'UAE VAT 5%', 5.00, 2, 1, '2026-09-29 06:28:15', 'VAT5', 'VAT', 0, 0.00, 0.00),
(172, 'GST Intra-State (CGST 9% + SGST 9%)', 18.00, 1, 1, '2026-09-29 06:28:15', 'CGST_SGST_18', 'CGST_SGST', 1, 9.00, 9.00),
(173, 'GST Inter-State (IGST 18%)', 18.00, 1, 1, '2026-09-29 06:28:15', 'IGST_18', 'IGST', 0, 0.00, 0.00),
(174, 'GST Intra-State (CGST 6% + SGST 6%)', 12.00, 1, 1, '2026-09-29 06:28:15', 'CGST_SGST_12', 'CGST_SGST', 1, 6.00, 6.00),
(175, 'GST Inter-State (IGST 12%)', 12.00, 1, 1, '2026-09-29 06:28:15', 'IGST_12', 'IGST', 0, 0.00, 0.00),
(176, 'Saudi VAT 15%', 15.00, 3, 1, '2026-09-29 06:28:15', 'VAT15', 'VAT', 0, 0.00, 0.00),
(177, 'US Sales Tax 8.875%', 8.88, 9, 1, '2026-09-29 06:28:15', 'SALES_TAX_US', 'SALES_TAX', 0, 0.00, 0.00),
(178, 'UK Standard VAT 20%', 20.00, 8, 1, '2026-09-29 06:28:15', 'VAT20_UK', 'VAT', 0, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `terms_templates`
--

DROP TABLE IF EXISTS `terms_templates`;
CREATE TABLE IF NOT EXISTS `terms_templates` (
  `template_id` int NOT NULL AUTO_INCREMENT,
  `template_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int DEFAULT NULL COMMENT 'NULL = All countries',
  `project_type_id` int DEFAULT NULL COMMENT 'NULL = All project types',
  `discipline_id` int DEFAULT NULL COMMENT 'NULL = All disciplines',
  `terms_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `version` int NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`template_id`),
  KEY `country_id` (`country_id`),
  KEY `project_type_id` (`project_type_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `terms_templates`
--

INSERT INTO `terms_templates` (`template_id`, `template_name`, `country_id`, `project_type_id`, `discipline_id`, `terms_content`, `status`, `version`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 09:14:51', '2026-09-28 09:14:51'),
(2, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 09:14:51', '2026-09-28 09:14:51'),
(3, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 09:14:51', '2026-09-28 09:14:51'),
(4, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 09:15:23', '2026-09-28 09:15:23'),
(5, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 09:15:23', '2026-09-28 09:15:23'),
(6, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 09:15:23', '2026-09-28 09:15:23'),
(7, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 09:45:02', '2026-09-28 09:45:02'),
(8, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 09:45:02', '2026-09-28 09:45:02'),
(9, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 09:45:02', '2026-09-28 09:45:02'),
(10, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 10:51:07', '2026-09-28 10:51:07'),
(11, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 10:51:07', '2026-09-28 10:51:07'),
(12, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 10:51:07', '2026-09-28 10:51:07'),
(13, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 10:57:23', '2026-09-28 10:57:23'),
(14, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 10:57:23', '2026-09-28 10:57:23'),
(15, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 10:57:23', '2026-09-28 10:57:23'),
(16, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:16:03', '2026-09-28 11:16:03'),
(17, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:16:03', '2026-09-28 11:16:03'),
(18, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:16:03', '2026-09-28 11:16:03'),
(19, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:17:47', '2026-09-28 11:17:47'),
(20, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:17:47', '2026-09-28 11:17:47'),
(21, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:17:47', '2026-09-28 11:17:47'),
(22, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:19:37', '2026-09-28 11:19:37'),
(23, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:19:37', '2026-09-28 11:19:37'),
(24, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:19:37', '2026-09-28 11:19:37'),
(25, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:20:22', '2026-09-28 11:20:22'),
(26, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:20:22', '2026-09-28 11:20:22'),
(27, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:20:22', '2026-09-28 11:20:22'),
(28, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:40:39', '2026-09-28 11:40:39'),
(29, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:40:39', '2026-09-28 11:40:39'),
(30, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:40:39', '2026-09-28 11:40:39'),
(31, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:41:16', '2026-09-28 11:41:16'),
(32, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:41:16', '2026-09-28 11:41:16'),
(33, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:41:16', '2026-09-28 11:41:16'),
(34, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:43:14', '2026-09-28 11:43:14'),
(35, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:43:14', '2026-09-28 11:43:14'),
(36, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:43:14', '2026-09-28 11:43:14'),
(37, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:45:46', '2026-09-28 11:45:46'),
(38, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:45:46', '2026-09-28 11:45:46'),
(39, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:45:46', '2026-09-28 11:45:46'),
(40, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:46:38', '2026-09-28 11:46:38'),
(41, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:46:38', '2026-09-28 11:46:38'),
(42, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:46:38', '2026-09-28 11:46:38'),
(43, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-28 11:48:13', '2026-09-28 11:48:13'),
(44, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-28 11:48:13', '2026-09-28 11:48:13'),
(45, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-28 11:48:13', '2026-09-28 11:48:13'),
(46, 'Standard Construction Contract Terms', NULL, NULL, NULL, '1. Payment terms: 30 days net from invoice date.\n2. All works to strictly follow local municipality guidelines and HSE standards.\n3. Retention rate of 5% applies until final completion.', 1, 1, NULL, NULL, '2026-09-29 06:28:15', '2026-09-29 06:28:15'),
(47, 'Subcontractor Billing & Progress Terms', NULL, NULL, NULL, '1. Monthly progress billing against certified milestone completion.\n2. All safety compliance certificates required prior to payment release.', 1, 1, NULL, NULL, '2026-09-29 06:28:15', '2026-09-29 06:28:15'),
(48, 'Civil & MEP Works General Terms', NULL, NULL, NULL, '1. Materials subject to on-site quality inspection and approval.\n2. Defect liability period is 12 months from handover date.', 1, 1, NULL, NULL, '2026-09-29 06:28:15', '2026-09-29 06:28:15');

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
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `timesheets`
--

INSERT INTO `timesheets` (`timesheet_id`, `project_id`, `wbs_id`, `task_id`, `employee_id`, `log_date`, `working_hours`, `comment`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(12, 1004, 1016, 1013, 2, '2026-03-05', 8.00, 'Cable trenching setup', '2026-09-11 11:14:35', '2026-09-11 11:14:35', 0, NULL),
(11, 1004, 1015, 1011, 1, '2026-03-06', 8.00, 'Excavation supervision Day 2', '2026-09-11 11:14:35', '2026-09-11 11:14:35', 0, NULL),
(10, 1004, 1015, 1011, 1, '2026-03-05', 8.00, 'Excavation supervision Day 1', '2026-09-11 11:14:35', '2026-09-11 11:14:35', 0, NULL),
(13, 1004, 1011, 1006, 1, '2026-09-12', 2.00, NULL, '2026-09-12 06:09:00', '2026-09-12 06:09:00', 0, NULL),
(14, 1004, 1011, 1006, 4, '2026-09-12', 78.00, NULL, '2026-09-12 07:30:06', '2026-09-12 07:30:06', 0, NULL),
(15, 1004, 1011, 1009, 1, '2026-09-12', 8.00, NULL, '2026-09-12 07:31:09', '2026-09-12 07:31:09', 0, NULL),
(16, 1004, 1019, 1017, 1, '2026-09-12', 6.00, NULL, '2026-09-12 09:25:14', '2026-09-12 09:25:14', 0, NULL),
(17, 1004, 1019, 1017, 1, '2026-09-12', 8.00, NULL, '2026-09-12 09:25:25', '2026-09-12 09:25:25', 0, NULL),
(18, 1004, 1014, 1008, 4, '2026-09-12', 6.00, NULL, '2026-09-12 10:03:50', '2026-09-12 10:03:50', 0, NULL),
(19, 1004, 1011, 1009, 4, '2026-09-12', 2.00, 'test', '2026-09-12 10:18:01', '2026-09-12 10:18:01', 0, NULL),
(20, 1004, 1014, 1018, 1, '2026-09-17', 5.00, NULL, '2026-09-17 11:38:44', '2026-09-17 11:41:45', 0, NULL),
(21, 1004, 1014, 1018, 4, '2026-09-17', 6.00, NULL, '2026-09-17 11:41:14', '2026-09-17 11:41:14', 0, NULL),
(22, 1014, 1025, 1021, 1, '2024-03-24', 6.00, 'Mocked actual hours', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL),
(23, 1014, 1025, 1022, 1, '2024-03-28', 0.50, 'Mocked actual hours', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL),
(24, 1014, 1025, 1023, 1, '2024-03-30', 8.00, 'Mocked actual hours', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL),
(25, 1014, 1026, 1024, 1, '2024-04-02', 4.00, 'Mocked actual hours', '2026-09-18 11:47:52', '2026-09-18 11:47:52', 0, NULL),
(26, 1015, 1029, 1030, 1, '2024-03-24', 6.00, 'Mocked actual hours', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL),
(27, 1015, 1029, 1031, 1, '2024-03-28', 0.50, 'Mocked actual hours', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL),
(28, 1015, 1029, 1032, 1, '2024-03-30', 8.00, 'Mocked actual hours', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL),
(29, 1015, 1030, 1033, 1, '2024-04-02', 4.00, 'Mocked actual hours', '2026-09-18 11:48:01', '2026-09-18 11:48:01', 0, NULL),
(30, 1004, 1011, 1039, 3, '2026-09-19', 5.00, NULL, '2026-09-19 10:07:10', '2026-09-19 10:07:10', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
CREATE TABLE IF NOT EXISTS `vendors` (
  `vendor_id` int NOT NULL AUTO_INCREMENT,
  `vendor_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gst_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`vendor_id`),
  UNIQUE KEY `vendor_code` (`vendor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_invoices`
--

DROP TABLE IF EXISTS `vendor_invoices`;
CREATE TABLE IF NOT EXISTS `vendor_invoices` (
  `vendor_invoice_id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `po_id` int NOT NULL,
  `grn_id` int DEFAULT NULL,
  `project_id` int NOT NULL,
  `wbs_id` int NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `payable_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `balance_amount` decimal(15,2) NOT NULL,
  `payment_status` enum('unpaid','partially_paid','paid','on_hold','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_payments`
--

DROP TABLE IF EXISTS `vendor_payments`;
CREATE TABLE IF NOT EXISTS `vendor_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `vendor_invoice_id` int NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `vendor_invoice_id` (`vendor_invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_breakdown_structures`
--

DROP TABLE IF EXISTS `work_breakdown_structures`;
CREATE TABLE IF NOT EXISTS `work_breakdown_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wbs_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wbs_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wbs_code` (`wbs_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1024 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_breakdown_structures`
--

INSERT INTO `work_breakdown_structures` (`id`, `wbs_code`, `wbs_name`, `description`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1003, 'WBS-TEMP-1789105733768-332', 'Civil & Earthworks - WBS-01', NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', '2026-09-11 11:18:53', NULL),
(1004, 'WBS-TEMP-1789105733770-9', 'Electrical Installation - WBS-02', NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', '2026-09-11 11:18:53', NULL),
(1005, 'WBS-TEMP-1789105733770-689', 'Mechanical Works or WBS-03', NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', '2026-09-11 11:18:53', NULL),
(1006, 'WBS-TEMP-1789105733771-908', 'Testing & Commissioning - WBS-04', NULL, 1, NULL, NULL, NULL, '2026-09-11 11:18:53', '2026-09-11 11:18:53', NULL),
(1007, 'WBS-CIVIL', 'Civil Works', 'Excavation, grading, and concrete foundations', 1, NULL, NULL, NULL, '2026-09-11 15:39:29', '2026-09-11 15:39:29', NULL),
(1008, 'WBS-ELEC', 'Electrical Works', 'Cable trenching, wiring, panel setup, and earthing', 1, NULL, NULL, NULL, '2026-09-11 15:39:29', '2026-09-11 15:39:29', NULL),
(1009, 'WBS-MECH', 'Mechanical Works', 'Tracker installation and module mounting structures', 1, NULL, NULL, NULL, '2026-09-11 15:39:29', '2026-09-11 15:39:29', NULL),
(1010, 'WBS-INST', 'Installation', 'Solar panel mounting and inverter connections', 1, NULL, NULL, NULL, '2026-09-11 15:39:29', '2026-09-11 15:39:29', NULL),
(1011, 'WBS-TEST', 'Testing & Commissioning', 'String testing, grid sync, and safety checks', 1, NULL, NULL, NULL, '2026-09-11 15:39:29', '2026-09-11 15:39:29', NULL),
(1012, 'WBS-TEMP-1789644909324-698', 'Smita test', NULL, 1, NULL, NULL, NULL, '2026-09-17 17:05:09', '2026-09-17 17:05:09', NULL),
(1013, 'IDEA', 'Ideation', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:15:49', '2026-09-18 17:15:49', NULL),
(1016, 'IDE8364', 'Ideation', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL),
(1017, 'DES6696', 'Design', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL),
(1018, 'PRO9094', 'Prototyping', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL),
(1019, 'PRE9105', 'Pre-production', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:17:52', '2026-09-18 17:17:52', NULL),
(1020, 'IDE5279', 'Ideation', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL),
(1021, 'DES5143', 'Design', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL),
(1022, 'PRO7755', 'Prototyping', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL),
(1023, 'PRE7739', 'Pre-production', NULL, 1, NULL, NULL, NULL, '2026-09-18 17:18:01', '2026-09-18 17:18:01', NULL);

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
-- Constraints for table `billing_schedules`
--
ALTER TABLE `billing_schedules`
  ADD CONSTRAINT `billing_schedules_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `billing_schedules_ibfk_2` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT;

--
-- Constraints for table `employee_documents`
--
ALTER TABLE `employee_documents`
  ADD CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `entity_documents`
--
ALTER TABLE `entity_documents`
  ADD CONSTRAINT `entity_documents_ibfk_1` FOREIGN KEY (`doc_type_id`) REFERENCES `document_types` (`doc_type_id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `entity_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `expiry_notifications_log`
--
ALTER TABLE `expiry_notifications_log`
  ADD CONSTRAINT `expiry_notifications_log_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `entity_documents` (`document_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expiry_notifications_log_ibfk_2` FOREIGN KEY (`recipient_user_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `goods_receipt_notes`
--
ALTER TABLE `goods_receipt_notes`
  ADD CONSTRAINT `goods_receipt_notes_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goods_receipt_notes_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goods_receipt_notes_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`currency_id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`) ON DELETE RESTRICT;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  ADD CONSTRAINT `invoice_payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE;

--
-- Constraints for table `material_indents`
--
ALTER TABLE `material_indents`
  ADD CONSTRAINT `material_indents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `material_indents_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `material_indents_ibfk_3` FOREIGN KEY (`required_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `material_requirements`
--
ALTER TABLE `material_requirements`
  ADD CONSTRAINT `fk_indent_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_indent_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_indent_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_indent_required_emp` FOREIGN KEY (`required_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_indent_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `monthly_completed_work`
--
ALTER TABLE `monthly_completed_work`
  ADD CONSTRAINT `monthly_completed_work_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `monthly_completed_work_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `monthly_completed_work_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

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
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `quotation_disciplines`
--
ALTER TABLE `quotation_disciplines`
  ADD CONSTRAINT `quotation_disciplines_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotation_disciplines_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotation_disciplines_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE CASCADE;

--
-- Constraints for table `quotation_required_documents`
--
ALTER TABLE `quotation_required_documents`
  ADD CONSTRAINT `quotation_required_documents_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE;

--
-- Constraints for table `quotation_terms_snapshots`
--
ALTER TABLE `quotation_terms_snapshots`
  ADD CONSTRAINT `quotation_terms_snapshots_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE;

--
-- Constraints for table `quotation_terms_template_items`
--
ALTER TABLE `quotation_terms_template_items`
  ADD CONSTRAINT `quotation_terms_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `terms_templates` (`template_id`) ON DELETE CASCADE;

--
-- Constraints for table `site_surveys`
--
ALTER TABLE `site_surveys`
  ADD CONSTRAINT `site_surveys_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `site_surveys_ibfk_2` FOREIGN KEY (`conducted_by`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `site_surveys_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL;

--
-- Constraints for table `site_survey_photos`
--
ALTER TABLE `site_survey_photos`
  ADD CONSTRAINT `site_survey_photos_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `site_surveys` (`survey_id`) ON DELETE CASCADE;

--
-- Constraints for table `site_survey_photo_disciplines`
--
ALTER TABLE `site_survey_photo_disciplines`
  ADD CONSTRAINT `site_survey_photo_disciplines_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `site_survey_photos` (`photo_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `site_survey_photo_disciplines_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE CASCADE;

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

--
-- Constraints for table `taxes`
--
ALTER TABLE `taxes`
  ADD CONSTRAINT `taxes_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL;

--
-- Constraints for table `terms_templates`
--
ALTER TABLE `terms_templates`
  ADD CONSTRAINT `terms_templates_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `terms_templates_ibfk_2` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `terms_templates_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `terms_templates_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `vendor_invoices`
--
ALTER TABLE `vendor_invoices`
  ADD CONSTRAINT `vendor_invoices_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_invoices_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_payments`
--
ALTER TABLE `vendor_payments`
  ADD CONSTRAINT `vendor_payments_ibfk_1` FOREIGN KEY (`vendor_invoice_id`) REFERENCES `vendor_invoices` (`vendor_invoice_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
