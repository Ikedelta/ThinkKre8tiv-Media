import sql from '@/app/api/utils/sql';
import { requireAdmin } from '@/lib/api-security';

export async function GET() {
  try {
    const services = await sql`SELECT * FROM services ORDER BY category ASC, name ASC`;
    return Response.json(services, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { name, category, description, base_price, unit, is_active } = body;
    
    if (!name || !category) {
      return Response.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const [service] = await sql`
      INSERT INTO services (name, category, description, base_price, unit, is_active)
      VALUES (${name}, ${category}, ${description || null}, ${base_price || 0}, ${unit || 'unit'}, ${is_active ?? true})
      RETURNING *
    `;
    
    return Response.json(service);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, name, category, description, base_price, unit, is_active } = body;
    
    if (!id) return Response.json({ error: 'ID is required' }, { status: 400 });

    const [service] = await sql`
      UPDATE services
      SET name = ${name}, 
          category = ${category}, 
          description = ${description}, 
          base_price = ${base_price}, 
          unit = ${unit}, 
          is_active = ${is_active},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return Response.json(service);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
    
    await sql`DELETE FROM services WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
