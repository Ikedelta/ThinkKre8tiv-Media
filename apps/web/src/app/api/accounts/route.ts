import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const accounts = await sql`
      SELECT * FROM accounts ORDER BY type ASC, name ASC
    `;
    return Response.json(accounts);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, description } = body;

    if (!name || !type) {
      return Response.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const [account] = await sql`
      INSERT INTO accounts (name, type, description)
      VALUES (${name}, ${type}, ${description ?? null})
      RETURNING *
    `;

    return Response.json(account);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create account' }, { status: 500 });
  }
}
