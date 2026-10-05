import { dbPool } from './config/db';

async function runMigration() {
  console.log('Starting task times migration...');
  try {
    // Add start_time
    await dbPool.query(`
      ALTER TABLE \`tasks\` 
      ADD COLUMN \`start_time\` TIME NULL AFTER \`start_date\`;
    `);
    console.log('Added start_time column.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('start_time already exists.');
    else console.error('Error adding start_time:', err.message);
  }

  try {
    // Add target_time
    await dbPool.query(`
      ALTER TABLE \`tasks\` 
      ADD COLUMN \`target_time\` TIME NULL AFTER \`target_date\`;
    `);
    console.log('Added target_time column.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('target_time already exists.');
    else console.error('Error adding target_time:', err.message);
  }

  console.log('Migration complete.');
  process.exit(0);
}

runMigration();
