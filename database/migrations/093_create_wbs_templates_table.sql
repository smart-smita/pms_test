-- Migration for table: wbs_templates

-- UP
CREATE TABLE `wbs_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_code` varchar(50) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_code` (`template_code`),
  KEY `idx_project_type` (`project_type_id`),
  CONSTRAINT `fk_wbs_template_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `wbs_templates`;
