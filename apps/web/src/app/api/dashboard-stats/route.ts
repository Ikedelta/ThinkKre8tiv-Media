import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    // Combine all metrics and lists into a single efficient query 
    // to avoid rate limits and reduce roundtrips to exactly 1.
    const [result] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM quotations) as total_print_jobs,
        (SELECT COUNT(*) FROM quotations WHERE status IN ('draft', 'sent')) as pending_jobs,
        (SELECT COUNT(*) FROM quotations WHERE status IN ('accepted', 'printing', 'finishing')) as jobs_in_production,
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
        totalPrintJobs: Number(result.total_print_jobs),
        pendingJobs: Number(result.pending_jobs),
        jobsInProduction: Number(result.jobs_in_production),
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
