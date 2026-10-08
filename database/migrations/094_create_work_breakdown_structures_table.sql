-- Migration for table: work_breakdown_structures

-- UP
CREATE TABLE `work_breakdown_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wbs_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `wbs_type` enum('labour','material','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labour',
  PRIMARY KEY (`id`),
  UNIQUE KEY `wbs_code` (`wbs_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `work_breakdown_structures`;
