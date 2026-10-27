USE `eth_htco_db`;

ALTER TABLE `projects` 
ADD COLUMN `client_code` VARCHAR(50) DEFAULT NULL AFTER `client_name`,
ADD COLUMN `project_address` TEXT DEFAULT NULL AFTER `project_name`,
ADD COLUMN `project_date` DATE DEFAULT NULL AFTER `radius_meters`,
ADD COLUMN `note` TEXT DEFAULT NULL AFTER `status`;
