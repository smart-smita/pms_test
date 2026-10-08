-- Migration for table: site_survey_photos

-- UP
CREATE TABLE `site_survey_photos` (
  `photo_id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `photo_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`photo_id`),
  KEY `survey_id` (`survey_id`),
  CONSTRAINT `site_survey_photos_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `site_surveys` (`survey_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `site_survey_photos`;
