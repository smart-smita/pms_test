import { dbPool } from './src/config/db';

async function seedCheckIns() {
  try {
    console.log('Seeding check-ins...');
    await dbPool.execute(`
      INSERT INTO attendance_logs (employee_id, task_id, attendance_date, check_in_time, check_out_time, in_latitude, in_longitude, in_address, out_latitude, out_longitude, out_address, total_working_hours, status) 
      VALUES (2, NULL, CURDATE(), NOW(), NULL, 0, 0, 'Test Manager Punch', NULL, NULL, NULL, 0.00, 'open')
      ON DUPLICATE KEY UPDATE status = 'open'
    `);
    console.log('Manager punched in!');

    await dbPool.execute(`
      INSERT INTO attendance_logs (employee_id, task_id, attendance_date, check_in_time, check_out_time, in_latitude, in_longitude, in_address, out_latitude, out_longitude, out_address, total_working_hours, status) 
      VALUES (3, NULL, CURDATE(), NOW(), NULL, 0, 0, 'Test Employee Punch', NULL, NULL, NULL, 0.00, 'open')
      ON DUPLICATE KEY UPDATE status = 'open'
    `);
    console.log('Employee punched in!');
  } catch (error) {
    console.error('Error seeding check-ins:', error);
  } finally {
    process.exit(0);
  }
}

seedCheckIns();
