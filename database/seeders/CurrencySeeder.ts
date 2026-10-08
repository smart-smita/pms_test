import { Pool } from 'mysql2/promise';
import { Seeder } from './Seeder';

export class CurrencySeeder implements Seeder {
  async run(pool: Pool): Promise<void> {
    const currencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' }
    ];
    
    for (const c of currencies) {
      await pool.query(
        `INSERT INTO currencies (currency_code, currency_name, symbol, status, is_base) 
         VALUES (?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE currency_name = VALUES(currency_name), symbol = VALUES(symbol)`,
        [c.code, c.name, c.symbol, c.code === 'AED' ? 1 : 0] // Setting AED or INR as base? Kept AED base by default as per usual UAE systems, but it can be changed.
      );
    }
    console.log(`✅ CurrencySeeder executed. Seeded ${currencies.length} currencies.`);
  }
}
