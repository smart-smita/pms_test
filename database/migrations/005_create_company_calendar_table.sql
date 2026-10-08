-- Migration for table: company_calendar

-- UP
CREATE TABLE `company_calendar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL COMMENT 'If null, this is the company default calendar',
  `calendar_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `working_days_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat) e.g., [1,2,3,4,5,6] for Mon-Sat',
  `working_hours_per_day` decimal(5,2) NOT NULL DEFAULT 8.00,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `company_calendar`;
