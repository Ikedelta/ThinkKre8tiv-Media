import sql from '@/app/api/utils/sql';
import { ensureDatabaseIndexes } from '@/lib/db-indexes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory cache for ultra-fast instant dashboard rendering
let cachedStats: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && (now - lastCacheTime) < CACHE_TTL_MS) {
      return Response.json(cachedStats, {
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' }
      });
    }

    // Ensure database indexes asynchronously in the background
    ensureDatabaseIndexes().catch(() => {});

    // Run queries concurrently for better performance on Neon serverless
    const [
      [metrics],
      recentInvoices,
      recentReceipts,
      recentCustomers,
      recentExpenses
    ] = await Promise.all([
      sql`
        SELECT 
          (SELECT COUNT(*) FROM quotations) as total_print_jobs,
          (SELECT COUNT(*) FROM quotations WHERE status IN ('draft', 'sent')) as pending_jobs,
          (SELECT COUNT(*) FROM quotations WHERE status IN ('accepted', 'printing', 'finishing')) as jobs_in_production,
          (SELECT COUNT(*) FROM customers) as total_customers,
          (SELECT COUNT(*) FROM vendors) as total_vendors,
          (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_invoiced,
          (SELECT COALESCE(SUM(amount), 0) FROM payments) as total_received,
          (SELECT COALESCE(SUM(balance_due), 0) FROM invoices) as total_outstanding,
          (SELECT COUNT(*) FROM invoices WHERE balance_due > 0) as unpaid_invoices_count,
          (SELECT COUNT(*) FROM invoices WHERE balance_due <= 0 AND total_amount > 0) as paid_invoices_count,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expenses
      `,
      sql`
        SELECT 
          i.*, 
          c.name as customer_name, 
          c.email as customer_email,
          CASE 
            WHEN i.balance_due <= 0 THEN 'paid'
            WHEN i.balance_due < i.total_amount THEN 'partial'
            ELSE 'unpaid'
          END as status
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT r.*, c.name as customer_name, i.invoice_number
        FROM receipts r
        LEFT JOIN customers c ON r.customer_id = c.id
        LEFT JOIN invoices i ON r.invoice_id = i.id
        ORDER BY r.created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT *
        FROM customers
        ORDER BY created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT ex.*, v.name as vendor_name, a.name as account_name
        FROM expenses ex
        LEFT JOIN vendors v ON ex.vendor_id = v.id
        LEFT JOIN accounts a ON ex.account_id = a.id
        ORDER BY ex.date DESC
        LIMIT 10
      `
    ]);

    const payload = {
      metrics: {
        totalPrintJobs: Number(metrics.total_print_jobs),
        pendingJobs: Number(metrics.pending_jobs),
        jobsInProduction: Number(metrics.jobs_in_production),
        totalCustomersCount: Number(metrics.total_customers),
        totalVendorsCount: Number(metrics.total_vendors || 0),
        totalInvoiced: Number(metrics.total_invoiced),
        totalReceived: Number(metrics.total_received),
        totalOutstanding: Number(metrics.total_outstanding),
        unpaidInvoicesCount: Number(metrics.unpaid_invoices_count || 0),
        paidInvoicesCount: Number(metrics.paid_invoices_count || 0),
        totalExpenses: Number(metrics.total_expenses),
        netProfit: Number(metrics.total_received) - Number(metrics.total_expenses)
      },
      recent: {
        invoices: recentInvoices,
        receipts: recentReceipts,
        customers: recentCustomers,
        expenses: recentExpenses
      }
    };

    cachedStats = payload;
    lastCacheTime = now;

    return Response.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
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
