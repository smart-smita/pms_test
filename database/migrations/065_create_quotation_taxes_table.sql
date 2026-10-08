-- Migration for table: quotation_taxes

-- UP
CREATE TABLE `quotation_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_qt_quote` (`quotation_id`),
  KEY `idx_qt_tax` (`tax_id`),
  CONSTRAINT `fk_qt_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qt_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `quotation_taxes`;
