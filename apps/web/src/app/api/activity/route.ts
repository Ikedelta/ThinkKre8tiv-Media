import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { logActivity } from '@/app/api/utils/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    // Only super admin or admin with highest privilege can view audit logs
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email?.toLowerCase();

    // Check if user is an admin or super admin
    const isAuthorized = userRole === 'admin' || userRole === 'super_admin' || userEmail?.includes('admin');
    
    if (!session || !isAuthorized) {
      return Response.json({ error: 'Access denied. System logs are restricted to Super Administrators only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let logs;
    if (resource && resource !== 'all') {
      logs = await sql`
        SELECT * FROM activity_logs
        WHERE resource = ${resource}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else if (search) {
      const q = `%${search}%`;
      logs = await sql`
        SELECT * FROM activity_logs
        WHERE action ILIKE ${q} OR details ILIKE ${q} OR user_name ILIKE ${q} OR resource ILIKE ${q}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      logs = await sql`
        SELECT * FROM activity_logs
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return Response.json(logs, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return Response.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await request.json();
    const { action, resource, resource_id, details } = body;

    if (!action || !resource) {
      return Response.json({ error: 'Action and resource are required' }, { status: 400 });
    }

    await logActivity({
      user_name: session?.user?.name || 'Administrator',
      user_email: session?.user?.email || null,
      role: (session?.user as any)?.role || 'admin',
      action,
      resource,
      resource_id,
      details
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to create log' }, { status: 500 });
  }
}
