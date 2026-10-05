-- Add precise time tracking to tasks
ALTER TABLE `tasks` ADD COLUMN `start_time` TIME NULL AFTER `start_date`;
ALTER TABLE `tasks` ADD COLUMN `target_time` TIME NULL AFTER `target_date`;
