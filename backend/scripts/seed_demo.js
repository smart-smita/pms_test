const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'gaptm',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, '../../database/demo_seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running demo_seed.sql...');
    await pool.query(sql);
    console.log('Demo seed applied successfully.');
  } catch (err) {
    console.error('Error applying seed:', err);
  } finally {
    await pool.end();
  }
}

seed();
