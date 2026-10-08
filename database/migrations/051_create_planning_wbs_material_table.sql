-- Migration for table: planning_wbs_material

-- UP
CREATE TABLE `planning_wbs_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `planning_wbs_id` int(11) NOT NULL,
  `quotation_material_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(255) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(30) DEFAULT NULL,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  KEY `planning_wbs_id` (`planning_wbs_id`),
  CONSTRAINT `planning_wbs_material_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_material_ibfk_2` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_wbs_material`;
