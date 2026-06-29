import { query } from './src/lib/db.js';

async function check() {
  const result = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log(result.rows);
  process.exit(0);
}
check();
