-- Migration for table: holidays

-- UP
CREATE TABLE `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `calendar_id` int(11) NOT NULL,
  `holiday_date` date NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('public_holiday','site_shutdown','unavailable') DEFAULT 'public_holiday',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_calendar_date` (`calendar_id`,`holiday_date`),
  CONSTRAINT `holidays_ibfk_1` FOREIGN KEY (`calendar_id`) REFERENCES `company_calendar` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4;

-- DOWN
DROP TABLE IF EXISTS `holidays`;
