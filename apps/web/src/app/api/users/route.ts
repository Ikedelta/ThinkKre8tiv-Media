import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hashPassword } from 'better-auth/crypto';

export async function GET() {
  try {
    const users = await sql`
      SELECT id, name, email, phone, role, position, is_active, "createdAt" as created_at
      FROM "user"
      ORDER BY "createdAt" DESC
    `;
    return Response.json(users);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, email, password, role, phone, position } = body;

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a unique ID
    const [{ gen_id }] = await sql`SELECT gen_random_uuid()::text as gen_id`;

    // Insert into user table
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, phone, position, is_active, "createdAt", "updatedAt")
      VALUES (${gen_id}, ${name}, ${email}, false, ${role ?? 'staff'}, ${phone ?? null}, ${position ?? null}, true, NOW(), NOW())
    `;

    // Insert into account table (credential provider)
    const [{ acc_id }] = await sql`SELECT gen_random_uuid()::text as acc_id`;
    await sql`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${acc_id}, ${gen_id}, ${gen_id}, 'credential', ${hashedPassword}, NOW(), NOW())
    `;

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${session.user.name}, 'Created user', 'user', ${`Added ${name} as ${role ?? 'staff'}`})
    `;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error?.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name, phone, role, position, is_active } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    await sql`
      UPDATE "user"
      SET name = ${name},
          phone = ${phone ?? null},
          role = ${role ?? 'staff'},
          position = ${position ?? null},
          is_active = ${is_active ?? true},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${session.user.name}, 'Updated user', 'user', ${id}, ${`Updated ${name}`})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    // Deactivate instead of hard delete
    await sql`UPDATE "user" SET is_active = FALSE WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
