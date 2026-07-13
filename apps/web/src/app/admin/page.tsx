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
  CircleDollarSign,
  Activity,
  ArrowDownRight,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

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
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await fetch('/api/dashboard-stats');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    enabled: mounted,
    staleTime: 60000, // Keep fresh for 60 seconds to avoid spamming the DB
    retry: false,
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
    refetchInterval: 30000,
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
    totalCustomersCount: 0,
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    totalExpenses: 0,
    netProfit: 0,
  };

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Team'}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your print operations, billing, and customers.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 shadow-sm">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs font-medium text-slate-500">SMS Balance</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {smsData?.balance !== undefined ? `${smsData.balance} Credits` : 'Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
        <LayoutGrid className="w-5 h-5 text-indigo-500" /> 
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Create Invoice', href: '/admin/invoices/new', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Create Estimate', href: '/admin/quotations/new', icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Record Payment', href: '/admin/payments/new', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Log Expense', href: '/admin/expenses/new', icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Add Customer', href: '/admin/customers/new', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Add Service', href: '/admin/services', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer h-full group">
              <div className={cn("p-2 rounded-lg", action.bg, action.color)}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Financial Metrics */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-500" /> 
        Financial Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Net Profit', value: fmt(metrics.netProfit || 0), secondary: 'Income minus Expenses', color: (metrics.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', icon: TrendingUp, iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600' },
          { label: 'Total Income', value: fmt(metrics.totalReceived || 0), secondary: 'Payments collected', color: 'text-blue-600 dark:text-blue-400', icon: Wallet, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600' },
          { label: 'Total Expenses', value: fmt(metrics.totalExpenses || 0), secondary: 'Money spent', color: 'text-rose-600 dark:text-rose-400', icon: ArrowDownRight, iconBg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600' },
          { label: 'Outstanding A/R', value: fmt(metrics.totalOutstanding || 0), secondary: 'Unpaid invoices', color: 'text-amber-600 dark:text-amber-400', alert: (metrics.totalOutstanding || 0) > 0, icon: AlertCircle, iconBg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600' },
          { label: 'Total Invoiced', value: fmt(metrics.totalInvoiced || 0), secondary: 'Total billed to date', color: 'text-slate-700 dark:text-slate-300', icon: CircleDollarSign, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                  <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
                </div>
              </div>
              <h3 className={cn("text-2xl font-bold", stat.color)}>{stat.value}</h3>
              <p className={cn("text-xs mt-2", stat.alert ? "text-rose-600 font-medium" : "text-slate-500 dark:text-slate-500")}>
                {stat.secondary}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
