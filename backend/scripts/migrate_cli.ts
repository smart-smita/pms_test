import { dbPool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connection = await dbPool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const [rows]: any = await connection.query(
        `SELECT migration FROM schema_migrations WHERE migration = ?`, 
        [file]
      );

      if (rows.length === 0) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Very basic split for UP section. In real life we'd parse properly or run whole file
        const upSql = sql.split('-- DOWN')[0].replace('-- UP', '').trim();
        
        await connection.beginTransaction();
        try {
          await connection.query(upSql);
          await connection.query(
            `INSERT INTO schema_migrations (migration) VALUES (?)`,
            [file]
          );
          await connection.commit();
          console.log(`✅ Applied: ${file}`);
        } catch (err: any) {
          await connection.rollback();
          console.error(`❌ Migration failed: ${file}`);
          console.error(err);
          process.exit(1);
        }
      } else {
        console.log(`Skipping applied migration: ${file}`);
      }
    }
    
    console.log('All migrations applied successfully.');
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigrations().catch(console.error);