'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Printer, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2, Plus, Download, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { DocumentViewer } from '@/components/DocumentViewer';
import { SendDocumentModal } from '@/components/SendDocumentModal';
import { exportToCsv } from '@/lib/export-csv';

interface Receipt {
  id: string;
  receipt_number: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  approval_status: string;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function ReceiptsPage() {
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [sendModalDoc, setSendModalDoc] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: receipts = [], isLoading } = useQuery<Receipt[]>({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Failed to fetch receipts');
      return res.json();
    },
  });

  const { data: receiptDetails } = useQuery<any>({
    queryKey: ['receipt-details', selectedReceiptId],
    queryFn: async () => {
      if (!selectedReceiptId) return null;
      const res = await fetch(`/api/receipts?id=${selectedReceiptId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!selectedReceiptId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/receipts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Receipt deleted and invoice balance restored');
    },
    onError: () => toast.error('Failed to delete receipt'),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: session?.user?.id || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update receipt approval');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Receipt approval updated!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update receipt approval'),
  });

  const filtered = receipts
    .filter((r) => {
      const matchSearch =
        r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
        r.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        r.customer_name?.toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === 'all' || r.payment_method?.toLowerCase() === methodFilter.toLowerCase();
      const matchApproval = approvalFilter === 'all' || r.approval_status === approvalFilter;
      return matchSearch && matchMethod && matchApproval;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.payment_date || b.created_at || '').getTime() - new Date(a.payment_date || a.created_at || '').getTime();
      if (sortBy === 'date-asc') return new Date(a.payment_date || a.created_at || '').getTime() - new Date(b.payment_date || b.created_at || '').getTime();
      if (sortBy === 'amount-desc') return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortBy === 'amount-asc') return Number(a.amount || 0) - Number(b.amount || 0);
      if (sortBy === 'customer-asc') return (a.customer_name || '').localeCompare(b.customer_name || '');
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Receipts</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-medium">
            Manage payments, print receipts, and issue new receipts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/payments/new">
            <Button className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-sm text-xs uppercase tracking-wider">
              <Plus size={16} className="mr-1.5" /> Issue Receipt / Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by receipt #, invoice # or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="mobile money">Mobile Money</option>
            <option value="cheque">Cheque</option>
          </select>

          {/* Approval Filter */}
          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Approvals</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
            <option value="customer-asc">Customer: A to Z</option>
          </select>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                exportToCsv(filtered, 'Receipts_Export', [
                  { key: 'receipt_number', label: 'Receipt Number' },
                  { key: 'invoice_number', label: 'Invoice Number' },
                  { key: 'customer_name', label: 'Customer' },
                  { key: 'customer_email', label: 'Email' },
                  { key: 'amount', label: 'Amount (GHS)', format: (v) => Number(v || 0).toFixed(2) },
                  { key: 'payment_method', label: 'Payment Method' },
                  { key: 'payment_date', label: 'Payment Date' },
                  { key: 'approval_status', label: 'Approval Status' },
                  { key: 'created_at', label: 'Recorded At' },
                ]);
                toast.success('Receipts exported successfully!');
              } catch (err: any) {
                toast.error(err.message || 'Export failed');
              }
            }}
            className="h-10 px-3 border-slate-200 dark:border-slate-800 font-bold text-xs gap-1.5"
          >
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="border border-slate-100 shadow-none overflow-hidden hidden md:block">
        <div className="w-full">
          <table className="w-full text-left table-auto">
            <thead className="bg-slate-50">
              <tr>
                {['Receipt #', 'Invoice #', 'Customer', 'Amount', 'Method', 'Date', 'Approval', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400 font-semibold">
                    No receipts found
                  </td>
                </tr>
              ) : (
                paginated.map((receipt) => {
                  const dateStr = receipt.payment_date ? receipt.payment_date.split('T')[0] : '—';
                  const isPending = receipt.approval_status === 'pending';
                  const isApproved = receipt.approval_status === 'approved';
                  
                  return (
                    <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-emerald-600 text-sm">
                        {receipt.receipt_number}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-600 text-sm">
                        {receipt.invoice_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#001F3F] text-sm">{receipt.customer_name}</p>
                        <p className="text-xs text-slate-400 font-medium">{receipt.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#001F3F] text-sm">
                        {fmt(receipt.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-slate-100 text-slate-600 border-none uppercase text-[10px] font-bold">
                          {receipt.payment_method?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm font-medium">{dateStr}</td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedReceiptId(receipt.id)}
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors shadow-sm font-medium"
                            title="Print/View"
                          >
                            <Printer size={14} />
                          </button>

                          <button
                            onClick={() => setSendModalDoc(receipt)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors shadow-sm font-medium"
                            title="Send via Email / SMS"
                          >
                            <Mail size={14} />
                          </button>
                          
                          {isPending && (session?.user as any)?.role === 'admin' && (
                            <button
                              onClick={() => approveMutation.mutate({ id: receipt.id, approval_status: 'approved' })}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors shadow-sm"
                              title="Approve"
                            >
                              <CheckCircle2 size={14} />
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
        
        {/* Pagination */}
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
          Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)
        ) : paginated.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No receipts found</div>
        ) : (
          paginated.map((receipt) => {
            const dateStr = receipt.payment_date ? receipt.payment_date.split('T')[0] : '—';
            const isPending = receipt.approval_status === 'pending';
            const isApproved = receipt.approval_status === 'approved';
            
            return (
              <Card key={receipt.id} className="shadow-none border border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-emerald-600 text-sm">{receipt.receipt_number}</p>
                      </div>
                      <p className="font-bold text-[#001F3F] text-sm mt-0.5">
                        {receipt.customer_name}
                      </p>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        {receipt.invoice_number}
                      </p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 border-none uppercase text-[10px] font-bold">
                      {receipt.payment_method?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Amount
                      </p>
                      <p className="font-black text-[#001F3F] text-sm">
                        {fmt(receipt.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Status
                      </p>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                          Pending
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedReceiptId(receipt.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 rounded-lg border border-slate-200"
                    >
                      <Printer size={12} /> Print/View
                    </button>
                    {isPending && (session?.user as any)?.role === 'admin' && (
                      <button
                        onClick={() => approveMutation.mutate({ id: receipt.id, approval_status: 'approved' })}
                        className="py-1.5 px-3 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    )}
                  </div>
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

      {/* Viewer Modal */}
      {selectedReceiptId && receiptDetails && (
        <DocumentViewer
          type="receipt"
          document={receiptDetails}
          onClose={() => setSelectedReceiptId(null)}
          onSendDocument={() => setSendModalDoc(receiptDetails)}
          onApprove={(id, status) => {
            approveMutation.mutate({ id, approval_status: status });
            setSelectedReceiptId(null);
          }}
          isAdmin={(session?.user as any)?.role === 'admin'}
        />
      )}

      {sendModalDoc && (
        <SendDocumentModal
          isOpen={!!sendModalDoc}
          documentType="receipt"
          document={sendModalDoc}
          onClose={() => setSendModalDoc(null)}
        />
      )}
    </div>
  );
}
