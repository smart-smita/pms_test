-- Migration for table: taxes

-- UP
CREATE TABLE `taxes` (
  `tax_id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_type` enum('VAT','GST','CGST_SGST','IGST','SALES_TAX','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VAT',
  `is_split` tinyint(1) DEFAULT 0,
  `cgst_percentage` decimal(5,2) DEFAULT 0.00,
  `sgst_percentage` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`tax_id`),
  KEY `country_id` (`country_id`),
  CONSTRAINT `taxes_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1703 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `taxes`;
