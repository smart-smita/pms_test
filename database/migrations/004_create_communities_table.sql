-- Migration for table: communities

-- UP
CREATE TABLE `communities` (
  `community_id` int(11) NOT NULL AUTO_INCREMENT,
  `community_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`community_id`),
  UNIQUE KEY `uk_community_name` (`community_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1448 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `communities`;
