import { dbPool } from './config/db';

export async function migrate() {
  console.log('Starting ACL migration...');

  try {
    // 1. Create permissions table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        permission_code VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log('Created permissions table.');

    // 2. Create role_permissions table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_perm (role_id, permission_id)
      );
    `);
    console.log('Created role_permissions table.');

    // 3. Create manager_projects table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS manager_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_id INT NOT NULL,
        project_id INT NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        UNIQUE KEY unique_manager_project (manager_id, project_id)
      );
    `);
    console.log('Created manager_projects table.');

    // 4. Create manager_employees table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS manager_employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_id INT NOT NULL,
        employee_id INT NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
        UNIQUE KEY unique_manager_employee (manager_id, employee_id)
      );
    `);
    console.log('Created manager_employees table.');

    // 5. Create audit_logs table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100),
        module VARCHAR(100),
        description TEXT,
        record_id INT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES employees(employee_id) ON DELETE SET NULL
      );
    `);
    console.log('Created audit_logs table.');

    // 0. Ensure default roles exist (Super Admin, Admin, Manager, Employee)
    const defaultRoles = ['Super Admin', 'Admin', 'Manager', 'Employee'];
    for (const rName of defaultRoles) {
      await dbPool.query(`INSERT IGNORE INTO roles (role_name) VALUES (?)`, [rName]);
    }

    // 5b. Create labours, labour_attendance & timesheets tables
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS labours (
          labour_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          contact_number VARCHAR(20) DEFAULT NULL,
          aadhar_id VARCHAR(20) DEFAULT NULL,
          labour_type ENUM('contractor', 'direct_labour') NOT NULL DEFAULT 'direct_labour',
          contractor_id INT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_contact (contact_number),
          UNIQUE KEY unique_aadhar (aadhar_id)
        );
      `);
      await dbPool.query(`ALTER TABLE labours ADD COLUMN contractor_id INT DEFAULT NULL`).catch(() => {});
      await dbPool.query(`
        -- NOTE: labour_attendance is DEPRECATED and should not be used for new work.
        -- It has been replaced by labour_work_logs for proper task/date/rate tracking.
        CREATE TABLE IF NOT EXISTS labour_attendance (
          labour_attendance_id INT AUTO_INCREMENT PRIMARY KEY,
          labour_id INT NOT NULL,
          project_id INT DEFAULT NULL,
          wbs_id INT DEFAULT NULL,
          task_id INT DEFAULT NULL,
          attendance_date DATE NOT NULL,
          in_time TIME DEFAULT NULL,
          out_time TIME DEFAULT NULL,
          daily_pay_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          worker_count INT NOT NULL DEFAULT 1,
          comment TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (labour_id) REFERENCES labours(labour_id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL,
          FOREIGN KEY (wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL,
          UNIQUE KEY unique_labour_task_date (labour_id, task_id, attendance_date)
        );
      `);
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS timesheets (
          timesheet_id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          wbs_id INT DEFAULT NULL,
          task_id INT NOT NULL,
          employee_id INT NOT NULL,
          log_date DATE NOT NULL,
          working_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          comment TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
          FOREIGN KEY (wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
          FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
        );
      `);
      // Column migrations for soft-delete & GPS addresses
      await dbPool.query(`ALTER TABLE attendance_logs ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`).catch(() => {});
      await dbPool.query(`ALTER TABLE attendance_logs ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`).catch(() => {});

      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN calculated_payment DECIMAL(10,2) NOT NULL DEFAULT 0.00`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN in_latitude DECIMAL(10,8) DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN in_longitude DECIMAL(11,8) DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN in_address TEXT DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN out_latitude DECIMAL(10,8) DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN out_longitude DECIMAL(11,8) DEFAULT NULL`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_attendance ADD COLUMN out_address TEXT DEFAULT NULL`).catch(() => {});

      // Create labour_work_logs, labour_payments, labour_payment_items tables
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS labour_work_logs (
          work_log_id INT AUTO_INCREMENT PRIMARY KEY,
          labour_id INT NOT NULL,
          project_id INT NOT NULL,
          wbs_id INT DEFAULT NULL,
          task_id INT NOT NULL,
          work_date DATE NOT NULL,
          in_time TIME DEFAULT NULL,
          out_time TIME DEFAULT NULL,
          total_working_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          rate_type ENUM('hourly', 'daily') NOT NULL DEFAULT 'hourly',
          rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          work_description TEXT DEFAULT NULL,
          work_status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'completed',
          payment_status ENUM('pending', 'approved', 'paid', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
          created_by INT DEFAULT NULL,
          updated_by INT DEFAULT NULL,
          is_deleted TINYINT(1) NOT NULL DEFAULT 0,
          deleted_at DATETIME DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (labour_id) REFERENCES labours(labour_id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
          FOREIGN KEY (wbs_id) REFERENCES project_wbs(id) ON DELETE SET NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
        );
      `);

      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS labour_payments (
          payment_id INT AUTO_INCREMENT PRIMARY KEY,
          payment_code VARCHAR(50) NOT NULL UNIQUE,
          labour_id INT NOT NULL,
          project_id INT DEFAULT NULL,
          payment_date DATE NOT NULL,
          total_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          payment_method VARCHAR(50) DEFAULT 'cash',
          reference_number VARCHAR(100) DEFAULT NULL,
          status ENUM('pending', 'approved', 'paid', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
          remarks TEXT DEFAULT NULL,
          created_by INT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (labour_id) REFERENCES labours(labour_id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
        );
      `);

      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS labour_payment_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          payment_id INT NOT NULL,
          work_log_id INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          FOREIGN KEY (payment_id) REFERENCES labour_payments(payment_id) ON DELETE CASCADE,
          FOREIGN KEY (work_log_id) REFERENCES labour_work_logs(work_log_id) ON DELETE CASCADE,
          UNIQUE KEY unique_payment_log (payment_id, work_log_id)
        );
      `);

      console.log('Created labours, labour_work_logs, labour_payments, and timesheets tables.');

      // NEW Schema Migrations for Addresses & Coordinates
      await dbPool.query(`ALTER TABLE tasks ADD COLUMN task_address TEXT`).catch(() => {});
      await dbPool.query(`ALTER TABLE tasks ADD COLUMN latitude DECIMAL(10,8)`).catch(() => {});
      await dbPool.query(`ALTER TABLE tasks ADD COLUMN longitude DECIMAL(11,8)`).catch(() => {});

      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN in_address TEXT`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN out_address TEXT`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN in_latitude DECIMAL(10,8)`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN in_longitude DECIMAL(11,8)`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN out_latitude DECIMAL(10,8)`).catch(() => {});
      await dbPool.query(`ALTER TABLE labour_work_logs ADD COLUMN out_longitude DECIMAL(11,8)`).catch(() => {});

      // Backfill existing historical labour_work_logs with project addresses
      try {
        await dbPool.query(`
          UPDATE labour_work_logs wl
          JOIN projects p ON wl.project_id = p.project_id
          SET wl.in_address = p.project_address, wl.out_address = p.project_address,
              wl.in_latitude = p.latitude, wl.out_latitude = p.latitude,
              wl.in_longitude = p.longitude, wl.out_longitude = p.longitude
          WHERE wl.in_address IS NULL
        `);
      } catch(err: any) {
        console.warn('Backfill issue:', err.message);
      }

    } catch (err: any) {
      console.warn('Table migration warning:', err.message);
    }

    // 6. Ensure default roles map
    const [existingRoles]: any = await dbPool.query(`SELECT role_id AS id, role_name FROM roles`);
    const rolesMap: Record<string, number> = {};
    for (const r of existingRoles) {
      rolesMap[r.role_name.toUpperCase().replace(/\s+/g, '_')] = r.id;
      rolesMap[r.role_name] = r.id;
    }

    const superAdminRoleId = rolesMap['SUPER_ADMIN'] || rolesMap['Super Admin'];
    const adminRoleId = rolesMap['ADMIN'] || rolesMap['Admin'] || rolesMap['System Administrator'] || superAdminRoleId;
    const managerRoleId = rolesMap['MANAGER'] || rolesMap['Manager'];
    const employeeRoleId = rolesMap['EMPLOYEE'] || rolesMap['Employee'];

    // 7. Seed permissions
    const permissionsToSeed = [
      ['employees', 'view', 'employees_view'],
      ['employees', 'create', 'employees_create'],
      ['employees', 'update', 'employees_update'],
      ['employees', 'delete', 'employees_delete'],
      ['projects', 'view', 'projects_view'],
      ['projects', 'create', 'projects_create'],
      ['projects', 'update', 'projects_update'],
      ['projects', 'delete', 'projects_delete'],
      ['tasks', 'view', 'tasks_view'],
      ['tasks', 'create', 'tasks_create'],
      ['tasks', 'update', 'tasks_update'],
      ['tasks', 'delete', 'tasks_delete'],
      ['tasks', 'assign', 'tasks_assign'],
      ['attendance', 'view', 'attendance_view'],
      ['attendance', 'create', 'attendance_create'],
      ['attendance', 'update', 'attendance_update'],
      ['payments', 'view', 'payments_view'],
      ['payments', 'create', 'payments_create'],
      ['payments', 'update', 'payments_update'],
      ['reports', 'view', 'reports_view'],
      ['reports', 'export', 'reports_export'],
      ['profile', 'view', 'profile_view'],
      ['profile', 'update', 'profile_update'],
      ['settings', 'manage', 'settings_manage'],
      ['labours', 'view', 'labours_view'],
      ['labours', 'create', 'labours_create'],
      ['labours', 'update', 'labours_update'],
      ['labours', 'delete', 'labours_delete'],
      ['timesheets', 'view', 'timesheets_view'],
      ['timesheets', 'create', 'timesheets_create'],
      ['timesheets', 'update', 'timesheets_update'],
      ['timesheets', 'delete', 'timesheets_delete'],
      ['labour_work_logs', 'view', 'labour_work_logs_view'],
      ['labour_work_logs', 'create', 'labour_work_logs_create'],
      ['labour_work_logs', 'update', 'labour_work_logs_update'],
      ['labour_work_logs', 'delete', 'labour_work_logs_delete'],
      ['labour_payments', 'view', 'labour_payments_view'],
      ['labour_payments', 'create', 'labour_payments_create'],
      ['labour_payments', 'update', 'labour_payments_update'],
    ];

    for (const p of permissionsToSeed) {
      await dbPool.query(`INSERT IGNORE INTO permissions (module, action, permission_code) VALUES (?, ?, ?)`, p);
    }
    console.log('Seeded permissions.');

    // 8. Seed Role-Permissions
    const [allPerms]: any = await dbPool.query(`SELECT id, permission_code FROM permissions`);
    const permMap: Record<string, number> = {};
    for (const p of allPerms) {
      permMap[p.permission_code] = p.id;
    }

    const grantPermission = async (roleId: number | undefined, permCodes: string[]) => {
      if (!roleId) return;
      for (const code of permCodes) {
        const pId = permMap[code];
        if (pId) {
          await dbPool.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, pId]);
        }
      }
    };

    // Super Admin & Admin get EVERYTHING
    const adminPerms = Object.keys(permMap);
    await grantPermission(superAdminRoleId, adminPerms);
    await grantPermission(adminRoleId, adminPerms);

    // Manager gets Scoped permissions
    const managerPerms = [
      'employees_view',
      'projects_view', 'projects_update',
      'tasks_view', 'tasks_create', 'tasks_update', 'tasks_assign',
      'attendance_view',
      'payments_view',
      'reports_view', 'reports_export',
      'profile_view', 'profile_update',
      'labours_view', 'labours_create', 'labours_update',
      'timesheets_view', 'timesheets_create', 'timesheets_update',
      'labour_work_logs_view', 'labour_work_logs_create', 'labour_work_logs_update', 'labour_payments_view'
    ];
    await grantPermission(managerRoleId, managerPerms);

    // Employee gets Self-Only permissions
    const employeePerms = [
      'employees_view',
      'profile_view', 'profile_update',
      'attendance_view', 'attendance_create',
      'tasks_view', 'tasks_update',
      'projects_view',
      'payments_view',
      'reports_view', 'reports_export',
      'labours_view',
      'timesheets_view', 'timesheets_create'
    ];
    await grantPermission(employeeRoleId, employeePerms);

    console.log('Seeded role_permissions! ACL Migration COMPLETE.');

    // 9. Schema extensions for Employees & Attendance & Budgets
    const alterQueries = [
      `ALTER TABLE employees ADD COLUMN reporting_to_id INT DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN assigned_project_id INT DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN assigned_wbs_id INT DEFAULT NULL`,
      `ALTER TABLE attendance_logs ADD COLUMN in_distance_meters DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE attendance_logs ADD COLUMN out_distance_meters DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE attendance_logs ADD COLUMN project_radius_meters INT DEFAULT 500`,
      `ALTER TABLE attendance_logs ADD COLUMN in_status ENUM('inside', 'outside') DEFAULT 'inside'`,
      `ALTER TABLE attendance_logs ADD COLUMN out_status ENUM('inside', 'outside') DEFAULT 'inside'`,
      `ALTER TABLE attendance_logs MODIFY COLUMN status ENUM('open', 'completed', 'outside_area', 'missing_checkout') NOT NULL DEFAULT 'open'`,
      `ALTER TABLE projects ADD COLUMN budget_amount DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN budget_amount DECIMAL(15,2) DEFAULT 0.00`,
      `ALTER TABLE project_wbs ADD COLUMN actual_start_date DATE NULL DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN actual_end_date DATE NULL DEFAULT NULL`,
      `ALTER TABLE project_wbs ADD COLUMN actual_hours DECIMAL(10,2) NULL DEFAULT 0.00`,
      `ALTER TABLE tasks ADD COLUMN budget_amount DECIMAL(15,2) DEFAULT 0.00`,
    ];

    for (const query of alterQueries) {
      try {
        await dbPool.query(query);
      } catch (err: any) {
        // Fallback for MySQL duplicate column error (ER_DUP_FIELDNAME / 1060)
        if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column name') && !err.message?.includes('duplicate column')) {
          console.warn('Attendance schema alter note:', err.message);
        }
      }
    }
    console.log('Migrated attendance_logs GPS schema extensions.');

    // 10. Task Labour Assignments
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS task_labour_assignments (
          task_id INT NOT NULL,
          labour_id INT NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (task_id, labour_id),
          FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
          FOREIGN KEY (labour_id) REFERENCES labours(labour_id) ON DELETE CASCADE
        );
      `);
      console.log('Created task_labour_assignments table.');
    } catch (err: any) {
      console.warn('Table migration warning (task_labour_assignments):', err.message);
    }

    // ─── PHASE 1: PMS Master Tables ────────────────────────────────────────
    console.log('Running Phase 1: PMS Master tables...');

    // 11. Countries master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        country_id   INT AUTO_INCREMENT PRIMARY KEY,
        country_code CHAR(2)      NOT NULL UNIQUE COMMENT 'ISO 3166-1 alpha-2',
        country_name VARCHAR(100) NOT NULL,
        phone_code   VARCHAR(10)  DEFAULT NULL,
        status       TINYINT(1)   NOT NULL DEFAULT 1,
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed essential countries
    const countrySeed = [
      ['IN', 'India', '+91'],
      ['AE', 'United Arab Emirates', '+971'],
      ['SA', 'Saudi Arabia', '+966'],
      ['QA', 'Qatar', '+974'],
      ['KW', 'Kuwait', '+965'],
      ['BH', 'Bahrain', '+973'],
      ['OM', 'Oman', '+968'],
      ['GB', 'United Kingdom', '+44'],
      ['US', 'United States', '+1'],
      ['SG', 'Singapore', '+65'],
      ['AU', 'Australia', '+61'],
      ['NZ', 'New Zealand', '+64'],
      ['PK', 'Pakistan', '+92'],
      ['BD', 'Bangladesh', '+880'],
      ['NP', 'Nepal', '+977'],
      ['LK', 'Sri Lanka', '+94'],
    ];
    for (const [code, name, phone] of countrySeed) {
      await dbPool.query(
        `INSERT IGNORE INTO countries (country_code, country_name, phone_code) VALUES (?, ?, ?)`,
        [code, name, phone]
      );
    }

    // 12. Nationalities master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS nationalities (
        nationality_id   INT AUTO_INCREMENT PRIMARY KEY,
        nationality_name VARCHAR(100) NOT NULL UNIQUE,
        country_id       INT          DEFAULT NULL,
        status           TINYINT(1)   NOT NULL DEFAULT 1,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed nationalities
    const natSeed = ['Indian', 'Emirati', 'Saudi', 'Qatari', 'Kuwaiti', 'Bahraini', 'Omani', 'British', 'American', 'Singaporean', 'Australian', 'Pakistani', 'Bangladeshi', 'Nepali', 'Sri Lankan'];
    for (const n of natSeed) {
      await dbPool.query(`INSERT IGNORE INTO nationalities (nationality_name) VALUES (?)`, [n]);
    }

    // 13. Communities master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS communities (
        community_id   INT AUTO_INCREMENT PRIMARY KEY,
        community_name VARCHAR(150) NOT NULL,
        country_id     INT          DEFAULT NULL,
        state          VARCHAR(100) DEFAULT NULL,
        status         TINYINT(1)   NOT NULL DEFAULT 1,
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 14. Project Types master (configurable)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS project_types (
        type_id     INT AUTO_INCREMENT PRIMARY KEY,
        type_code   VARCHAR(50)  NOT NULL UNIQUE,
        type_name   VARCHAR(100) NOT NULL,
        description TEXT         DEFAULT NULL,
        status      TINYINT(1)   NOT NULL DEFAULT 1,
        sort_order  INT          NOT NULL DEFAULT 0,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed project types
    const projectTypeSeed = [
      ['MAIN_CONTRACT', 'Main Contract', 1],
      ['APARTMENT',     'Apartment',     2],
      ['TOWN_HOUSE',    'Town House',     3],
      ['VILLA',         'Villa',         4],
      ['COMMUNITY',     'Community',     5],
      ['OFFICE',        'Office',        6],
      ['CORPORATE',     'Corporate',     7],
      ['HOTEL',         'Hotel',         8],
      ['WAREHOUSE',     'Warehouse',     9],
      ['INDUSTRIAL',    'Industrial',   10],
      ['INFRASTRUCTURE','Infrastructure',11],
      ['RESIDENTIAL',   'Residential',  12],
    ];
    for (const [code, name, order] of projectTypeSeed) {
      await dbPool.query(
        `INSERT IGNORE INTO project_types (type_code, type_name, sort_order) VALUES (?, ?, ?)`,
        [code, name, order]
      );
    }

    // 15. Document Types master (configurable, country-aware)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS document_types (
        doc_type_id    INT AUTO_INCREMENT PRIMARY KEY,
        type_code      VARCHAR(50)  NOT NULL UNIQUE,
        type_name      VARCHAR(100) NOT NULL,
        applies_to     ENUM('employee','labour','project','quotation','all') NOT NULL DEFAULT 'all',
        has_expiry     TINYINT(1)   NOT NULL DEFAULT 1,
        has_number     TINYINT(1)   NOT NULL DEFAULT 1,
        has_issue_date TINYINT(1)   NOT NULL DEFAULT 1,
        is_required    TINYINT(1)   NOT NULL DEFAULT 0,
        country_id     INT          DEFAULT NULL COMMENT 'NULL = universal',
        status         TINYINT(1)   NOT NULL DEFAULT 1,
        sort_order     INT          NOT NULL DEFAULT 0,
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed document types
    const docTypeSeed = [
      ['PASSPORT',        'Passport',                  'all',      1, 1, 1, 0, null,  1],
      ['VISA',            'Visa',                      'all',      1, 1, 1, 0, null,  2],
      ['LABOUR_CARD',     'Labour Card',               'labour',   1, 1, 1, 0, null,  3],
      ['CONTRACT',        'Employment Contract',       'all',      1, 1, 1, 0, null,  4],
      ['NATIONAL_ID',     'National ID / Aadhaar',    'all',      0, 1, 0, 0, null,  5],
      ['PAN_CARD',        'PAN Card',                  'employee', 0, 1, 0, 0, null,  6],
      ['EMIRATES_ID',     'Emirates ID',               'all',      1, 1, 1, 0, null,  7],
      ['MEDICAL_FITNESS', 'Medical Fitness Certificate','all',     1, 1, 1, 0, null,  8],
      ['PERMISSION_DOC',  'Permission Document',       'project',  1, 1, 1, 0, null,  9],
      ['DRAWING',         'Drawing / Blueprint',       'project',  0, 1, 1, 0, null, 10],
      ['INSURANCE',       'Insurance Certificate',     'project',  1, 1, 1, 0, null, 11],
      ['NOC',             'No Objection Certificate',  'project',  1, 1, 1, 0, null, 12],
    ];
    for (const [code, name, applies, hasExp, hasNum, hasIssue, isReq, cid, ord] of docTypeSeed) {
      await dbPool.query(
        `INSERT IGNORE INTO document_types (type_code, type_name, applies_to, has_expiry, has_number, has_issue_date, is_required, country_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, applies, hasExp, hasNum, hasIssue, isReq, cid, ord]
      );
    }

    // ─── PHASE 2: Customer Module ───────────────────────────────────────────
    console.log('Running Phase 2: Customer module...');

    // 16. Customers table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id    INT AUTO_INCREMENT PRIMARY KEY,
        customer_code  VARCHAR(50)  NOT NULL UNIQUE,
        customer_name  VARCHAR(200) NOT NULL,
        contact_person VARCHAR(100) DEFAULT NULL,
        contact_number VARCHAR(30)  DEFAULT NULL,
        email          VARCHAR(150) DEFAULT NULL,
        country_id     INT          DEFAULT NULL,
        state          VARCHAR(100) DEFAULT NULL,
        city           VARCHAR(100) DEFAULT NULL,
        community_id   INT          DEFAULT NULL,
        nationality_id INT          DEFAULT NULL,
        address        TEXT         DEFAULT NULL,
        status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_by     INT          DEFAULT NULL,
        updated_by     INT          DEFAULT NULL,
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 17. Extend projects table with PMS fields (safe, nullable)
    const projectPmsAlters = [
      `ALTER TABLE projects ADD COLUMN customer_id     INT          DEFAULT NULL AFTER project_code`,
      `ALTER TABLE projects ADD COLUMN project_type_id INT          DEFAULT NULL AFTER customer_id`,
      `ALTER TABLE projects ADD COLUMN emreads_id      VARCHAR(50)  DEFAULT NULL AFTER project_type_id`,
      `ALTER TABLE projects ADD COLUMN contact_email   VARCHAR(150) DEFAULT NULL AFTER emreads_id`,
      `ALTER TABLE projects ADD COLUMN community_id    INT          DEFAULT NULL AFTER contact_email`,
      `ALTER TABLE projects ADD COLUMN nationality_id  INT          DEFAULT NULL AFTER community_id`,
      `ALTER TABLE projects ADD COLUMN country_id      INT          DEFAULT NULL AFTER nationality_id`,
    ];
    for (const q of projectPmsAlters) {
      try { await dbPool.query(q); } catch (e: any) { /* column already added */ }
    }

    // 18. Extend employees table with PMS fields (safe, nullable)
    const employeePmsAlters = [
      `ALTER TABLE employees ADD COLUMN nationality_id INT         DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN community_id   INT         DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN country_id     INT         DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN emreads_id     VARCHAR(50) DEFAULT NULL`,
      `ALTER TABLE employees ADD COLUMN contact_number VARCHAR(30) DEFAULT NULL`,
    ];
    for (const q of employeePmsAlters) {
      try { await dbPool.query(q); } catch (e: any) { /* column already added */ }
    }

    // 19. Extend labours table with PMS fields (safe, nullable)
    const labourPmsAlters = [
      `ALTER TABLE labours ADD COLUMN nationality_id INT          DEFAULT NULL`,
      `ALTER TABLE labours ADD COLUMN community_id   INT          DEFAULT NULL`,
      `ALTER TABLE labours ADD COLUMN country_id     INT          DEFAULT NULL`,
      `ALTER TABLE labours ADD COLUMN emreads_id     VARCHAR(50)  DEFAULT NULL`,
      `ALTER TABLE labours ADD COLUMN email          VARCHAR(150) DEFAULT NULL`,
      `ALTER TABLE labours ADD COLUMN status         ENUM('active','inactive') DEFAULT 'active'`,
      `ALTER TABLE labours ADD COLUMN is_deleted     TINYINT(1)   NOT NULL DEFAULT 0`,
      `ALTER TABLE labours ADD COLUMN deleted_at     DATETIME     DEFAULT NULL`,
    ];
    for (const q of labourPmsAlters) {
      try { await dbPool.query(q); } catch (e: any) { /* column already added */ }
    }

    // 20. Extend notifications table with context fields
    const notifPmsAlters = [
      `ALTER TABLE notifications ADD COLUMN reference_type VARCHAR(50) DEFAULT NULL AFTER type`,
      `ALTER TABLE notifications ADD COLUMN reference_id   INT         DEFAULT NULL AFTER reference_type`,
      `ALTER TABLE notifications ADD COLUMN priority       TINYINT(1)  NOT NULL DEFAULT 0 AFTER reference_id`,
    ];
    for (const q of notifPmsAlters) {
      try { await dbPool.query(q); } catch (e: any) { /* column already added */ }
    }

    // 21. Seed new PMS permissions
    const pmsPermissions = [
      ['customers',      'view',    'customers_view'],
      ['customers',      'create',  'customers_create'],
      ['customers',      'update',  'customers_update'],
      ['customers',      'delete',  'customers_delete'],
      ['project_types',  'manage',  'project_types_manage'],
      ['document_types', 'manage',  'document_types_manage'],
      ['masters',        'view',    'masters_view'],
      ['disciplines',    'view',    'disciplines_view'],
      ['disciplines',    'manage',  'disciplines_manage'],
      ['terms_templates','view',    'terms_templates_view'],
      ['terms_templates','manage',  'terms_templates_manage'],
      ['quotations',     'view',    'quotations_view'],
      ['quotations',     'create',  'quotations_create'],
      ['quotations',     'update',  'quotations_update'],
      ['quotations',     'approve', 'quotations_approve'],
      ['quotations',     'delete',  'quotations_delete'],
      ['documents',      'view',    'documents_view'],
      ['documents',      'upload',  'documents_upload'],
      ['documents',      'delete',  'documents_delete'],
    ];
    for (const p of pmsPermissions) {
      await dbPool.query(`INSERT IGNORE INTO permissions (module, action, permission_code) VALUES (?, ?, ?)`, p);
    }

    // ─── PHASE 3: Disciplines, Terms Templates, Quotations & Documents ────────
    console.log('Running Phase 3: Disciplines, Terms Templates, Quotations & Documents migration...');

    // 22. Disciplines master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS disciplines (
        discipline_id   INT AUTO_INCREMENT PRIMARY KEY,
        discipline_code VARCHAR(50)  NOT NULL UNIQUE,
        discipline_name VARCHAR(150) NOT NULL,
        description     TEXT         DEFAULT NULL,
        status          TINYINT(1)   NOT NULL DEFAULT 1,
        sort_order      INT          NOT NULL DEFAULT 0,
        created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed default disciplines
    const disciplineSeed = [
      ['CIVIL',       'Civil Works',                1],
      ['ELECTRICAL',  'Electrical Installation',     2],
      ['PLUMBING',    'Plumbing & Drainage',         3],
      ['HVAC',        'HVAC & Air Conditioning',     4],
      ['CARPENTRY',   'Carpentry & Joinery',         5],
      ['FINISHING',   'Interior & Exterior Finishing',6],
      ['STRUCTURAL',  'Structural Steelwork',        7],
      ['PAINTING',    'Painting & Coating',          8],
      ['MAINTENANCE', 'General Maintenance',         9],
      ['FIRE_SAFETY', 'Fire Fighting & Safety',     10],
    ];
    for (const [code, name, order] of disciplineSeed) {
      await dbPool.query(
        `INSERT IGNORE INTO disciplines (discipline_code, discipline_name, sort_order) VALUES (?, ?, ?)`,
        [code, name, order]
      );
    }

    // 23. Terms & Conditions Templates Master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS terms_templates (
        template_id     INT AUTO_INCREMENT PRIMARY KEY,
        template_name   VARCHAR(150) NOT NULL,
        country_id      INT          DEFAULT NULL COMMENT 'NULL = All countries',
        project_type_id INT          DEFAULT NULL COMMENT 'NULL = All project types',
        discipline_id   INT          DEFAULT NULL COMMENT 'NULL = All disciplines',
        terms_content   LONGTEXT     NOT NULL,
        status          TINYINT(1)   NOT NULL DEFAULT 1,
        version         INT          NOT NULL DEFAULT 1,
        created_by      INT          DEFAULT NULL,
        updated_by      INT          DEFAULT NULL,
        created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (country_id) REFERENCES countries(country_id) ON DELETE SET NULL,
        FOREIGN KEY (project_type_id) REFERENCES project_types(type_id) ON DELETE SET NULL,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 24. Quotations Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        quotation_id     INT AUTO_INCREMENT PRIMARY KEY,
        quotation_code   VARCHAR(50)   NOT NULL UNIQUE,
        customer_id      INT           NOT NULL,
        project_id       INT           NOT NULL,
        quotation_date   DATE          NOT NULL,
        validity_date    DATE          DEFAULT NULL,
        description      TEXT          DEFAULT NULL,
        subtotal_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        tax_percentage   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
        tax_amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        discount_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_amount     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        terms_conditions LONGTEXT      DEFAULT NULL COMMENT 'Snapshot of final T&C',
        status           ENUM('draft', 'pending_approval', 'approved', 'rejected', 'revised') NOT NULL DEFAULT 'draft',
        revision_number  INT           NOT NULL DEFAULT 1,
        created_by       INT           DEFAULT NULL,
        approved_by      INT           DEFAULT NULL,
        approved_at      DATETIME      DEFAULT NULL,
        rejection_reason TEXT          DEFAULT NULL,
        is_deleted       TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at       DATETIME      DEFAULT NULL,
        created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 25. Quotation Disciplines Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quotation_disciplines (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id     INT           NOT NULL,
        project_id       INT           NOT NULL,
        discipline_id    INT           NOT NULL,
        discipline_name  VARCHAR(150)  NOT NULL,
        description      TEXT          DEFAULT NULL,
        unit             VARCHAR(30)   DEFAULT 'lump_sum',
        quantity         DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        rate             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        amount           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        terms_conditions TEXT          DEFAULT NULL,
        status           ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 26. Universal Entity Documents Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS entity_documents (
        document_id     INT AUTO_INCREMENT PRIMARY KEY,
        entity_type     ENUM('employee', 'labour', 'project', 'quotation', 'discipline') NOT NULL,
        entity_id       INT          NOT NULL,
        doc_type_id     INT          NOT NULL,
        document_name   VARCHAR(200) NOT NULL,
        document_number VARCHAR(100) DEFAULT NULL,
        issue_date      DATE         DEFAULT NULL,
        expiry_date     DATE         DEFAULT NULL,
        file_path       VARCHAR(255) NOT NULL,
        file_size       INT          DEFAULT 0,
        mime_type       VARCHAR(100) DEFAULT NULL,
        status          ENUM('active', 'expired', 'archived') NOT NULL DEFAULT 'active',
        uploaded_by     INT          DEFAULT NULL,
        created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (doc_type_id) REFERENCES document_types(doc_type_id) ON DELETE RESTRICT,
        FOREIGN KEY (uploaded_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
        INDEX idx_entity_doc (entity_type, entity_id),
        INDEX idx_expiry (expiry_date, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 27. Expiry Notifications Log Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS expiry_notifications_log (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        document_id       INT        NOT NULL,
        entity_type       ENUM('employee', 'labour', 'project', 'quotation') NOT NULL,
        entity_id         INT        NOT NULL,
        days_before       INT        NOT NULL COMMENT '10, 8, 5, 3, 2, 1, 0 (expired)',
        recipient_user_id INT        NOT NULL,
        sent_at           TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
        delivery_status   ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
        error_message     TEXT       DEFAULT NULL,
        FOREIGN KEY (document_id) REFERENCES entity_documents(document_id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_user_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
        UNIQUE KEY uniq_expiry_sent (document_id, days_before, recipient_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 28. Extend tasks table with quotation_id and discipline_id
    const taskPmsAlters = [
      `ALTER TABLE tasks ADD COLUMN quotation_id INT DEFAULT NULL AFTER project_id`,
      `ALTER TABLE tasks ADD COLUMN discipline_id INT DEFAULT NULL AFTER quotation_id`,
    ];
    for (const q of taskPmsAlters) {
      try { await dbPool.query(q); } catch (e: any) { /* column already added */ }
    }

    // ─── PHASE 4: Monthly Invoice Workflow (Currency, Tax, Billing) ────────
    console.log('Running Phase 4: Monthly Invoice Workflow migration...');

    // 29. Currency Master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        currency_id INT AUTO_INCREMENT PRIMARY KEY,
        currency_code VARCHAR(10) NOT NULL UNIQUE,
        currency_name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
        is_base TINYINT(1) DEFAULT 0,
        status TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed default currencies
    const currencySeed = [
      ['AED', 'UAE Dirham', 'AED', 1.000000, 1],
      ['INR', 'Indian Rupee', '₹', 22.500000, 0],
      ['USD', 'US Dollar', '$', 0.270000, 0]
    ];
    for (const [code, name, sym, rate, base] of currencySeed) {
      await dbPool.query(
        `INSERT IGNORE INTO currencies (currency_code, currency_name, symbol, exchange_rate, is_base) VALUES (?, ?, ?, ?, ?)`,
        [code, name, sym, rate, base]
      );
    }

    // 30. Tax Configuration Master
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS taxes (
        tax_id INT AUTO_INCREMENT PRIMARY KEY,
        tax_name VARCHAR(100) NOT NULL,
        tax_percentage DECIMAL(5,2) NOT NULL,
        country_id INT DEFAULT NULL,
        status TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (country_id) REFERENCES countries(country_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Seed default taxes (UAE VAT 5%, Indian GST 18%)
    try {
      const [countries]: any = await dbPool.query(`SELECT country_id, country_code FROM countries WHERE country_code IN ('AE', 'IN')`);
      const countryMap: Record<string, number> = {};
      for (const c of countries) { countryMap[c.country_code] = c.country_id; }
      
      const taxSeed = [
        ['UAE VAT 5%', 5.00, countryMap['AE'] || null],
        ['Indian GST 18%', 18.00, countryMap['IN'] || null]
      ];
      for (const [name, pct, cid] of taxSeed) {
        await dbPool.query(`INSERT IGNORE INTO taxes (tax_name, tax_percentage, country_id) VALUES (?, ?, ?)`, [name, pct, cid]);
      }
    } catch(err) { console.warn('Tax seed warning', err); }

    // 31. Project Billing Schedules
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS billing_schedules (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        quotation_id INT NOT NULL,
        billing_month DATE NOT NULL COMMENT 'e.g. 2026-01-01 for Jan 2026',
        expected_amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'completed_work_logged', 'invoiced', 'paid') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 32. Monthly Completed Work
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS monthly_completed_work (
        completed_work_id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        project_id INT NOT NULL,
        completion_percentage DECIMAL(5,2) DEFAULT 100.00,
        approved_amount DECIMAL(15,2) NOT NULL,
        status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
        approved_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES billing_schedules(schedule_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 33. Invoices
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        project_id INT NOT NULL,
        quotation_id INT NOT NULL,
        schedule_id INT NOT NULL,
        currency_id INT NOT NULL,
        tax_id INT DEFAULT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal_amount DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status ENUM('draft', 'pending_approval', 'approved', 'sent', 'partially_paid', 'paid', 'cancelled') DEFAULT 'draft',
        created_by INT,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES billing_schedules(schedule_id) ON DELETE CASCADE,
        FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT,
        FOREIGN KEY (tax_id) REFERENCES taxes(tax_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 33b. Invoice Items (Line items including extra work)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        discipline_id INT DEFAULT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        is_extra_work TINYINT(1) NOT NULL DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 34. Invoice Payments
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS invoice_payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50),
        reference_number VARCHAR(100),
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // Add Invoice Module Permissions
    const invoicePermissions = [
      ['currencies', 'view', 'currencies_view'],
      ['currencies', 'manage', 'currencies_manage'],
      ['taxes', 'view', 'taxes_view'],
      ['taxes', 'manage', 'taxes_manage'],
      ['invoices', 'view', 'invoices_view'],
      ['invoices', 'create', 'invoices_create'],
      ['invoices', 'update', 'invoices_update'],
      ['invoices', 'delete', 'invoices_delete'],
      ['invoices', 'approve', 'invoices_approve']
    ];
    for (const p of invoicePermissions) {
      await dbPool.query(`INSERT IGNORE INTO permissions (module, action, permission_code) VALUES (?, ?, ?)`, p);
    }

    // Re-fetch permission map after seeding new ones
    const [allPerms2]: any = await dbPool.query(`SELECT id, permission_code FROM permissions`);
    const permMap2: Record<string, number> = {};
    for (const p of allPerms2) { permMap2[p.permission_code] = p.id; }

    // Grant new permissions to Admin/Super Admin
    const grantPerm2 = async (roleId: number | undefined, codes: string[]) => {
      if (!roleId) return;
      for (const code of codes) {
        const pId = permMap2[code];
        if (pId) await dbPool.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, pId]);
      }
    };
    const [rRows2]: any = await dbPool.query(`SELECT role_id AS id, role_name FROM roles`);
    const rMap2: Record<string, number> = {};
    for (const r of rRows2) { rMap2[r.role_name] = r.id; }

    await grantPerm2(rMap2['Super Admin'], Object.keys(permMap2));
    await grantPerm2(rMap2['Admin'],       Object.keys(permMap2));
    await grantPerm2(rMap2['Manager'], ['customers_view', 'masters_view', 'quotations_view', 'disciplines_view', 'documents_view', 'invoices_view']);

    // ─── PHASE 5: Site Inspection & Survey Module ──────────────────────────
    console.log('Running Phase 5: Site Inspection & Survey Module migration...');

    // 35. Master Site Surveys Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS site_surveys (
        survey_id            INT AUTO_INCREMENT PRIMARY KEY,
        survey_code          VARCHAR(50)  NOT NULL UNIQUE,
        project_id           INT          NOT NULL,
        customer_id          INT          DEFAULT NULL,
        discipline_id        INT          DEFAULT NULL,
        survey_date          DATE         NOT NULL,
        conducted_by         INT          NOT NULL,
        entry_type           ENUM('system_entry', 'report_attachment') NOT NULL DEFAULT 'system_entry',
        location_details     TEXT         DEFAULT NULL,
        latitude             DECIMAL(10,8) DEFAULT NULL,
        longitude            DECIMAL(11,8) DEFAULT NULL,
        comments             TEXT         DEFAULT NULL,
        remarks              TEXT         DEFAULT NULL,
        attached_report_path VARCHAR(255) DEFAULT NULL,
        status               ENUM('draft', 'completed', 'verified', 'rejected') NOT NULL DEFAULT 'completed',
        created_by           INT          DEFAULT NULL,
        created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (conducted_by) REFERENCES employees(employee_id) ON DELETE CASCADE,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 36. Site Survey Photos Table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS site_survey_photos (
        photo_id   INT AUTO_INCREMENT PRIMARY KEY,
        survey_id  INT          NOT NULL,
        photo_name VARCHAR(200) DEFAULT NULL,
        file_path  VARCHAR(255) NOT NULL,
        caption    VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES site_surveys(survey_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 36b. Site Survey Photo Disciplines Mapping
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS site_survey_photo_disciplines (
        photo_id INT NOT NULL,
        discipline_id INT NOT NULL,
        FOREIGN KEY (photo_id) REFERENCES site_survey_photos(photo_id) ON DELETE CASCADE,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON DELETE CASCADE,
        PRIMARY KEY (photo_id, discipline_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => {});

    // 37. Extend invoices table with survey_id
    try {
      await dbPool.query(`ALTER TABLE invoices ADD COLUMN survey_id INT DEFAULT NULL AFTER schedule_id`);
    } catch (e: any) { /* column already exists */ }

    // Add Site Survey Permissions
    const surveyPermissions = [
      ['site_surveys', 'view', 'site_surveys_view'],
      ['site_surveys', 'create', 'site_surveys_create'],
      ['site_surveys', 'update', 'site_surveys_update'],
      ['site_surveys', 'delete', 'site_surveys_delete'],
      ['site_surveys', 'verify', 'site_surveys_verify'],
    ];
    for (const p of surveyPermissions) {
      await dbPool.query(`INSERT IGNORE INTO permissions (module, action, permission_code) VALUES (?, ?, ?)`, p);
    }

    // Re-grant permissions to roles
    const [allPerms3]: any = await dbPool.query(`SELECT id, permission_code FROM permissions`);
    const permMap3: Record<string, number> = {};
    for (const p of allPerms3) { permMap3[p.permission_code] = p.id; }

    await grantPerm2(rMap2['Super Admin'], Object.keys(permMap3));
    await grantPerm2(rMap2['Admin'],       Object.keys(permMap3));
    await grantPerm2(rMap2['Manager'], ['site_surveys_view', 'site_surveys_create', 'site_surveys_update', 'site_surveys_verify']);

    console.log('Phase 1, 2, 3, 4 & 5 PMS migrations complete.');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

