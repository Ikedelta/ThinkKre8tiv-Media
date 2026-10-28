import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hashPassword } from 'better-auth/crypto';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any)?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    if (!session || (session.user as any)?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, issuer, "createdAt", "updatedAt")
      VALUES (${acc_id}, ${gen_id}, ${gen_id}, 'credential', ${hashedPassword}, 'local:credential', NOW(), NOW())
    `;

    // Insert into activity logs
    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${session?.user?.name || 'Admin'}, 'Created user', 'user', ${`Added ${name} as ${role ?? 'staff'}`})
    `;

    // Attempt to notify user via email asynchronously
    let emailStatus: { sent: boolean; message?: string } = { sent: false };
    try {
      const { sendEmail, generateUserWelcomeEmail } = await import('@/app/api/utils/email');
      const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:4000';
      const loginUrl = origin.startsWith('http') ? `${origin}/account/signin` : `https://${origin}/account/signin`;

      const emailHtml = generateUserWelcomeEmail({
        name,
        email,
        password,
        role: role ?? 'staff',
        loginUrl,
      });

      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to Think Kre8tiv Media - Your Access Credentials',
        html: emailHtml,
      });

      if (emailResult.success) {
        emailStatus = { sent: true };
      } else {
        emailStatus = { sent: false, message: emailResult.error };
      }
    } catch (err: any) {
      console.error('Email notification error:', err);
      emailStatus = { sent: false, message: err.message };
    }

    return Response.json({ success: true, emailStatus });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error?.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any)?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (is_active !== undefined && is_active === false) {
      // Invalidate all active sessions for this deactivated user
      await sql`DELETE FROM "session" WHERE "userId" = ${id}`;
    }

    const actionText = is_active === false ? `Deactivated user account: ${name}` : is_active === true ? `Activated user account: ${name}` : `Updated ${name}`;

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${session?.user?.name || 'Admin'}, ${is_active === false ? 'Deactivated user' : is_active === true ? 'Activated user' : 'Updated user'}, 'user', ${id}, ${actionText})
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
    if (!session || (session.user as any)?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    // Hard delete user and associated records
    await sql`DELETE FROM "account" WHERE "userId" = ${id}`;
    await sql`DELETE FROM "session" WHERE "userId" = ${id}`;
    await sql`DELETE FROM "user" WHERE id = ${id}`;

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${session?.user?.name || 'Admin'}, 'Deleted user', 'user', ${id}, 'User completely deleted')
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
