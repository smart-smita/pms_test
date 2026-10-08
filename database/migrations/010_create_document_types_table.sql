-- Migration for table: document_types

-- UP
CREATE TABLE `document_types` (
  `doc_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('employee','labour','project','quotation','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `has_expiry` tinyint(1) NOT NULL DEFAULT 1,
  `has_number` tinyint(1) NOT NULL DEFAULT 1,
  `has_issue_date` tinyint(1) NOT NULL DEFAULT 1,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `country_id` int(11) DEFAULT NULL COMMENT 'NULL = universal',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doc_type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2992 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `document_types`;
