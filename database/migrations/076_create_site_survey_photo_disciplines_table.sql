-- Migration for table: site_survey_photo_disciplines

-- UP
CREATE TABLE `site_survey_photo_disciplines` (
  `photo_id` int(11) NOT NULL,
  `discipline_id` int(11) NOT NULL,
  PRIMARY KEY (`photo_id`,`discipline_id`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `site_survey_photo_disciplines_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `site_survey_photos` (`photo_id`) ON DELETE CASCADE,
  CONSTRAINT `site_survey_photo_disciplines_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `site_survey_photo_disciplines`;
