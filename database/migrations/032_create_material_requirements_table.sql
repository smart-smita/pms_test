-- Migration for table: material_requirements

-- UP
CREATE TABLE `material_requirements` (
  `indent_id` int(11) NOT NULL AUTO_INCREMENT,
  `indent_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `indent_date` date NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `required_by_employee_id` int(11) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','approved','po_created','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_number` (`indent_number`),
  KEY `fk_indent_projects` (`project_id`),
  KEY `fk_indent_wbs` (`wbs_id`),
  KEY `fk_indent_required_emp` (`required_by_employee_id`),
  KEY `fk_indent_created_by` (`created_by`),
  KEY `fk_indent_approved_by` (`approved_by`),
  CONSTRAINT `fk_indent_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_indent_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `fk_indent_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `fk_indent_required_emp` FOREIGN KEY (`required_by_employee_id`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `fk_indent_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `material_requirements`;
