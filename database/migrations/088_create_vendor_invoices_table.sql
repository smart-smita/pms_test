-- Migration for table: vendor_invoices

-- UP
CREATE TABLE `vendor_invoices` (
  `vendor_invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `po_id` int(11) NOT NULL,
  `grn_id` int(11) DEFAULT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `payable_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT 0.00,
  `balance_amount` decimal(15,2) NOT NULL,
  `payment_status` enum('unpaid','partially_paid','paid','on_hold','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`vendor_invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `vendor_invoices_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_invoices_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `vendor_invoices`;
