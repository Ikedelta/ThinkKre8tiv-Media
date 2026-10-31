import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';
import { sendEmail } from '@/app/api/utils/email';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      channel, // 'email' | 'sms' | 'both'
      documentType, // 'invoice' | 'receipt' | 'quotation'
      documentId,
      customEmail,
      customPhone,
      customMessage,
    } = body;

    if (!channel || !documentType || !documentId) {
      return Response.json({ error: 'channel, documentType, and documentId are required' }, { status: 400 });
    }

    // 1. Fetch document data
    let doc: any = null;
    if (documentType === 'invoice') {
      const [invoice] = await sql`
        SELECT 
          i.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.company_name as customer_company
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ${documentId}
      `;
      if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
      const items = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${documentId}`;
      doc = { ...invoice, items };
    } else if (documentType === 'receipt') {
      const [receipt] = await sql`
        SELECT 
          p.*,
          i.invoice_number,
          i.total_amount as invoice_total_amount,
          i.balance_due as invoice_balance_due,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.company_name as customer_company
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE p.id = ${documentId}
      `;
      if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });
      doc = receipt;
    } else if (documentType === 'quotation') {
      const [quotation] = await sql`
        SELECT 
          q.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.company_name as customer_company
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        WHERE q.id = ${documentId}
      `;
      if (!quotation) return Response.json({ error: 'Quotation not found' }, { status: 404 });
      doc = quotation;
    }

    const customerEmail = (customEmail || doc.customer_email || '').trim();
    const customerPhone = (customPhone || doc.customer_phone || '').trim();
    const customerName = doc.customer_name || 'Valued Customer';
    const docNumber = doc.receipt_number || doc.invoice_number || doc.quotation_number || 'DOC';
    const amountVal = Number(doc.amount || doc.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results = {
      emailSent: false,
      smsSent: false,
      emailError: null as string | null,
      smsError: null as string | null,
    };

    // 2. Process Email Dispatch
    if ((channel === 'email' || channel === 'both') && customerEmail) {
      const isReceipt = documentType === 'receipt';
      const isQuotation = documentType === 'quotation';
      const docLabel = isReceipt ? 'Receipt' : isQuotation ? 'Quotation / Estimate' : 'Invoice';
      const subject = `Think Kre8tiv Media: Your ${docLabel} #${docNumber}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${docLabel} #${docNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background-color: #0f172a; border-top: 4px solid ${isReceipt ? '#059669' : '#D22630'}; padding: 28px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .header p { color: #94a3b8; margin: 6px 0 0; font-size: 12px; font-weight: 600; }
            .content { padding: 32px 28px; }
            .amount-card { background: ${isReceipt ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isReceipt ? '#a7f3d0' : '#fecaca'}; border-radius: 10px; padding: 18px 20px; margin: 20px 0; text-align: center; }
            .amount-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${isReceipt ? '#065f46' : '#991b1b'}; letter-spacing: 0.5px; }
            .amount-val { font-size: 28px; font-weight: 900; color: ${isReceipt ? '#064e3b' : '#7f1d1d'}; font-family: monospace; margin-top: 4px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .detail-label { color: #64748b; font-weight: 600; }
            .detail-val { color: #0f172a; font-weight: 700; font-family: monospace; }
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
              <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Hello ${customerName},</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                ${customMessage || `Please find attached details of your ${docLabel.toLowerCase()} #${docNumber} from Think Kre8tiv Media.`}
              </p>
              
              <div class="amount-card">
                <div class="amount-label">${isReceipt ? 'Total Amount Received' : 'Total Amount'}</div>
                <div class="amount-val">GH₵${amountVal}</div>
              </div>

              <div style="margin-top: 20px;">
                <div class="detail-row">
                  <span class="detail-label">Reference Number:</span>
                  <span class="detail-val">${docNumber}</span>
                </div>
                ${doc.due_date ? `
                <div class="detail-row">
                  <span class="detail-label">Payment Due Date:</span>
                  <span class="detail-val">${new Date(doc.due_date).toLocaleDateString('en-GB')}</span>
                </div>
                ` : ''}
                ${doc.balance_due !== undefined ? `
                <div class="detail-row">
                  <span class="detail-label">Outstanding Balance:</span>
                  <span class="detail-val" style="color: ${Number(doc.balance_due) > 0 ? '#dc2626' : '#059669'};">GH₵${Number(doc.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                ` : ''}
                ${doc.payment_method ? `
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span class="detail-val" style="text-transform: capitalize;">${String(doc.payment_method).replace('_', ' ')}</span>
                </div>
                ` : ''}
              </div>

              <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 24px; font-size: 12px; color: #475569;">
                <strong>Payment Channels:</strong><br/>
                &bull; Mobile Money (MoMo): <strong>024 468 1391</strong> (Think Kre8tiv Media)<br/>
                &bull; Bank: Stanbic Bank / GCB Bank &bull; Account: Think Kre8tiv Media
              </div>
            </div>
            <div class="footer">
              Think Kre8tiv Media Ltd. &bull; Accra OSU, Haramani Sport &bull; +233 24 468 1391<br/>
              Thank you for your business!
            </div>
          </div>
        </body>
        </html>
      `;

      const sendResult = await sendEmail({
        to: customerEmail,
        subject,
        html: emailHtml,
        text: `Hello ${customerName},\n\nDetails of your ${docLabel} #${docNumber}:\nAmount: GH₵${amountVal}\nReference: ${docNumber}\n\nMoMo: 024 468 1391\nThink Kre8tiv Media`,
      });

      if (sendResult.success) {
        results.emailSent = true;
      } else {
        results.emailError = sendResult.error || 'Failed to send email';
      }
    } else if ((channel === 'email' || channel === 'both') && !customerEmail) {
      results.emailError = 'No customer email address available';
    }

    // 3. Process SMS Dispatch
    if ((channel === 'sms' || channel === 'both') && customerPhone) {
      try {
        const [settings] = await sql`
          SELECT sms_balance, sms_api_key, sms_sender_id 
          FROM app_settings 
          WHERE id = 'default'
        `;
        const arkeselApiKey = process.env.ARKESEL_SMS_API_KEY || settings?.sms_api_key;
        const arkeselSenderId = process.env.ARKESEL_SMS_SENDER_ID || settings?.sms_sender_id || 'ThinkKr8';

        if (!arkeselApiKey) {
          results.smsError = 'SMS API key not configured';
        } else {
          // Format phone number
          let phone = customerPhone.replace(/\+/g, '').replace(/\s+/g, '');
          if (phone.startsWith('0') && phone.length === 10) {
            phone = '233' + phone.slice(1);
          }

          const defaultSmsMsg = documentType === 'receipt'
            ? `Dear ${customerName}, thank you for your payment of GH₵${amountVal}. Receipt #${docNumber} has been issued. Think Kre8tiv Media.`
            : documentType === 'quotation'
            ? `Dear ${customerName}, your quotation #${docNumber} for GH₵${amountVal} is ready from Think Kre8tiv Media. Please contact us to proceed.`
            : `Dear ${customerName}, your invoice #${docNumber} for GH₵${amountVal} is ready from Think Kre8tiv Media. Kindly settle via MoMo: 024 468 1391. Thank you!`;

          const smsText = customMessage || defaultSmsMsg;

          const arkeselResponse = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
            method: 'POST',
            headers: {
              'api-key': arkeselApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: arkeselSenderId,
              message: smsText,
              recipients: [phone],
            }),
          });

          if (arkeselResponse.ok) {
            results.smsSent = true;
            // Record log & deduct credit
            await sql`
              INSERT INTO sms_logs (recipient_name, recipient_phone, message, status, sent_by, credits_used)
              VALUES (${customerName}, ${customerPhone}, ${smsText}, 'sent', ${session.user.name}, 1)
            `;
            await sql`
              UPDATE app_settings SET sms_balance = sms_balance - 1 WHERE id = 'default'
            `;
          } else {
            results.smsError = await arkeselResponse.text();
          }
        }
      } catch (smsErr: any) {
        results.smsError = smsErr.message || 'SMS delivery failed';
      }
    } else if ((channel === 'sms' || channel === 'both') && !customerPhone) {
      results.smsError = 'No customer phone number available';
    }

    return Response.json({
      success: results.emailSent || results.smsSent,
      results,
    });
  } catch (error: any) {
    console.error('Send document dispatch error:', error);
    return Response.json({ error: error.message || 'Dispatch failed' }, { status: 500 });
  }
}

