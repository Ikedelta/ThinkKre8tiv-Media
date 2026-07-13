import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const products = await sql`
      SELECT * FROM products ORDER BY name ASC
    `;
    return Response.json(products);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, default_price, tax_rate } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [product] = await sql`
      INSERT INTO products (name, description, default_price, tax_rate)
      VALUES (${name}, ${description ?? null}, ${default_price ?? 0}, ${tax_rate ?? 0})
      RETURNING *
    `;

    return Response.json(product);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
