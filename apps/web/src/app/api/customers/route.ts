import sql from '@/app/api/utils/sql';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const engagements = searchParams.get('engagements') === 'true';

    if (id) {
      const [customer] = await sql`
        SELECT c.*,
          COUNT(DISTINCT i.id) as invoice_count,
          COALESCE(SUM(i.total_amount), 0) as total_billed,
          COALESCE(SUM(i.total_amount - i.balance_due), 0) as total_paid,
          COALESCE(SUM(i.balance_due), 0) as total_outstanding
        FROM customers c
        LEFT JOIN invoices i ON i.customer_id = c.id
        WHERE c.id = ${id}
        GROUP BY c.id
      `;
      if (!customer) return Response.json({ error: 'Not found' }, { status: 404 });

      if (engagements) {
        const [invoices, receipts, quotations, activities] = await Promise.all([
          sql`
            SELECT id, invoice_number, subtotal, vat_amount, discount_amount, total_amount, balance_due, status, approval_status, due_date, created_at, notes
            FROM invoices
            WHERE customer_id = ${id}
            ORDER BY created_at DESC
          `,
          sql`
            SELECT r.id, r.receipt_number, r.amount, r.payment_method, r.payment_date, r.approval_status, r.notes, r.created_at, r.invoice_id,
                   i.invoice_number
            FROM receipts r
            LEFT JOIN invoices i ON r.invoice_id = i.id
            WHERE r.customer_id = ${id}
            ORDER BY r.created_at DESC
          `,
          sql`
            SELECT id, quotation_number, subtotal, vat_amount, discount_amount, total_amount, status, valid_until, notes, created_at
            FROM quotations
            WHERE customer_id = ${id}
            ORDER BY created_at DESC
          `,
          sql`
            SELECT id, user_name, user_email, role, action, resource, resource_id, details, created_at
            FROM activity_logs
            WHERE resource_id = ${id}
               OR details ILIKE ${'%' + customer.name + '%'}
               OR details ILIKE ${'%' + id + '%'}
            ORDER BY created_at DESC
            LIMIT 50
          `
        ]);

        return Response.json({
          customer,
          invoices,
          receipts,
          quotations,
          activities
        });
      }

      return Response.json(customer);
    }

    const customers = await sql`
      SELECT c.*,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(i.total_amount), 0) as total_billed,
        COALESCE(SUM(i.total_amount - i.balance_due), 0) as total_paid,
        COALESCE(SUM(i.balance_due), 0) as total_outstanding
      FROM customers c
      LEFT JOIN invoices i ON i.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return Response.json(customers);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { name, email, phone, address, company, notes, industry, social_handle, birthday } = body;
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

    const [customer] = await sql`
      INSERT INTO customers (name, email, phone, address, company, notes, industry, social_handle, birthday)
      VALUES (${name}, ${email ?? null}, ${phone ?? null}, ${address ?? null}, ${company ?? null}, ${notes ?? null}, ${industry ?? null}, ${social_handle ?? null}, ${birthday || null})
      RETURNING *
    `;
    return Response.json(customer);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, name, email, phone, address, company, notes, industry, social_handle, birthday } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [customer] = await sql`
      UPDATE customers
      SET name = ${name}, email = ${email ?? null}, phone = ${phone ?? null},
          address = ${address ?? null}, company = ${company ?? null}, notes = ${notes ?? null},
          industry = ${industry ?? null}, social_handle = ${social_handle ?? null}, birthday = ${birthday || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json(customer);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
    await sql`DELETE FROM customers WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
