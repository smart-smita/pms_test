import { Pool, RowDataPacket } from 'mysql2/promise';
import { Seeder } from './Seeder';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

export class UserSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [roles] = await pool.query<RowDataPacket[]>('SELECT role_id FROM roles WHERE role_name = ?', ['SUPER_ADMIN']);
    if (roles.length === 0) {
      console.log('⚠️ SUPER_ADMIN role not found. Cannot seed Admin User.');
      return;
    }
    const superAdminId = roles[0].role_id;

    await pool.query(
      `INSERT INTO employees (employee_code, name, email, password_hash, role_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name), 
         role_id = VALUES(role_id)`,
      ['EMP_ADMIN', 'System Administrator', adminEmail, passwordHash, superAdminId]
    );

    console.log(`✅ UserSeeder executed. Seeded Admin User: ${adminEmail}`);
  }
}
