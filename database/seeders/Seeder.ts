import { Pool } from 'mysql2/promise';

export interface Seeder {
  run(pool: Pool): Promise<void>;
}
