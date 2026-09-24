const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  const tables = [
    'projects', 'work_breakdown_structures', 'tasks', 'task_assignments',
    'labours', 'labour_work_logs', 'materials', 'task_dependencies'
  ];

  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`\n=== ${table} ===`);
      console.table(rows.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
    } catch (e) {
      console.log(`\n=== ${table} ===\nNot found or error: ${e.message}`);
    }
  }
  await connection.end();
}
main();
