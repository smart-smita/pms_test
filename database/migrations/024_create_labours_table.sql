-- Migration for table: labours

-- UP
CREATE TABLE `labours` (
  `labour_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labour_type` enum('contractor','direct_labour','temporary') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'direct_labour',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `contractor_id` int(11) DEFAULT NULL,
  `assigned_project_id` int(11) DEFAULT NULL,
  `nationality_id` int(11) DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `emreads_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `labour_category` enum('employee','contract','temporary') COLLATE utf8mb4_unicode_ci DEFAULT 'contract',
  `monthly_salary` decimal(12,2) DEFAULT NULL,
  `project_rate` decimal(12,2) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`labour_id`),
  UNIQUE KEY `uq_labour_contact` (`contact_number`),
  KEY `fk_labour_assigned_project` (`assigned_project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `labours`;
