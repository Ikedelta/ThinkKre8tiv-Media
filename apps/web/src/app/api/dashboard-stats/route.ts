import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    // Combine all metrics and lists into a single efficient query 
    // to avoid rate limits and reduce roundtrips to exactly 1.
    const [result] = await sql`
      SELECT 
        (SELECT COALESCE(SUM(total_amount - balance_due), 0) FROM invoices) as total_revenue,
        (SELECT COALESCE(SUM(balance_due), 0) FROM invoices) as outstanding_balance,
        (SELECT COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) FROM invoices) as pending_count,
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT COUNT(*) FROM quotations WHERE status NOT IN ('completed', 'rejected')) as active_print_jobs,
        (SELECT COUNT(*) FROM customers) as total_customers,
        
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT i.*, c.name as customer_name, c.email as customer_email
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          ORDER BY i.created_at DESC
          LIMIT 10
        ) t) as recent_invoices,
        
        (SELECT COALESCE(json_agg(q), '[]'::json) FROM (
          SELECT q.*, c.name as customer_name, c.email as customer_email
          FROM quotations q
          LEFT JOIN customers c ON q.customer_id = c.id
          ORDER BY q.created_at DESC
          LIMIT 10
        ) q) as recent_quotations,
        
        (SELECT COALESCE(json_agg(cust), '[]'::json) FROM (
          SELECT *
          FROM customers
          ORDER BY created_at DESC
          LIMIT 10
        ) cust) as recent_customers
    `;

    return Response.json({
      metrics: {
        totalRevenue: Number(result.total_revenue),
        outstandingBalance: Number(result.outstanding_balance),
        pendingInvoicesCount: Number(result.pending_count),
        totalInvoicesCount: Number(result.total_invoices),
        activePrintJobs: Number(result.active_print_jobs),
        totalCustomersCount: Number(result.total_customers)
      },
      recent: {
        invoices: result.recent_invoices,
        quotations: result.recent_quotations,
        customers: result.recent_customers
      }
    }, {
      headers: {
        'Cache-Control': 's-maxage=10, stale-while-revalidate=59'
      }
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return Response.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
