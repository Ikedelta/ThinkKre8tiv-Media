import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`;

    await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'`;
    await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)`;
    await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`;
    
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'staff'`;
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
