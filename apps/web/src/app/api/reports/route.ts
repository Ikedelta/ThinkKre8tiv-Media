import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any)?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Only administrators can access financial reports' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all'; // 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'custom', 'all'
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate boundary timestamps in UTC/ISO
    let startTimestamp: string | null = null;
    let endTimestamp: string | null = null;

    const now = new Date();

    if (range === 'this_week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      startTimestamp = monday.toISOString();
      endTimestamp = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    } else if (range === 'last_week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day - 7;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() + diffToMonday);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      startTimestamp = lastMonday.toISOString();
      endTimestamp = lastSunday.toISOString();
    } else if (range === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      startTimestamp = firstDay.toISOString();
      endTimestamp = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    } else if (range === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      startTimestamp = firstDay.toISOString();
      endTimestamp = lastDay.toISOString();
    } else if (range === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      startTimestamp = firstDay.toISOString();
      endTimestamp = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    } else if (range === 'custom' && startDateParam) {
      startTimestamp = new Date(`${startDateParam}T00:00:00.000Z`).toISOString();
      if (endDateParam) {
        endTimestamp = new Date(`${endDateParam}T23:59:59.999Z`).toISOString();
      } else {
        endTimestamp = new Date().toISOString();
      }
    }

    // 1. Overall Financial Summary within date range
    const [revenueData] = startTimestamp && endTimestamp
      ? await sql`
        SELECT
          COALESCE(SUM(total_amount - balance_due), 0) as total_revenue,
          COALESCE(SUM(total_amount), 0) as total_billed,
          COALESCE(SUM(balance_due), 0) as total_outstanding,
          COUNT(*) as total_invoices,
          COUNT(*) FILTER (WHERE balance_due <= 0) as paid_invoices,
          COUNT(*) FILTER (WHERE balance_due >= total_amount) as unpaid_invoices,
          COUNT(*) FILTER (WHERE balance_due > 0 AND balance_due < total_amount) as partial_invoices,
          COUNT(*) FILTER (WHERE due_date < NOW() AND balance_due > 0) as overdue_invoices
        FROM invoices
        WHERE created_at >= ${startTimestamp} AND created_at <= ${endTimestamp}
      `
      : await sql`
        SELECT
          COALESCE(SUM(total_amount - balance_due), 0) as total_revenue,
          COALESCE(SUM(total_amount), 0) as total_billed,
          COALESCE(SUM(balance_due), 0) as total_outstanding,
          COUNT(*) as total_invoices,
          COUNT(*) FILTER (WHERE balance_due <= 0) as paid_invoices,
          COUNT(*) FILTER (WHERE balance_due >= total_amount) as unpaid_invoices,
          COUNT(*) FILTER (WHERE balance_due > 0 AND balance_due < total_amount) as partial_invoices,
          COUNT(*) FILTER (WHERE due_date < NOW() AND balance_due > 0) as overdue_invoices
        FROM invoices
      `;

    // 2. Total Collected via Payments
    const [paymentData] = startTimestamp && endTimestamp
      ? await sql`
        SELECT 
          COALESCE(SUM(amount), 0) as total_collected,
          COUNT(*) as total_payments
        FROM payments
        WHERE payment_date >= ${startTimestamp} AND payment_date <= ${endTimestamp}
      `
      : await sql`
        SELECT 
          COALESCE(SUM(amount), 0) as total_collected,
          COUNT(*) as total_payments
        FROM payments
      `;

    // 3. Expenses
    const [expenseData] = startTimestamp && endTimestamp
      ? await sql`
        SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(*) as total_records
        FROM expenses
        WHERE (date >= ${startTimestamp} AND date <= ${endTimestamp})
           OR (date IS NULL AND created_at >= ${startTimestamp} AND created_at <= ${endTimestamp})
      `
      : await sql`
        SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(*) as total_records
        FROM expenses
      `;

    // 4. Customers
    const [customerData] = await sql`SELECT COUNT(*) as total_customers FROM customers`;

    // 5. Jobs Workflow
    const [jobData] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'design') as design,
        COUNT(*) FILTER (WHERE status = 'printing') as printing,
        COUNT(*) FILTER (WHERE status = 'finishing') as finishing,
        COUNT(*) FILTER (WHERE status = 'delivery') as delivery,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM jobs
    `;

    // 6. Timeline Breakdown (Trend over time)
    const timelineData = startTimestamp && endTimestamp
      ? await sql`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM-DD') as period_label,
          COALESCE(SUM(total_amount - balance_due), 0) as revenue,
          COALESCE(SUM(total_amount), 0) as billed
        FROM invoices
        WHERE created_at >= ${startTimestamp} AND created_at <= ${endTimestamp}
        GROUP BY period_label
        ORDER BY period_label ASC
      `
      : await sql`
        SELECT
          TO_CHAR(created_at, 'Mon YYYY') as period_label,
          TO_CHAR(created_at, 'YYYY-MM') as sort_key,
          COALESCE(SUM(total_amount - balance_due), 0) as revenue,
          COALESCE(SUM(total_amount), 0) as billed
        FROM invoices
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY period_label, sort_key
        ORDER BY sort_key ASC
      `;

    // 7. Expenses by category within range
    const expenseByCategory = startTimestamp && endTimestamp
      ? await sql`
        SELECT COALESCE(description, 'General') as category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE (date >= ${startTimestamp} AND date <= ${endTimestamp})
           OR (date IS NULL AND created_at >= ${startTimestamp} AND created_at <= ${endTimestamp})
        GROUP BY category
        ORDER BY total DESC
      `
      : await sql`
        SELECT COALESCE(description, 'General') as category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        GROUP BY category
        ORDER BY total DESC
      `;

    // 8. Payment Method Distribution
    const paymentMethods = startTimestamp && endTimestamp
      ? await sql`
        SELECT payment_method, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM payments
        WHERE payment_date >= ${startTimestamp} AND payment_date <= ${endTimestamp}
        GROUP BY payment_method
        ORDER BY total DESC
      `
      : await sql`
        SELECT payment_method, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM payments
        GROUP BY payment_method
        ORDER BY total DESC
      `;

    // 9. Detailed Itemized Transaction Rows (Recent Invoices & Payments within selection)
    const detailedInvoices = startTimestamp && endTimestamp
      ? await sql`
        SELECT i.id, i.invoice_number, i.total_amount, i.balance_due, i.status, i.approval_status, i.created_at, c.name as customer_name
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.created_at >= ${startTimestamp} AND i.created_at <= ${endTimestamp}
        ORDER BY i.created_at DESC
        LIMIT 50
      `
      : await sql`
        SELECT i.id, i.invoice_number, i.total_amount, i.balance_due, i.status, i.approval_status, i.created_at, c.name as customer_name
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 50
      `;

    const detailedExpenses = startTimestamp && endTimestamp
      ? await sql`
        SELECT id, amount, description, payment_method, date, created_at
        FROM expenses
        WHERE (date >= ${startTimestamp} AND date <= ${endTimestamp})
           OR (date IS NULL AND created_at >= ${startTimestamp} AND created_at <= ${endTimestamp})
        ORDER BY date DESC NULLS LAST, created_at DESC
        LIMIT 50
      `
      : await sql`
        SELECT id, amount, description, payment_method, date, created_at
        FROM expenses
        ORDER BY date DESC NULLS LAST, created_at DESC
        LIMIT 50
      `;

    const totalRevenueVal = parseFloat(revenueData.total_revenue || 0);
    const totalCollectedVal = parseFloat(paymentData.total_collected || 0);
    const totalExpensesVal = parseFloat(expenseData.total_expenses || 0);
    const effectiveRevenue = totalCollectedVal > 0 ? totalCollectedVal : totalRevenueVal;

    return Response.json({
      range,
      startDate: startTimestamp,
      endDate: endTimestamp,
      revenue: revenueData,
      payments: paymentData,
      expenses: expenseData,
      customers: customerData,
      jobs: jobData,
      timeline: timelineData,
      expenseByCategory,
      paymentMethods,
      detailedInvoices,
      detailedExpenses,
      profit: {
        gross: effectiveRevenue - totalExpensesVal,
        netMarginPct: effectiveRevenue > 0 ? (((effectiveRevenue - totalExpensesVal) / effectiveRevenue) * 100).toFixed(1) : 0,
      },
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
