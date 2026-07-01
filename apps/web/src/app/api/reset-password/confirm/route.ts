import sql from '@/app/api/utils/sql';
import { hashPassword } from 'better-auth/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return Response.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find the token
    const [tokenRecord] = await sql`
      SELECT * FROM password_reset_tokens WHERE token = ${token} LIMIT 1
    `;

    if (!tokenRecord) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return Response.json({ error: 'This password reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const userId = tokenRecord.user_id;

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password in the account table where providerId = 'credential'
    const result = await sql`
      UPDATE "account" 
      SET password = ${hashedPassword}, "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "providerId" = 'credential'
      RETURNING id
    `;

    if (result.length === 0) {
      // It's possible the user doesn't have a credential account yet (e.g., they only signed in with Google)
      // Let's create one or return an error. For simplicity, return an error.
      return Response.json({ error: 'User does not have an email/password account setup' }, { status: 400 });
    }

    // Delete the token so it cannot be used again
    await sql`
      DELETE FROM password_reset_tokens WHERE token = ${token}
    `;

    // Log the reset
    const [user] = await sql`SELECT name FROM "user" WHERE id = ${userId} LIMIT 1`;
    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${user?.name || 'System'}, 'Password Reset', 'user', ${userId}, 'User successfully reset their password via SMS link')
    `;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Failed to confirm password reset:', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
