-- Migration for table: project_materials

-- UP
CREATE TABLE `project_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Nos',
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `received_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `used_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `extra_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `planned_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `actual_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pm_proj` (`project_id`),
  KEY `idx_pm_wbs` (`wbs_id`),
  KEY `idx_pm_mat` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `project_materials`;
