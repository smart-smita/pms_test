-- Migration for table: customers

-- UP
CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `nationality_id` int(11) DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `gst_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Registration Number (India)',
  `pan_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number (India)',
  `tax_id` int(11) DEFAULT NULL COMMENT 'Default tax configuration for this customer',
  `currency_id` int(11) DEFAULT NULL COMMENT 'Default billing currency',
  `billing_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State for place-of-supply determination',
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `customer_code` (`customer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `customers`;
