import { Pool } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class ProjectTypeSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const types = [
      { code: 'MAIN_CONTRACT', name: 'Main Contract', desc: 'Main Contract Project' },
      { code: 'SUB_CONTRACT', name: 'Sub Contract', desc: 'Sub Contract Project' },
      { code: 'MAINTENANCE', name: 'Maintenance', desc: 'Maintenance Project' },
      { code: 'SERVICE', name: 'Service', desc: 'Service Project' },
      { code: 'INTERNAL', name: 'Internal', desc: 'Internal Project' }
    ];
    
    for (const t of types) {
      await pool.query(
        `INSERT INTO project_types (type_code, type_name, description, status, sort_order) 
         VALUES (?, ?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE type_name = VALUES(type_name), description = VALUES(description)`,
        [t.code, t.name, t.desc]
      );
    }
    console.log(`✅ ProjectTypeSeeder executed. Seeded ${types.length} project types.`);
  }
}
