import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const [tokenRecord] = await sql`
      SELECT prt.token, prt.expires_at, u.id as user_id, u.name, u.email, u.role
      FROM password_reset_tokens prt
      JOIN "user" u ON u.id = prt.user_id
      WHERE prt.token = ${token}
      LIMIT 1
    `;

    if (!tokenRecord) {
      return Response.json({ error: 'Invalid or expired password reset link' }, { status: 404 });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return Response.json({ error: 'This password reset link has expired' }, { status: 410 });
    }

    return Response.json({
      valid: true,
      user: {
        id: tokenRecord.user_id,
        name: tokenRecord.name,
        email: tokenRecord.email,
        role: tokenRecord.role,
      }
    });
  } catch (error: any) {
    console.error('Failed to verify reset token:', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

