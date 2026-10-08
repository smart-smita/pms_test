-- Migration for table: wbs_template_project_types

-- UP
CREATE TABLE `wbs_template_project_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `project_type_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_project_type` (`template_id`,`project_type_id`),
  KEY `idx_wtpt_template` (`template_id`),
  KEY `idx_wtpt_project_type` (`project_type_id`),
  CONSTRAINT `fk_wtpt_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wtpt_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `wbs_template_project_types`;
