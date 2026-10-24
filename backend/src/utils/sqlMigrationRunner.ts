import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../config/env';

export async function runSqlMigrations(): Promise<void> {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  });

  try {
    // 1. Ensure schema_migrations exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Ensure version column exists
    const [cols]: any = await connection.query(`DESCRIBE schema_migrations`);
    const colNames = cols.map((c: any) => c.Field);
    const versionCol = colNames.includes('version') ? 'version' : 'migration';

    const migrationsDir = path.join(__dirname, '../../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found at:', migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    // Check applied migrations
    const [rows]: any = await connection.query(`SELECT ${versionCol} AS ver FROM schema_migrations`);
    const appliedSet = new Set<string>(rows.map((r: any) => r.ver));

    // Baseline: Mark existing 001-094 as applied if baseline tables already exist
    const [existingTables]: any = await connection.query(`SHOW TABLES`);
    const tableList = existingTables.map((t: any) => Object.values(t)[0]);
    const hasBaseline = tableList.includes('projects') && tableList.includes('materials');

    for (const file of files) {
      const isAlreadyApplied = appliedSet.has(file) || appliedSet.has(file.replace('.sql', ''));
      const matchNum = file.match(/^(\d+)_/);
      const fileNum = matchNum ? parseInt(matchNum[1], 10) : 999;

      if (!isAlreadyApplied && hasBaseline && fileNum < 95) {
        await connection.query(
          `INSERT INTO schema_migrations (${versionCol}) VALUES (?) ON DUPLICATE KEY UPDATE ${versionCol} = ${versionCol}`,
          [file]
        );
        appliedSet.add(file);
        continue;
      }

      if (!isAlreadyApplied) {
        console.log(`\n⏳ Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        const upSql = sql.split('-- DOWN')[0].replace('-- UP', '').trim();

        await connection.beginTransaction();
        try {
          await connection.query(upSql);
          await connection.query(
            `INSERT INTO schema_migrations (${versionCol}) VALUES (?)`,
            [file]
          );
          await connection.commit();
          appliedSet.add(file);
          console.log(`✅ Successfully applied migration: ${file}`);
        } catch (err: any) {
          await connection.rollback();
          console.error(`❌ Migration failed: ${file}`);
          console.error('Error detail:', err.message);
          throw err;
        }
      }
    }

    console.log('🎯 All database migrations are up to date.');
  } finally {
    await connection.end();
  }
}
