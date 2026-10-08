-- Migration for table: entity_documents

-- UP
CREATE TABLE `entity_documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('employee','labour','project','quotation','discipline') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) NOT NULL,
  `doc_type_id` int(11) NOT NULL,
  `document_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) DEFAULT 0,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','expiring_soon','expired','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_current` tinyint(1) NOT NULL DEFAULT 1,
  `replaced_by_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`document_id`),
  KEY `doc_type_id` (`doc_type_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_entity_doc` (`entity_type`,`entity_id`),
  KEY `idx_expiry` (`expiry_date`,`status`),
  CONSTRAINT `entity_documents_ibfk_1` FOREIGN KEY (`doc_type_id`) REFERENCES `document_types` (`doc_type_id`),
  CONSTRAINT `entity_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `entity_documents`;
