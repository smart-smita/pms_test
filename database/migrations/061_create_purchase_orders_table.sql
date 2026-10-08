-- Migration for table: purchase_orders

-- UP
CREATE TABLE `purchase_orders` (
  `po_id` int(11) NOT NULL AUTO_INCREMENT,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_date` date NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `indent_id` int(11) DEFAULT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_terms` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','issued','partially_received','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`po_id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `purchase_orders`;
