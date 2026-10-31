import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [receipt] = await sql`
        SELECT r.*, 
               COALESCE(r.receipt_number, 'TK-RCT-' || SUBSTRING(r.id::text, 1, 6)) as receipt_number,
               c.name as customer_name, 
               c.email as customer_email, 
               c.phone as customer_phone, 
               c.company as customer_company,
               i.invoice_number, 
               i.total_amount as invoice_total_amount, 
               i.balance_due as invoice_balance_due, 
               (
                 SELECT COALESCE(SUM(amount), 0)
                 FROM receipts
                 WHERE invoice_id = r.invoice_id
                   AND approval_status = 'approved'
                   AND created_at <= r.created_at
               ) as running_paid_up_to_receipt
        FROM receipts r
        JOIN customers c ON r.customer_id = c.id
        JOIN invoices i ON r.invoice_id = i.id
        WHERE r.id = ${id}
      `;
      if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });
      return Response.json(receipt);
    }

    const receipts = await sql`
      SELECT r.*, 
             COALESCE(r.receipt_number, 'TK-RCT-' || SUBSTRING(r.id::text, 1, 6)) as receipt_number,
             c.name as customer_name, 
             c.email as customer_email, 
             c.phone as customer_phone,
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
    const { invoice_id, customer_id, customer_name, customer_email, customer_phone, amount, payment_method, payment_date, notes, created_by } = body;

    let finalCustomerId = customer_id;
    let finalInvoiceId = invoice_id;

    // Handle customer_name if provided
    if (!finalCustomerId && customer_name) {
      const [existing] = await sql`SELECT id FROM customers WHERE name ILIKE ${customer_name} LIMIT 1`;
      if (existing) {
        finalCustomerId = existing.id;
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

    // Handle missing invoice_id (standalone receipt creation)
    if (!finalInvoiceId) {
      const invoice_number = `INV-2026-${Date.now().toString().slice(-6)}`;
      const [invoice] = await sql`
        INSERT INTO invoices (
          customer_id, invoice_number, subtotal, vat_rate, vat_amount,
          discount_amount, total_amount, balance_due, due_date, notes, approval_status, created_by
        ) VALUES (
          ${finalCustomerId}, ${invoice_number}, ${amount}, 0, 0,
          0, ${amount}, 0, ${new Date().toISOString()}, ${notes ?? 'Auto-generated for standalone receipt'}, 'approved', ${created_by ?? 'System User'}
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

    // Check user session
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = (session?.user as any)?.role;
    const userName = session?.user?.name || created_by || 'Staff';
    const initialStatus = userRole === 'admin' ? 'approved' : 'pending';

    // Create receipt
    const [receipt] = await sql`
      INSERT INTO receipts (invoice_id, customer_id, payment_id, receipt_number, amount, payment_method, payment_date, notes, approval_status, created_by)
      VALUES (${finalInvoiceId}, ${finalCustomerId}, ${payment.id}, ${receipt_number}, ${amount}, ${payment_method ?? 'bank_transfer'}, ${payment_date ?? new Date().toISOString()}, ${notes ?? null}, ${initialStatus}, ${userName})
      RETURNING *
    `;

    // Recalculate invoice balance accurately ONLY from APPROVED receipts
    const [invoiceRecord] = await sql`SELECT total_amount FROM invoices WHERE id = ${finalInvoiceId}`;
    if (invoiceRecord) {
      const [sumRecord] = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM receipts
        WHERE invoice_id = ${finalInvoiceId} AND approval_status = 'approved'
      `;
      const totalPaid = parseFloat(sumRecord?.total_paid || 0);
      const totalAmt = parseFloat(invoiceRecord.total_amount || 0);
      const newBalance = Math.max(0, totalAmt - totalPaid);
      const newStatus = newBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

      await sql`
        UPDATE invoices
        SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${finalInvoiceId}
      `;
    }

    return Response.json(receipt);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to create receipt' }, { status: 500 });
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
      amount,
      payment_method,
      payment_date,
      notes,
      items
    } = body;
    
    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 });
    }

    const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${id}`;
    if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });

    // Approval update
    if (approval_status && !amount) {
      if (!isAdmin) {
        return Response.json({ error: 'Unauthorized: Only administrators can approve or reject receipts' }, { status: 403 });
      }

      const [updated] = await sql`
        UPDATE receipts
        SET approval_status = ${approval_status},
            approved_by = ${user?.id || approved_by || null},
            approved_at = ${approval_status === 'approved' ? new Date().toISOString() : null}
        WHERE id = ${id}
        RETURNING *
      `;

      // If approval status changes, recalculate invoice balance from all approved receipts
      const [invoiceRecord] = await sql`SELECT total_amount FROM invoices WHERE id = ${receipt.invoice_id}`;
      if (invoiceRecord) {
        const [sumRecord] = await sql`
          SELECT COALESCE(SUM(amount), 0) as total_paid
          FROM receipts
          WHERE invoice_id = ${receipt.invoice_id} AND approval_status = 'approved'
        `;
        const totalPaid = parseFloat(sumRecord?.total_paid || 0);
        const totalAmt = parseFloat(invoiceRecord.total_amount || 0);
        const newBalance = Math.max(0, totalAmt - totalPaid);
        const newStatus = newBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

        await sql`
          UPDATE invoices
          SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = NOW()
          WHERE id = ${receipt.invoice_id}
        `;
      }
      return Response.json(updated);
    }

    // Full Edit Mode
    let finalCustomerId = customer_id || receipt.customer_id;
    if (customer_name && !customer_id) {
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

    const [updatedReceipt] = await sql`
      UPDATE receipts
      SET customer_id = ${finalCustomerId},
          amount = COALESCE(${amount}, amount),
          payment_method = COALESCE(${payment_method}, payment_method),
          payment_date = COALESCE(${payment_date}, payment_date),
          notes = COALESCE(${notes}, notes)
      WHERE id = ${id}
      RETURNING *
    `;

    // Update underlying invoice if standalone
    if (receipt.invoice_id && amount) {
      await sql`
        UPDATE invoices
        SET total_amount = ${amount}, subtotal = ${amount}, balance_due = ${amount}
        WHERE id = ${receipt.invoice_id}
      `;
      
      if (items && Array.isArray(items)) {
        await sql`DELETE FROM invoice_items WHERE invoice_id = ${receipt.invoice_id}`;
        for (const item of items) {
          await sql`
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
            VALUES (${receipt.invoice_id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
          `;
        }
      }
    }

    return Response.json(updatedReceipt);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${id}`;
    if (!receipt) return Response.json({ error: 'Receipt not found' }, { status: 404 });

    // 1. Delete associated payment if present
    if (receipt.payment_id) {
      await sql`DELETE FROM payments WHERE id = ${receipt.payment_id}`;
    }

    // 2. Delete the receipt
    await sql`DELETE FROM receipts WHERE id = ${id}`;

    // 3. Recalculate invoice balance if linked
    if (receipt.invoice_id) {
      const [invoiceRecord] = await sql`SELECT total_amount FROM invoices WHERE id = ${receipt.invoice_id}`;
      if (invoiceRecord) {
        const [sumRecord] = await sql`
          SELECT COALESCE(SUM(amount), 0) as total_paid
          FROM receipts
          WHERE invoice_id = ${receipt.invoice_id} AND approval_status = 'approved'
        `;
        const totalPaid = parseFloat(sumRecord?.total_paid || 0);
        const totalAmt = parseFloat(invoiceRecord.total_amount || 0);
        const newBalance = Math.max(0, totalAmt - totalPaid);
        const newStatus = newBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

        await sql`
          UPDATE invoices
          SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = NOW()
          WHERE id = ${receipt.invoice_id}
        `;
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to delete receipt' }, { status: 500 });
  }
}
