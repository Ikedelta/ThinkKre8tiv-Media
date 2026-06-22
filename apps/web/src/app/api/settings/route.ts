import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const [settings] = await sql`SELECT * FROM app_settings WHERE id = 'default'`;
    return Response.json(settings || {});
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      company_name,
      company_email,
      company_phone,
      company_address,
      currency,
      currency_code,
      vat_rate,
      invoice_prefix,
      quotation_prefix,
      receipt_prefix,
      sms_api_key,
      sms_sender_id,
      website_tagline,
      website_about,
      social_facebook,
      social_instagram,
      social_twitter,
      social_linkedin,
    } = body;

    await sql`
      UPDATE app_settings SET
        company_name = ${company_name ?? 'Think Kre8tive'},
        company_email = ${company_email ?? null},
        company_phone = ${company_phone ?? null},
        company_address = ${company_address ?? null},
        currency = ${currency ?? 'GH₵'},
        currency_code = ${currency_code ?? 'GHS'},
        vat_rate = ${vat_rate ?? 15.0},
        invoice_prefix = ${invoice_prefix ?? 'TK-INV'},
        quotation_prefix = ${quotation_prefix ?? 'TK-QT'},
        receipt_prefix = ${receipt_prefix ?? 'TK-RCT'},
        sms_api_key = ${sms_api_key ?? null},
        sms_sender_id = ${sms_sender_id ?? 'ThinkKr8'},
        website_tagline = ${website_tagline ?? null},
        website_about = ${website_about ?? null},
        social_facebook = ${social_facebook ?? null},
        social_instagram = ${social_instagram ?? null},
        social_twitter = ${social_twitter ?? null},
        social_linkedin = ${social_linkedin ?? null},
        updated_at = NOW()
      WHERE id = 'default'
    `;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
