const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function copyDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('Dropping gaptm_copy...');
    await connection.query('DROP DATABASE IF EXISTS gaptm_copy');
    console.log('Creating gaptm_copy...');
    await connection.query('CREATE DATABASE gaptm_copy');
    
    console.log('Dumping gaptm...');
    execSync('mysqldump -u root gaptm > gaptm.sql');
    
    console.log('Restoring to gaptm_copy...');
    execSync('mysql -u root gaptm_copy < gaptm.sql');
    
    console.log('✅ Database copied successfully.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await connection.end();
  }
}

copyDb();
