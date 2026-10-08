-- Migration for table: material_indents

-- UP
CREATE TABLE `material_indents` (
  `indent_id` int(11) NOT NULL AUTO_INCREMENT,
  `indent_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `required_by` int(11) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','approved','rejected','ordered') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_code` (`indent_code`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `required_by` (`required_by`),
  CONSTRAINT `material_indents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `material_indents_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `material_indents_ibfk_3` FOREIGN KEY (`required_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `material_indents`;
