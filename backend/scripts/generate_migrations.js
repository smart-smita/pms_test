const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pmsDir = '/Applications/XAMPP/xamppfiles/htdocs/pms_test';
const backendDir = path.join(pmsDir, 'backend');
const dbDir = path.join(pmsDir, 'database');
const migrationsDir = path.join(dbDir, 'migrations');
const schemaDir = path.join(dbDir, 'schema');

if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });
if (!fs.existsSync(schemaDir)) fs.mkdirSync(schemaDir, { recursive: true });

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  const [tablesResult] = await connection.query('SHOW TABLES');
  const tables = tablesResult.map(row => Object.values(row)[0]);

  let masterSchema = `-- PMS Master Schema\n-- Generated automatically from actual database\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;
  
  let migrationIndex = 1;
  const tableData = [];

  for (const table of tables) {
    if (table === 'schema_migrations' || table === 'migrations') continue;

    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    const createStmt = createTableResult[0]['Create Table'];
    
    // Add to master schema
    masterSchema += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    masterSchema += `${createStmt};\n\n`;

    // Add to migration file
    const migrationName = `${String(migrationIndex).padStart(3, '0')}_create_${table}_table.sql`;
    const migrationPath = path.join(migrationsDir, migrationName);
    
    const migrationSql = `-- Migration for table: ${table}\n\n-- UP\n${createStmt};\n\n-- DOWN\nDROP TABLE IF EXISTS \`${table}\`;\n`;
    fs.writeFileSync(migrationPath, migrationSql);
    
    const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
    
    tableData.push({
      table,
      columns: cols.map(c => c.Field),
      primaryKey: cols.find(c => c.Key === 'PRI')?.Field || 'none'
    });
    
    migrationIndex++;
  }

  // Also extract seed data for roles, permissions, project_types, disciplines if they have data
  const seedTables = ['roles', 'permissions', 'project_types', 'disciplines', 'labours', 'labour_types'];
  let seedsSql = '-- SEED DATA\n';
  
  for (const t of seedTables) {
    if (tables.includes(t)) {
      const [rows] = await connection.query(`SELECT * FROM \`${t}\` LIMIT 50`);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        for (const row of rows) {
          const values = columns.map(c => {
             if (row[c] === null) return 'NULL';
             if (typeof row[c] === 'string') return "'" + row[c].replace(/'/g, "\\'") + "'";
             if (row[c] instanceof Date) return "'" + row[c].toISOString().slice(0,19).replace('T', ' ') + "'";
             return row[c];
          });
          seedsSql += `INSERT IGNORE INTO \`${t}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
      }
    }
  }

  masterSchema += seedsSql;
  masterSchema += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
  
  fs.writeFileSync(path.join(schemaDir, 'master_schema.sql'), masterSchema);

  fs.writeFileSync(path.join(dbDir, 'schema_report.json'), JSON.stringify(tableData, null, 2));
  
  // Write migration CLI script wrapper for deployment
  const cliScript = `
import { dbPool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connection = await dbPool.getConnection();
  try {
    await connection.query(\`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    \`);

    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const [rows]: any = await connection.query(
        \`SELECT migration FROM schema_migrations WHERE migration = ?\`, 
        [file]
      );

      if (rows.length === 0) {
        console.log(\`Applying migration: \${file}\`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Very basic split for UP section. In real life we'd parse properly or run whole file
        const upSql = sql.split('-- DOWN')[0].replace('-- UP', '').trim();
        
        await connection.beginTransaction();
        try {
          await connection.query(upSql);
          await connection.query(
            \`INSERT INTO schema_migrations (migration) VALUES (?)\`,
            [file]
          );
          await connection.commit();
          console.log(\`✅ Applied: \${file}\`);
        } catch (err: any) {
          await connection.rollback();
          console.error(\`❌ Migration failed: \${file}\`);
          console.error(err);
          process.exit(1);
        }
      } else {
        console.log(\`Skipping applied migration: \${file}\`);
      }
    }
    
    console.log('All migrations applied successfully.');
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigrations().catch(console.error);
`;

  fs.writeFileSync(path.join(backendDir, 'scripts', 'migrate_cli.ts'), cliScript.trim());
  
  const readme = `
# PMS Database Migration System

## Commands

**Run Migrations:**
\`npm run db:migrate\` (from backend folder, maps to \`ts-node scripts/migrate_cli.ts\`)

**Fresh Installation:**
Run the master schema in your database.
\`mysql -u root pms_db < database/schema/master_schema.sql\`

## Migrations Directory
Contains all .sql migration files in the \`database/migrations/\` directory.
`;

  fs.writeFileSync(path.join(dbDir, 'README.md'), readme);

  await connection.end();
  console.log("Done generating all requested files.");
}
main();
