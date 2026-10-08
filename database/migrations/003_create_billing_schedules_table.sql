-- Migration for table: billing_schedules

-- UP
CREATE TABLE `billing_schedules` (
  `schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `billing_month` date NOT NULL COMMENT 'e.g. 2026-01-01 for Jan 2026',
  `expected_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','completed_work_logged','invoiced','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `billing_schedules_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `billing_schedules_ibfk_2` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `billing_schedules`;
