import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // We run a very simple query: just getting the current time from the database server.
    // If this works, it proves we are successfully connected!
    const tables = await query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    const result = await query('SELECT NOW() as current_time_from_db');
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Neon Database!',
      tables: tables.rows,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    // If it fails, we return the error so we can see what went wrong.
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to the database.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
