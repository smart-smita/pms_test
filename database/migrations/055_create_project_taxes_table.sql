-- Migration for table: project_taxes

-- UP
CREATE TABLE `project_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pt_project` (`project_id`),
  KEY `idx_pt_tax` (`tax_id`),
  CONSTRAINT `fk_pt_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `project_taxes`;
