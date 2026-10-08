-- Migration for table: vendor_payments

-- UP
CREATE TABLE `vendor_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_invoice_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `vendor_invoice_id` (`vendor_invoice_id`),
  CONSTRAINT `vendor_payments_ibfk_1` FOREIGN KEY (`vendor_invoice_id`) REFERENCES `vendor_invoices` (`vendor_invoice_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `vendor_payments`;
