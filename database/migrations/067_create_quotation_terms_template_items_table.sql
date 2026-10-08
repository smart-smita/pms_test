-- Migration for table: quotation_terms_template_items

-- UP
CREATE TABLE `quotation_terms_template_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 1,
  PRIMARY KEY (`item_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `quotation_terms_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `terms_templates` (`template_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `quotation_terms_template_items`;
