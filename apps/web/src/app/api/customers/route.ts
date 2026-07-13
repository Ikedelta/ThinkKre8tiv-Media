import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [customer] = await sql`
        SELECT * FROM customers WHERE id = ${id}
      `;
      if (!customer) return Response.json({ error: 'Not found' }, { status: 404 });
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
