import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { sendEmail } from '@/app/api/utils/email';

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList });
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
    const [targetUser] = await sql`SELECT id, name, email, phone FROM "user" WHERE id = ${userId} LIMIT 1`;
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert token
    await sql`
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES (${token}, ${userId}, ${expiresAt.toISOString()})
    `;

    // Determine current host origin dynamically from request headers or env
    const hostHeader = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:4000';
    const protoHeader = headerList.get('x-forwarded-proto') || (hostHeader.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.BETTER_AUTH_URL || `${protoHeader}://${hostHeader}`;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    let smsSent = false;
    let emailSent = false;
    let smsError = '';
    let emailError = '';

    // 1. Try SMS if target user has a phone number
    if (targetUser.phone) {
      try {
        const [settings] = await sql`SELECT sms_api_key, sms_sender_id FROM app_settings WHERE id = 'default'`;
        const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
        const arkeselSenderId = process.env.ARKESEL_SMS_SENDER_ID || settings?.sms_sender_id || 'ThinkKre8';

        if (arkeselApiKey) {
          const message = `Hi ${targetUser.name}, your Think Kre8tiv Media password reset link: ${resetLink}`;
          const arkeselResponse = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
            method: 'POST',
            headers: {
              'api-key': arkeselApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sender: arkeselSenderId,
              message,
              recipients: [targetUser.phone]
            })
          });

          if (arkeselResponse.ok) {
            smsSent = true;
          } else {
            smsError = await arkeselResponse.text();
            console.warn('Arkesel SMS delivery issue:', smsError);
          }
        } else {
          smsError = 'SMS API key not configured';
        }
      } catch (err: any) {
        smsError = err.message || 'SMS send failure';
      }
    } else {
      smsError = 'No phone number on profile';
    }

    // 2. Try Email delivery if target user has an email
    if (targetUser.email) {
      try {
        const emailResult = await sendEmail({
          to: targetUser.email,
          subject: 'Reset Your Think Kre8tiv Media Password',
          text: `Hi ${targetUser.name},\n\nA password reset was requested for your account. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 24 hours.\n\nThink Kre8tiv Media`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; border-top: 4px solid #D22630; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Think Kre8tiv Media</h1>
                <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Password Reset Request</p>
              </div>
              <div style="padding: 28px;">
                <h3 style="color: #0f172a; margin-top: 0;">Hello ${targetUser.name},</h3>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  An administrator has requested a password reset for your account. Click the button below to set a new secure password:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetLink}" style="display: inline-block; background-color: #D22630; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Reset My Password
                  </a>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                  Or copy and paste this link into your browser:<br/>
                  <a href="${resetLink}" style="color: #D22630; word-break: break-all;">${resetLink}</a>
                </p>
                <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">This link will expire in 24 hours. If you did not request this, you can safely ignore this email.</p>
              </div>
            </div>
          `
        });

        if (emailResult.success) {
          emailSent = true;
        } else {
          emailError = emailResult.error || 'SMTP delivery failed';
        }
      } catch (err: any) {
        emailError = err.message || 'Email delivery failed';
      }
    }

    // If both automated channels failed (e.g. no SMS gateway and no SMTP), return the reset link directly!
    // This allows the admin to copy the link and share it directly with the staff member, zero roadblocks.
    const message = smsSent && emailSent
      ? 'Password reset link sent via SMS and Email!'
      : smsSent
      ? `Password reset link sent to ${targetUser.phone} via SMS!`
      : emailSent
      ? `Password reset link sent to ${targetUser.email} via Email!`
      : 'Reset link generated successfully! (SMS & SMTP not configured)';

    // Log the activity
    await sql`
      INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
      VALUES (${session.user.name}, 'Generated Password Reset', 'user', ${userId}, ${`Generated reset link for ${targetUser.name}`})
    `;

    return Response.json({
      success: true,
      resetLink,
      smsSent,
      emailSent,
      message,
    });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to process reset request' }, { status: 500 });
  }
}
