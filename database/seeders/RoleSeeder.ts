import { Pool } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class RoleSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const roles = [
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'EMPLOYEE',
      'ACCOUNT_MANAGER',
      'CLUSTER_MANAGER',
      'AUDITOR',
      'ENGINEER',
      'HIGHER_AUTHORITY'
    ];

    for (const roleName of roles) {
      await pool.query(
        `INSERT INTO roles (role_name) VALUES (?) 
         ON DUPLICATE KEY UPDATE role_name = VALUES(role_name)`,
        [roleName]
      );
    }
    console.log(`✅ RoleSeeder executed. Seeded ${roles.length} roles.`);
  }
}
