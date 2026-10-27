import mysql from 'mysql2/promise';
import { env } from './env';

export const dbPool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

export async function testDbConnection() {
  try {
    const connection = await dbPool.getConnection();
    console.log(`✅ Connected to MySQL database [${env.DB_NAME}] on ${env.DB_HOST}`);
    
    // Auto-migrate project fields
    try {
      await connection.query(`
        ALTER TABLE projects 
        ADD COLUMN client_code VARCHAR(50) DEFAULT NULL AFTER client_name,
        ADD COLUMN project_address TEXT DEFAULT NULL AFTER project_name,
        ADD COLUMN project_date DATE DEFAULT NULL AFTER radius_meters,
        ADD COLUMN note TEXT DEFAULT NULL AFTER status;
      `);
      console.log('✅ Auto-migration: Added new project fields successfully.');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        // Already migrated
      } else {
        console.error('⚠️ Auto-migration failed (this is usually fine if it already ran):', err.message);
      }
    }

    // Auto-migrate final phase fields (Soft Deletes & Notifications)
    try {
      await connection.query(`
        ALTER TABLE employees ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0, ADD COLUMN deleted_at DATETIME DEFAULT NULL;
      `);
    } catch (err: any) {}
    try {
      await connection.query(`
        ALTER TABLE projects ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0, ADD COLUMN deleted_at DATETIME DEFAULT NULL;
      `);
    } catch (err: any) {}
    try {
      await connection.query(`
        ALTER TABLE tasks ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0, ADD COLUMN deleted_at DATETIME DEFAULT NULL;
      `);
    } catch (err: any) {}
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          notification_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(150) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ Final Phase Auto-migration: Added soft deletes & notifications successfully.');
    } catch (err: any) {
      console.error('⚠️ Final Phase Auto-migration failed:', err.message);
    }

    connection.release();
  } catch (error: any) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    
    // Provide specific guidance based on common cPanel/Remote MySQL errors
    switch(error.code) {
      case 'ECONNREFUSED':
        console.error('👉 Fix: The database host is unreachable. Check if DB_HOST is correct and if the server is down.');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('👉 Fix: Access Denied. Check your DB_USER and DB_PASSWORD. If using cPanel, ensure the user is assigned to the database.');
        break;
      case 'ER_HOST_NOT_PRIVILEGED':
        console.error(`👉 Fix: Your IP is BLOCKED by cPanel. Go to cPanel -> "Remote MySQL" and add your local IP address to the allowed list.`);
        break;
      case 'ER_BAD_DB_ERROR':
        console.error(`👉 Fix: The database "${env.DB_NAME}" does not exist on the server.`);
        break;
      case 'ENOTFOUND':
        console.error(`👉 Fix: Could not resolve the hostname ${env.DB_HOST}. Ensure it is correct (e.g., md-in-38.webhostbox.net).`);
        break;
      default:
        console.error('👉 Fix: Unknown error. Check network connection or SSL requirements.');
    }
    
    // If it's a critical startup failure, you might want to process.exit(1), but for dev we let it keep trying.
  }
}
