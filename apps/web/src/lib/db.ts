import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon to work nicely in a Node.js/Next.js environment
neonConfig.webSocketConstructor = ws;

// We create a connection pool. A pool manages multiple connections to your Neon database
// efficiently, reusing them instead of creating a new connection for every request.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// We also export a handy helper function to quickly run SQL queries anywhere in your app
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    // Always release the client back to the pool when you're done!
    client.release();
  }
}
