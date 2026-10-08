-- Migration for table: planning_resources

-- UP
CREATE TABLE `planning_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_task_id` int(11) NOT NULL,
  `resource_type` enum('labour','employee','material','equipment') NOT NULL,
  `resource_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `planned_cost` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `planning_task_id` (`planning_task_id`),
  CONSTRAINT `planning_resources_ibfk_1` FOREIGN KEY (`planning_task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_resources`;
