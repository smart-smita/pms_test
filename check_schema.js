const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pms'
});

connection.query('SHOW COLUMNS FROM attendance_logs', function(err, results, fields) {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  connection.end();
});
