-- Migration for table: invoices

-- UP
CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `survey_id` int(11) DEFAULT NULL,
  `currency_id` int(11) NOT NULL,
  `tax_id` int(11) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','pending_approval','approved','sent','partially_paid','paid','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `currency_id` (`currency_id`),
  KEY `tax_id` (`tax_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`currency_id`),
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `invoices`;
