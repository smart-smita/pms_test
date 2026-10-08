-- Migration for table: material_surveys

-- UP
CREATE TABLE `material_surveys` (
  `survey_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `survey_date` date NOT NULL,
  `survey_month` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`survey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `material_surveys`;
