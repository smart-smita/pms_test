import { dbPool } from '../src/config/db';
import { DatabaseSeeder } from '../../database/seeders/DatabaseSeeder';

async function runSeeders() {
  const connection = await dbPool.getConnection();
  try {
    const seeder = new DatabaseSeeder();
    await seeder.run(connection as any);
  } catch (error) {
    console.error('❌ Error executing seeders:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runSeeders();
