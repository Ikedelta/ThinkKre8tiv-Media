import sql from '@/app/api/utils/sql';
import { logActivity } from '@/app/api/utils/audit';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [[invoice], items, receipts] = await Promise.all([
        sql`
          SELECT i.*, 
                 c.name as customer_name, 
                 c.email as customer_email, 
                 c.phone as customer_phone, 
                 c.company as customer_company, 
                 c.address as customer_address
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          WHERE i.id = ${id}
        `,
        sql`SELECT * FROM invoice_items WHERE invoice_id = ${id}`,
        sql`SELECT * FROM receipts WHERE invoice_id = ${id} AND approval_status = 'approved'`
      ]);

      if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

      return Response.json({ ...invoice, items, receipts });
    }

    const invoices = await sql`
      SELECT i.*, 
             COALESCE(i.status, CASE WHEN i.balance_due <= 0 THEN 'paid' WHEN i.balance_due < i.total_amount THEN 'partial' ELSE 'unpaid' END) as status,
             c.name as customer_name, 
             c.email as customer_email
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
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const { user, isAdmin } = authResult;

    const body = await request.json();
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      invoice_number,
      subtotal,
      vat_rate,
      vat_amount,
      discount_amount,
      total_amount,
      due_date,
      notes,
      items,
      created_by
    } = body;

    const creatorName = user.name || created_by || 'Staff';
    const initialApproval = isAdmin ? (body.approval_status || 'approved') : 'pending';

    let finalCustomerId = customer_id;

    // If a customer_name is provided instead of ID, find or create the customer
    if (!finalCustomerId && customer_name) {
      const [existing] = await sql`SELECT id FROM customers WHERE name ILIKE ${customer_name} LIMIT 1`;
      if (existing) {
        finalCustomerId = existing.id;
        // Optionally update email/phone if they were missing, but for now just use existing.
      } else {
        const safeEmail = customer_email?.trim() || `guest_${Date.now()}@example.com`;
        const safePhone = customer_phone?.trim() || null;

        const [newCustomer] = await sql`
          INSERT INTO customers (name, email, phone) 
          VALUES (${customer_name}, ${safeEmail}, ${safePhone}) 
          RETURNING id
        `;
        finalCustomerId = newCustomer.id;
      }
    }

    if (!finalCustomerId) {
      return Response.json({ error: 'Customer is required' }, { status: 400 });
    }

    const [invoice] = await sql`
      INSERT INTO invoices (
        customer_id, invoice_number, subtotal, vat_rate, vat_amount,
        discount_amount, total_amount, balance_due, due_date, notes, approval_status, created_by
      ) VALUES (
        ${finalCustomerId}, ${invoice_number}, ${subtotal}, ${vat_rate ?? 15.0}, ${vat_amount},
        ${discount_amount ?? 0}, ${total_amount}, ${total_amount}, ${due_date}, ${notes ?? null}, ${initialApproval}, ${creatorName}
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

    await logActivity({
      user_name: creatorName,
      action: 'Created Invoice',
      resource: 'invoice',
      resource_id: invoice.id,
      details: `Generated ${invoice.invoice_number} for GH₵${invoice.total_amount} (Approval: ${initialApproval})`
    });

    return Response.json(invoice);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;
    const { user, isAdmin } = authResult;

    const body = await request.json();
    const { 
      id, 
      approval_status, 
      approved_by,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      subtotal,
      vat_rate,
      vat_amount,
      discount_amount,
      total_amount,
      due_date,
      notes,
      items
    } = body;
    
    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 });
    }

    // If only updating approval status
    if (approval_status && !items) {
      if (!isAdmin) {
        return Response.json({ error: 'Unauthorized: Only administrators can approve or reject invoices' }, { status: 403 });
      }

      const [updated] = await sql`
        UPDATE invoices
        SET approval_status = ${approval_status},
            approved_by = ${user?.id || approved_by || null},
            approved_at = ${approval_status === 'approved' ? new Date().toISOString() : null},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return Response.json(updated);
    }

    // Full Edit Mode
    let finalCustomerId = customer_id;
    if (!finalCustomerId && customer_name) {
      const [existing] = await sql`SELECT id FROM customers WHERE name ILIKE ${customer_name} LIMIT 1`;
      if (existing) {
        finalCustomerId = existing.id;
      } else {
        const safeEmail = customer_email?.trim() || null;
        const safePhone = customer_phone?.trim() || null;
        const [newCustomer] = await sql`
          INSERT INTO customers (name, email, phone) 
          VALUES (${customer_name}, ${safeEmail}, ${safePhone}) 
          RETURNING id
        `;
        finalCustomerId = newCustomer.id;
      }
    }

    // Compute already paid amount from payments/approved receipts
    const [paidRecord] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE invoice_id = ${id}
    `;
    const totalPaid = parseFloat(paidRecord?.total_paid || 0);
    const newTotal = parseFloat(total_amount !== undefined ? total_amount : (subtotal || 0));
    const calculatedBalanceDue = Math.max(0, newTotal - totalPaid);
    const newStatus = calculatedBalanceDue <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

    const [updated] = await sql`
      UPDATE invoices
      SET customer_id = COALESCE(${finalCustomerId}, customer_id),
          subtotal = COALESCE(${subtotal}, subtotal),
          vat_rate = COALESCE(${vat_rate}, vat_rate),
          vat_amount = COALESCE(${vat_amount}, vat_amount),
          discount_amount = COALESCE(${discount_amount}, discount_amount),
          total_amount = COALESCE(${total_amount}, total_amount),
          balance_due = ${calculatedBalanceDue},
          status = ${newStatus},
          due_date = COALESCE(${due_date}, due_date),
          notes = COALESCE(${notes}, notes),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (items && Array.isArray(items)) {
      // Delete old items
      await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;
      // Insert new items
      for (const item of items) {
        await sql`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
          VALUES (${id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;
      }
    }

    await logActivity({
      user_name: 'Admin',
      action: 'Updated Invoice',
      resource: 'invoice',
      resource_id: id,
      details: `Modified invoice ${updated?.invoice_number || id} (Total: GH₵${updated?.total_amount || 0})`
    });

    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [existing] = await sql`SELECT invoice_number FROM invoices WHERE id = ${id}`;
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    await logActivity({
      user_name: user.name,
      user_email: user.email,
      role: 'admin',
      action: 'Deleted Invoice',
      resource: 'invoice',
      resource_id: id,
      details: `Permanently removed invoice ${existing?.invoice_number || id}`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
