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
  
  const sql = fs.readFileSync('../database/migrations/02_add_project_fields.sql', 'utf8');
  try {
    await connection.query(sql);
    console.log('Migration successful');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Fields already exist. Migration skipped.');
    } else {
      console.error('Migration failed:', err);
    }
  }
  await connection.end();
}
run();
