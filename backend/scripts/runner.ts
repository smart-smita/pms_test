import { dbPool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connection = await dbPool.getConnection();
  try {
    // 1. Create migration table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const version = file.split('.')[0];
      const [rows]: any = await connection.query(
        `SELECT version FROM schema_migrations WHERE version = ?`, 
        [version]
      );

      if (rows.length === 0) {
        console.log(`Applying migration: ${file}`);
        const migration = await import(path.join(migrationsDir, file));
        
        await connection.beginTransaction();
        try {
          await migration.up(connection);
          await connection.query(
            `INSERT INTO schema_migrations (version) VALUES (?)`,
            [version]
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
