CREATE TABLE IF NOT EXISTS `work_breakdown_structures` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `wbs_code` VARCHAR(100) NOT NULL UNIQUE,
    `wbs_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by` INT NULL,
    `updated_by` INT NULL,
    `deleted_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_wbs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NOT NULL,
    `wbs_id` INT NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `total_hours` DECIMAL(10,2) DEFAULT 0,
    `note` TEXT NULL,
    `status` TINYINT(1) DEFAULT 1,
    `created_by` INT NULL,
    `updated_by` INT NULL,
    `deleted_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_wbs_id` (`wbs_id`),
    CONSTRAINT `fk_pwbs_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pwbs_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safely add wbs_id to tasks
ALTER TABLE `tasks` ADD COLUMN `wbs_id` INT NULL AFTER `project_id`;

-- Insert unique task names into work_breakdown_structures
INSERT INTO `work_breakdown_structures` (`wbs_code`, `wbs_name`)
SELECT DISTINCT CONCAT('WBS-', UPPER(REPLACE(`task_name`, ' ', ''))), `task_name`
FROM `tasks`
WHERE `task_name` IS NOT NULL
ON DUPLICATE KEY UPDATE `wbs_name` = `wbs_name`;

-- Create project_wbs records for existing tasks
INSERT INTO `project_wbs` (`project_id`, `wbs_id`, `start_date`, `end_date`, `total_hours`)
SELECT 
    t.`project_id`, 
    w.`id`,
    t.`start_date`,
    t.`target_date`,
    t.`estimated_hours`
FROM `tasks` t
JOIN `work_breakdown_structures` w ON w.`wbs_name` = t.`task_name`;

-- Update tasks with the new wbs_id
UPDATE `tasks` t
JOIN `work_breakdown_structures` w ON w.`wbs_name` = t.`task_name`
JOIN `project_wbs` pw ON pw.`project_id` = t.`project_id` AND pw.`wbs_id` = w.`id`
SET t.`wbs_id` = pw.`id`;

-- Finally add the foreign key to tasks
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_pwbs` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs`(`id`) ON DELETE CASCADE;
