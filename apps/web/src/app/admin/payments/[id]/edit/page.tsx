'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { DocumentViewer } from '@/components/DocumentViewer';

const fmt = (n: number | string) =>
  `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await fetch(`/api/receipts?id=${id}`);
      if (!res.ok) throw new Error('Failed to load payment');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (receipt) {
      setInvoiceId(receipt.invoice_id || '');
      setAmount(Number(receipt.amount) || '');
      setPaymentMethod(receipt.payment_method || 'bank_transfer');
      setPaymentDate(receipt.payment_date ? receipt.payment_date.split('T')[0] : '');
      setNotes(receipt.notes || '');
    }
  }, [receipt]);

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update payment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      toast.success('Payment updated successfully!');
      router.push('/admin/payments');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update payment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Valid payment amount is required');
      return;
    }
    updateMutation.mutate({
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date: new Date(paymentDate).toISOString(),
      notes,
    });
  };

  const previewDocument = {
    status: receipt?.approval_status || 'approved',
    approval_status: receipt?.approval_status || 'approved',
    receipt_number: receipt?.receipt_number || 'REC-PREVIEW',
    created_at: paymentDate,
    customer_name: receipt?.customer_name || 'Customer',
    customer_phone: receipt?.customer_phone || '',
    customer_email: receipt?.customer_email || '',
    invoice_number: receipt?.invoice_number || '-',
    amount: Number(amount) || 0,
    payment_method: paymentMethod,
    notes,
    items: [
      {
        description: `Settlement for Invoice ${receipt?.invoice_number || '-'}`,
        quantity: 1,
        unit_price: Number(amount) || 0,
        total_price: Number(amount) || 0,
      },
    ],
    amount_paid: Number(amount) || 0,
    balance_due: receipt ? Math.max(0, Number(receipt.invoice_total_amount || 0) - Number(amount)) : 0,
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2';
  const inputClass =
    'w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#E04D1B] focus:border-[#E04D1B] outline-none transition-all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/payments">
            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider mb-2">
              <ArrowLeft size={14} /> Back to Payments
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Edit Payment Record
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                receipt?.approval_status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              {receipt?.approval_status === 'approved' ? (
                <>
                  <CheckCircle2 size={12} /> Approved
                </>
              ) : (
                <>
                  <Clock size={12} /> Pending Approval
                </>
              )}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Modify transaction details for receipt <span className="font-bold text-slate-700 dark:text-slate-200">{receipt?.receipt_number}</span>
          </p>
        </div>

        {/* Mobile / Tablet View Switcher Toggle */}
        <div className="flex xl:hidden items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'form'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Edit Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Receipt Preview
          </button>
        </div>
      </div>

      {/* Main Grid: Responsive 2-column on xl+, tabbed on smaller screens */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className={`xl:col-span-6 2xl:col-span-5 space-y-6 ${activeTab === 'preview' ? 'hidden xl:block' : 'block'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-5 sm:p-7 space-y-6">
                
                {/* Associated Invoice & Customer Banner */}
                <div>
                  <label className={labelClass}>Associated Invoice (Locked)</label>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Customer</p>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                        {receipt?.customer_name || 'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{receipt?.customer_email || 'No email'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#E04D1B] tracking-wider">Invoice Reference</p>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                        {receipt?.invoice_number || 'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Total: {fmt(receipt?.invoice_total_amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Paid & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Amount Paid *</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400 pointer-events-none select-none">
                        GH₵
                      </span>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className={`${inputClass} pl-14 font-extrabold text-lg`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className={labelClass}>Payment Method *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={inputClass}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money (MoMo)</option>
                    <option value="cash">Cash Settlement</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className={labelClass}>Notes / Reference Number (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="Transaction ID, Cheque Number, Bank Details"
                  />
                </div>

              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link href="/admin/payments" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto border-slate-300 dark:border-slate-700 font-semibold">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateMutation.isPending || amount === '' || Number(amount) <= 0}
                className="w-full sm:w-auto bg-[#E04D1B] hover:bg-[#c93f12] text-white font-bold px-8 py-2.5 shadow-md transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving Changes...' : 'Save Payment Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className={`xl:col-span-6 2xl:col-span-7 space-y-3 ${activeTab === 'form' ? 'hidden xl:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Updated Receipt Preview
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Updates in real-time as you edit
            </span>
          </div>

          <div className="sticky top-6">
            <DocumentViewer inline type="receipt" document={previewDocument} />
          </div>
        </div>
      </div>
    </div>
  );
}
