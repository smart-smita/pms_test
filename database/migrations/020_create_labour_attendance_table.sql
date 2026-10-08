-- Migration for table: labour_attendance

-- UP
CREATE TABLE `labour_attendance` (
  `labour_attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `daily_pay_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `worker_count` int(11) NOT NULL DEFAULT 1,
  `comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `calculated_payment` decimal(10,2) NOT NULL DEFAULT 0.00,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`labour_attendance_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `labour_attendance`;
