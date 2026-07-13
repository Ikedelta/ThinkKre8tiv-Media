'use client';

import { useConfirm } from '@/components/providers/ConfirmProvider';

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
  Phone,
  MessageSquare,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { DocumentViewer } from '@/components/DocumentViewer';

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
  const { confirm } = useConfirm();
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

  const smsMutation = useMutation({
    mutationFn: async (payload: { recipients: { phone: string; name?: string }[], message: string }) => {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms_balance'] });
      toast.success('SMS sent to customer!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send SMS');
    }
  });

  const handleSendSMS = async (doc: any) => {
    if (!doc.customer_phone) {
      toast.error('Customer has no phone number on record.');
      return;
    }
    const msg = `Dear ${doc.customer_name}, your invoice (${doc.invoice_number}) from Think Kre8tiv Media for GHS ${doc.total_amount} is ready.`;
    if (await confirm({ title: 'Confirmation', message: `Send SMS to ${doc.customer_phone}? \n\nMessage: "${msg}"`, variant: 'destructive' })) {
      smsMutation.mutate({
        recipients: [{ phone: doc.customer_phone, name: doc.customer_name }],
        message: msg
      });
    }
  };

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
                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors shadow-sm font-medium"
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
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors shadow-sm font-medium"
                                title="Reject"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors shadow-sm font-medium"
                            title="Print/View"
                          >
                            <Printer size={14} />
                          </button>
                          {(session?.user as any)?.role === 'admin' && (
                            <>
                              <Link href={`/admin/invoices/${invoice.id}/edit`}>
                                <button
                                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shadow-sm font-medium"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </Link>
                              <button
                                onClick={async () => {
                                  if (await confirm({ title: 'Confirmation', message: `Delete this invoice?`, variant: 'destructive' }))
                                    deleteMutation.mutate(invoice.id);
                                }}
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors shadow-sm font-medium"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
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
                          onClick={async () => {
                            if (await confirm({ title: 'Confirmation', message: `Delete?`, variant: 'destructive' })) deleteMutation.mutate(invoice.id);
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
        <DocumentViewer
          type="invoice"
          document={invoiceDetails}
          onClose={() => setSelectedInvoiceId(null)}
          onApprove={(id, status) => {
            approveMutation.mutate({ id, approval_status: status });
            setSelectedInvoiceId(null);
          }}
          onSendSMS={() => handleSendSMS(invoiceDetails)}
          isAdmin={(session?.user as any)?.role === 'admin'}
          isSMSPending={smsMutation.isPending}
        />
      )}
    </div>
  );
}
