'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  X,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Receipt {
  id: string;
  receipt_number: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string;
  approval_status: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  balance_due: number;
  total_amount: number;
}

const methodConfig: Record<string, { label: string; color: string }> = {
  bank_transfer: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700' },
  cash: { label: 'Cash', color: 'bg-green-100 text-green-700' },
  card: { label: 'Card', color: 'bg-purple-100 text-purple-700' },
  mobile: { label: 'Mobile Money', color: 'bg-teal-100 text-teal-700' },
  cheque: { label: 'Cheque', color: 'bg-orange-100 text-orange-700' },
};

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery<Receipt[]>({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: receiptDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ['receipt-details', selectedReceiptId],
    queryFn: async () => {
      if (!selectedReceiptId) return null;
      const res = await fetch(`/api/receipts?id=${selectedReceiptId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!selectedReceiptId,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const unpaidInvoices = invoices.filter((i) => Number(i.balance_due) > 0);
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: 'Admin' }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(
        vars.approval_status === 'approved'
          ? '✅ Receipt approved & invoice updated!'
          : 'Receipt rejected'
      );
    },
    onError: () => toast.error('Failed to update approval'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded — pending admin approval');
      closeForm();
    },
    onError: () => toast.error('Failed to create receipt'),
  });

  const closeForm = () => {
    setShowForm(false);
    setSelectedInvoiceId('');
    setAmount('');
    setPaymentMethod('bank_transfer');
    setPaymentDate('');
    setNotes('');
  };

  const handleInvoiceChange = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) setAmount(String(inv.balance_due));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) {
      toast.error('Select invoice and enter amount');
      return;
    }
    if (!selectedInvoice) return;
    const payload: Record<string, unknown> = {
      invoice_id: selectedInvoiceId,
      customer_id: selectedInvoice.customer_id,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      notes,
    };
    if (paymentDate) payload.payment_date = paymentDate;
    createMutation.mutate(payload);
  };

  const filtered = receipts.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const pendingReceipts = receipts.filter((r) => r.approval_status === 'pending');

  const totalReceived = receipts.reduce((sum, r) => sum + Number(r.amount), 0);
  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#001F3F] tracking-tight">Receipts</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-medium">
            Record payments and generate receipts
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#001F3F] hover:bg-[#002a52] font-bold w-full sm:w-auto"
        >
          <Plus size={16} className="mr-2" /> Record Payment
        </Button>
      </div>

      {/* Pending alert */}
      {pendingReceipts.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <Clock size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-800 flex-1">
            {pendingReceipts.length} receipt{pendingReceipts.length !== 1 ? 's' : ''} awaiting admin
            approval
          </p>
          <p className="text-xs text-amber-600 font-medium">Approve to update invoice balances</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <FileText size={18} />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Receipts
            </p>
            <p className="text-2xl font-black text-[#001F3F]">{receipts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Received
            </p>
            <p className="text-2xl font-black text-green-600">{fmt(totalReceived)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                <AlertCircle size={18} />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pending Invoices
            </p>
            <p className="text-2xl font-black text-orange-500">{unpaidInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search receipts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
      </div>

      {/* Desktop Table */}
      <Card className="border border-slate-100 shadow-none overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Receipt #',
                  'Invoice #',
                  'Customer',
                  'Amount',
                  'Method',
                  'Date',
                  'Approval',
                  '',
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
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded" />
                      </td>
                    </tr>
                  ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400 font-bold">
                    No receipts found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isPending = r.approval_status === 'pending';
                  const isApproved = r.approval_status === 'approved';
                  const dateStr = r.payment_date ? r.payment_date.split('T')[0] : '—';
                  const methodCfg = methodConfig[r.payment_method] || {
                    label: r.payment_method,
                    color: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'hover:bg-slate-50/50 transition-colors',
                        isPending && 'bg-amber-50/20'
                      )}
                    >
                      <td className="px-4 py-3 font-bold text-green-600 text-sm">
                        {r.receipt_number}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-600 text-sm">
                        {r.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-sm">{r.customer_name}</p>
                        <p className="text-xs text-slate-500">{r.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-[#001F3F] text-sm">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`border-none text-[10px] font-bold uppercase tracking-wider ${methodCfg.color}`}
                        >
                          {methodCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm font-medium">{dateStr}</td>
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
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  approveMutation.mutate({ id: r.id, approval_status: 'approved' })
                                }
                                className="p-1.5 hover:bg-green-50 text-slate-300 hover:text-green-600 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  approveMutation.mutate({ id: r.id, approval_status: 'rejected' })
                                }
                                className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedReceiptId(r.id)}
                            className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-colors"
                            title="Print/View"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">No receipts found</div>
        ) : (
          filtered.map((r) => {
            const dateStr = r.payment_date ? r.payment_date.split('T')[0] : '—';
            const methodCfg = methodConfig[r.payment_method] || {
              label: r.payment_method,
              color: 'bg-slate-100 text-slate-700',
            };
            return (
              <Card
                key={r.id}
                onClick={() => setSelectedReceiptId(r.id)}
                className="border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-green-600 text-sm">{r.receipt_number}</p>
                      <p className="text-xs text-blue-600 font-bold">{r.invoice_number}</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{r.customer_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-black text-[#001F3F] text-base">{fmt(r.amount)}</p>
                      <Badge
                        className={`border-none text-[10px] font-bold uppercase tracking-wider mt-1 ${methodCfg.color}`}
                      >
                        {methodCfg.label}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-montserrat font-black text-lg text-[#001F3F]">Record Payment</h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Invoice *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select an invoice...</option>
                  {unpaidInvoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.invoice_number} — {i.customer_name} (Bal: {fmt(i.balance_due)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="bg-blue-50 rounded-xl p-3 text-sm">
                  <p className="text-blue-800 font-bold">{selectedInvoice.customer_name}</p>
                  <p className="text-blue-600">
                    Balance Due: <strong>{fmt(selectedInvoice.balance_due)}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Amount (GH₵) *
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  min={1}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {Object.entries(methodConfig).map(([val, { label }]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Payment Date
                </label>
                <input
                  type="datetime-local"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Payment notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Processing...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedReceiptId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:relative print:z-0 print:h-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden print:shadow-none print:rounded-none print:w-full">
            {/* Modal header (hidden in print) */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 print:hidden bg-slate-50">
              <h2 className="font-extrabold text-base text-[#001F3F]">Receipt Details</h2>
              <button
                onClick={() => setSelectedReceiptId(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Print Area */}
            <div className="p-8 print:p-0 space-y-6 text-slate-800">
              {isLoadingDetails ? (
                <div className="py-20 text-center text-slate-400 font-semibold">Loading receipt details...</div>
              ) : !receiptDetails ? (
                <div className="py-20 text-center text-slate-400 font-semibold">Receipt not found</div>
              ) : (
                <>
                  {/* Top Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#001F3F] tracking-tight">THINK KRE8TIVE</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">Premium Print & Branding Solutions</p>
                      <p className="text-[10px] text-slate-400">Accra, Ghana · +233 20 000 0000</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1 print:border print:border-green-200">
                        Payment Receipt
                      </span>
                      <p className="text-base font-black text-green-600">{receiptDetails.receipt_number}</p>
                      <p className="text-[10px] text-slate-400">Date: {receiptDetails.payment_date?.split('T')[0] || receiptDetails.created_at?.split('T')[0]}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-5 text-sm">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Received From</p>
                      <p className="font-extrabold text-[#001F3F]">{receiptDetails.customer_name}</p>
                      {receiptDetails.customer_company && (
                        <p className="text-xs text-slate-500 font-semibold">{receiptDetails.customer_company}</p>
                      )}
                      {receiptDetails.customer_email && (
                        <p className="text-xs text-slate-400">{receiptDetails.customer_email}</p>
                      )}
                      {receiptDetails.customer_phone && (
                        <p className="text-xs text-slate-400">{receiptDetails.customer_phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                      <Badge className="border-none font-bold uppercase text-[9px] tracking-wider mb-2 shadow-none px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {receiptDetails.payment_method?.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs text-slate-400">Linked Invoice: <strong className="text-blue-600">{receiptDetails.invoice_number}</strong></p>
                    </div>
                  </div>

                  {/* Payment Value Display */}
                  <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100 text-center space-y-1">
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Amount Received</p>
                    <p className="text-3xl font-black text-green-600 print:text-green-700 border-b-4 border-double border-green-200 pb-2 inline-block px-8">{fmt(receiptDetails.amount)}</p>
                  </div>

                  {/* Summary Totals */}
                  <div className="space-y-2.5 text-sm border-b border-slate-100 pb-5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Invoice Total</span>
                      <span className="font-bold text-slate-700">{fmt(receiptDetails.invoice_total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Invoice Amount Paid</span>
                      <span className="font-bold text-green-600">{fmt(receiptDetails.invoice_amount_paid)}</span>
                    </div>
                    <div className="flex justify-between font-black border-t border-slate-200 pt-2 text-slate-800">
                      <span>Remaining Balance Due</span>
                      <span className={Number(receiptDetails.invoice_balance_due) > 0 ? 'text-red-500' : 'text-green-600'}>
                        {fmt(receiptDetails.invoice_balance_due)}
                      </span>
                    </div>
                  </div>

                  {/* Signature / Stamp space for printing */}
                  <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs">
                    <div className="text-center pt-8 border-t border-slate-200 w-48 mx-auto">
                      <p className="font-bold text-slate-600">Authorized Signature</p>
                    </div>
                    <div className="text-center pt-8 border-t border-slate-200 w-48 mx-auto">
                      <p className="font-bold text-slate-600">Company Stamp</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {receiptDetails.notes && (
                    <div className="text-xs text-slate-400 pt-2">
                      <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                      <p className="font-medium leading-relaxed">{receiptDetails.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions (hidden in print) */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 print:hidden bg-slate-50">
              <Button variant="outline" onClick={() => setSelectedReceiptId(null)} className="font-semibold">
                Close
              </Button>
              <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 font-bold px-6">
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
