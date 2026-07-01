'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Briefcase,
  AlertCircle,
  FileText,
  Users,
  Plus,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  printing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  unpaid: 'bg-rose-100 text-rose-800 border-rose-200',
  overdue: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'print-jobs' | 'invoices' | 'customers'>('print-jobs');

  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await fetch('/api/dashboard-stats');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    enabled: mounted,
    staleTime: 60000, // Keep fresh for 60 seconds to avoid spamming the DB
  });

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalPrintJobs: 0,
    pendingJobs: 0,
    jobsInProduction: 0,
    totalCustomersCount: 0,
  };

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const recentInvoices = data?.recent?.invoices || [];
  const recentQuotations = data?.recent?.quotations || [];
  const recentCustomers = data?.recent?.customers || [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your print operations, billing, and customers.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Print Jobs', value: metrics.totalPrintJobs.toString(), secondary: 'All recorded orders' },
          { label: 'Pending Jobs', value: metrics.pendingJobs.toString(), secondary: 'Awaiting proofs/approval', alert: metrics.pendingJobs > 0 },
          { label: 'Jobs in Production', value: metrics.jobsInProduction.toString(), secondary: 'Currently printing/finishing' },
          { label: 'Total Customers', value: metrics.totalCustomersCount.toString(), secondary: 'Registered clients' },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
              <p className={cn("text-xs mt-2", stat.alert ? "text-rose-600 font-medium" : "text-slate-500 dark:text-slate-500")}>
                {stat.secondary}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Activity Feed */}
      <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm w-full max-w-full">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('print-jobs')}
            className={cn(
              "py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'print-jobs' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Recent Print Jobs
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              "py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'invoices' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Recent Invoices
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={cn(
              "py-4 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'customers' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            New Customers
          </button>
        </div>

        <div className="p-0">
          {/* Print Jobs Tab */}
          {activeTab === 'print-jobs' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentQuotations.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No print jobs found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Job ID</th>
                      <th className="px-6 py-3 font-medium">Customer</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentQuotations.map((job: any) => (
                      <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{job.quotation_number}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{job.customer_name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{fmt(job.total_amount)}</td>
                        <td className="px-6 py-4">
                          <Badge className={cn('border font-medium uppercase text-[10px] px-2 py-0.5 rounded-full shadow-none', statusColors[job.status] || statusColors.draft)}>
                            {job.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                          {job.file_url && (
                            <a href={job.file_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1">
                              Download File
                            </a>
                          )}
                          <Link href={`/admin/quotations?id=${job.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            View details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              {recentQuotations.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-right">
                  <Link href="/admin/quotations" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-end gap-1">
                    View all print jobs <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentInvoices.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No invoices found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Invoice #</th>
                      <th className="px-6 py-3 font-medium">Customer</th>
                      <th className="px-6 py-3 font-medium">Total</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{inv.customer_name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{fmt(inv.total_amount)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Badge className={cn('border font-medium uppercase text-[10px] px-2 py-0.5 rounded-full shadow-none', statusColors[inv.status] || statusColors.draft)}>
                              {inv.status || 'draft'}
                            </Badge>
                            {inv.approval_status === 'pending' && (
                              <Badge className="border border-amber-200 bg-amber-50 text-amber-700 font-medium uppercase text-[10px] px-2 py-0.5 rounded-full shadow-none">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/invoices?id=${inv.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            View details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              {recentInvoices.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-right">
                  <Link href="/admin/invoices" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-end gap-1">
                    View all invoices <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentCustomers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No customers found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Customer Name</th>
                      <th className="px-6 py-3 font-medium">Email / Contact</th>
                      <th className="px-6 py-3 font-medium">Orders</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentCustomers.map((cust: any) => (
                      <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{cust.name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{cust.email || cust.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{cust.invoice_count || 0} orders</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/customers?id=${cust.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            View profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              {recentCustomers.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-right">
                  <Link href="/admin/customers" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-end gap-1">
                    View all customers <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
