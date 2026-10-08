-- Migration for table: project_selected_templates

-- UP
CREATE TABLE `project_selected_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pst_project` (`project_id`),
  KEY `fk_pst_template` (`template_id`),
  CONSTRAINT `fk_pst_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pst_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `project_selected_templates`;
