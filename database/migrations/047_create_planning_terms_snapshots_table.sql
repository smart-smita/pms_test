-- Migration for table: planning_terms_snapshots

-- UP
CREATE TABLE `planning_terms_snapshots` (
  `snapshot_id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`snapshot_id`),
  KEY `planning_id` (`planning_id`),
  CONSTRAINT `planning_terms_snapshots_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_terms_snapshots`;
