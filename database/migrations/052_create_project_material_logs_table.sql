-- Migration for table: project_material_logs

-- UP
CREATE TABLE `project_material_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_material_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `action_type` enum('received','used') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'used',
  `quantity` decimal(12,2) NOT NULL,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `log_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_pml_pm` (`project_material_id`),
  KEY `idx_pml_proj` (`project_id`),
  KEY `idx_pml_wbs` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `project_material_logs`;
