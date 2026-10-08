-- Migration for table: labour_work_logs

-- UP
CREATE TABLE `labour_work_logs` (
  `work_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate_type` enum('hourly','daily') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hourly',
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `work_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('pending','in_progress','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `payment_status` enum('pending','approved','paid','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `labour_count` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of labourers allocated from contractor for this task/date',
  `rate_per_labour` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Rate per individual labourer',
  PRIMARY KEY (`work_log_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `labour_work_logs`;
