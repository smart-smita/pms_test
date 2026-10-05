-- Migration 04: Working Calendars and Holidays
-- Provides the foundation for the Scheduling Engine (Phase 5)

CREATE TABLE IF NOT EXISTS `working_calendars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `project_id` int(11) DEFAULT NULL,
  `work_days` varchar(50) DEFAULT '1,2,3,4,5,6', -- 0=Sun, 1=Mon... 6=Sat
  `working_hours_per_day` decimal(5,2) DEFAULT '10.00',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `calendar_holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `calendar_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` enum('holiday','shutdown','unavailable') DEFAULT 'holiday',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `calendar_id` (`calendar_id`),
  FOREIGN KEY (`calendar_id`) REFERENCES `working_calendars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default company calendar
INSERT INTO `working_calendars` (`name`, `is_default`, `work_days`, `working_hours_per_day`) 
VALUES ('Standard Company Calendar', 1, '1,2,3,4,5,6', 10.00)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
