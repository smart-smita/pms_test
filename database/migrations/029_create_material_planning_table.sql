-- Migration for table: material_planning

-- UP
CREATE TABLE `material_planning` (
  `plan_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `material_id` int(11) NOT NULL,
  `planned_date` date DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `planned_cost` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`plan_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `material_planning`;
