import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const [settings] =
      await sql`SELECT sms_balance, sms_api_key, sms_sender_id FROM app_settings WHERE id = 'default'`;
    
    const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
    let liveBalance = settings?.sms_balance ?? 0;

    // Fetch live balance directly from Arkesel Portal API asynchronously without delaying initial layout load
    if (arkeselApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms quick budget so UI never hangs

        const arkeselRes = await fetch('https://sms.arkesel.com/api/v2/clients/balance-details', {
          headers: {
            'api-key': arkeselApiKey,
            'Accept': 'application/json',
          },
          signal: controller.signal,
          next: { revalidate: 120 },
        });
        clearTimeout(timeoutId);

        if (arkeselRes.ok) {
          const resData = await arkeselRes.json();
          const fetchedBalance =
            resData?.data?.sms_balance ??
            resData?.data?.balance ??
            resData?.sms_balance ??
            resData?.balance;

          if (fetchedBalance !== undefined && fetchedBalance !== null) {
            liveBalance = Number(fetchedBalance);
            sql`UPDATE app_settings SET sms_balance = ${liveBalance} WHERE id = 'default'`.catch(() => {});
          }
        }
      } catch (liveErr) {
        // Fall back instantly to cached local DB balance without blocking
      }
    }
      
    if (action === 'balance') {
      return Response.json({ balance: liveBalance });
    }

    const logs = await sql`SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 100`;
    return Response.json({ balance: liveBalance, logs });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch SMS data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { recipients, message } = body;

    if (!recipients || recipients.length === 0) {
      return Response.json({ error: 'Recipients required' }, { status: 400 });
    }
    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const [settings] =
      await sql`SELECT sms_balance, sms_api_key, sms_sender_id FROM app_settings WHERE id = 'default'`;
    const creditsNeeded = recipients.length;

    const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
    const arkeselSenderId = process.env.ARKESEL_SMS_SENDER_ID || settings?.sms_sender_id || 'ThinkKre8';

    if (!arkeselApiKey || arkeselApiKey.trim() === '') {
      return Response.json({ error: 'SMS API Key is not configured. Please check your environment variables or Settings.' }, { status: 500 });
    }

    // Actually send via Arkesel
    // Arkesel V2 expects numbers in international format without the '+' sign and without spaces.
    const phoneNumbers = recipients.map((r: any) => {
      let phone = String(r.phone).replace(/\+/g, '').replace(/\s+/g, '');
      // Example: '0245559000' -> '233245559000'
      if (phone.startsWith('0') && phone.length === 10) {
        phone = '233' + phone.slice(1);
      }
      return phone;
    });
    
    console.log('Sending SMS via Arkesel to:', phoneNumbers);
    
    const arkeselResponse = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': arkeselApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: arkeselSenderId,
        message: message,
        recipients: phoneNumbers
      })
    });

    if (!arkeselResponse.ok) {
      const errorData = await arkeselResponse.text();
      console.error('Arkesel API Error:', errorData);
      return Response.json({ error: `Failed to send SMS via Arkesel. Details: ${errorData}` }, { status: 502 });
    }

    // Log each SMS
    for (const r of recipients) {
      await sql`
        INSERT INTO sms_logs (recipient_name, recipient_phone, message, status, sent_by, credits_used)
        VALUES (${r.name ?? null}, ${r.phone}, ${message}, 'sent', ${session.user.name}, 1)
      `;
    }

    // Deduct credits
    await sql`
      UPDATE app_settings SET sms_balance = sms_balance - ${creditsNeeded} WHERE id = 'default'
    `;

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${session.user.name}, 'Sent SMS', 'sms', ${`Sent to ${creditsNeeded} recipient(s)`})
    `;

    return Response.json({ success: true, sent: creditsNeeded });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Add SMS credits (top-up)
    const body = await request.json();
    const { credits } = body;
    if (!credits || credits <= 0)
      return Response.json({ error: 'Invalid credits amount' }, { status: 400 });

    await sql`UPDATE app_settings SET sms_balance = sms_balance + ${credits} WHERE id = 'default'`;
    const [settings] = await sql`SELECT sms_balance FROM app_settings WHERE id = 'default'`;
    return Response.json({ balance: settings.sms_balance });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to add credits' }, { status: 500 });
  }
}
