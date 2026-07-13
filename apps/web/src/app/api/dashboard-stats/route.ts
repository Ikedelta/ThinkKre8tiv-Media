import sql from '@/app/api/utils/sql';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_invoiced,
        (SELECT COALESCE(SUM(total_amount - balance_due), 0) FROM invoices) as total_received,
        (SELECT COALESCE(SUM(balance_due), 0) FROM invoices) as total_outstanding,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expenses,
        
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT i.*, c.name as customer_name, c.email as customer_email
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          ORDER BY i.created_at DESC
          LIMIT 10
        ) t) as recent_invoices,
        
        (SELECT COALESCE(json_agg(r), '[]'::json) FROM (
          SELECT r.*, c.name as customer_name, i.invoice_number
          FROM receipts r
          LEFT JOIN customers c ON r.customer_id = c.id
          LEFT JOIN invoices i ON r.invoice_id = i.id
          ORDER BY r.created_at DESC
          LIMIT 10
        ) r) as recent_receipts,
        
        (SELECT COALESCE(json_agg(cust), '[]'::json) FROM (
          SELECT *
          FROM customers
          ORDER BY created_at DESC
          LIMIT 10
        ) cust) as recent_customers,

        (SELECT COALESCE(json_agg(e), '[]'::json) FROM (
          SELECT ex.*, v.name as vendor_name, a.name as account_name
          FROM expenses ex
          LEFT JOIN vendors v ON ex.vendor_id = v.id
          LEFT JOIN accounts a ON ex.account_id = a.id
          ORDER BY ex.date DESC
          LIMIT 10
        ) e) as recent_expenses
    `;

    return Response.json({
      metrics: {
        totalPrintJobs: Number(result.total_print_jobs),
        pendingJobs: Number(result.pending_jobs),
        jobsInProduction: Number(result.jobs_in_production),
        totalCustomersCount: Number(result.total_customers),
        totalInvoiced: Number(result.total_invoiced),
        totalReceived: Number(result.total_received),
        totalOutstanding: Number(result.total_outstanding),
        totalExpenses: Number(result.total_expenses),
        netProfit: Number(result.total_received) - Number(result.total_expenses)
      },
      recent: {
        invoices: result.recent_invoices,
        receipts: result.recent_receipts,
        customers: result.recent_customers,
        expenses: result.recent_expenses
      }
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // Return empty fallback instead of 500 so UI doesn't hang retrying
    return Response.json({ 
      metrics: { totalPrintJobs: 0, pendingJobs: 0, jobsInProduction: 0, totalCustomersCount: 0, totalInvoiced: 0, totalReceived: 0, totalOutstanding: 0 },
      recent: { invoices: [], receipts: [], customers: [] },
      error: 'Failed to fetch dashboard stats' 
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
