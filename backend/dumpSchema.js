const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  const tables = [
    'projects', 'work_breakdown_structures', 'project_wbs', 'tasks', 'task_assignments',
    'labours', 'labour_work_logs', 'invoices', 'quotations'
  ];

  let out = '';
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SHOW COLUMNS FROM ${table}`);
      out += `\n=== ${table} ===\n`;
      for (const row of rows) {
        out += `${row.Field} | ${row.Type} | ${row.Null} | ${row.Key}\n`;
      }
    } catch (e) {
      out += `\n=== ${table} ===\nNot found or error: ${e.message}\n`;
    }
  }
  fs.writeFileSync('schema_dump.txt', out);
  await connection.end();
}
main();
