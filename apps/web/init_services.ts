import { query } from './src/lib/db.js';

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'unit',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log("Table created!");
  process.exit(0);
}
init();
