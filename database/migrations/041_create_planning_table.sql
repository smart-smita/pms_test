-- Migration for table: planning

-- UP
CREATE TABLE `planning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `new_project_name` varchar(255) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `calendar_id` int(11) DEFAULT NULL,
  `status` enum('draft','in_review','approved','rejected') DEFAULT 'draft',
  `version` int(11) DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_duration` int(11) NOT NULL DEFAULT 0,
  `total_budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` longtext DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `calendar_id` (`calendar_id`),
  CONSTRAINT `planning_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `planning_ibfk_2` FOREIGN KEY (`calendar_id`) REFERENCES `company_calendar` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning`;
