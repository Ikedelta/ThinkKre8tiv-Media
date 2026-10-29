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
  MessageSquare,
  Banknote,
  Receipt,
  FileSignature,
  Wallet,
  Coins,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  LayoutGrid,
  Building2,
  PieChart,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  printing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
  partial: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200',
  unpaid: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200',
  overdue: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200',
};

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'customers'>('invoices');
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await fetch('/api/dashboard-stats');
      if (!r.ok) throw new Error('Failed to fetch dashboard stats');
      return r.json();
    },
    enabled: mounted,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const { data: smsData } = useQuery({
    queryKey: ['sms_balance'],
    queryFn: async () => {
      const res = await fetch('/api/sms?action=balance');
      if (!res.ok) throw new Error('Failed to fetch SMS balance');
      return res.json();
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading financial overview & metrics...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalCustomersCount: 0,
    totalVendorsCount: 0,
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
    totalExpenses: 0,
    netProfit: 0,
  };

  const recent = {
    invoices: data?.recent?.invoices || [],
    receipts: data?.recent?.receipts || [],
    customers: data?.recent?.customers || [],
    expenses: data?.recent?.expenses || []
  };

  const fmt = (n: number) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const collectionRate = metrics.totalInvoiced > 0
    ? Math.round((metrics.totalReceived / metrics.totalInvoiced) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16 font-sans">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 uppercase tracking-wider">
              QuickBooks Flow Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Team'}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial status, double-entry invoicing pipeline, and vendor payables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 shadow-sm">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SMS Balance</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {smsData?.balance !== undefined ? `${smsData.balance} Credits` : '...'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* UNIFIED CORPORATE QUICK ACTIONS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0F172A] text-white">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Immediate shortcuts to common operational and accounting tasks</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ghana Cedi (GH₵)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'New Invoice', desc: 'Bill client order', href: '/admin/invoices/new', icon: FileText },
            { label: 'New Estimate', desc: 'Create quote', href: '/admin/quotations/new', icon: FileSignature },
            { label: 'Record Payment', desc: 'Issue receipt', href: '/admin/payments/new', icon: Banknote },
            { label: 'Log Expense', desc: 'Materials & bills', href: '/admin/expenses/new', icon: Receipt },
            { label: 'Add Supplier', desc: 'Manage vendors', href: '/admin/suppliers', icon: Building2 },
            { label: 'Add Customer', desc: 'Register client', href: '/admin/customers/new', icon: Users },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="group">
              <div className="h-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-transform group-hover:scale-105 group-hover:bg-[#D22630]/10 group-hover:text-[#D22630]">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#D22630] transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {action.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* DETAILED FINANCIAL OVERVIEW (RESTRICTED TO ADMIN) */}
      {isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Financial Health &amp; Balances
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Formula: Net Profit = Total Income (Collections) &minus; Expenses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Net Profit */}
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Profit</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {fmt(metrics.netProfit)}
                </h3>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", (metrics.netProfit || 0) >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Income minus expenses
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Total Income (Collected) */}
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Income</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#D22630]" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {fmt(metrics.totalReceived)}
                </h3>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Collected payments to date
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Total Expenses */}
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Expenses</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {fmt(metrics.totalExpenses)}
                </h3>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Supplier &amp; operations
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 4. Outstanding A/R */}
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding A/R</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {fmt(metrics.totalOutstanding)}
                </h3>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {metrics.unpaidInvoicesCount} pending invoices
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Total Billed */}
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Invoiced</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {fmt(metrics.totalInvoiced)}
                </h3>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D22630]" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {collectionRate}% collection rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* QUICKBOOKS INVOICE AGING / PROGRESS STRIP (ADMIN ONLY) */}
      {isAdmin && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Invoicing &amp; Accounts Receivable Health
              </h3>
              <p className="text-xs text-slate-500">Live breakdown between collected revenue and pending customer balances</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Paid: {fmt(metrics.totalReceived)}
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                A/R Pending: {fmt(metrics.totalOutstanding)}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, collectionRate)}%` }}
              title={`Collected: ${collectionRate}%`}
            />
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${Math.max(0, 100 - collectionRate)}%` }}
              title={`Pending: ${100 - collectionRate}%`}
            />
          </div>
        </Card>
      )}

      {/* RECENT TRANSACTIONS & ACTIVITY (TABBED QUICKBOOKS LEDGER) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'invoices'
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Recent Invoices ({(recent.invoices || []).length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'expenses'
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Recent Expenses & Bills ({(recent.expenses || []).length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'customers'
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Customers ({(recent.customers || []).length})
            </button>
          </div>

          <Link
            href={
              activeTab === 'invoices' ? '/admin/invoices' :
              activeTab === 'expenses' ? '/admin/expenses' :
              '/admin/customers'
            }
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Open full ledger &rarr;
          </Link>
        </div>

        {/* TAB 1: RECENT INVOICES */}
        {activeTab === 'invoices' && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3 text-right">Total Amount</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.invoices.length > 0 ? (
                    recent.invoices.slice(0, 7).map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {inv.invoice_number}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {inv.customer_name || 'Walk-in Customer'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {fmt(inv.total_amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                          {fmt(inv.balance_due)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge className={cn("border-none text-[10px] uppercase font-bold tracking-wider", statusColors[inv.status] || 'bg-slate-100 text-slate-600')}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {Number(inv.balance_due) > 0 ? (
                            <Link href={`/admin/payments/new?invoice_id=${inv.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                Record Pay
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/admin/payments?search=${encodeURIComponent(inv.invoice_number)}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-slate-500">
                                View Receipt
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No recent invoices found. Click &quot;+ Invoice&quot; to issue your first invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: RECENT EXPENSES */}
        {activeTab === 'expenses' && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Supplier / Vendor</th>
                    <th className="px-5 py-3">Account / Category</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.expenses.length > 0 ? (
                    recent.expenses.slice(0, 7).map((ex: any) => (
                      <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {ex.date ? new Date(ex.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {ex.vendor_name || 'General Supplier'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {ex.account_name || 'Cost of Goods / Supplies'}
                        </td>
                        <td className="px-5 py-3.5 text-xs uppercase font-medium text-slate-500">
                          {ex.payment_method || 'Cash'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                          {fmt(ex.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        No expenses logged yet. Click &quot;Log Expense&quot; to record raw materials, ink, or rent expenses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: CUSTOMERS */}
        {activeTab === 'customers' && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Customer Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.customers.length > 0 ? (
                    recent.customers.slice(0, 7).map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{c.email || '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{c.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/admin/invoices/new?customer_id=${c.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                              Invoice Customer
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        No customers found. Click &quot;+ Add Customer&quot; to register your client database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
