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
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
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
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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

      console.log('Created labours, labour_attendance and timesheets tables.');
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
      'timesheets_view', 'timesheets_create', 'timesheets_update'
    ];
    await grantPermission(managerRoleId, managerPerms);

    // Employee gets Self-Only permissions
    const employeePerms = [
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

    // 9. Schema extensions for Employees & Attendance
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
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
