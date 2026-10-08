-- Migration for table: quotation_wbs_items

-- UP
CREATE TABLE `quotation_wbs_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_discipline_id` int(11) NOT NULL,
  `item_type` enum('labour','material','other') NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(50) DEFAULT 'lump_sum',
  `qty` decimal(10,2) NOT NULL DEFAULT 1.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `line_total` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quotation_discipline_id` (`quotation_discipline_id`),
  CONSTRAINT `quotation_wbs_items_ibfk_1` FOREIGN KEY (`quotation_discipline_id`) REFERENCES `quotation_disciplines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=latin1;

-- DOWN
DROP TABLE IF EXISTS `quotation_wbs_items`;
