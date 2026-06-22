import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    if (type === 'overview') {
      const [revenueData] = await sql`
        SELECT
          COALESCE(SUM(amount_paid), 0) as total_revenue,
          COALESCE(SUM(total_amount), 0) as total_billed,
          COALESCE(SUM(balance_due), 0) as total_outstanding,
          COUNT(*) as total_invoices,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
          COUNT(*) FILTER (WHERE status = 'unpaid') as unpaid_invoices,
          COUNT(*) FILTER (WHERE status = 'partial') as partial_invoices,
          COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices
        FROM invoices
      `;

      const [expenseData] = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_expenses
        FROM expenses
      `;

      const [customerData] = await sql`
        SELECT COUNT(*) as total_customers FROM customers
      `;

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

      const monthlyRevenue = await sql`
        SELECT
          TO_CHAR(created_at, 'Mon') as month,
          EXTRACT(MONTH FROM created_at) as month_num,
          COALESCE(SUM(amount_paid), 0) as revenue,
          COALESCE(SUM(total_amount), 0) as billed
        FROM invoices
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_num
        ORDER BY month_num
      `;

      const monthlyExpenses = await sql`
        SELECT
          TO_CHAR(created_at, 'Mon') as month,
          EXTRACT(MONTH FROM created_at) as month_num,
          COALESCE(SUM(amount), 0) as expenses
        FROM expenses
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_num
        ORDER BY month_num
      `;

      const expenseByCategory = await sql`
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        GROUP BY category
        ORDER BY total DESC
      `;

      return Response.json({
        revenue: revenueData,
        expenses: expenseData,
        customers: customerData,
        jobs: jobData,
        monthlyRevenue,
        monthlyExpenses,
        expenseByCategory,
        profit: {
          gross: parseFloat(revenueData.total_revenue) - parseFloat(expenseData.total_expenses),
        },
      });
    }

    return Response.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
