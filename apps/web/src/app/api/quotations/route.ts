import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [[quotation], items] = await Promise.all([
        sql`
          SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
          FROM quotations q
          JOIN customers c ON q.customer_id = c.id
          WHERE q.id = ${id}
        `,
        sql`SELECT * FROM quotation_items WHERE quotation_id = ${id}`
      ]);
      if (!quotation) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ ...quotation, items });
    }

    const quotations = await sql`
      SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      ORDER BY q.created_at DESC
    `;
    return Response.json(quotations);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const {
      customer_id,
      subtotal,
      vat_rate,
      vat_amount,
      discount_amount,
      total_amount,
      notes,
      valid_until,
      items,
    } = body;

    // Generate quotation number
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM quotations`;
    const quotation_number = `QT-2026-${String(Number(count) + 1).padStart(3, '0')}`;

    const [quotation] = await sql`
      INSERT INTO quotations (customer_id, quotation_number, subtotal, vat_rate, vat_amount, discount_amount, total_amount, notes, valid_until)
      VALUES (${customer_id}, ${quotation_number}, ${subtotal}, ${vat_rate ?? 7.5}, ${vat_amount}, ${discount_amount ?? 0}, ${total_amount}, ${notes ?? null}, ${valid_until ?? null})
      RETURNING *
    `;

    if (items && items.length > 0) {
      for (const item of items) {
        await sql`
          INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
          VALUES (${quotation.id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;
      }
    }

    return Response.json(quotation);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    if (['accepted', 'rejected'].includes(status)) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session || (session.user as any)?.role !== 'admin') {
        return Response.json({ error: 'Unauthorized: Only administrators can approve or reject estimates' }, { status: 403 });
      }
    }

    const [quotation] = await sql`
      UPDATE quotations 
      SET status = ${status}::text, updated_at = NOW()
      WHERE id = ${id} 
      RETURNING *
    `;
    return Response.json(quotation);
  } catch (error: any) {
    console.error('PATCH /api/quotations error:', error);
    return Response.json({ error: error?.message || 'Failed to update quotation' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, customer_id, subtotal, vat_rate, vat_amount, discount_amount, total_amount, notes, valid_until, items } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [updated] = await sql`
      UPDATE quotations
      SET customer_id = COALESCE(${customer_id}, customer_id),
          subtotal = COALESCE(${subtotal}, subtotal),
          vat_rate = COALESCE(${vat_rate}, vat_rate),
          vat_amount = COALESCE(${vat_amount}, vat_amount),
          discount_amount = COALESCE(${discount_amount}, discount_amount),
          total_amount = COALESCE(${total_amount}, total_amount),
          notes = COALESCE(${notes}, notes),
          valid_until = COALESCE(${valid_until}, valid_until),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (items && Array.isArray(items)) {
      await sql`DELETE FROM quotation_items WHERE quotation_id = ${id}`;
      for (const item of items) {
        await sql`
          INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
          VALUES (${id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
    await sql`DELETE FROM quotations WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
