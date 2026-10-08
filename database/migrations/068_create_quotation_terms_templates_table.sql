-- Migration for table: quotation_terms_templates

-- UP
CREATE TABLE `quotation_terms_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_template` (`quotation_id`,`template_id`),
  KEY `idx_quotation_id` (`quotation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `quotation_terms_templates`;
