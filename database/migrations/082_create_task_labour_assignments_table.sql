-- Migration for table: task_labour_assignments

-- UP
CREATE TABLE `task_labour_assignments` (
  `task_id` int(11) NOT NULL,
  `labour_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`task_id`,`labour_id`),
  KEY `labour_id` (`labour_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `task_labour_assignments`;
