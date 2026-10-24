import { runSqlMigrations } from '../src/utils/sqlMigrationRunner';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

runSqlMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration runner failed:', err);
    process.exit(1);
  });