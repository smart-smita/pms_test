-- Migration for table: invoice_items

-- UP
CREATE TABLE `invoice_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_extra_work` tinyint(1) NOT NULL DEFAULT 0,
  `project_wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `rate` decimal(15,2) DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`item_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `project_wbs_id` (`project_wbs_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL,
  CONSTRAINT `invoice_items_ibfk_3` FOREIGN KEY (`project_wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoice_items_ibfk_4` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `invoice_items`;
