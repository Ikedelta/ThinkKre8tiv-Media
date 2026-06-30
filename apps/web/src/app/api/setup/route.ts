import sql from '@/app/api/utils/sql';
import { hashPassword } from 'better-auth/crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const name = searchParams.get('name') || 'Super Admin';

    if (!email || !password) {
      return Response.json({ error: 'Please provide ?email=...&password=... in the URL' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a unique ID
    const [{ gen_id }] = await sql`SELECT gen_random_uuid()::text as gen_id`;

    // Insert into user table
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, is_active, "createdAt", "updatedAt")
      VALUES (${gen_id}, ${name}, ${email}, true, 'admin', true, NOW(), NOW())
    `;

    // Insert into account table
    const [{ acc_id }] = await sql`SELECT gen_random_uuid()::text as acc_id`;
    await sql`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${acc_id}, ${gen_id}, ${email}, 'credential', ${hashedPassword}, NOW(), NOW())
    `;

    return Response.json({ success: true, message: `Admin account ${email} created successfully!` });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error?.message || 'Failed to create admin' }, { status: 500 });
  }
}
