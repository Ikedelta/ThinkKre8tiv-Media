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
  MoreHorizontal,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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
    totalRevenue: 0,
    outstandingBalance: 0,
    pendingInvoicesCount: 0,
    totalInvoicesCount: 0,
    activePrintJobs: 0,
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your print operations, billing, and customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/invoices/new" className="flex items-center gap-2 bg-[#E04D1B] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95">
            <Plus size={16} /> New Invoice
          </Link>
          <Link href="/admin/quotations/new" className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95">
            <Plus size={16} /> New Print Job
          </Link>
          <Link href="/admin/customers" className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95">
            <Users size={16} /> View Customers
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(metrics.totalRevenue), secondary: `${metrics.totalInvoicesCount} total invoices`, icon: DollarSign, color: "text-emerald-500" },
          { label: 'Outstanding Balance', value: fmt(metrics.outstandingBalance), secondary: `${metrics.pendingInvoicesCount} awaiting approval`, alert: metrics.pendingInvoicesCount > 0, icon: AlertCircle, color: "text-rose-500" },
          { label: 'Active Print Jobs', value: metrics.activePrintJobs.toString(), secondary: 'Currently in progress', icon: Briefcase, color: "text-blue-500" },
          { label: 'Total Customers', value: metrics.totalCustomersCount.toString(), secondary: 'Registered clients', icon: Users, color: "text-indigo-500" },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                <stat.icon className={cn("w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity", stat.color)} />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <p className={cn("text-[10px] font-black mt-2 uppercase tracking-wider", stat.alert ? "text-rose-600" : "text-slate-400 dark:text-slate-500")}>
                {stat.secondary}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Activity Feed */}
      <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 flex gap-6">
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
                      <tr 
                        key={job.id} 
                        onClick={() => router.push(`/admin/quotations?id=${job.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{job.quotation_number}</td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{job.customer_name}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-300">{fmt(job.total_amount)}</td>
                        <td className="px-6 py-4">
                          <Badge className={cn('border-none font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-full shadow-none', statusColors[job.status] || statusColors.draft)}>
                            {job.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight size={18} className="inline-block text-slate-300 group-hover:text-[#E04D1B] transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <tr 
                        key={inv.id} 
                        onClick={() => router.push(`/admin/invoices?id=${inv.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{inv.invoice_number}</td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{inv.customer_name}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-300">{fmt(inv.total_amount)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Badge className={cn('border-none font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-full shadow-none', statusColors[inv.status] || statusColors.draft)}>
                              {inv.status || 'draft'}
                            </Badge>
                            {inv.approval_status === 'pending' && (
                              <Badge className="border-none bg-amber-50 text-amber-700 font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-full shadow-none">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight size={18} className="inline-block text-slate-300 group-hover:text-[#E04D1B] transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <tr 
                        key={cust.id} 
                        onClick={() => router.push(`/admin/customers?id=${cust.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{cust.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{cust.email || cust.phone || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-300">{cust.invoice_count || 0} orders</td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight size={18} className="inline-block text-slate-300 group-hover:text-[#E04D1B] transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
