import sql from '@/app/api/utils/sql';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// High-performance in-memory cache for instant dashboard rendering
let cachedStats: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20000; // 20 seconds cache

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && (now - lastCacheTime) < CACHE_TTL_MS) {
      return Response.json(cachedStats, {
        headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40' }
      });
    }

    // Consolidated single round-trip database query utilizing PostgreSQL JSON aggregation.
    // Instead of firing 5 separate sequential/parallel HTTP roundtrips to Neon serverless,
    // this gathers all dashboard metrics, recent invoices, receipts, customers, and expenses
    // in one single lightning-fast database execution.
    const [result] = await sql`
      SELECT json_build_object(
        'metrics', (
          SELECT json_build_object(
            'total_print_jobs', (SELECT COUNT(*) FROM quotations),
            'pending_jobs', (SELECT COUNT(*) FROM quotations WHERE status IN ('draft', 'sent')),
            'jobs_in_production', (SELECT COUNT(*) FROM quotations WHERE status IN ('accepted', 'printing', 'finishing')),
            'total_customers', (SELECT COUNT(*) FROM customers),
            'total_vendors', (SELECT COUNT(*) FROM vendors),
            'total_invoiced', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices),
            'total_received', (SELECT COALESCE(SUM(amount), 0) FROM payments),
            'total_outstanding', (SELECT COALESCE(SUM(balance_due), 0) FROM invoices),
            'unpaid_invoices_count', (SELECT COUNT(*) FROM invoices WHERE balance_due > 0),
            'paid_invoices_count', (SELECT COUNT(*) FROM invoices WHERE balance_due <= 0 AND total_amount > 0),
            'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM expenses)
          )
        ),
        'invoices', COALESCE((
          SELECT json_agg(t) FROM (
            SELECT i.*, c.name as customer_name, c.email as customer_email,
              CASE WHEN i.balance_due <= 0 THEN 'paid' WHEN i.balance_due < i.total_amount THEN 'partial' ELSE 'unpaid' END as status
            FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC LIMIT 10
          ) t
        ), '[]'::json),
        'receipts', COALESCE((
          SELECT json_agg(t) FROM (
            SELECT r.*, c.name as customer_name, i.invoice_number
            FROM receipts r LEFT JOIN customers c ON r.customer_id = c.id LEFT JOIN invoices i ON r.invoice_id = i.id ORDER BY r.created_at DESC LIMIT 10
          ) t
        ), '[]'::json),
        'customers', COALESCE((
          SELECT json_agg(t) FROM (SELECT * FROM customers ORDER BY created_at DESC LIMIT 10) t
        ), '[]'::json),
        'expenses', COALESCE((
          SELECT json_agg(t) FROM (
            SELECT ex.*, v.name as vendor_name, a.name as account_name
            FROM expenses ex LEFT JOIN vendors v ON ex.vendor_id = v.id LEFT JOIN accounts a ON ex.account_id = a.id ORDER BY ex.date DESC LIMIT 10
          ) t
        ), '[]'::json)
      ) as dashboard
    `;

    const d = result?.dashboard;
    const m = d?.metrics || {};

    const payload = {
      metrics: {
        totalPrintJobs: Number(m.total_print_jobs || 0),
        pendingJobs: Number(m.pending_jobs || 0),
        jobsInProduction: Number(m.jobs_in_production || 0),
        totalCustomersCount: Number(m.total_customers || 0),
        totalVendorsCount: Number(m.total_vendors || 0),
        totalInvoiced: Number(m.total_invoiced || 0),
        totalReceived: Number(m.total_received || 0),
        totalOutstanding: Number(m.total_outstanding || 0),
        unpaidInvoicesCount: Number(m.unpaid_invoices_count || 0),
        paidInvoicesCount: Number(m.paid_invoices_count || 0),
        totalExpenses: Number(m.total_expenses || 0),
        netProfit: Number(m.total_received || 0) - Number(m.total_expenses || 0)
      },
      recent: {
        invoices: d?.invoices || [],
        receipts: d?.receipts || [],
        customers: d?.customers || [],
        expenses: d?.expenses || []
      }
    };

    cachedStats = payload;
    lastCacheTime = now;

    return Response.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40'
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    // If cachedStats exists, serve stale on failure
    if (cachedStats) {
      return Response.json(cachedStats);
    }
    return Response.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
