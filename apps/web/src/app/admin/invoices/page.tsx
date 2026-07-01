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
        body: JSON.stringify({ id, approval_status, approved_by: 'Admin' }),
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {selectedInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto print:p-0 print:bg-white print:block backdrop-blur-sm">
          {/* A4 Paper Container */}
          <div className="bg-white shadow-2xl w-full max-w-[800px] min-h-[1130px] relative flex flex-col print:shadow-none print:w-full print:max-w-none print:min-h-0 print:m-0 my-auto">
            
            {/* Action Bar - Hidden in print */}
            <div className="absolute top-0 left-0 right-0 -translate-y-full pb-4 flex items-center justify-end gap-3 print:hidden">
              <Button variant="secondary" onClick={() => setSelectedInvoiceId(null)} className="font-semibold bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md">
                Close Preview
              </Button>
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg shadow-blue-900/20">
                Print Invoice
              </Button>
            </div>

            {/* Print Area */}
            <div className="flex-1 flex flex-col text-slate-800">
              {isLoadingDetails ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">Loading invoice details...</div>
              ) : !invoiceDetails ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">Invoice not found</div>
              ) : (
                <>
                  {/* Decorative Top Accent */}
                  <div className="h-4 w-full bg-[#001F3F] print:bg-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />

                  {/* Header Section */}
                  <div className="px-12 pt-10 pb-8 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 mb-4">
                        <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-16 h-16 object-contain" />
                        <div>
                          <h3 className="text-2xl font-black text-[#001F3F] tracking-tight leading-none">THINK KRE8TIV MEDIA</h3>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Premium Print & Branding</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Accra, Ghana</p>
                      <p className="text-xs text-slate-500 font-medium">+233 20 000 0000</p>
                      <p className="text-xs text-slate-500 font-medium">billing@thinkkre8tivmedia.com</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <h1 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-4 print:text-slate-300">INVOICE</h1>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-right min-w-[200px] print:border-slate-300" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <p className="text-sm font-black text-[#001F3F]">{invoiceDetails.invoice_number}</p>
                        <p className="text-xs text-slate-500 mt-1">Date: <span className="font-bold text-slate-700">{invoiceDetails.created_at?.split('T')[0]}</span></p>
                        {invoiceDetails.due_date && (
                          <p className="text-xs text-slate-500 mt-0.5">Due: <span className="font-bold text-slate-700">{invoiceDetails.due_date.split('T')[0]}</span></p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-wider">Created By: {invoiceDetails.created_by || 'System User'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-12 pb-8 grid grid-cols-2 gap-12">
                    {/* Bill To */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                      <p className="text-base font-extrabold text-[#001F3F]">{invoiceDetails.customer_name}</p>
                      {invoiceDetails.customer_company && (
                        <p className="text-sm text-slate-600 font-semibold">{invoiceDetails.customer_company}</p>
                      )}
                      <div className="text-xs text-slate-500 pt-1 space-y-0.5">
                        {invoiceDetails.customer_phone && <p>{invoiceDetails.customer_phone}</p>}
                        {invoiceDetails.customer_email && <p>{invoiceDetails.customer_email}</p>}
                        {invoiceDetails.customer_address && <p>{invoiceDetails.customer_address}</p>}
                      </div>
                    </div>
                    
                    {/* Status Box */}
                    <div className="flex flex-col items-end justify-end space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status:</span>
                        <Badge className={cn('border-none font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-full shadow-none', statusConfig[invoiceDetails.status]?.color)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          {invoiceDetails.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval:</span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{invoiceDetails.approval_status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="px-12 flex-1">
                    <div className="rounded-xl border border-slate-200 overflow-hidden print:border-slate-300">
                      <table className="w-full text-sm">
                        <thead className="bg-[#001F3F] text-white print:bg-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <tr className="text-[10px] font-bold uppercase tracking-widest">
                            <th className="py-3 px-4 text-left">Description</th>
                            <th className="py-3 px-4 text-center w-20">Qty</th>
                            <th className="py-3 px-4 text-right w-32">Unit Price</th>
                            <th className="py-3 px-4 text-right w-32">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {invoiceDetails.items?.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4 font-semibold text-slate-800">{item.description}</td>
                              <td className="py-4 px-4 text-center font-bold text-slate-600">{item.quantity}</td>
                              <td className="py-4 px-4 text-right font-medium text-slate-600">{fmt(item.unit_price)}</td>
                              <td className="py-4 px-4 text-right font-black text-[#001F3F]">{fmt(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Totals */}
                    <div className="flex justify-end pt-6">
                      <div className="w-80 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Subtotal</span>
                          <span className="font-bold text-slate-800">{fmt(invoiceDetails.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">VAT ({invoiceDetails.vat_rate}%)</span>
                          <span className="font-bold text-slate-800">{fmt(invoiceDetails.vat_amount)}</span>
                        </div>
                        {Number(invoiceDetails.discount_amount) > 0 && (
                          <div className="flex justify-between text-sm text-red-500">
                            <span>Discount</span>
                            <span className="font-bold">-{fmt(invoiceDetails.discount_amount)}</span>
                          </div>
                        )}
                        
                        <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100 print:border-slate-300" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-black text-[#001F3F] uppercase tracking-wider">Total Amount</span>
                            <span className="text-xl font-black text-[#001F3F]">{fmt(invoiceDetails.total_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-green-600 font-bold mb-1">
                            <span>Amount Paid</span>
                            <span>{fmt(invoiceDetails.amount_paid)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-2">
                            <span className="font-black text-[#001F3F] uppercase tracking-wider">Balance Due</span>
                            <span className={cn('font-black text-lg', Number(invoiceDetails.balance_due) > 0 ? 'text-red-500' : 'text-green-600')}>
                              {fmt(invoiceDetails.balance_due)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Receipts Payment History */}
                    {invoiceDetails.receipts?.length > 0 && (
                      <div className="mt-10">
                        <h4 className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Payment History</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {invoiceDetails.receipts.map((rec: any) => (
                            <div key={rec.id} className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-lg border border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                              <div>
                                <p className="font-bold text-slate-800">{rec.receipt_number}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{rec.payment_method.replace('_', ' ')} · {rec.payment_date?.split('T')[0]}</p>
                              </div>
                              <span className="font-black text-green-600">{fmt(rec.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-12 py-8 mt-auto border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      {invoiceDetails.notes ? (
                        <div className="max-w-md text-xs text-slate-500">
                          <p className="font-bold text-[#001F3F] uppercase tracking-wider mb-1">Notes & Terms</p>
                          <p className="font-medium leading-relaxed">{invoiceDetails.notes}</p>
                        </div>
                      ) : <div />}
                      
                       <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for your business!</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">Think Kre8tiv Media</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
