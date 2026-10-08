-- Migration for table: quotation_disciplines

-- UP
CREATE TABLE `quotation_disciplines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `discipline_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'lump_sum',
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wbs_type` enum('labour','material','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labour',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `labour_hours` decimal(10,2) DEFAULT 0.00,
  `labour_rate` decimal(15,2) DEFAULT 0.00,
  `labour_cost` decimal(15,2) DEFAULT 0.00,
  `material_quantity` decimal(12,2) DEFAULT 0.00,
  `material_rate` decimal(15,2) DEFAULT 0.00,
  `material_cost` decimal(15,2) DEFAULT 0.00,
  `wbs_template_id` int(11) DEFAULT NULL,
  `planned_hours` decimal(10,2) DEFAULT 0.00,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `project_id` (`project_id`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `quotation_disciplines_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `quotation_disciplines`;
