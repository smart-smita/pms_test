import { Pool } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class PermissionSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const modules = ['projects', 'quotations', 'tasks', 'labour', 'employees', 'invoices', 'materials'];
    const actions = ['create', 'read', 'update', 'delete', 'export', 'approve', 'reject'];
    
    let count = 0;
    for (const module of modules) {
      for (const action of actions) {
        const permissionCode = `${module}.${action}`;
        await pool.query(
          `INSERT INTO permissions (module, action, permission_code) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE module = VALUES(module), action = VALUES(action)`,
          [module, action, permissionCode]
        );
        count++;
      }
    }
    console.log(`✅ PermissionSeeder executed. Seeded ${count} permissions.`);
  }
}
