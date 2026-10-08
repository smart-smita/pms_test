-- Migration for table: planning_wbs

-- UP
CREATE TABLE `planning_wbs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `quotation_discipline_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `wbs_template_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `wbs_name` varchar(255) NOT NULL,
  `wbs_code` varchar(100) DEFAULT NULL,
  `wbs_type` enum('labour','material','both') NOT NULL DEFAULT 'labour',
  `level` int(11) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `unit` varchar(30) NOT NULL DEFAULT 'hours',
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `budget_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `planned_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `baseline_duration` int(11) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `planning_wbs_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_wbs`;
