const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm',
    multipleStatements: true
  });
  
  const sqlPath = path.join(__dirname, '../database/migrations/03_material_management.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query(sql);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  await connection.end();
}
run();
