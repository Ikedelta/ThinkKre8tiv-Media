import sql from '@/app/api/utils/sql';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');

    // 1. Fetch overdue invoices that still have balance due > 0 and customer has a phone number
    const overdueInvoices = await sql`
      SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.balance_due,
        i.due_date,
        i.status,
        c.name as customer_name,
        c.phone as customer_phone
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.due_date < CURRENT_DATE
        AND i.balance_due > 0
        AND i.approval_status = 'approved'
        AND c.phone IS NOT NULL
        AND TRIM(c.phone) != ''
      ORDER BY i.due_date ASC
    `;

    // If query mode (without trigger=send), return the overdue invoices list
    if (trigger !== 'send') {
      return NextResponse.json({
        count: overdueInvoices.length,
        invoices: overdueInvoices,
      });
    }

    // 2. Fetch SMS credentials
    const [settings] = await sql`SELECT sms_api_key, sms_sender_id FROM app_settings WHERE id = 'default'`;
    const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
    const arkeselSenderId = process.env.ARKESEL_SMS_SENDER_ID || settings?.sms_sender_id || 'ThinkKre8';

    if (!arkeselApiKey) {
      return NextResponse.json({ error: 'SMS API key not configured' }, { status: 500 });
    }

    const results = [];

    // 3. Process each overdue invoice and send SMS alert
    for (const inv of overdueInvoices) {
      let phone = String(inv.customer_phone).replace(/\+/g, '').replace(/\s+/g, '');
      if (phone.startsWith('0') && phone.length === 10) {
        phone = '233' + phone.slice(1);
      }

      const formattedDueDate = new Date(inv.due_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const message = `Dear ${inv.customer_name}, friendly reminder from Think Kre8tiv Media: Invoice #${inv.invoice_number} (Bal: GH₵${Number(inv.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}) was due on ${formattedDueDate}. Kindly settle via MoMo (024 468 1391) or Bank. Thank you!`;

      try {
        const arkeselRes = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
          method: 'POST',
          headers: {
            'api-key': arkeselApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: arkeselSenderId,
            message,
            recipients: [phone],
          }),
        });

        const isOk = arkeselRes.ok;
        results.push({
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          phone,
          sent: isOk,
        });

        // Log SMS activity
        await sql`
          INSERT INTO activity_logs (user_name, action, resource, resource_id, details)
          VALUES (
            'System Automator',
            'Sent Overdue SMS Alert',
            'invoice',
            ${inv.id},
            ${`Dispatched automated overdue SMS reminder to ${inv.customer_name} (${phone}) for Invoice #${inv.invoice_number}`}
          )
        `;
      } catch (err: any) {
        results.push({
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          phone,
          sent: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Overdue cron error:', error);
    return NextResponse.json({ error: error.message || 'Overdue check failed' }, { status: 500 });
  }
}
