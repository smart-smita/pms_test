-- Migration for table: terms_templates

-- UP
CREATE TABLE `terms_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL COMMENT 'NULL = All countries',
  `project_type_id` int(11) DEFAULT NULL COMMENT 'NULL = All project types',
  `discipline_id` int(11) DEFAULT NULL COMMENT 'NULL = All disciplines',
  `terms_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`template_id`),
  KEY `country_id` (`country_id`),
  KEY `project_type_id` (`project_type_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `terms_templates_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_2` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=639 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `terms_templates`;
