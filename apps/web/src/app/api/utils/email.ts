import nodemailer from 'nodemailer';
import sql from '@/app/api/utils/sql';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // 1. Fetch SMTP settings from database
    const [settings] = await sql`
      SELECT 
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_from_name,
        smtp_from_email,
        company_name
      FROM app_settings 
      WHERE id = 'default'
    `;

    // 2. Fallback to process.env if not set in DB
    const host = settings?.smtp_host || process.env.SMTP_HOST;
    const port = Number(settings?.smtp_port || process.env.SMTP_PORT || 587);
    const user = settings?.smtp_user || process.env.SMTP_USER;
    const pass = settings?.smtp_password || process.env.SMTP_PASSWORD;
    const fromName = settings?.smtp_from_name || settings?.company_name || 'Think Kre8tiv Media';
    const fromEmail = settings?.smtp_from_email || settings?.company_email || process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
      console.warn('⚠️ SMTP settings not configured. Email will not be sent to:', to);
      return { success: false, error: 'SMTP settings not configured' };
    }

    // 3. Configure Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // 4. Send Email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });

    console.log('✅ Email sent successfully to:', to, 'Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ Failed to send email:', err);
    return { success: false, error: err.message };
  }
}

export function generateUserWelcomeEmail({
  name,
  email,
  password,
  role,
  loginUrl,
}: {
  name: string;
  email: string;
  password?: string;
  role: string;
  loginUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Think Kre8tiv Media</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; border-top: 4px solid #D22630; padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
        .header p { color: #94a3b8; margin: 6px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .credentials-box { background-color: #f1f5f9; border-left: 4px solid #D22630; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; }
        .cred-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .cred-label { font-weight: 600; color: #64748b; }
        .cred-val { font-weight: 700; color: #0f172a; font-family: monospace; }
        .button-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #D22630; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .footer { padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Think Kre8tiv Media</h1>
          <p>Commercial Printing &amp; Brand Fabrication</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <div class="text">
            You have been granted access to the <strong>Think Kre8tiv Enterprise Dashboard</strong> as a <strong>${role.toUpperCase()}</strong>. You can now log in to manage quotes, invoices, print workflows, and operations.
          </div>
          
          <div class="credentials-box">
            <div style="margin-bottom: 8px;"><strong>Your Account Credentials:</strong></div>
            <div class="cred-row">
              <span class="cred-label">Email:</span>
              <span class="cred-val">${email}</span>
            </div>
            ${password ? `
            <div class="cred-row">
              <span class="cred-label">Password:</span>
              <span class="cred-val">${password}</span>
            </div>
            ` : ''}
            <div class="cred-row" style="margin-bottom: 0;">
              <span class="cred-label">Assigned Role:</span>
              <span class="cred-val" style="color: #D22630;">${role.toUpperCase()}</span>
            </div>
          </div>

          <div class="text" style="font-size: 13px; color: #64748b;">
            For security purposes, we recommend changing your password under your Profile settings after your initial sign in.
          </div>

          <div class="button-wrapper">
            <a href="${loginUrl}" class="btn" target="_blank">Access Admin Dashboard</a>
          </div>
        </div>

        <div class="footer">
          Think Kre8tiv Media Ltd. &bull; OSU, Haramani Sport Complex, Accra, Ghana<br/>
          If you did not expect this invitation, please contact your systems administrator.
        </div>
      </div>
    </body>
    </html>
  `;
}
