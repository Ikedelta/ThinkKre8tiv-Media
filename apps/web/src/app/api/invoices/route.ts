import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [invoice] = await sql`
        SELECT i.*, 
               c.name as customer_name, 
               c.email as customer_email, 
               c.phone as customer_phone, 
               c.company as customer_company, 
               c.address as customer_address
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ${id}
      `;
      if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

      const items = await sql`
        SELECT * FROM invoice_items WHERE invoice_id = ${id}
      `;

      const receipts = await sql`
        SELECT * FROM receipts WHERE invoice_id = ${id} AND approval_status = 'approved'
      `;

      return Response.json({ ...invoice, items, receipts });
    }

    const invoices = await sql`
      SELECT i.*, c.name as customer_name, c.email as customer_email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `;
    return Response.json(invoices);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_id,
      invoice_number,
      subtotal,
      vat_rate,
      vat_amount,
      discount_amount,
      total_amount,
      due_date,
      notes,
      items,
    } = body;

    const [invoice] = await sql`
      INSERT INTO invoices (
        customer_id, invoice_number, subtotal, vat_rate, vat_amount,
        discount_amount, total_amount, balance_due, due_date, notes, approval_status
      ) VALUES (
        ${customer_id}, ${invoice_number}, ${subtotal}, ${vat_rate ?? 15.0}, ${vat_amount},
        ${discount_amount ?? 0}, ${total_amount}, ${total_amount}, ${due_date}, ${notes ?? null}, 'pending'
      ) RETURNING *
    `;

    if (items && items.length > 0) {
      for (const item of items) {
        await sql`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
          VALUES (${invoice.id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;
      }
    }

    return Response.json(invoice);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, approval_status, approved_by } = body;
    if (!id || !approval_status) {
      return Response.json({ error: 'ID and approval_status required' }, { status: 400 });
    }
    const [updated] = await sql`
      UPDATE invoices
      SET approval_status = ${approval_status},
          approved_by = ${approved_by ?? null},
          approved_at = ${approval_status === 'approved' ? new Date().toISOString() : null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
