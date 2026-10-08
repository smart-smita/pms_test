-- Migration for table: wbs_template_details

-- UP
CREATE TABLE `wbs_template_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `wbs_name` varchar(255) DEFAULT NULL,
  `wbs_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tpl_detail_template` (`template_id`),
  KEY `idx_tpl_detail_wbs` (`wbs_id`),
  KEY `fk_wbs_template_parent` (`parent_id`),
  CONSTRAINT `fk_tpl_detail_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tpl_detail_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`),
  CONSTRAINT `fk_wbs_template_parent` FOREIGN KEY (`parent_id`) REFERENCES `wbs_template_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `wbs_template_details`;
