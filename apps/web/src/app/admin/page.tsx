'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Briefcase,
  AlertCircle,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  design: 'bg-slate-200 dark:bg-slate-800/60 text-slate-700 dark:text-slate-350',
  printing: 'bg-slate-200 dark:bg-slate-800/60 text-slate-700 dark:text-slate-350',
  finishing: 'bg-slate-300 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200',
  delivery: 'bg-slate-300 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200',
  completed: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold',
  paid: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold',
  unpaid: 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300',
  partial: 'bg-slate-200 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
  overdue: 'bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white',
};

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const r = await fetch('/api/invoices');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    enabled: mounted,
  });

  const totalRevenue = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);
  const outstanding = invoices.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
  const pendingInvoices = invoices.filter((i: any) => i.approval_status === 'pending');
  const unpaidCount = invoices.filter(
    (i: any) => i.status === 'unpaid' || i.status === 'overdue'
  ).length;

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  const stats = [
    {
      label: 'Total Revenue',
      value: fmt(totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      href: '/admin/reports',
    },
    {
      label: 'Outstanding',
      value: fmt(outstanding),
      icon: AlertCircle,
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      href: '/admin/invoices',
    },
  ];

  const recentInvoices = invoices.slice(0, 6);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header — single action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5 font-medium">Business overview</p>
        </div>
        <Link href="/admin/invoices/new">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95">
            <FileText size={15} /> New Invoice
          </button>
        </Link>
      </div>

      {/* Pending approvals alert */}
      {pendingInvoices.length > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-5 py-4">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
              {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              Review and approve to activate them
            </p>
          </div>
          <Link
            href="/admin/invoices"
            className="flex-shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            Review <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* 2-column stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.label}>
            <Card className="border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow transition-all cursor-pointer rounded-2xl">
              <CardContent className="p-5">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                    stat.bg
                  )}
                >
                  <stat.icon size={18} className={stat.color} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Full-width table */}
      <div>
        {/* Recent Invoices */}
        <Card className="border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400 dark:text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Recent Invoices</h2>
            </div>
            <Link
              href="/admin/invoices"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-850">
            {recentInvoices.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-slate-400">No invoices yet</p>
                <Link
                  href="/admin/invoices/new"
                  className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                >
                  Create first invoice →
                </Link>
              </div>
            ) : (
              recentInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {inv.customer_name}
                      </p>
                      {inv.approval_status === 'pending' && (
                        <span className="flex-shrink-0 text-[8px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{inv.invoice_number}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fmt(inv.total_amount)}</p>
                    <Badge
                      className={cn(
                        'border-none text-[9px] font-bold uppercase tracking-wider shadow-none px-2.5 py-1 rounded-full',
                        statusColors[inv.status] || 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          {unpaidCount > 0 && (
            <div className="px-5 py-3.5 bg-red-50/60 dark:bg-red-950/10 border-t border-red-100 dark:border-red-950/30">
              <p className="text-xs font-semibold text-red-500">
                {unpaidCount} invoice{unpaidCount !== 1 ? 's' : ''} require attention
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Quotation', href: '/admin/quotations/new', icon: FileText },
          { label: 'Record Payment', href: '/admin/receipts', icon: CreditCard },
          { label: 'Manage Customers', href: '/admin/customers', icon: Users },
          { label: 'View Reports', href: '/admin/reports', icon: TrendingUp },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-900/40 hover:bg-indigo-600/5 dark:hover:bg-indigo-600/5 transition-all group cursor-pointer shadow-sm">
              <Icon
                size={16}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0"
              />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
