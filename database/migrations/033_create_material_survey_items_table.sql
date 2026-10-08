-- Migration for table: material_survey_items

-- UP
CREATE TABLE `material_survey_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `opening_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `added_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `used_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `wastage_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_qty` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `used_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `material_survey_items`;
