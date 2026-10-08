-- PMS Master Schema
-- Generated automatically from actual database

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `attendance_logs`;
CREATE TABLE `attendance_logs` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` datetime NOT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('open','completed','outside_area','missing_checkout') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `in_distance_meters` decimal(10,2) DEFAULT NULL,
  `out_distance_meters` decimal(10,2) DEFAULT NULL,
  `project_radius_meters` int(11) DEFAULT 500,
  `in_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `out_status` enum('inside','outside') COLLATE utf8mb4_unicode_ci DEFAULT 'inside',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_attendance_emp_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_task` (`task_id`),
  KEY `idx_attendance_status` (`status`),
  CONSTRAINT `fk_att_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=396 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `billing_schedules`;
CREATE TABLE `billing_schedules` (
  `schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `billing_month` date NOT NULL COMMENT 'e.g. 2026-01-01 for Jan 2026',
  `expected_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','completed_work_logged','invoiced','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `billing_schedules_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `billing_schedules_ibfk_2` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `communities`;
CREATE TABLE `communities` (
  `community_id` int(11) NOT NULL AUTO_INCREMENT,
  `community_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`community_id`),
  UNIQUE KEY `uk_community_name` (`community_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1448 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `company_calendar`;
CREATE TABLE `company_calendar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL COMMENT 'If null, this is the company default calendar',
  `calendar_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `working_days_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat) e.g., [1,2,3,4,5,6] for Mon-Sat',
  `working_hours_per_day` decimal(5,2) NOT NULL DEFAULT 8.00,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `countries`;
