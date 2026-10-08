-- Migration for table: planning_taxes

-- UP
CREATE TABLE `planning_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  CONSTRAINT `planning_taxes_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `planning_taxes`;
