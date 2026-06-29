import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [receipt] = await sql`
        SELECT r.*, 
               c.name as customer_name, 
               c.email as customer_email, 
               c.phone as customer_phone, 
               c.company as customer_company,
               i.invoice_number, 
               i.total_amount as invoice_total_amount, 
               i.balance_due as invoice_balance_due, 
               i.amount_paid as invoice_amount_paid
        FROM receipts r
        JOIN customers c ON r.customer_id = c.id
        JOIN invoices i ON r.invoice_id = i.id
        WHERE r.id = ${id}
      `;
      if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });
      return Response.json(receipt);
    }

    const receipts = await sql`
      SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             i.invoice_number
      FROM receipts r
      JOIN customers c ON r.customer_id = c.id
      JOIN invoices i ON r.invoice_id = i.id
      ORDER BY r.created_at DESC
    `;
    return Response.json(receipts);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, customer_id, customer_name, amount, payment_method, payment_date, notes } = body;

    let finalCustomerId = customer_id;
    let finalInvoiceId = invoice_id;

    // Handle customer_name if provided
    if (!finalCustomerId && customer_name) {
      const [existing] = await sql`SELECT id FROM customers WHERE name ILIKE ${customer_name} LIMIT 1`;
      if (existing) {
        finalCustomerId = existing.id;
      } else {
        const [newCustomer] = await sql`INSERT INTO customers (name) VALUES (${customer_name}) RETURNING id`;
        finalCustomerId = newCustomer.id;
      }
    }

    if (!finalCustomerId) {
      return Response.json({ error: 'Customer is required' }, { status: 400 });
    }

    // Handle missing invoice_id (standalone receipt creation)
    if (!finalInvoiceId) {
      const invoice_number = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const [invoice] = await sql`
        INSERT INTO invoices (
          customer_id, invoice_number, subtotal, vat_rate, vat_amount,
          discount_amount, total_amount, balance_due, amount_paid, due_date, notes, status, approval_status
        ) VALUES (
          ${finalCustomerId}, ${invoice_number}, ${amount}, 0, 0,
          0, ${amount}, 0, ${amount}, ${new Date().toISOString()}, ${notes ?? 'Auto-generated for standalone receipt'}, 'paid', 'approved'
        ) RETURNING *
      `;
      finalInvoiceId = invoice.id;
    }

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM receipts`;
    const receipt_number = `TK-RCT-${String(Number(count) + 1).padStart(4, '0')}`;

    const [payment] = await sql`
      INSERT INTO payments (invoice_id, amount, payment_method, payment_date, notes)
      VALUES (${finalInvoiceId}, ${amount}, ${payment_method ?? 'bank_transfer'}, ${payment_date ?? new Date().toISOString()}, ${notes ?? null})
      RETURNING *
    `;

    // Create receipt with pending approval
    const [receipt] = await sql`
      INSERT INTO receipts (invoice_id, customer_id, payment_id, receipt_number, amount, payment_method, payment_date, notes, approval_status)
      VALUES (${finalInvoiceId}, ${finalCustomerId}, ${payment.id}, ${receipt_number}, ${amount}, ${payment_method ?? 'bank_transfer'}, ${payment_date ?? new Date().toISOString()}, ${notes ?? null}, 'pending')
      RETURNING *
    `;

    return Response.json(receipt);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create receipt' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, approval_status, approved_by } = body;
    if (!id || !approval_status) {
      return Response.json({ error: 'ID and approval_status required' }, { status: 400 });
    }

    const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${id}`;
    if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });

    const [updated] = await sql`
      UPDATE receipts
      SET approval_status = ${approval_status},
          approved_by = ${approved_by ?? null},
          approved_at = ${approval_status === 'approved' ? new Date().toISOString() : null}
      WHERE id = ${id}
      RETURNING *
    `;

    // If approved, update invoice balance
    if (approval_status === 'approved') {
      const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${receipt.invoice_id}`;
      if (invoice) {
        const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(receipt.amount);
        const newBalance = parseFloat(invoice.total_amount) - newAmountPaid;
        const newStatus = newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
        await sql`
          UPDATE invoices
          SET amount_paid = ${newAmountPaid}, balance_due = ${Math.max(newBalance, 0)}, status = ${newStatus}, updated_at = NOW()
          WHERE id = ${receipt.invoice_id}
        `;
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}
