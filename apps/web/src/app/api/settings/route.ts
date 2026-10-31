import sql from '@/app/api/utils/sql';
import { requireAdmin } from '@/lib/api-security';

export async function GET() {
  try {
    const [settings] = await sql`SELECT * FROM app_settings WHERE id = 'default'`;
    return Response.json(settings || {}, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const {
      company_name,
      company_email,
      company_phone,
      company_address,
      currency,
      currency_code,
      vat_rate,
      nhil_rate,
      invoice_prefix,
      quotation_prefix,
      receipt_prefix,
      sms_api_key,
      sms_sender_id,
      resend_api_key,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_from_name,
      smtp_from_email,
      website_tagline,
      website_about,
      social_facebook,
      social_instagram,
      social_twitter,
      social_linkedin,
    } = body;

    await sql`
      UPDATE app_settings SET
        company_name = ${company_name ?? 'Think Kre8tiv Media'},
        company_email = ${company_email ?? null},
        company_phone = ${company_phone ?? null},
        company_address = ${company_address ?? null},
        currency = ${currency ?? 'GH₵'},
        currency_code = ${currency_code ?? 'GHS'},
        vat_rate = ${vat_rate !== undefined ? Number(vat_rate) : 15.0},
        nhil_rate = ${nhil_rate !== undefined ? Number(nhil_rate) : 5.0},
        invoice_prefix = ${invoice_prefix ?? 'TK-INV'},
        quotation_prefix = ${quotation_prefix ?? 'TK-QT'},
        receipt_prefix = ${receipt_prefix ?? 'TK-RCT'},
        sms_api_key = ${sms_api_key ?? null},
        sms_sender_id = ${sms_sender_id ?? 'ThinkKr8'},
        resend_api_key = ${resend_api_key ?? null},
        smtp_host = ${smtp_host ?? null},
        smtp_port = ${smtp_port ? Number(smtp_port) : 587},
        smtp_user = ${smtp_user ?? null},
        smtp_password = ${smtp_password ?? null},
        smtp_from_name = ${smtp_from_name ?? null},
        smtp_from_email = ${smtp_from_email ?? null},
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
