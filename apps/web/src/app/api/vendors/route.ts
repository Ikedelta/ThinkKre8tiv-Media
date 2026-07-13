import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const vendors = await sql`
      SELECT * FROM vendors ORDER BY name ASC
    `;
    return Response.json(vendors);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, address } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [vendor] = await sql`
      INSERT INTO vendors (name, email, phone, company, address)
      VALUES (${name}, ${email ?? null}, ${phone ?? null}, ${company ?? null}, ${address ?? null})
      RETURNING *
    `;

    return Response.json(vendor);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create vendor' }, { status: 500 });
  }
}
