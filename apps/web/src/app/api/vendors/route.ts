import sql from '@/app/api/utils/sql';
import { logActivity } from '@/app/api/utils/audit';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';

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
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
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

    await logActivity({
      action: 'Created Supplier',
      resource: 'supplier',
      resource_id: vendor.id,
      details: `Added new supplier: ${name} (${company || 'Direct'})`
    });

    return Response.json(vendor);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create vendor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, name, email, phone, company, address } = body;

    if (!id || !name) {
      return Response.json({ error: 'Vendor ID and Name are required' }, { status: 400 });
    }

    const [vendor] = await sql`
      UPDATE vendors
      SET 
        name = ${name},
        email = ${email ?? null},
        phone = ${phone ?? null},
        company = ${company ?? null},
        address = ${address ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    await logActivity({
      action: 'Updated Supplier',
      resource: 'supplier',
      resource_id: id,
      details: `Updated supplier details for ${name}`
    });

    return Response.json(vendor);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Check if expenses are linked
    const linkedExpenses = await sql`
      SELECT id FROM expenses WHERE vendor_id = ${id} LIMIT 1
    `;

    if (linkedExpenses.length > 0) {
      return Response.json({ 
        error: 'Cannot delete this supplier because there are expenses linked to them. Please reassign or delete the expenses first.' 
      }, { status: 400 });
    }

    const [existing] = await sql`SELECT name FROM vendors WHERE id = ${id}`;
    await sql`DELETE FROM vendors WHERE id = ${id}`;

    await logActivity({
      action: 'Deleted Supplier',
      resource: 'supplier',
      resource_id: id,
      details: `Deleted supplier ${existing?.name || id}`
    });

    return Response.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to delete vendor' }, { status: 500 });
  }
}

