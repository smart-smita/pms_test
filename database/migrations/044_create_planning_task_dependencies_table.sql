-- Migration for table: planning_task_dependencies

-- UP
CREATE TABLE `planning_task_dependencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `predecessor_task_id` int(11) NOT NULL,
  `dependency_type` enum('FS','SS','FF','SF') DEFAULT 'FS',
  `lag_days` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `predecessor_task_id` (`predecessor_task_id`),
  CONSTRAINT `planning_task_dependencies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_task_dependencies_ibfk_2` FOREIGN KEY (`predecessor_task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_task_dependencies`;
