-- Migration for table: planning_wbs_labour

-- UP
CREATE TABLE `planning_wbs_labour` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `planning_wbs_id` int(11) NOT NULL,
  `quotation_labour_id` int(11) DEFAULT NULL,
  `labour_id` int(11) DEFAULT NULL,
  `labour_name` varchar(255) NOT NULL,
  `labour_type` varchar(100) DEFAULT NULL,
  `worker_count` int(11) NOT NULL DEFAULT 1,
  `hours` decimal(10,2) NOT NULL DEFAULT 0.00,
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
  CONSTRAINT `planning_wbs_labour_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_labour_ibfk_2` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_wbs_labour`;
