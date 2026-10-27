const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm',
    multipleStatements: true
  });
  
  const sql = fs.readFileSync('../database/wbs_migration.sql', 'utf8');
  try {
    await connection.query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  await connection.end();
}
run();
