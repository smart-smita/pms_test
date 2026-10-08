import { RoleSeeder } from './RoleSeeder';
import { PermissionSeeder } from './PermissionSeeder';
import { RolePermissionSeeder } from './RolePermissionSeeder';
import { UserSeeder } from './UserSeeder';
import { ProjectTypeSeeder } from './ProjectTypeSeeder';
import { DisciplineSeeder } from './DisciplineSeeder';
import { CurrencySeeder } from './CurrencySeeder';
import { Pool } from 'mysql2/promise';

export class DatabaseSeeder {
  async run(pool: Pool): Promise<void> {
    console.log('🌱 Starting Database Seeder...');
    
    // Maintain dependency order
    await new RoleSeeder().run(pool);
    await new PermissionSeeder().run(pool);
    await new RolePermissionSeeder().run(pool);
    await new UserSeeder().run(pool);
    await new ProjectTypeSeeder().run(pool);
    await new DisciplineSeeder().run(pool);
    await new CurrencySeeder().run(pool);
    
    console.log('✅ All seeders executed successfully.');
  }
}
