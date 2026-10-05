USE `eth_htco_db`;

-- Give Manager (employee_id = 2) an active check-in
INSERT INTO `attendance_logs` (`employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`) 
VALUES (2, NULL, CURDATE(), NOW(), NULL, 0, 0, 'Test Manager Punch', NULL, NULL, NULL, 0.00, 'open')
ON DUPLICATE KEY UPDATE `status` = 'open';

-- Give Employee (employee_id = 3) an active check-in
INSERT INTO `attendance_logs` (`employee_id`, `task_id`, `attendance_date`, `check_in_time`, `check_out_time`, `in_latitude`, `in_longitude`, `in_address`, `out_latitude`, `out_longitude`, `out_address`, `total_working_hours`, `status`) 
VALUES (3, NULL, CURDATE(), NOW(), NULL, 0, 0, 'Test Employee Punch', NULL, NULL, NULL, 0.00, 'open')
ON DUPLICATE KEY UPDATE `status` = 'open';