CREATE TABLE `countries` (
  `country_id` int(11) NOT NULL AUTO_INCREMENT,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISO 3166-1 alpha-2',
  `country_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`country_id`),
  UNIQUE KEY `country_code` (`country_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3985 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `currencies`;
CREATE TABLE `currencies` (
  `currency_id` int(11) NOT NULL AUTO_INCREMENT,
  `currency_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exchange_rate` decimal(15,6) DEFAULT 1.000000,
  `decimal_places` int(11) NOT NULL DEFAULT 2,
  `is_base` tinyint(1) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_code` (`currency_code`)
) ENGINE=InnoDB AUTO_INCREMENT=743 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `nationality_id` int(11) DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `gst_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Registration Number (India)',
  `pan_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number (India)',
  `tax_id` int(11) DEFAULT NULL COMMENT 'Default tax configuration for this customer',
  `currency_id` int(11) DEFAULT NULL COMMENT 'Default billing currency',
  `billing_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State for place-of-supply determination',
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `customer_code` (`customer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `disciplines`;
CREATE TABLE `disciplines` (
  `discipline_id` int(11) NOT NULL AUTO_INCREMENT,
  `discipline_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discipline_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`discipline_id`),
  UNIQUE KEY `discipline_code` (`discipline_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2482 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `document_types`;
CREATE TABLE `document_types` (
  `doc_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('employee','labour','project','quotation','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `has_expiry` tinyint(1) NOT NULL DEFAULT 1,
  `has_number` tinyint(1) NOT NULL DEFAULT 1,
  `has_issue_date` tinyint(1) NOT NULL DEFAULT 1,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `country_id` int(11) DEFAULT NULL COMMENT 'NULL = universal',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doc_type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2992 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employee_documents`;
CREATE TABLE `employee_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `document_type` enum('passport','visa','national_id','labour_card','contract') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `issuing_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issuing_country_id` int(11) DEFAULT NULL,
  `document_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int(11) DEFAULT 0,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., visa_type or contract_type',
  `status` enum('active','expiring_soon','expired','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_emp_doc` (`employee_id`,`document_type`),
  KEY `idx_emp_expiry` (`expiry_date`,`status`),
  CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int(11) NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT 25.00,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `reporting_to_id` int(11) DEFAULT NULL,
  `assigned_project_id` int(11) DEFAULT NULL,
  `assigned_wbs_id` int(11) DEFAULT NULL,
  `nationality_id` int(11) DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `emreads_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employees_roles` (`role_id`),
  KEY `idx_employees_code` (`employee_code`),
  CONSTRAINT `fk_employees_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity_documents`;
CREATE TABLE `entity_documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('employee','labour','project','quotation','discipline') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) NOT NULL,
  `doc_type_id` int(11) NOT NULL,
  `document_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) DEFAULT 0,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','expiring_soon','expired','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_current` tinyint(1) NOT NULL DEFAULT 1,
  `replaced_by_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`document_id`),
  KEY `doc_type_id` (`doc_type_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_entity_doc` (`entity_type`,`entity_id`),
  KEY `idx_expiry` (`expiry_date`,`status`),
  CONSTRAINT `entity_documents_ibfk_1` FOREIGN KEY (`doc_type_id`) REFERENCES `document_types` (`doc_type_id`),
  CONSTRAINT `entity_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expiry_notifications_log`;
CREATE TABLE `expiry_notifications_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `entity_type` enum('employee','labour','project','quotation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) NOT NULL,
  `days_before` int(11) NOT NULL COMMENT '10, 8, 5, 3, 2, 1, 0 (expired)',
  `recipient_user_id` int(11) NOT NULL,
  `sent_at` timestamp NULL DEFAULT current_timestamp(),
  `delivery_status` enum('sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `error_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expiry_sent` (`document_id`,`days_before`,`recipient_user_id`),
  KEY `recipient_user_id` (`recipient_user_id`),
  CONSTRAINT `expiry_notifications_log_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `entity_documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `expiry_notifications_log_ibfk_2` FOREIGN KEY (`recipient_user_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `goods_receipt_notes`;
CREATE TABLE `goods_receipt_notes` (
  `grn_id` int(11) NOT NULL AUTO_INCREMENT,
  `grn_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_date` date NOT NULL,
  `delivery_challan_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`grn_id`),
  UNIQUE KEY `grn_number` (`grn_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `goods_receipt_notes_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_notes_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_notes_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `calendar_id` int(11) NOT NULL,
  `holiday_date` date NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('public_holiday','site_shutdown','unavailable') DEFAULT 'public_holiday',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_calendar_date` (`calendar_id`,`holiday_date`),
  CONSTRAINT `holidays_ibfk_1` FOREIGN KEY (`calendar_id`) REFERENCES `company_calendar` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_extra_work` tinyint(1) NOT NULL DEFAULT 0,
  `project_wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `rate` decimal(15,2) DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`item_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `project_wbs_id` (`project_wbs_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL,
  CONSTRAINT `invoice_items_ibfk_3` FOREIGN KEY (`project_wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoice_items_ibfk_4` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_payments`;
CREATE TABLE `invoice_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `survey_id` int(11) DEFAULT NULL,
  `currency_id` int(11) NOT NULL,
  `tax_id` int(11) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','pending_approval','approved','sent','partially_paid','paid','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `currency_id` (`currency_id`),
  KEY `tax_id` (`tax_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`currency_id`),
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `labour_attendance`;
CREATE TABLE `labour_attendance` (
  `labour_attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `daily_pay_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `worker_count` int(11) NOT NULL DEFAULT 1,
  `comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `calculated_payment` decimal(10,2) NOT NULL DEFAULT 0.00,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`labour_attendance_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `labour_payment_items`;
CREATE TABLE `labour_payment_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `work_log_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payment_log` (`payment_id`,`work_log_id`),
  KEY `work_log_id` (`work_log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `labour_payments`;
CREATE TABLE `labour_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `total_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','paid','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payment_code` (`payment_code`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `labour_work_logs`;
CREATE TABLE `labour_work_logs` (
  `work_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `labour_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `total_working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate_type` enum('hourly','daily') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hourly',
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `work_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('pending','in_progress','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `payment_status` enum('pending','approved','paid','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `in_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `in_latitude` decimal(10,8) DEFAULT NULL,
  `in_longitude` decimal(11,8) DEFAULT NULL,
  `out_latitude` decimal(10,8) DEFAULT NULL,
  `out_longitude` decimal(11,8) DEFAULT NULL,
  `labour_count` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of labourers allocated from contractor for this task/date',
  `rate_per_labour` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Rate per individual labourer',
  PRIMARY KEY (`work_log_id`),
  KEY `labour_id` (`labour_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `labours`;
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

DROP TABLE IF EXISTS `manager_employees`;
CREATE TABLE `manager_employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `manager_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_manager_employee` (`manager_id`,`employee_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `manager_projects`;
CREATE TABLE `manager_projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `manager_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_manager_project` (`manager_id`,`project_id`),
  KEY `project_id` (`project_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_indents`;
CREATE TABLE `material_indents` (
  `indent_id` int(11) NOT NULL AUTO_INCREMENT,
  `indent_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `required_by` int(11) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','approved','rejected','ordered') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_code` (`indent_code`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `required_by` (`required_by`),
  CONSTRAINT `material_indents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `material_indents_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `material_indents_ibfk_3` FOREIGN KEY (`required_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_logs`;
CREATE TABLE `material_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `material_id` int(11) NOT NULL,
  `usage_date` date NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `actual_cost` decimal(15,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_planning`;
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

DROP TABLE IF EXISTS `material_quotation_items`;
CREATE TABLE `material_quotation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 18.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_quotations`;
CREATE TABLE `material_quotations` (
  `quotation_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `quotation_date` date NOT NULL,
  `status` enum('draft','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_requirements`;
CREATE TABLE `material_requirements` (
  `indent_id` int(11) NOT NULL AUTO_INCREMENT,
  `indent_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `indent_date` date NOT NULL,
  `required_date` date NOT NULL,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `required_by_employee_id` int(11) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','approved','po_created','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`indent_id`),
  UNIQUE KEY `indent_number` (`indent_number`),
  KEY `fk_indent_projects` (`project_id`),
  KEY `fk_indent_wbs` (`wbs_id`),
  KEY `fk_indent_required_emp` (`required_by_employee_id`),
  KEY `fk_indent_created_by` (`created_by`),
  KEY `fk_indent_approved_by` (`approved_by`),
  CONSTRAINT `fk_indent_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_indent_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `fk_indent_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `fk_indent_required_emp` FOREIGN KEY (`required_by_employee_id`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `fk_indent_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `material_survey_items`;
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

DROP TABLE IF EXISTS `material_surveys`;
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

DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials` (
  `material_id` int(11) NOT NULL AUTO_INCREMENT,
  `material_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `material_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand_spec` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hsn_sac_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_percentage` decimal(5,2) DEFAULT 18.00,
  `min_stock_level` decimal(12,2) DEFAULT 0.00,
  `reorder_level` decimal(12,2) DEFAULT 0.00,
  `vendor_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`material_id`),
  UNIQUE KEY `material_code` (`material_code`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `monthly_completed_work`;
CREATE TABLE `monthly_completed_work` (
  `completed_work_id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `completion_percentage` decimal(5,2) DEFAULT 100.00,
  `approved_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','submitted','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`completed_work_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `project_id` (`project_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `monthly_completed_work_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `billing_schedules` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_completed_work_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_completed_work_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `nationalities`;
CREATE TABLE `nationalities` (
  `nationality_id` int(11) NOT NULL AUTO_INCREMENT,
  `nationality_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`nationality_id`),
  UNIQUE KEY `nationality_name` (`nationality_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3736 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `priority` tinyint(1) NOT NULL DEFAULT 0,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `token_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token_id`),
  KEY `fk_prt_employees` (`employee_id`),
  CONSTRAINT `fk_prt_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=MyISAM AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `planning`;
CREATE TABLE `planning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `new_project_name` varchar(255) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `calendar_id` int(11) DEFAULT NULL,
  `status` enum('draft','in_review','approved','rejected') DEFAULT 'draft',
  `version` int(11) DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_duration` int(11) NOT NULL DEFAULT 0,
  `total_budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` longtext DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `calendar_id` (`calendar_id`),
  CONSTRAINT `planning_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `planning_ibfk_2` FOREIGN KEY (`calendar_id`) REFERENCES `company_calendar` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_resources`;
CREATE TABLE `planning_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_task_id` int(11) NOT NULL,
  `resource_type` enum('labour','employee','material','equipment') NOT NULL,
  `resource_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `planned_cost` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `planning_task_id` (`planning_task_id`),
  CONSTRAINT `planning_resources_ibfk_1` FOREIGN KEY (`planning_task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_revisions`;
CREATE TABLE `planning_revisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_summary` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapshot_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `planning_task_dependencies`;
CREATE TABLE `planning_task_dependencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `predecessor_task_id` int(11) NOT NULL,
  `dependency_type` enum('FS','SS','FF','SF') DEFAULT 'FS',
  `lag_days` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `predecessor_task_id` (`predecessor_task_id`),
  CONSTRAINT `planning_task_dependencies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_task_dependencies_ibfk_2` FOREIGN KEY (`predecessor_task_id`) REFERENCES `planning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_tasks`;
CREATE TABLE `planning_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_wbs_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `task_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `baseline_duration` int(11) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `planned_hours` decimal(10,2) NOT NULL DEFAULT 8.00,
  `planned_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `manually_adjusted` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'pending',
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `planning_wbs_id` (`planning_wbs_id`),
  CONSTRAINT `planning_tasks_ibfk_1` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_taxes`;
CREATE TABLE `planning_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  CONSTRAINT `planning_taxes_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_terms_snapshots`;
CREATE TABLE `planning_terms_snapshots` (
  `snapshot_id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`snapshot_id`),
  KEY `planning_id` (`planning_id`),
  CONSTRAINT `planning_terms_snapshots_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_terms_templates`;
CREATE TABLE `planning_terms_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  CONSTRAINT `planning_terms_templates_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_wbs`;
CREATE TABLE `planning_wbs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `quotation_discipline_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `wbs_template_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `wbs_name` varchar(255) NOT NULL,
  `wbs_code` varchar(100) DEFAULT NULL,
  `wbs_type` enum('labour','material','both') NOT NULL DEFAULT 'labour',
  `level` int(11) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `unit` varchar(30) NOT NULL DEFAULT 'hours',
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `budget_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `planned_labour_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_material_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_other_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `baseline_duration` int(11) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `planning_wbs_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_wbs_labour`;
CREATE TABLE `planning_wbs_labour` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `planning_wbs_id` int(11) NOT NULL,
  `quotation_labour_id` int(11) DEFAULT NULL,
  `labour_id` int(11) DEFAULT NULL,
  `labour_name` varchar(255) NOT NULL,
  `labour_type` varchar(100) DEFAULT NULL,
  `worker_count` int(11) NOT NULL DEFAULT 1,
  `hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  KEY `planning_wbs_id` (`planning_wbs_id`),
  CONSTRAINT `planning_wbs_labour_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_labour_ibfk_2` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `planning_wbs_material`;
CREATE TABLE `planning_wbs_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planning_id` int(11) NOT NULL,
  `planning_wbs_id` int(11) NOT NULL,
  `quotation_material_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(255) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(30) DEFAULT NULL,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `planning_id` (`planning_id`),
  KEY `planning_wbs_id` (`planning_wbs_id`),
  CONSTRAINT `planning_wbs_material_ibfk_1` FOREIGN KEY (`planning_id`) REFERENCES `planning` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planning_wbs_material_ibfk_2` FOREIGN KEY (`planning_wbs_id`) REFERENCES `planning_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `project_material_logs`;
CREATE TABLE `project_material_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_material_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `action_type` enum('received','used') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'used',
  `quantity` decimal(12,2) NOT NULL,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `log_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_pml_pm` (`project_material_id`),
  KEY `idx_pml_proj` (`project_id`),
  KEY `idx_pml_wbs` (`wbs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_materials`;
CREATE TABLE `project_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Nos',
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `received_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `used_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `extra_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `planned_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `actual_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pm_proj` (`project_id`),
  KEY `idx_pm_wbs` (`wbs_id`),
  KEY `idx_pm_mat` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_selected_templates`;
CREATE TABLE `project_selected_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pst_project` (`project_id`),
  KEY `fk_pst_template` (`template_id`),
  CONSTRAINT `fk_pst_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pst_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_taxes`;
CREATE TABLE `project_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pt_project` (`project_id`),
  KEY `idx_pt_tax` (`tax_id`),
  CONSTRAINT `fk_pt_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `project_terms_snapshots`;
CREATE TABLE `project_terms_snapshots` (
  `snapshot_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`snapshot_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `project_terms_templates`;
CREATE TABLE `project_terms_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_template` (`project_id`,`template_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `project_types`;
CREATE TABLE `project_types` (
  `type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2995 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_wbs`;
CREATE TABLE `project_wbs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `wbs_template_id` int(11) DEFAULT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_hours` decimal(10,2) DEFAULT 0.00,
  `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT 0.00,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `actual_hours` decimal(10,2) DEFAULT 0.00,
  `planned_labour_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'Planned employee cost for this WBS',
  `planned_material_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'Planned material cost for this WBS',
  `planned_other_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'Planned subcontract/other cost for this WBS',
  `quotation_discipline_id` int(11) DEFAULT NULL COMMENT 'FK to quotation_disciplines line that spawned this WBS row',
  `wbs_type` enum('labour','material','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labour',
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'hours',
  `planned_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `actual_quantity` decimal(12,2) DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_hours` decimal(10,2) DEFAULT 0.00,
  `extra_hours` decimal(10,2) DEFAULT 0.00,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `level` int(11) DEFAULT 1,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wbs_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `current_start` date DEFAULT NULL,
  `current_end` date DEFAULT NULL,
  `baseline_duration` int(11) DEFAULT 0,
  `current_duration` int(11) DEFAULT 0,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quality_standard` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acceptance_criteria` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_wbs_id` (`wbs_id`),
  CONSTRAINT `fk_pwbs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pwbs_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `project_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `source_quotation_id` int(11) DEFAULT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `emreads_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `nationality_id` int(11) DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `project_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line_1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_area` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `radius_meters` int(11) DEFAULT 500,
  `project_date` date DEFAULT NULL,
  `status` enum('draft','active','on_hold','completed','cancelled','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `currency_id` int(11) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quotation_reference` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planning_required` tinyint(1) DEFAULT 1,
  `planning_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `project_code` (`project_code`),
  KEY `idx_proj_type` (`project_type_id`),
  KEY `idx_projects_customer` (`customer_id`),
  KEY `idx_projects_quotation` (`source_quotation_id`),
  CONSTRAINT `fk_projects_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_source_quotation` FOREIGN KEY (`source_quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `po_id` int(11) NOT NULL AUTO_INCREMENT,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_date` date NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `indent_id` int(11) DEFAULT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_terms` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','issued','partially_received','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`po_id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_disciplines`;
CREATE TABLE `quotation_disciplines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `discipline_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'lump_sum',
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wbs_type` enum('labour','material','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labour',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `labour_hours` decimal(10,2) DEFAULT 0.00,
  `labour_rate` decimal(15,2) DEFAULT 0.00,
  `labour_cost` decimal(15,2) DEFAULT 0.00,
  `material_quantity` decimal(12,2) DEFAULT 0.00,
  `material_rate` decimal(15,2) DEFAULT 0.00,
  `material_cost` decimal(15,2) DEFAULT 0.00,
  `wbs_template_id` int(11) DEFAULT NULL,
  `planned_hours` decimal(10,2) DEFAULT 0.00,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `project_id` (`project_id`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `quotation_disciplines_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_required_documents`;
CREATE TABLE `quotation_required_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) DEFAULT 1,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `document_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `quotation_required_documents_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_snapshots`;
CREATE TABLE `quotation_snapshots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `snapshot_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshot_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_taxes`;
CREATE TABLE `quotation_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `tax_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_qt_quote` (`quotation_id`),
  KEY `idx_qt_tax` (`tax_id`),
  CONSTRAINT `fk_qt_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qt_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`tax_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `quotation_terms_snapshots`;
CREATE TABLE `quotation_terms_snapshots` (
  `snapshot_id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `template_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 1,
  PRIMARY KEY (`snapshot_id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `quotation_terms_snapshots_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_terms_template_items`;
CREATE TABLE `quotation_terms_template_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 1,
  PRIMARY KEY (`item_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `quotation_terms_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `terms_templates` (`template_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `quotation_terms_templates`;
CREATE TABLE `quotation_terms_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_template` (`quotation_id`,`template_id`),
  KEY `idx_quotation_id` (`quotation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `quotation_wbs_items`;
CREATE TABLE `quotation_wbs_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_discipline_id` int(11) NOT NULL,
  `item_type` enum('labour','material','other') NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(50) DEFAULT 'lump_sum',
  `qty` decimal(10,2) NOT NULL DEFAULT 1.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `line_total` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quotation_discipline_id` (`quotation_discipline_id`),
  CONSTRAINT `quotation_wbs_items_ibfk_1` FOREIGN KEY (`quotation_discipline_id`) REFERENCES `quotation_disciplines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `quotation_wbs_labour`;
CREATE TABLE `quotation_wbs_labour` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `quotation_discipline_id` int(11) NOT NULL,
  `labour_id` int(11) DEFAULT NULL,
  `labour_name` varchar(255) NOT NULL,
  `labour_type` varchar(100) DEFAULT NULL,
  `hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `quotation_discipline_id` (`quotation_discipline_id`),
  CONSTRAINT `quotation_wbs_labour_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_wbs_labour_ibfk_2` FOREIGN KEY (`quotation_discipline_id`) REFERENCES `quotation_disciplines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `quotation_wbs_material`;
CREATE TABLE `quotation_wbs_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `quotation_discipline_id` int(11) NOT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(255) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(30) DEFAULT NULL,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `quotation_discipline_id` (`quotation_discipline_id`),
  CONSTRAINT `quotation_wbs_material_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_wbs_material_ibfk_2` FOREIGN KEY (`quotation_discipline_id`) REFERENCES `quotation_disciplines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `quotation_wbs_templates`;
CREATE TABLE `quotation_wbs_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `quotations`;
CREATE TABLE `quotations` (
  `quotation_id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `new_project_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency_id` int(11) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `quotation_date` date NOT NULL,
  `validity_date` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot of final T&C',
  `status` enum('draft','pending_approval','approved','rejected','revised','converted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `revision_number` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tax_id` int(11) DEFAULT NULL,
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  `project_type_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `planning_required` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`quotation_id`),
  UNIQUE KEY `quotation_code` (`quotation_code`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `fk_quotations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_perm` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`)
) ENGINE=MyISAM AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `site_survey_photo_disciplines`;
CREATE TABLE `site_survey_photo_disciplines` (
  `photo_id` int(11) NOT NULL,
  `discipline_id` int(11) NOT NULL,
  PRIMARY KEY (`photo_id`,`discipline_id`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `site_survey_photo_disciplines_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `site_survey_photos` (`photo_id`) ON DELETE CASCADE,
  CONSTRAINT `site_survey_photo_disciplines_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `site_survey_photos`;
CREATE TABLE `site_survey_photos` (
  `photo_id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `photo_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`photo_id`),
  KEY `survey_id` (`survey_id`),
  CONSTRAINT `site_survey_photos_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `site_surveys` (`survey_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `site_surveys`;
CREATE TABLE `site_surveys` (
  `survey_id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `survey_date` date NOT NULL,
  `conducted_by` int(11) NOT NULL,
  `entry_type` enum('system_entry','report_attachment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system_entry',
  `location_details` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attached_report_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','completed','verified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wbs_id` int(11) DEFAULT NULL,
  `site_conditions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `measurements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labour_requirements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_requirements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `survey_code` (`survey_code`),
  KEY `project_id` (`project_id`),
  KEY `conducted_by` (`conducted_by`),
  KEY `discipline_id` (`discipline_id`),
  CONSTRAINT `site_surveys_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `site_surveys_ibfk_2` FOREIGN KEY (`conducted_by`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `site_surveys_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `task_assignments`;
CREATE TABLE `task_assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `planned_hours` decimal(10,2) DEFAULT 0.00,
  `actual_hours` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_task_employee` (`task_id`,`employee_id`),
  KEY `fk_ta_employees` (`employee_id`),
  CONSTRAINT `fk_ta_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ta_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `task_checklists`;
CREATE TABLE `task_checklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `task_checklists_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task_dependencies`;
CREATE TABLE `task_dependencies` (
  `dependency_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `predecessor_task_id` int(11) NOT NULL,
  `dependency_type` enum('FS','SS','FF','SF') COLLATE utf8mb4_unicode_ci DEFAULT 'FS',
  `lag_days` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`dependency_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `task_labour_assignments`;
CREATE TABLE `task_labour_assignments` (
  `task_id` int(11) NOT NULL,
  `labour_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`task_id`,`labour_id`),
  KEY `labour_id` (`labour_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `task_used_materials`;
CREATE TABLE `task_used_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `material_name` varchar(255) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) DEFAULT NULL,
  `rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `used_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `quotation_id` int(11) DEFAULT NULL,
  `discipline_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `required_worker_count` int(11) NOT NULL DEFAULT 1,
  `estimated_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `target_time` time DEFAULT NULL,
  `status` enum('pending','in_progress','in-progress','completed','delayed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `task_address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT 0.00,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `actual_cost` decimal(15,2) DEFAULT 0.00,
  `progress_percentage` int(11) DEFAULT 0,
  `priority` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `planned_labour_cost` decimal(15,2) DEFAULT 0.00,
  `planned_material_cost` decimal(15,2) DEFAULT 0.00,
  `planned_other_cost` decimal(15,2) DEFAULT 0.00,
  `wbs_template_id` int(11) DEFAULT NULL,
  `is_billable` tinyint(1) DEFAULT 1,
  `baseline_start` date DEFAULT NULL,
  `baseline_end` date DEFAULT NULL,
  `current_start` date DEFAULT NULL,
  `current_end` date DEFAULT NULL,
  `baseline_duration` int(11) DEFAULT 0,
  `current_duration` int(11) DEFAULT 0,
  `manually_adjusted` tinyint(1) DEFAULT 0,
  `planning_task_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`task_id`),
  KEY `idx_tasks_project` (`project_id`),
  KEY `fk_tasks_pwbs` (`wbs_id`),
  KEY `idx_tasks_pw` (`project_id`,`wbs_id`),
  CONSTRAINT `fk_tasks_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_pwbs` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `taxes`;
CREATE TABLE `taxes` (
  `tax_id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_type` enum('VAT','GST','CGST_SGST','IGST','SALES_TAX','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VAT',
  `is_split` tinyint(1) DEFAULT 0,
  `cgst_percentage` decimal(5,2) DEFAULT 0.00,
  `sgst_percentage` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`tax_id`),
  KEY `country_id` (`country_id`),
  CONSTRAINT `taxes_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1703 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `terms_templates`;
CREATE TABLE `terms_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL COMMENT 'NULL = All countries',
  `project_type_id` int(11) DEFAULT NULL COMMENT 'NULL = All project types',
  `discipline_id` int(11) DEFAULT NULL COMMENT 'NULL = All disciplines',
  `terms_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`template_id`),
  KEY `country_id` (`country_id`),
  KEY `project_type_id` (`project_type_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `terms_templates_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_2` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_3` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`discipline_id`) ON DELETE SET NULL,
  CONSTRAINT `terms_templates_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=639 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `timesheets`;
CREATE TABLE `timesheets` (
  `timesheet_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `working_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `rate_snapshot` decimal(10,2) DEFAULT NULL COMMENT 'Employee hourly_rate at time of log',
  `cost` decimal(15,2) DEFAULT NULL COMMENT 'working_hours * rate_snapshot',
  PRIMARY KEY (`timesheet_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  KEY `task_id` (`task_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=516 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vendor_invoices`;
CREATE TABLE `vendor_invoices` (
  `vendor_invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `po_id` int(11) NOT NULL,
  `grn_id` int(11) DEFAULT NULL,
  `project_id` int(11) NOT NULL,
  `wbs_id` int(11) NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `payable_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT 0.00,
  `balance_amount` decimal(15,2) NOT NULL,
  `payment_status` enum('unpaid','partially_paid','paid','on_hold','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`vendor_invoice_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `po_id` (`po_id`),
  KEY `project_id` (`project_id`),
  KEY `wbs_id` (`wbs_id`),
  CONSTRAINT `vendor_invoices_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_invoices_ibfk_3` FOREIGN KEY (`wbs_id`) REFERENCES `project_wbs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vendor_payments`;
CREATE TABLE `vendor_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_invoice_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `vendor_invoice_id` (`vendor_invoice_id`),
  CONSTRAINT `vendor_payments_ibfk_1` FOREIGN KEY (`vendor_invoice_id`) REFERENCES `vendor_invoices` (`vendor_invoice_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vendors`;
CREATE TABLE `vendors` (
  `vendor_id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`vendor_id`),
  UNIQUE KEY `vendor_code` (`vendor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `wbs_template_details`;
CREATE TABLE `wbs_template_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `wbs_id` int(11) DEFAULT NULL,
  `wbs_name` varchar(255) DEFAULT NULL,
  `wbs_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tpl_detail_template` (`template_id`),
  KEY `idx_tpl_detail_wbs` (`wbs_id`),
  KEY `fk_wbs_template_parent` (`parent_id`),
  CONSTRAINT `fk_tpl_detail_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tpl_detail_wbs` FOREIGN KEY (`wbs_id`) REFERENCES `work_breakdown_structures` (`id`),
  CONSTRAINT `fk_wbs_template_parent` FOREIGN KEY (`parent_id`) REFERENCES `wbs_template_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `wbs_template_project_types`;
CREATE TABLE `wbs_template_project_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `project_type_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_project_type` (`template_id`,`project_type_id`),
  KEY `idx_wtpt_template` (`template_id`),
  KEY `idx_wtpt_project_type` (`project_type_id`),
  CONSTRAINT `fk_wtpt_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wtpt_template` FOREIGN KEY (`template_id`) REFERENCES `wbs_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `wbs_templates`;
CREATE TABLE `wbs_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_code` varchar(50) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `project_type_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_code` (`template_code`),
  KEY `idx_project_type` (`project_type_id`),
  CONSTRAINT `fk_wbs_template_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `work_breakdown_structures`;
CREATE TABLE `work_breakdown_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wbs_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wbs_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `wbs_type` enum('labour','material','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labour',
  PRIMARY KEY (`id`),
  UNIQUE KEY `wbs_code` (`wbs_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES (1, 'Admin', '2026-08-31 10:40:58');
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES (2, 'Manager', '2026-08-31 10:40:58');
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES (3, 'Employee', '2026-08-31 10:40:58');
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `created_at`) VALUES (4, 'Super Admin', '2026-09-01 11:44:51');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (1, 'employees', 'view', 'employees_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (2, 'employees', 'create', 'employees_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (3, 'employees', 'update', 'employees_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (4, 'employees', 'delete', 'employees_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (5, 'projects', 'view', 'projects_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (6, 'projects', 'create', 'projects_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (7, 'projects', 'update', 'projects_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (8, 'projects', 'delete', 'projects_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (9, 'tasks', 'view', 'tasks_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (10, 'tasks', 'create', 'tasks_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (11, 'tasks', 'update', 'tasks_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (12, 'tasks', 'delete', 'tasks_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (13, 'tasks', 'assign', 'tasks_assign');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (14, 'attendance', 'view', 'attendance_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (15, 'attendance', 'create', 'attendance_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (16, 'attendance', 'update', 'attendance_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (17, 'payments', 'view', 'payments_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (18, 'payments', 'create', 'payments_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (19, 'payments', 'update', 'payments_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (20, 'reports', 'view', 'reports_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (21, 'reports', 'export', 'reports_export');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (22, 'profile', 'view', 'profile_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (23, 'profile', 'update', 'profile_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (24, 'settings', 'manage', 'settings_manage');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (25, 'labours', 'view', 'labours_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (26, 'labours', 'create', 'labours_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (27, 'labours', 'update', 'labours_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (28, 'labours', 'delete', 'labours_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (29, 'timesheets', 'view', 'timesheets_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (30, 'timesheets', 'create', 'timesheets_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (31, 'timesheets', 'update', 'timesheets_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (32, 'timesheets', 'delete', 'timesheets_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (33, 'labour_work_logs', 'view', 'labour_work_logs_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (34, 'labour_work_logs', 'create', 'labour_work_logs_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (35, 'labour_work_logs', 'update', 'labour_work_logs_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (36, 'labour_work_logs', 'delete', 'labour_work_logs_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (37, 'labour_payments', 'view', 'labour_payments_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (38, 'labour_payments', 'create', 'labour_payments_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (39, 'labour_payments', 'update', 'labour_payments_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (40, 'customers', 'view', 'customers_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (41, 'customers', 'create', 'customers_create');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (42, 'customers', 'update', 'customers_update');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (43, 'customers', 'delete', 'customers_delete');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (44, 'project_types', 'manage', 'project_types_manage');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (45, 'document_types', 'manage', 'document_types_manage');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (46, 'masters', 'view', 'masters_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (47, 'disciplines', 'view', 'disciplines_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (48, 'disciplines', 'manage', 'disciplines_manage');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (49, 'terms_templates', 'view', 'terms_templates_view');
INSERT IGNORE INTO `permissions` (`id`, `module`, `action`, `permission_code`) VALUES (50, 'terms_templates', 'manage', 'terms_templates_manage');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1, 'MAIN_CONTRACT', 'Main Contract', NULL, 1, 1, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (2, 'APARTMENT', 'Apartment', NULL, 1, 2, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (3, 'TOWN_HOUSE', 'Town House', NULL, 1, 3, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (4, 'VILLA', 'Villa', NULL, 1, 4, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (5, 'COMMUNITY', 'Community', NULL, 1, 5, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (6, 'OFFICE', 'Office', NULL, 1, 6, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (7, 'CORPORATE', 'Corporate', NULL, 1, 7, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (8, 'HOTEL', 'Hotel', NULL, 1, 8, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (9, 'WAREHOUSE', 'Warehouse', NULL, 1, 9, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (10, 'INDUSTRIAL', 'Industrial', NULL, 1, 10, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (11, 'INFRASTRUCTURE', 'Infrastructure', NULL, 1, 11, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (12, 'RESIDENTIAL', 'Residential', NULL, 1, 12, '2026-09-22 12:20:33', '2026-09-22 12:20:33');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1489, 'BUNG', 'Bunglow', NULL, 1, 0, '2026-10-01 05:42:55', '2026-10-01 05:42:55');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1910, 'LANDSCAPING', 'Landscaping', 'Landscaping Projects', 1, 50, '2026-10-03 05:42:18', '2026-10-03 05:42:18');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1911, 'INTERIOR_FIT_OUT', 'Interior Fit-Out', 'Interior Fit-Out Projects', 1, 50, '2026-10-03 05:42:18', '2026-10-03 05:42:18');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1912, 'MEP_WORKS', 'MEP Works', 'MEP Works Projects', 1, 50, '2026-10-03 05:42:18', '2026-10-03 05:42:18');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1913, 'BTF', 'Bunglow Three Flour', 'test', 1, 0, '2026-10-03 06:38:15', '2026-10-03 06:38:15');
INSERT IGNORE INTO `project_types` (`type_id`, `type_code`, `type_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (2922, 'TEST', 'villas', 'villas', 1, 0, '2026-10-06 09:22:20', '2026-10-06 09:23:18');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1, 'CIVIL', 'Civil Works', 'test', 1, 1, '2026-09-22 12:38:53', '2026-10-06 09:52:05');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (2, 'ELECTRICAL', 'Electrical Installation', NULL, 1, 2, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (3, 'PLUMBING', 'Plumbing & Drainage', NULL, 1, 3, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (4, 'HVAC', 'HVAC & Air Conditioning', NULL, 1, 4, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (5, 'CARPENTRY', 'Carpentry & Joinery', NULL, 1, 5, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (6, 'FINISHING', 'Interior & Exterior Finishing', NULL, 1, 6, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (7, 'STRUCTURAL', 'Structural Steelwork', NULL, 1, 7, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (8, 'PAINTING', 'Painting & Coating', NULL, 1, 8, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (9, 'MAINTENANCE', 'General Maintenance', NULL, 1, 9, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (10, 'FIRE_SAFETY', 'Fire Fighting & Safety', NULL, 1, 10, '2026-09-22 12:38:53', '2026-09-22 12:38:53');
INSERT IGNORE INTO `disciplines` (`discipline_id`, `discipline_code`, `discipline_name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (1611, 'TEST', 'testing', 'test', 1, 0, '2026-10-03 08:05:30', '2026-10-03 08:05:30');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (1, 'Shivani Shinde', '1234567890', '123456789012', 'direct_labour', '2026-09-11 09:14:50', '2026-09-11 09:14:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (2, 'Tejas', '1234569870', '562341789203563465', 'contractor', '2026-09-11 09:15:13', '2026-09-11 09:15:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (3, 'Ramesh Kumar', '9876543210', '123456789012', 'direct_labour', '2026-09-11 11:14:35', '2026-09-11 11:14:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (4, 'Suresh Patel', '9876543211', '123456789013', 'contractor', '2026-09-11 11:14:35', '2026-09-11 11:14:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (5, 'krishna', '1234567896', '123456789562', 'contractor', '2026-09-12 06:50:53', '2026-09-12 06:50:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (6, 'smita', '1234567895', '125647896325', 'direct_labour', '2026-09-17 12:22:49', '2026-09-17 12:22:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (7, 'test labor', '661234567890', '123456789456', 'direct_labour', '2026-09-28 10:32:04', '2026-09-28 10:32:04', 5, 1008, 2, NULL, 2, '7894561230789456', NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (8, 'Senior Engineer', NULL, NULL, '', '2026-10-01 11:17:59', '2026-10-01 11:17:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (9, 'General Helper', NULL, NULL, 'contractor', '2026-10-01 11:17:59', '2026-10-01 11:17:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (10, 'Electrician', NULL, NULL, 'contractor', '2026-10-01 11:17:59', '2026-10-01 11:17:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (11, 'Plumber', NULL, NULL, 'temporary', '2026-10-01 11:17:59', '2026-10-01 11:17:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (19, 'ABC Civil Infrastructure Contractors', '+91-9876500101', 'DEMO-LAB-001', 'contractor', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, '3600.00', '450.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (20, 'XYZ Reinforced Concrete Specialists', '+91-9876500102', 'DEMO-LAB-002', 'contractor', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, '4400.00', '550.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (21, 'Prime Electro-Mechanical Contractors', '+91-9876500103', 'DEMO-LAB-003', 'contractor', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, '4800.00', '600.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (22, 'Green Oasis Landscaping & Irrigation', '+971-50-7112233', 'DEMO-LAB-004', 'contractor', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, '3200.00', '400.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (23, 'Metro Flow Plumbing & Sanitary Experts', '+91-9876500105', 'DEMO-LAB-005', 'contractor', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, '3840.00', '480.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (24, 'Apex Site Labour Force - Crew Alpha', '+91-9876500106', 'DEMO-LAB-006', 'direct_labour', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'temporary', NULL, '2000.00', '250.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (25, 'Apex Site Labour Force - Crew Beta', '+91-9876500107', 'DEMO-LAB-007', 'temporary', '2026-10-03 05:44:19', '2026-10-03 05:44:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'temporary', NULL, '1760.00', '220.00');
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (28, 'kartik dhawane 1', '127656576757', '767657676777', 'direct_labour', '2026-10-03 11:51:58', '2026-10-03 11:57:28', 23, 1, 1, NULL, 1, '111111111111111111111', 'kartikdhawane@gmail.com', 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (29, 'Script Labour', NULL, NULL, 'direct_labour', '2026-10-06 07:36:47', '2026-10-06 07:36:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (30, 'Script Labour', NULL, NULL, 'direct_labour', '2026-10-06 07:38:01', '2026-10-06 07:38:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (31, 'Script Labour', NULL, NULL, 'direct_labour', '2026-10-06 07:39:04', '2026-10-06 07:39:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);
INSERT IGNORE INTO `labours` (`labour_id`, `name`, `contact_number`, `aadhar_id`, `labour_type`, `created_at`, `updated_at`, `contractor_id`, `assigned_project_id`, `nationality_id`, `community_id`, `country_id`, `emreads_id`, `email`, `status`, `is_deleted`, `deleted_at`, `labour_category`, `monthly_salary`, `project_rate`, `hourly_rate`) VALUES (32, 'Expert Electrician', NULL, NULL, 'direct_labour', '2026-10-06 07:42:08', '2026-10-06 07:42:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, 'contract', NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
