import sql from '@/app/api/utils/sql';

export async function logActivity({
  user_name,
  user_email,
  role,
  action,
  resource,
  resource_id,
  details,
  ip_address
}: {
  user_name?: string | null;
  user_email?: string | null;
  role?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
}) {
  try {
    await sql`
      INSERT INTO activity_logs (
        user_name,
        user_email,
        role,
        action,
        resource,
        resource_id,
        details,
        ip_address,
        created_at
      )
      VALUES (
        ${user_name || 'System / Admin'},
        ${user_email || null},
        ${role || 'admin'},
        ${action},
        ${resource},
        ${resource_id || null},
        ${details || null},
        ${ip_address || null},
        NOW()
      )
    `;
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
