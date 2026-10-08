-- Migration for table: disciplines

-- UP
CREATE TABLE `disciplines` (
  `discipline_id` int(11) NOT NULL AUTO_INCREMENT,
  `discipline_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discipline_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`discipline_id`),
  UNIQUE KEY `discipline_code` (`discipline_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2482 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `disciplines`;
