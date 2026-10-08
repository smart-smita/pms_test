-- Migration for table: quotation_wbs_labour

-- UP
CREATE TABLE `quotation_wbs_labour` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `quotation_discipline_id` int(11) NOT NULL,
  `labour_id` int(11) DEFAULT NULL,
  `labour_name` varchar(255) NOT NULL,
  `labour_type` varchar(100) DEFAULT NULL,
  `hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `quotation_discipline_id` (`quotation_discipline_id`),
  CONSTRAINT `quotation_wbs_labour_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_wbs_labour_ibfk_2` FOREIGN KEY (`quotation_discipline_id`) REFERENCES `quotation_disciplines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=latin1;

-- DOWN
DROP TABLE IF EXISTS `quotation_wbs_labour`;
