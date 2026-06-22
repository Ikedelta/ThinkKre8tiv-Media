import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [user] = await sql`
      SELECT id, name, email, phone, role, position, is_active, "createdAt"
      FROM "user"
      WHERE id = ${session.user.id}
    `;
    return Response.json(user || null);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, phone, position } = body;

    await sql`
      UPDATE "user"
      SET name = ${name ?? session.user.name},
          phone = ${phone ?? null},
          position = ${position ?? null},
          "updatedAt" = NOW()
      WHERE id = ${session.user.id}
    `;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
