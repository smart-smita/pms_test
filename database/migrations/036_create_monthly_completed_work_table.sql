-- Migration for table: monthly_completed_work

-- UP
CREATE TABLE `monthly_completed_work` (
  `completed_work_id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `completion_percentage` decimal(5,2) DEFAULT 100.00,
  `approved_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','submitted','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`completed_work_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `monthly_completed_work_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_completed_work_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_completed_work_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `monthly_completed_work`;
