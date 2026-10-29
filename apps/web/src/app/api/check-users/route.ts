import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const email = 'masteradmin@thinkkre8tiv.com';
    const password = 'password123';

    // Add missing column from recent better-auth update
    try {
      await sql`ALTER TABLE account ADD COLUMN issuer TEXT`;
    } catch (e) {
      // Ignore if it already exists
    }

    // First check if user exists
    const [existing] = await sql`SELECT id FROM "user" WHERE email = ${email}`;
    
    if (!existing) {
      // Use the actual better-auth instance to create the user properly
      // We pass fake headers so it doesn't try to read/set cookies on this API call
      const res = await (auth.api.signUpEmail as any)({
        body: {
          email,
          password,
          name: 'Master Admin'
        },
        headers: new Headers({
          'User-Agent': 'System Script'
        })
      });
      
      // Upgrade them to admin
      if (res?.user?.id) {
        await sql`UPDATE "user" SET role = 'admin' WHERE id = ${res.user.id}`;
      }
      
      return NextResponse.json({ success: true, message: 'Master admin created', user: res });
    } else {
      return NextResponse.json({ success: true, message: 'Master admin already exists' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: String(error) });
  }
}
