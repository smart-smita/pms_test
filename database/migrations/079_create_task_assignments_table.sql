-- Migration for table: task_assignments

-- UP
CREATE TABLE `task_assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `planned_hours` decimal(10,2) DEFAULT 0.00,
  `actual_hours` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_task_employee` (`task_id`,`employee_id`),
  KEY `fk_ta_employees` (`employee_id`),
  CONSTRAINT `fk_ta_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ta_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `task_assignments`;
