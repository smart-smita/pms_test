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

    // 6. Ensure default roles exist and get their IDs
    const [existingRoles]: any = await dbPool.query(`SELECT id, role_name FROM roles`);
    const rolesMap: Record<string, number> = {};
    for (const r of existingRoles) {
      rolesMap[r.role_name.toUpperCase().replace(' ', '_')] = r.id; 
      rolesMap[r.role_name] = r.id; 
    }

    const adminRoleId = rolesMap['Admin'] || rolesMap['SUPER_ADMIN'] || rolesMap['System Administrator'];
    const managerRoleId = rolesMap['Manager'];
    const employeeRoleId = rolesMap['Employee'];

    if (!adminRoleId || !managerRoleId || !employeeRoleId) {
        console.log('Warning: Some default roles might be missing. Ensure Admin, Manager, and Employee exist.');
    }

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
    ];

    for (const p of permissionsToSeed) {
      await dbPool.query(`INSERT IGNORE INTO permissions (module, action, permission_code) VALUES (?, ?, ?)`, p);
    }
    console.log('Seeded permissions.');

    // 8. Seed Role-Permissions (Matrix from plan)
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

    // Admin gets EVERYTHING
    const adminPerms = Object.keys(permMap);
    await grantPermission(adminRoleId, adminPerms);

    // Manager gets Scoped permissions
    const managerPerms = [
      'employees_view',
      'projects_view', 'projects_update',
      'tasks_view', 'tasks_create', 'tasks_update', 'tasks_assign',
      'attendance_view',
      'payments_view',
      'reports_view', 'reports_export',
      'profile_view', 'profile_update'
    ];
    await grantPermission(managerRoleId, managerPerms);

    // Employee gets Self-Only permissions
    const employeePerms = [
      'profile_view', 'profile_update',
      'attendance_view', 'attendance_create',
      'tasks_view', 'tasks_update',
      'projects_view',
      'payments_view',
      'reports_view', 'reports_export'
    ];
    await grantPermission(employeeRoleId, employeePerms);

    console.log('Seeded role_permissions! ACL Migration COMPLETE.');

    // 9. Migrate attendance_logs table schema for GPS distance & radius tracking
    const alterQueries = [
      `ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS in_distance_meters DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS out_distance_meters DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS project_radius_meters INT DEFAULT 500`,
      `ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS in_status ENUM('inside', 'outside') DEFAULT 'inside'`,
      `ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS out_status ENUM('inside', 'outside') DEFAULT 'inside'`,
      `ALTER TABLE attendance_logs MODIFY COLUMN status ENUM('open', 'completed', 'outside_area', 'missing_checkout') NOT NULL DEFAULT 'open'`,
    ];

    for (const query of alterQueries) {
      try {
        await dbPool.query(query);
      } catch (err: any) {
        // Fallback for MySQL versions without IF NOT EXISTS in ALTER TABLE
        if (!err.message?.includes('Duplicate column name')) {
          console.warn('Attendance schema alter note:', err.message);
        }
      }
    }
    console.log('Migrated attendance_logs GPS schema extensions.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
