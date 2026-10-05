export async function up(connection: any) {
  // 1. Create company_calendar table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS company_calendar (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NULL COMMENT 'If null, this is the company default calendar',
      calendar_name VARCHAR(150) NOT NULL,
      working_days_json JSON NOT NULL COMMENT 'Array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat) e.g., [1,2,3,4,5,6] for Mon-Sat',
      working_hours_per_day DECIMAL(4,2) DEFAULT 10.00,
      status TINYINT(1) DEFAULT 1,
      created_by INT NULL,
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Create holidays table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      calendar_id INT NOT NULL,
      holiday_date DATE NOT NULL,
      description VARCHAR(255) NULL,
      type ENUM('public_holiday', 'site_shutdown', 'unavailable') DEFAULT 'public_holiday',
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (calendar_id) REFERENCES company_calendar(id) ON DELETE CASCADE,
      UNIQUE KEY uk_calendar_date (calendar_id, holiday_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Insert default company calendar
  await connection.query(`
    INSERT IGNORE INTO company_calendar (id, calendar_name, working_days_json, working_hours_per_day) 
    VALUES (1, 'Default Company Calendar', '[1,2,3,4,5,6]', 10.00)
  `);

  console.log('✅ Created company_calendar and holidays tables.');
}
