-- =========================================================================================
-- HTCO ERP - Responsive & High-Performance Relational Database Hierarchy Schema
-- Hierarchy: Project -> Discipline (project_wbs) -> Task (tasks) -> Timesheet Logs -> History
-- =========================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Projects Master Table
CREATE TABLE IF NOT EXISTS `projects` (
    `project_id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_code` VARCHAR(50) NOT NULL UNIQUE,
    `project_name` VARCHAR(255) NOT NULL,
    `client_name` VARCHAR(255) NULL,
    `client_code` VARCHAR(50) NULL,
    `project_address` TEXT NULL,
    `latitude` DECIMAL(10,8) NULL,
    `longitude` DECIMAL(11,8) NULL,
    `radius_meters` INT DEFAULT 100,
    `project_date` DATE NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `status` ENUM('active', 'completed', 'on-hold', 'delayed', 'cancelled') DEFAULT 'active',
    `note` TEXT NULL,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `created_by` INT NULL,
    `updated_by` INT NULL,
    `deleted_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_projects_status` (`status`),
    INDEX `idx_projects_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Work Breakdown Structures (Master Disciplines)
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
    `deleted_at` DATETIME NULL,
    INDEX `idx_wbs_code` (`wbs_code`),
    INDEX `idx_wbs_name` (`wbs_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Project WBS (Manage Project Work / Disciplines per Project)
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
    INDEX `idx_pwbs_project_id` (`project_id`),
    INDEX `idx_pwbs_wbs_id` (`wbs_id`),
    INDEX `idx_pwbs_deleted` (`deleted_at`),
    CONSTRAINT `fk_pwbs_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pwbs_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tasks Master Table (Task Management under Project -> Discipline)
CREATE TABLE IF NOT EXISTS `tasks` (
    `task_id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NOT NULL,
    `wbs_id` INT NULL,
    `task_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `required_worker_count` INT DEFAULT 1,
    `estimated_hours` DECIMAL(10,2) DEFAULT 0,
    `start_date` DATE NULL,
    `start_time` TIME NULL,
    `target_date` DATE NULL,
    `target_time` TIME NULL,
    `status` ENUM('pending', 'in-progress', 'completed', 'delayed', 'on-hold', 'cancelled') DEFAULT 'pending',
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `created_by` INT NULL,
    `updated_by` INT NULL,
    `deleted_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_tasks_project` (`project_id`),
    INDEX `idx_tasks_wbs` (`wbs_id`),
    INDEX `idx_tasks_status` (`status`),
    INDEX `idx_tasks_deleted` (`is_deleted`),
    CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tasks_pwbs` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Timesheet Logs Table (Daily Time Entry & Task History)
CREATE TABLE IF NOT EXISTS `timesheets` (
    `timesheet_id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NOT NULL,
    `wbs_id` INT NULL,
    `task_id` INT NULL,
    `employee_id` INT NOT NULL,
    `log_date` DATE NOT NULL,
    `working_hours` DECIMAL(10,2) NOT NULL,
    `comment` TEXT NULL,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `created_by` INT NULL,
    `updated_by` INT NULL,
    `deleted_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_ts_project` (`project_id`),
    INDEX `idx_ts_wbs` (`wbs_id`),
    INDEX `idx_ts_task` (`task_id`),
    INDEX `idx_ts_employee` (`employee_id`),
    INDEX `idx_ts_log_date` (`log_date`),
    INDEX `idx_ts_deleted` (`is_deleted`),
    CONSTRAINT `fk_ts_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ts_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Task Worker Assignments
CREATE TABLE IF NOT EXISTS `task_assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `task_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ta_task` (`task_id`),
    INDEX `idx_ta_employee` (`employee_id`),
    CONSTRAINT `fk_ta_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
