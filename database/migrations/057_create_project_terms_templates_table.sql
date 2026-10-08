-- Migration for table: project_terms_templates

-- UP
CREATE TABLE `project_terms_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_template` (`project_id`,`template_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `project_terms_templates`;
