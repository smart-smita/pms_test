-- Migration for table: site_surveys

-- UP
CREATE TABLE `site_surveys` (
  `survey_id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `survey_date` date NOT NULL,
  `conducted_by` int(11) NOT NULL,
  `entry_type` enum('system_entry','report_attachment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system_entry',
  `location_details` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attached_report_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','completed','verified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wbs_id` int(11) DEFAULT NULL,
  `site_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `measurements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labour_requirements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_requirements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `survey_code` (`survey_code`),
  KEY `project_id` (`project_id`),
  KEY `conducted_by` (`conducted_by`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `site_surveys_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `site_surveys_ibfk_2` FOREIGN KEY (`conducted_by`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `site_surveys_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `site_surveys`;
