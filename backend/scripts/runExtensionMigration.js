const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  try {
    console.log('Running extensions migration...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS materials (
        material_id INT AUTO_INCREMENT PRIMARY KEY,
        material_name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        unit VARCHAR(50),
        rate DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('Created materials table.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS material_planning (
        plan_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        wbs_id INT,
        task_id INT,
        material_id INT NOT NULL,
        planned_date DATE,
        quantity DECIMAL(10,2) NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        planned_cost DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created material_planning table.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS material_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        wbs_id INT,
        task_id INT,
        material_id INT NOT NULL,
        usage_date DATE NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        actual_cost DECIMAL(15,2) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created material_logs table.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        dependency_id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        predecessor_task_id INT NOT NULL,
        dependency_type ENUM('FS', 'SS', 'FF', 'SF') DEFAULT 'FS',
        lag_days INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created task_dependencies table.');

    try {
      await connection.query(`
        ALTER TABLE tasks
          ADD COLUMN actual_start_date DATE DEFAULT NULL,
          ADD COLUMN actual_end_date DATE DEFAULT NULL,
          ADD COLUMN actual_cost DECIMAL(15,2) DEFAULT 0.00,
          ADD COLUMN progress_percentage INT DEFAULT 0,
          ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
      `);
      console.log('Altered tasks table.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Tasks table already altered.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

main();
