-- Migration for table: materials

-- UP
CREATE TABLE `materials` (
  `material_id` int(11) NOT NULL AUTO_INCREMENT,
  `material_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `material_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand_spec` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hsn_sac_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_percentage` decimal(5,2) DEFAULT 18.00,
  `min_stock_level` decimal(12,2) DEFAULT 0.00,
  `reorder_level` decimal(12,2) DEFAULT 0.00,
  `vendor_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`material_id`),
  UNIQUE KEY `material_code` (`material_code`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `materials`;
