import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !['admin', 'superadmin'].includes(session.user.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;
    if (!userId) return Response.json({ error: 'User ID is required' }, { status: 400 });

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Fetch user details
    const [targetUser] = await sql`SELECT id, name, phone FROM "user" WHERE id = ${userId} LIMIT 1`;
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (!targetUser.phone) {
      return Response.json({ error: 'Target user does not have a phone number on file' }, { status: 400 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert token
    await sql`
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES (${token}, ${userId}, ${expiresAt.toISOString()})
    `;

    // Try to get SMS settings
    const [settings] = await sql`SELECT sms_api_key, sms_sender_id FROM app_settings WHERE id = 'default'`;
    const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
    const arkeselSenderId = process.env.ARKESEL_SMS_SENDER_ID || settings?.sms_sender_id || 'ThinkKre8';

    if (!arkeselApiKey) {
      return Response.json({ error: 'SMS API key is not configured' }, { status: 500 });
    }

    const resetLink = `${process.env.BETTER_AUTH_URL || 'http://localhost:4000'}/reset-password?token=${token}`;
    const message = `Hi ${targetUser.name}, your Think Kre8tiv Media password reset link is here. Click to set a new password: ${resetLink}`;

    // Send SMS via Arkesel
    const arkeselResponse = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': arkeselApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: arkeselSenderId,
        message: message,
        recipients: [targetUser.phone]
      })
    });

    if (!arkeselResponse.ok) {
      const errorData = await arkeselResponse.text();
      console.error('Arkesel API Error:', errorData);
      return Response.json({ error: 'Failed to send SMS via Arkesel' }, { status: 502 });
    }

    // Log the activity
    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${session.user.name}, 'Sent Password Reset', 'user', ${userId}, ${`Sent reset link to ${targetUser.name}`})
    `;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to send reset link' }, { status: 500 });
  }
}
