import { dbPool } from '../src/config/db';

async function check() {
  try {
    const [roles] = await dbPool.execute('SELECT * FROM roles');
    console.log('ROLES:', roles);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
