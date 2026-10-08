-- Migration for table: planning_tasks

-- UP
CREATE TABLE `planning_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_wbs_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `task_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `baseline_duration` int(11) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `planned_hours` decimal(10,2) NOT NULL DEFAULT 8.00,
  `planned_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `manually_adjusted` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'pending',
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `planning_wbs_id` (`planning_wbs_id`),
  CONSTRAINT `planning_tasks_ibfk_1` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_tasks`;
