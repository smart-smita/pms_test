-- Migration for table: timesheets

-- UP
CREATE TABLE `timesheets` (
  `timesheet_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `rate_snapshot` decimal(10,2) DEFAULT NULL COMMENT 'Employee hourly_rate at time of log',
  `cost` decimal(15,2) DEFAULT NULL COMMENT 'working_hours * rate_snapshot',
  PRIMARY KEY (`timesheet_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=516 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `timesheets`;
