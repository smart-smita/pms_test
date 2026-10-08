-- Migration for table: labour_payments

-- UP
CREATE TABLE `labour_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `total_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','paid','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payment_code` (`payment_code`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `labour_payments`;
