const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaptm'
  });

  try {
    console.log('Running quotation terms migration...');

    // 1. quotation_terms_template_items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotation_terms_template_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        template_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        status INT DEFAULT 1,
        FOREIGN KEY (template_id) REFERENCES terms_templates(template_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created quotation_terms_template_items table.');

    // 2. quotation_terms_snapshots
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotation_terms_snapshots (
        snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        status INT DEFAULT 1,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created quotation_terms_snapshots table.');

    // 3. quotation_required_documents
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotation_required_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        is_required TINYINT(1) DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        document_id INT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created quotation_required_documents table.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
