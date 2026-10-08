-- Migration for table: quotation_wbs_templates

-- UP
CREATE TABLE `quotation_wbs_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

-- DOWN
DROP TABLE IF EXISTS `quotation_wbs_templates`;
