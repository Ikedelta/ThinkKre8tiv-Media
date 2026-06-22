'use client';

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
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

interface ReportData {
  revenue: {
    total_revenue: number;
    total_billed: number;
    total_outstanding: number;
    total_invoices: number;
    paid_invoices: number;
    unpaid_invoices: number;
    partial_invoices: number;
    overdue_invoices: number;
  };
  expenses: { total_expenses: number };
  customers: { total_customers: number };
  jobs: {
    pending: number;
    design: number;
    printing: number;
    finishing: number;
    delivery: number;
    completed: number;
  };
  monthlyRevenue: { month: string; revenue: number; billed: number }[];
  monthlyExpenses: { month: string; expenses: number }[];
  expenseByCategory: { category: string; total: number }[];
  profit: { gross: number };
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports?type=overview');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const fmt = (n: number | string) => `GH₵${Number(n).toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-72 bg-slate-100 rounded-2xl" />
            ))}
        </div>
      </div>
    );
  }

  const rev = data?.revenue;
  const profitGross = data?.profit.gross ?? 0;
  const isProfitable = profitGross >= 0;

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: fmt(rev?.total_revenue ?? 0),
      sub: `${rev?.paid_invoices ?? 0} paid invoices`,
      icon: DollarSign,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Total Expenses',
      value: fmt(data?.expenses.total_expenses ?? 0),
      sub: 'All categories',
      icon: TrendingDown,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Gross Profit',
      value: fmt(Math.abs(profitGross)),
      sub: isProfitable ? 'Profitable' : 'Net Loss',
      icon: isProfitable ? TrendingUp : TrendingDown,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Outstanding',
      value: fmt(rev?.total_outstanding ?? 0),
      sub: `${Number(rev?.unpaid_invoices ?? 0) + Number(rev?.partial_invoices ?? 0)} invoices pending`,
      icon: FileText,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Total Billed',
      value: fmt(rev?.total_billed ?? 0),
      sub: `${rev?.total_invoices ?? 0} total invoices`,
      icon: FileText,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Customers',
      value: String(data?.customers.total_customers ?? 0),
      sub: 'Active clients',
      icon: Users,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Overdue',
      value: String(rev?.overdue_invoices ?? 0),
      sub: 'Need attention',
      icon: FileText,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
    {
      label: 'Jobs Done',
      value: String(data?.jobs.completed ?? 0),
      sub: `${Number(data?.jobs.printing ?? 0) + Number(data?.jobs.design ?? 0)} in progress`,
      icon: Briefcase,
      color: 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    },
  ];

  const jobsData = [
    { name: 'Pending', value: Number(data?.jobs.pending ?? 0) },
    { name: 'Design', value: Number(data?.jobs.design ?? 0) },
    { name: 'Printing', value: Number(data?.jobs.printing ?? 0) },
    { name: 'Finishing', value: Number(data?.jobs.finishing ?? 0) },
    { name: 'Delivery', value: Number(data?.jobs.delivery ?? 0) },
    { name: 'Completed', value: Number(data?.jobs.completed ?? 0) },
  ].filter((d) => d.value > 0);

  const combinedMonthly = (data?.monthlyRevenue ?? []).map((r) => {
    const expRow = (data?.monthlyExpenses ?? []).find((e) => e.month === r.month);
    return { month: r.month, revenue: Number(r.revenue), expenses: Number(expRow?.expenses ?? 0) };
  });

  const expenseByCategory = (data?.expenseByCategory ?? []).map((e) => ({
    name: e.category.charAt(0).toUpperCase() + e.category.slice(1),
    value: Number(e.total),
  }));

  const invoiceStatus = [
    { name: 'Paid', value: Number(rev?.paid_invoices ?? 0), color: '#0f172a' },
    { name: 'Unpaid', value: Number(rev?.unpaid_invoices ?? 0), color: '#94a3b8' },
    { name: 'Partial', value: Number(rev?.partial_invoices ?? 0), color: '#64748b' },
    { name: 'Overdue', value: Number(rev?.overdue_invoices ?? 0), color: '#cbd5e1' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-black text-slate-800 dark:text-white">
            Financial Reports
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Business performance overview</p>
        </div>
        <div
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-bold border',
            isProfitable
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          {isProfitable ? '✓ Profitable' : '⚠ Net Loss'} — {fmt(Math.abs(profitGross))}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm hover:shadow-md transition-all dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-lg', card.color)}>
                  <card.icon size={16} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-slate-800 dark:text-white">
              Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-64">
            {combinedMonthly.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={combinedMonthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-slate-800 dark:text-white">
              Invoice Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-64">
            {invoiceStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No invoices yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
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
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-slate-800 dark:text-white">
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-64">
            {expenseByCategory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No expense data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Job Workflow */}
        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-slate-800 dark:text-white">
              Production Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {jobsData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No job data
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {jobsData.map((job, i) => {
                  const total = jobsData.reduce((s, j) => s + j.value, 0);
                  const pct = total > 0 ? Math.round((job.value / total) * 100) : 0;
                  return (
                    <div key={job.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-750 dark:text-slate-350">{job.name}</span>
                        <span className="font-black text-slate-800 dark:text-slate-100">
                          {job.value}{' '}
                          <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                        <div
                           className="h-full rounded-full"
                           style={{
                             width: `${pct}%`,
                             backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                           }}
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
  );
}
