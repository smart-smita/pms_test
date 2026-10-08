import { Pool, RowDataPacket } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class RolePermissionSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const [roles] = await pool.query<RowDataPacket[]>('SELECT role_id FROM roles WHERE role_name = ?', ['SUPER_ADMIN']);
    if (roles.length === 0) {
      console.log('⚠️ SUPER_ADMIN role not found. Skipping RolePermissionSeeder.');
      return;
    }
    const superAdminId = roles[0].role_id;

    const [permissions] = await pool.query<RowDataPacket[]>('SELECT id FROM permissions');
    
    let count = 0;
    for (const perm of permissions) {
      await pool.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [superAdminId, perm.id]
      );
      count++;
    }
    console.log(`✅ RolePermissionSeeder executed. Assigned ${count} permissions to SUPER_ADMIN.`);
  }
}
