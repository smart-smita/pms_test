-- Migration for table: task_dependencies

-- UP
CREATE TABLE `task_dependencies` (
  `dependency_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `predecessor_task_id` int(11) NOT NULL,
  `dependency_type` enum('FS','SS','FF','SF') COLLATE utf8mb4_unicode_ci DEFAULT 'FS',
  `lag_days` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`dependency_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `task_dependencies`;
