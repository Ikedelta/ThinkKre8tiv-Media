import sql from '@/app/api/utils/sql';
import { logActivity } from '@/app/api/utils/audit';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');

    if (invoiceId) {
      const payments = await sql`
        SELECT * FROM payments WHERE invoice_id = ${invoiceId} ORDER BY payment_date DESC
      `;
      return Response.json(payments);
    }

    const payments = await sql`
      SELECT p.*, i.invoice_number, c.name as customer_name, c.email as customer_email
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      ORDER BY p.payment_date DESC
    `;
    return Response.json(payments);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, amount, payment_method, payment_date, notes } = body;

    if (!invoice_id || !amount) {
      return Response.json({ error: 'Invoice ID and amount are required' }, { status: 400 });
    }

    // 1. Get the invoice to check balances
    const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${invoice_id}`;
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });

    // 2. Insert the payment
    const [payment] = await sql`
      INSERT INTO payments (invoice_id, amount, payment_method, payment_date, notes)
      VALUES (${invoice_id}, ${payAmount}, ${payment_method ?? 'bank_transfer'}, ${payment_date ?? new Date().toISOString()}, ${notes ?? null})
      RETURNING *
    `;

    // 3. Insert receipt record with approval_status tied to user role
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = (session?.user as any)?.role;
    const userName = session?.user?.name || 'Staff';
    const initialStatus = userRole === 'admin' ? 'approved' : 'pending';

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM receipts`;
    const receipt_number = `TK-RCT-${String(Number(count) + 1).padStart(4, '0')}`;

    await sql`
      INSERT INTO receipts (invoice_id, customer_id, payment_id, receipt_number, amount, payment_method, payment_date, notes, approval_status, created_by)
      VALUES (${invoice_id}, ${invoice.customer_id}, ${payment.id}, ${receipt_number}, ${payAmount}, ${payment_method ?? 'bank_transfer'}, ${payment_date ?? new Date().toISOString()}, ${notes ?? null}, ${initialStatus}, ${userName})
    `;

    // 4. Update the invoice balance and status ONLY from approved receipts/payments
    const [approvedSumRecord] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_approved
      FROM receipts
      WHERE invoice_id = ${invoice_id} AND approval_status = 'approved'
    `;
    const totalApprovedPaid = parseFloat(approvedSumRecord?.total_approved || 0);
    const invoiceTotal = parseFloat(invoice.total_amount || 0);
    const newBalance = Math.max(0, invoiceTotal - totalApprovedPaid);
    const newStatus = newBalance <= 0 ? 'paid' : totalApprovedPaid > 0 ? 'partial' : 'unpaid';

    await sql`
      UPDATE invoices
      SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = NOW()
      WHERE id = ${invoice_id}
    `;

    await logActivity({
      user_name: userName,
      action: 'Recorded Payment',
      resource: 'payment',
      resource_id: payment.id,
      details: `Collected GH₵${payAmount} via ${payment_method ?? 'bank_transfer'} on invoice ${invoice.invoice_number} (Receipt: ${receipt_number}, Status: ${initialStatus})`
    });

    return Response.json({ success: true, payment });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
