-- Migration for table: attendance_logs

-- UP
CREATE TABLE `attendance_logs` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` datetime NOT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('open','completed','outside_area','missing_checkout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `in_distance_meters` decimal(10,2) DEFAULT NULL,
  `out_distance_meters` decimal(10,2) DEFAULT NULL,
  `project_radius_meters` int(11) DEFAULT 500,
  `in_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `out_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_attendance_emp_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_task` (`task_id`),
  KEY `idx_attendance_status` (`status`),
  CONSTRAINT `fk_att_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `attendance_logs`;
