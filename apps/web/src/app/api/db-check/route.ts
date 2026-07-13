import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Run migration
    await query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- e.g., 'income', 'expense', 'asset', 'liability', 'equity'
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID REFERENCES vendors(id),
        account_id UUID REFERENCES accounts(id),
        amount NUMERIC(10,2) NOT NULL,
        payment_method VARCHAR(50),
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        receipt_url TEXT,
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
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
