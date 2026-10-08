-- Migration for table: goods_receipt_notes

-- UP
CREATE TABLE `goods_receipt_notes` (
  `grn_id` int(11) NOT NULL AUTO_INCREMENT,
  `grn_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_date` date NOT NULL,
  `delivery_challan_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`grn_id`),
  UNIQUE KEY `grn_number` (`grn_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `goods_receipt_notes_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_notes_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_notes_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `goods_receipt_notes`;
