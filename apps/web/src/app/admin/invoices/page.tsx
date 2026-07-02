'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_id: string;
  total_amount: number;
  balance_due: number;
  amount_paid: number;
  status: string;
  approval_status: string;
  due_date: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-black font-semibold' },
  partial: { label: 'Partial', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  unpaid: { label: 'Unpaid', color: 'bg-slate-100 text-slate-650 border border-slate-350 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700' },
  overdue: { label: 'Overdue', color: 'bg-slate-100 text-slate-850 border border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600' },
};

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: invoiceDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ['invoice-details', selectedInvoiceId],
    queryFn: async () => {
      if (!selectedInvoiceId) return null;
      const res = await fetch(`/api/invoices?id=${selectedInvoiceId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!selectedInvoiceId,
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: session?.user?.id || null }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(
        vars.approval_status === 'approved' ? '✅ Invoice approved!' : 'Invoice rejected'
      );
    },
    onError: () => toast.error('Failed to update approval'),
  });

  const pendingInvoices = invoices.filter((i) => i.approval_status === 'pending');
  const displayInvoices = activeTab === 'pending' ? pendingInvoices : invoices;

  const filtered = displayInvoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Invoices</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-medium">
            Manage and track customer billing
          </p>
        </div>
        <Link href="/admin/invoices/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full sm:w-auto">
            <Plus size={16} className="mr-2" /> New Invoice
          </Button>
        </Link>
      </div>

      {/* Pending alert */}
      {pendingInvoices.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <Clock size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-800 flex-1">
            {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} waiting for
            admin approval
          </p>
          <button
            onClick={() => {
              setActiveTab('pending');
              setPage(1);
            }}
            className="text-xs font-bold text-amber-700 hover:underline"
          >
            Review now →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {[
          { key: 'all', label: `All (${invoices.length})` },
          { key: 'pending', label: `Pending Approval (${pendingInvoices.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key as 'all' | 'pending');
              setPage(1);
            }}
            className={cn(
              'px-4 py-1.5 text-xs font-bold rounded-md transition-all',
              activeTab === key
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = invoices.filter((i) => i.status === status).length;
          const total = invoices
            .filter((i) => i.status === status)
            .reduce((s, i) => s + Number(i.total_amount), 0);
          return (
            <Card key={status} className="border border-slate-100 dark:border-slate-800 shadow-none dark:bg-slate-900">
              <CardContent className="p-4">
                <Badge
                  className={cn(
                    'border-none font-bold uppercase text-[10px] tracking-wider mb-2',
                    cfg.color
                  )}
                >
                  {cfg.label}
                </Badge>
                <p className="text-xl font-black text-slate-800 dark:text-white">{count}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{fmt(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search by invoice # or customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium dark:bg-slate-900 dark:border-slate-800"
        />
      </div>

      {/* Desktop Table */}
      <Card className="border border-slate-100 shadow-none overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Invoice #',
                  'Customer',
                  'Amount',
                  'Balance',
                  'Due Date',
                  'Status',
                  'Approval',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded" />
                      </td>
                    </tr>
                  ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400 font-semibold">
                    No invoices found
                  </td>
                </tr>
              ) : (
                paginated.map((invoice) => {
                  const cfg = statusConfig[invoice.status] || {
                    label: invoice.status,
                    color: 'bg-slate-100 text-slate-600',
                  };
                  const dateStr = invoice.due_date ? invoice.due_date.split('T')[0] : '—';
                  const isPending = invoice.approval_status === 'pending';
                  const isApproved = invoice.approval_status === 'approved';
                  return (
                    <tr
                      key={invoice.id}
                      className={cn(
                        'hover:bg-slate-50/50 transition-colors group',
                        isPending && 'bg-amber-50/20'
                      )}
                    >
                      <td className="px-4 py-3 font-bold text-blue-600 text-sm">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#001F3F] text-sm">{invoice.customer_name}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          {invoice.customer_email}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#001F3F] text-sm">
                        {fmt(invoice.total_amount)}
                      </td>
                      <td className="px-4 py-3 font-bold text-sm">
                        <span
                          className={
                            Number(invoice.balance_due) > 0 ? 'text-red-500' : 'text-green-600'
                          }
                        >
                          {fmt(invoice.balance_due)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm font-medium">{dateStr}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            'border-none font-bold uppercase text-[10px] tracking-wider',
                            cfg.color
                          )}
                        >
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <Clock size={9} /> Pending
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={9} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            <XCircle size={9} /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          {isPending && (session?.user as any)?.role === 'admin' && (
                            <>
                              <button
                                onClick={() =>
                                  approveMutation.mutate({
                                    id: invoice.id,
                                    approval_status: 'approved',
                                  })
                                }
                                className="p-1.5 hover:bg-green-50 text-slate-300 hover:text-green-600 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  approveMutation.mutate({
                                    id: invoice.id,
                                    approval_status: 'rejected',
                                  })
                                }
                                className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                            title="Print/View"
                          >
                            <Printer size={14} />
                          </button>
                          {(session?.user as any)?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this invoice?'))
                                  deleteMutation.mutate(invoice.id);
                              }}
                              className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
          <p className="text-xs font-semibold text-slate-400">
            {filtered.length === 0
              ? 'No results'
              : `${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 font-bold',
                  page === p && 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-750'
                )}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)
        ) : paginated.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No invoices found</div>
        ) : (
          paginated.map((invoice) => {
            const cfg = statusConfig[invoice.status] || {
              label: invoice.status,
              color: 'bg-slate-100 text-slate-600',
            };
            const isPending = invoice.approval_status === 'pending';
            return (
              <Card
                key={invoice.id}
                className={cn(
                  'shadow-none',
                  isPending ? 'border border-amber-200' : 'border border-slate-100'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-blue-600 text-sm">{invoice.invoice_number}</p>
                        {isPending && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-[#001F3F] text-sm mt-0.5">
                        {invoice.customer_name}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'border-none font-bold uppercase text-[10px] tracking-wider',
                        cfg.color
                      )}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Total
                      </p>
                      <p className="font-black text-[#001F3F] text-sm">
                        {fmt(invoice.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Balance
                      </p>
                      <p
                        className={cn(
                          'font-black text-sm',
                          Number(invoice.balance_due) > 0 ? 'text-red-500' : 'text-green-600'
                        )}
                      >
                        {fmt(invoice.balance_due)}
                      </p>
                    </div>
                  </div>
                  {isPending && (session?.user as any)?.role === 'admin' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          approveMutation.mutate({ id: invoice.id, approval_status: 'approved' })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        onClick={() =>
                          approveMutation.mutate({ id: invoice.id, approval_status: 'rejected' })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 rounded-lg border border-slate-200"
                      >
                        <Printer size={12} /> Print/View
                      </button>
                      {(session?.user as any)?.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete?')) deleteMutation.mutate(invoice.id);
                          }}
                          className="py-1.5 px-3 text-xs font-bold bg-red-50 text-red-500 rounded-lg border border-red-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="flex items-center px-3 text-sm font-bold text-slate-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>

      {selectedInvoiceId && invoiceDetails && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-start overflow-hidden print:bg-white print:block backdrop-blur-sm">
          
          {/* Action buttons (Sticky Top Bar) */}
          <div className="w-full bg-[#0B0F19] border-b border-slate-800 p-4 flex justify-end gap-3 shrink-0 print:hidden shadow-md z-50">
              {invoiceDetails?.approval_status === 'pending' && (session?.user as any)?.role === 'admin' && (
                <>
                  <Button 
                    onClick={() => {
                      approveMutation.mutate({ id: selectedInvoiceId!, approval_status: 'approved' });
                      setSelectedInvoiceId(null);
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold px-6"
                  >
                    <CheckCircle2 size={16} className="mr-2" /> Approve
                  </Button>
                  <Button 
                    onClick={() => {
                      approveMutation.mutate({ id: selectedInvoiceId!, approval_status: 'rejected' });
                      setSelectedInvoiceId(null);
                    }} 
                    className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 font-bold px-6"
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </Button>
                  <div className="w-px h-8 bg-slate-200/20 mx-1"></div>
                </>
              )}
              <Button variant="secondary" onClick={() => setSelectedInvoiceId(null)} className="font-semibold bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md">
                Close Preview
              </Button>
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg shadow-blue-900/20">
                Print Invoice
              </Button>
            </div>

            {/* Scrollable Document Area */}
            <div className="flex-1 w-full overflow-auto p-4 sm:p-8 flex justify-center">
              
              {/* A4 Paper Container */}
              <div className="bg-white shadow-2xl w-full max-w-[800px] relative flex flex-col shrink-0 print:shadow-none print:w-full print:max-w-none print:min-w-0 print:min-h-0 print:m-0 my-auto rounded-xl sm:rounded-none overflow-hidden sm:overflow-visible">
                
                {/* Print Area */}
                <div className="flex-1 flex flex-col text-slate-800 relative bg-white">
              {isLoadingDetails ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">Loading invoice details...</div>
              ) : !invoiceDetails ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">Invoice not found</div>
              ) : (
                <>
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
                    <img src="/logo.png" alt="Watermark" className="w-[600px] h-[600px] object-contain grayscale" />
                  </div>

                  {/* Header Section */}
                  <div className="relative z-10">
                    <div className="h-2 w-full bg-gradient-to-r from-[#001F3F] to-[#FF5722] print:bg-[#001F3F]"></div>
                    <div className="p-6 sm:p-12 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 print:flex-row print:p-12">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain print:w-20 print:h-20" />
                        <div>
                          <h3 className="text-xl sm:text-3xl font-black tracking-tight text-[#001F3F] leading-none mb-3 sm:mb-4 print:text-3xl uppercase">THINK KRE8TIV MEDIA</h3>
                          <div className="space-y-0.5 text-[9px] sm:text-[10px] text-slate-400 font-medium print:text-[10px]">
                            <p>OSU haramani Sport complex</p>
                            <p>+233 20 000 0000 | billing@thinkkre8tivmedia.com</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto print:text-right print:items-end">
                        <h1 className="text-3xl sm:text-4xl font-black text-[#FF5722] uppercase tracking-widest mb-4 sm:mb-6 print:text-[#FF5722] print:text-4xl" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>INVOICE</h1>
                        <div className="space-y-2 sm:space-y-3 bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-xl w-full sm:w-64 text-left print:bg-slate-50 print:w-64" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No.</span>
                            <span className="text-sm font-bold text-[#001F3F]">{invoiceDetails.invoice_number}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                            <span className="text-xs font-bold text-slate-700">{invoiceDetails.created_at?.split('T')[0]}</span>
                          </div>
                          {invoiceDetails.due_date && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                              <span className="text-xs font-bold text-[#FF5722]">{invoiceDetails.due_date.split('T')[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 sm:px-12 pb-6 sm:pb-8 border-b border-slate-100 mb-6 sm:mb-8 mx-6 sm:mx-12 mt-2 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 print:px-12 print:mx-12 print:flex-row">
                    {/* Bill To */}
                    <div className="space-y-2 w-full sm:w-auto">
                      <p className="text-[10px] font-black text-[#FF5722] uppercase tracking-widest mb-2 sm:mb-3">Billed To</p>
                      <p className="text-lg sm:text-xl font-extrabold text-[#001F3F] leading-tight mb-1 print:text-xl">{invoiceDetails.customer_name}</p>
                      {invoiceDetails.customer_company && (
                        <p className="text-xs sm:text-sm text-[#FF5722] font-black tracking-wide uppercase mb-1 sm:mb-2">{invoiceDetails.customer_company}</p>
                      )}
                      <div className="text-xs text-slate-500 font-medium space-y-1">
                        {invoiceDetails.customer_phone && <p>{invoiceDetails.customer_phone}</p>}
                        {invoiceDetails.customer_email && <p className="break-all sm:break-normal">{invoiceDetails.customer_email}</p>}
                        {invoiceDetails.customer_address && <p className="max-w-full sm:max-w-[300px] leading-relaxed pt-1 print:max-w-[300px]">{invoiceDetails.customer_address}</p>}
                      </div>
                    </div>
                    
                    {/* Status Box */}
                    <div className="flex flex-col items-start sm:items-end justify-start w-full sm:w-auto print:items-end">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 w-full sm:w-64 shadow-sm print:border-slate-200 print:w-64" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                          <Badge className={cn('border-none font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-md shadow-none', statusConfig[invoiceDetails.status]?.color)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            {invoiceDetails.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount Due</span>
                          <span className={cn('text-lg font-black', Number(invoiceDetails.balance_due) > 0 ? 'text-[#FF5722]' : 'text-emerald-600')}>
                            {fmt(invoiceDetails.balance_due)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="px-4 sm:px-12 flex-1 relative z-10 print:px-12 overflow-x-auto">
                    <table className="w-full text-sm mb-6 sm:mb-8 min-w-[400px]">
                      <thead className="border-b-2 border-slate-800">
                        <tr className="text-xs font-black text-slate-800 uppercase tracking-widest">
                          <th className="py-4 px-3 text-left">Description</th>
                          <th className="py-4 px-3 text-center w-24">Qty</th>
                          <th className="py-4 px-3 text-right w-36">Unit Price</th>
                          <th className="py-4 px-3 text-right w-40">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceDetails.items?.map((item: any, i: number) => (
                          <tr key={i} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-3 font-bold text-slate-700">{item.description}</td>
                            <td className="py-4 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                            <td className="py-4 px-3 text-right font-medium text-slate-600">{fmt(item.unit_price)}</td>
                            <td className="py-4 px-3 text-right font-black text-[#001F3F]">{fmt(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary Totals */}
                    <div className="flex justify-end pt-4">
                      <div className="w-full sm:w-[350px] print:w-[350px]">
                        <div className="space-y-3 sm:space-y-4 px-2 sm:px-3 pb-4 sm:pb-5 border-b border-slate-100">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Subtotal</span>
                            <span className="font-bold text-slate-800">{fmt(invoiceDetails.subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">VAT ({invoiceDetails.vat_rate}%)</span>
                            <span className="font-bold text-slate-800">{fmt(invoiceDetails.vat_amount)}</span>
                          </div>
                          {Number(invoiceDetails.discount_amount) > 0 && (
                            <div className="flex justify-between items-center text-sm text-[#FF5722]">
                              <span className="font-bold uppercase tracking-widest text-[11px]">Discount</span>
                              <span className="font-bold">-{fmt(invoiceDetails.discount_amount)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-[#001F3F] rounded-xl p-6 mt-5 text-white shadow-lg print:bg-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-black uppercase tracking-widest text-blue-200">Total Amount</span>
                            <span className="text-2xl font-black">{fmt(invoiceDetails.total_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold mb-3 border-t border-white/10 pt-4">
                            <span className="text-[11px] font-black uppercase tracking-widest text-blue-200">Amount Paid</span>
                            <span className="text-emerald-400">{fmt(invoiceDetails.amount_paid)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[11px] font-black uppercase tracking-widest text-blue-200">Balance Due</span>
                            <span className={cn('font-black text-lg', Number(invoiceDetails.balance_due) > 0 ? 'text-[#FF5722]' : 'text-emerald-400')}>
                              {fmt(invoiceDetails.balance_due)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Receipts Payment History */}
                    {invoiceDetails.receipts?.length > 0 && (
                      <div className="mt-8 sm:mt-12">
                        <h4 className="text-[11px] font-black text-[#001F3F] uppercase tracking-widest mb-4 border-b-2 border-slate-100 pb-2 inline-block">Payment History</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {invoiceDetails.receipts.map((rec: any) => (
                            <div key={rec.id} className="flex justify-between items-center text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm print:bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                              <div>
                                <p className="font-black text-[#001F3F]">{rec.receipt_number}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  {rec.payment_method.replace('_', ' ')} · {rec.payment_date?.split('T')[0]}
                                </p>
                              </div>
                              <span className="font-black text-emerald-600 text-lg">{fmt(rec.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 sm:px-12 py-8 sm:py-10 mt-8 sm:mt-12 bg-slate-50 flex flex-col justify-between border-t border-slate-200 print:bg-slate-50 print:px-12 print:mt-12" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 sm:gap-0 print:flex-row">
                      <div className="max-w-full sm:max-w-md space-y-6 print:max-w-md">
                        {invoiceDetails.notes && (
                          <div className="text-xs text-slate-500 bg-white p-4 rounded-lg border border-slate-200 print:border-slate-300">
                            <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest mb-1.5">Notes & Terms</p>
                            <p className="font-medium leading-relaxed">{invoiceDetails.notes}</p>
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest mb-1.5">Payment Instructions</p>
                          <p className="font-medium">Please include the Invoice Number when making payment.</p>
                          <p className="font-medium mt-1">Mobile Money: <span className="font-bold text-slate-700">020 000 0000</span> (Think Kre8tiv Media)</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex flex-col items-start sm:items-end print:items-end print:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By</p>
                        <div className="relative mt-2 mb-1">
                          <img src="/logo.png" alt="Signature Stamp" className="h-12 object-contain opacity-20" />
                        </div>
                        <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest">Think Kre8tiv Media</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
