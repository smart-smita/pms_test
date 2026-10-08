-- Migration for table: expiry_notifications_log

-- UP
CREATE TABLE `expiry_notifications_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `entity_type` enum('employee','labour','project','quotation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) NOT NULL,
  `days_before` int(11) NOT NULL COMMENT '10, 8, 5, 3, 2, 1, 0 (expired)',
  `recipient_user_id` int(11) NOT NULL,
  `sent_at` timestamp NULL DEFAULT current_timestamp(),
  `delivery_status` enum('sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `error_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expiry_sent` (`document_id`,`days_before`,`recipient_user_id`),
  KEY `recipient_user_id` (`recipient_user_id`),
  CONSTRAINT `expiry_notifications_log_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `entity_documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `expiry_notifications_log_ibfk_2` FOREIGN KEY (`recipient_user_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `expiry_notifications_log`;
