import { Pool } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class DisciplineSeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const disciplines = [
      { code: 'CIVIL', name: 'Civil Engineering' },
      { code: 'MECH', name: 'Mechanical' },
      { code: 'ELEC', name: 'Electrical' },
      { code: 'PLUMBING', name: 'Plumbing' },
      { code: 'HVAC', name: 'HVAC' }
    ];
    
    for (const d of disciplines) {
      await pool.query(
        `INSERT INTO disciplines (discipline_code, discipline_name, status, sort_order) 
         VALUES (?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE discipline_name = VALUES(discipline_name)`,
        [d.code, d.name]
      );
    }
    console.log(`✅ DisciplineSeeder executed. Seeded ${disciplines.length} disciplines.`);
  }
}
