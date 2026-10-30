'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileText, 
  Calendar, 
  Printer, 
  Download, 
  Clock, 
  Receipt, 
  CreditCard,
  Building,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

const PIE_COLORS = ['#E04D1B', '#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

interface ReportData {
  range: string;
  startDate?: string;
  endDate?: string;
  revenue: {
    total_revenue: number | string;
    total_billed: number | string;
    total_outstanding: number | string;
    total_invoices: number | string;
    paid_invoices: number | string;
    unpaid_invoices: number | string;
    partial_invoices: number | string;
    overdue_invoices: number | string;
  };
  payments: {
    total_collected: number | string;
    total_payments: number | string;
  };
  expenses: {
    total_expenses: number | string;
    total_records: number | string;
  };
  customers: { total_customers: number | string };
  jobs: {
    pending: number;
    design: number;
    printing: number;
    finishing: number;
    delivery: number;
    completed: number;
  };
  timeline: { period_label: string; revenue: number; billed: number }[];
  expenseByCategory: { category: string; total: number }[];
  paymentMethods: { payment_method: string; total: number; count: number }[];
  detailedInvoices: {
    id: string;
    invoice_number: string;
    total_amount: number;
    balance_due: number;
    status: string;
    approval_status: string;
    created_at: string;
    customer_name: string;
  }[];
  detailedExpenses: {
    id: string;
    amount: number;
    description: string;
    payment_method: string;
    date: string;
    created_at: string;
  }[];
  profit: { gross: number; netMarginPct: number | string };
}

export default function ReportsPage() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [selectedRange, setSelectedRange] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'invoices' | 'expenses'>('analytics');

  const { data, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['reports', selectedRange, appliedCustom],
    queryFn: async () => {
      let url = `/api/reports?range=${selectedRange}`;
      if (selectedRange === 'custom' && appliedCustom) {
        url += `&startDate=${appliedCustom.start}&endDate=${appliedCustom.end}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load reports');
      return res.json();
    },
    enabled: isAdmin,
  });

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Administrator Access Required
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Financial statements, revenue metrics, disbursements, and operational analytics are strictly restricted to executive administrators.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  const fmt = (n: number | string) =>
    `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setSelectedRange('custom');
      setAppliedCustom({ start: customStart, end: customEnd });
    }
  };

  const rangeButtons = [
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  const rev = data?.revenue;
  const pay = data?.payments;
  const exp = data?.expenses;
  const profitGross = data?.profit.gross ?? 0;
  const isProfitable = profitGross >= 0;

  const summaryCards = [
    {
      label: 'Collected Payments',
      value: fmt(pay?.total_collected ?? rev?.total_revenue ?? 0),
      sub: `${pay?.total_payments ?? rev?.paid_invoices ?? 0} transactions processed`,
      icon: Wallet,
      color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900',
    },
    {
      label: 'Total Expenses',
      value: fmt(exp?.total_expenses ?? 0),
      sub: `${exp?.total_records ?? 0} recorded disbursements`,
      icon: TrendingDown,
      color: 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900',
    },
    {
      label: 'Net Margin / Profit',
      value: fmt(Math.abs(profitGross)),
      sub: isProfitable ? `Profitable (+${data?.profit.netMarginPct || 0}%)` : 'Operating at Net Loss',
      icon: isProfitable ? TrendingUp : TrendingDown,
      color: isProfitable 
        ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900'
        : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900',
    },
    {
      label: 'Total Invoiced (Billed)',
      value: fmt(rev?.total_billed ?? 0),
      sub: `${rev?.total_invoices ?? 0} total invoices generated`,
      icon: FileText,
      color: 'text-slate-700 bg-slate-50 dark:text-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    },
    {
      label: 'Outstanding Receivables',
      value: fmt(rev?.total_outstanding ?? 0),
      sub: `${Number(rev?.unpaid_invoices ?? 0) + Number(rev?.partial_invoices ?? 0)} pending settlements`,
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900',
    },
  ];

  const invoiceStatus = [
    { name: 'Paid', value: Number(rev?.paid_invoices ?? 0), color: '#10b981' },
    { name: 'Partial', value: Number(rev?.partial_invoices ?? 0), color: '#3b82f6' },
    { name: 'Unpaid', value: Number(rev?.unpaid_invoices ?? 0), color: '#f59e0b' },
    { name: 'Overdue', value: Number(rev?.overdue_invoices ?? 0), color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const expenseByCategory = (data?.expenseByCategory ?? []).map((e) => ({
    name: e.category,
    value: Number(e.total),
  }));

  const timelineChartData = (data?.timeline ?? []).map((t) => ({
    period: t.period_label,
    revenue: Number(t.revenue || 0),
    billed: Number(t.billed || 0),
  }));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Top Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial & Operational Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Detailed performance analytics, settlements, and itemized records across custom durations
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2 text-xs font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50"
          >
            <Printer size={14} /> Print Report
          </Button>
        </div>
      </div>

      {/* Professional Print Report Template */}
      <div className="hidden print:block mb-6">
        <div className="border-b-2 border-slate-900 pb-5 mb-5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 p-2 shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                  THINK <span className="text-[#D22630]">KRE8TIV</span> MEDIA
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  Accra OSU, Haramani Sport &bull; +233 24 468 1391 &bull; info@thinkkre8tiv.com
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Official Business Operations & Financial Audit Statement
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded tracking-widest mb-1.5">
                EXECUTIVE REPORT
              </span>
              <p className="text-xs font-bold text-slate-800">
                Period: <span className="text-[#D22630] font-black">{selectedRange === 'custom' && appliedCustom ? `${appliedCustom.start} to ${appliedCustom.end}` : rangeButtons.find((btn) => btn.id === selectedRange)?.label || selectedRange}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary Grid for Print */}
        <div className="grid grid-cols-5 gap-2.5 mb-6">
          <div className="border border-slate-200 bg-slate-50/70 p-3 rounded-lg text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Total Billed</span>
            <span className="text-sm font-black text-slate-900 font-mono">{fmt(rev?.total_billed ?? 0)}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{rev?.total_invoices ?? 0} invoices</span>
          </div>
          <div className="border border-emerald-200 bg-emerald-50/60 p-3 rounded-lg text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block mb-0.5">Total Collected</span>
            <span className="text-sm font-black text-emerald-900 font-mono">{fmt(pay?.total_collected ?? rev?.total_revenue ?? 0)}</span>
            <span className="text-[9px] text-emerald-700 block mt-0.5">{pay?.total_payments ?? rev?.paid_invoices ?? 0} settlements</span>
          </div>
          <div className="border border-amber-200 bg-amber-50/60 p-3 rounded-lg text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">Receivables Due</span>
            <span className="text-sm font-black text-amber-900 font-mono">{fmt(rev?.total_outstanding ?? 0)}</span>
            <span className="text-[9px] text-amber-700 block mt-0.5">Outstanding</span>
          </div>
          <div className="border border-rose-200 bg-rose-50/60 p-3 rounded-lg text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 block mb-0.5">Total Expenses</span>
            <span className="text-sm font-black text-rose-900 font-mono">{fmt(exp?.total_expenses ?? 0)}</span>
            <span className="text-[9px] text-rose-700 block mt-0.5">{exp?.total_records ?? 0} records</span>
          </div>
          <div className={cn("border p-3 rounded-lg text-center", isProfitable ? "border-blue-200 bg-blue-50/60" : "border-rose-200 bg-rose-50/60")}>
            <span className="text-[9px] font-black uppercase tracking-wider block mb-0.5 text-slate-600">Net Profit</span>
            <span className={cn("text-sm font-black font-mono", isProfitable ? "text-blue-900" : "text-rose-900")}>
              {fmt(Math.abs(profitGross))}
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">{isProfitable ? `+${data?.profit?.netMarginPct || 0}% margin` : 'Deficit'}</span>
          </div>
        </div>

        {/* Print Sign-off Bar */}
        <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[10px] text-slate-500">
          <span>Think Kre8tiv Media ERP &bull; Confidential Business Financial Record</span>
          <span className="font-semibold text-slate-700">Audit Verified &bull; Page 1 of 1</span>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setSelectedRange(btn.id);
                  setAppliedCustom(null);
                }}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                  selectedRange === btn.id
                    ? 'bg-[#E04D1B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleApplyCustom} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Custom Range:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-[#E04D1B]"
            />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-[#E04D1B]"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold px-3.5 h-8"
            >
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all rounded-xl print:shadow-none print:break-inside-avoid">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={cn('p-2 rounded-lg shrink-0', card.color)}>
                  <card.icon size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main View Tabs: Analytics Charts vs Itemized Data Tables */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 print:hidden">
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'pb-3 text-sm font-bold border-b-2 transition-all',
            activeTab === 'analytics'
              ? 'border-[#E04D1B] text-[#E04D1B]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          Analytics & Charts
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            'pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'invoices'
              ? 'border-[#E04D1B] text-[#E04D1B]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          Detailed Invoices <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{data?.detailedInvoices?.length || 0}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            'pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'expenses'
              ? 'border-[#E04D1B] text-[#E04D1B]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          Itemized Expenses <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{data?.detailedExpenses?.length || 0}</Badge>
        </button>
      </div>

      {/* TAB 1: Visual Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Bar Chart */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Revenue & Billing Timeline</span>
                  <span className="text-xs font-normal text-slate-500">Selected Duration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {timelineChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No activity recorded for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          backgroundColor: '#0F172A',
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="billed" name="Total Invoiced" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" name="Settled Revenue" fill="#E04D1B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status Distribution */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Invoice Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {invoiceStatus.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No invoices in this date window
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {invoiceStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#0F172A',
                          color: '#fff',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {expenseByCategory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No expenses logged in this range
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#0F172A',
                          color: '#fff',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Settlements by Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(data?.paymentMethods ?? []).length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                    No payments registered in this timeframe
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data?.paymentMethods ?? []).map((pm, i) => {
                      const totalAll = (data?.paymentMethods ?? []).reduce((acc, curr) => acc + Number(curr.total), 0);
                      const pct = totalAll > 0 ? Math.round((Number(pm.total) / totalAll) * 100) : 0;
                      return (
                        <div key={pm.payment_method} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              {pm.payment_method.replace('_', ' ')}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {fmt(pm.total)} <span className="font-normal text-slate-400">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#E04D1B] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Invoices Table */}
      {activeTab === 'invoices' && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Itemized Invoices in Selected Duration
            </CardTitle>
            <span className="text-xs text-slate-500 font-medium">
              Showing {data?.detailedInvoices?.length || 0} records
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Total Amount</th>
                  <th className="px-6 py-3.5 text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.detailedInvoices ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No invoices found for this duration
                    </td>
                  </tr>
                ) : (
                  (data?.detailedInvoices ?? []).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {inv.customer_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {fmt(inv.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#E04D1B]">
                        {fmt(inv.balance_due)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          inv.status === 'partial' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          inv.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          inv.approval_status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        )}>
                          {inv.approval_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Itemized Expenses Table */}
      {activeTab === 'expenses' && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Itemized Expenses in Selected Duration
            </CardTitle>
            <span className="text-xs text-slate-500 font-medium">
              Showing {data?.detailedExpenses?.length || 0} records
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Description / Purpose</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.detailedExpenses ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No expenses logged for this duration
                    </td>
                  </tr>
                ) : (
                  (data?.detailedExpenses ?? []).map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(expense.date || expense.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {expense.description || 'General Disbursement'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                        {expense.payment_method?.replace('_', ' ') || 'Cash / Bank'}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                        {fmt(expense.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
