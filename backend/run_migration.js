const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  try {
    console.log('Adding location columns to tasks table...');
    await pool.query(`ALTER TABLE tasks ADD COLUMN task_address TEXT, ADD COLUMN latitude DECIMAL(10,8), ADD COLUMN longitude DECIMAL(11,8)`);
    console.log('Success.');
  } catch (err) {
    console.log('Task columns error (might exist):', err.message);
  }

  try {
    console.log('Adding address fields to labour_work_logs...');
    await pool.query(`ALTER TABLE labour_work_logs ADD COLUMN in_address TEXT, ADD COLUMN out_address TEXT, ADD COLUMN in_latitude DECIMAL(10,8), ADD COLUMN in_longitude DECIMAL(11,8), ADD COLUMN out_latitude DECIMAL(10,8), ADD COLUMN out_longitude DECIMAL(11,8)`);
    console.log('Success.');
  } catch (err) {
    console.log('Work Log columns error (might exist):', err.message);
  }

  try {
    console.log('Backfilling historical work log addresses...');
    await pool.query(`
      UPDATE labour_work_logs wl
      JOIN projects p ON wl.project_id = p.project_id
      SET wl.in_address = p.project_address, wl.out_address = p.project_address,
          wl.in_latitude = p.latitude, wl.out_latitude = p.latitude,
          wl.in_longitude = p.longitude, wl.out_longitude = p.longitude
      WHERE wl.in_address IS NULL
    `);
    console.log('Backfill complete.');
  } catch (err) {
    console.log('Backfill error:', err.message);
  }

  await pool.end();
}

migrate();
