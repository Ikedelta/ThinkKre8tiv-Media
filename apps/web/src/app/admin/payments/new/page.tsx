'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { DocumentViewer } from '@/components/DocumentViewer';

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RecordPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryInvoiceId = searchParams?.get('invoice_id') || '';
  const [invoiceId, setInvoiceId] = useState(queryInvoiceId);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  // Only show unpaid or partial invoices that are approved
  const eligibleInvoices = invoices.filter(inv => inv.approval_status === 'approved' && ['unpaid', 'partial'].includes(inv.status));
  const selectedInvoice = eligibleInvoices.find(inv => inv.id === invoiceId) || invoices.find(inv => inv.id === invoiceId);

  useEffect(() => {
    if (queryInvoiceId && invoices.length > 0) {
      const match = invoices.find(i => i.id === queryInvoiceId);
      if (match) {
        setInvoiceId(queryInvoiceId);
        if (match.balance_due) {
          setAmount(Number(match.balance_due));
        }
      }
    }
  }, [queryInvoiceId, invoices]);

  // Auto-fill amount with balance due when an invoice is selected
  const handleSelectInvoice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setInvoiceId(id);
    const inv = eligibleInvoices.find(i => i.id === id);
    if (inv && inv.balance_due) {
      setAmount(inv.balance_due);
    } else {
      setAmount('');
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      router.push('/admin/payments');
    },
    onError: () => toast.error('Failed to record payment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) {
      toast.error('Invoice and amount are required');
      return;
    }
    createMutation.mutate({
      invoice_id: invoiceId,
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date: new Date(paymentDate).toISOString(),
      notes
    });
  };

  const previewDocument = {
    status: 'draft',
    receipt_number: 'REC-PREVIEW',
    created_at: paymentDate,
    customer_name: selectedInvoice?.customer_name || 'Select an invoice',
    customer_phone: selectedInvoice?.customer_phone || '',
    customer_email: selectedInvoice?.customer_email || '',
    invoice_number: selectedInvoice?.invoice_number || '-',
    amount: Number(amount) || 0,
    payment_method: paymentMethod,
    notes,
    items: [{ description: `Payment for Invoice ${selectedInvoice?.invoice_number || '-'}`, quantity: 1, unit_price: Number(amount) || 0, total_price: Number(amount) || 0 }],
    amount_paid: Number(amount) || 0,
    balance_due: selectedInvoice ? Number(selectedInvoice.balance_due) - (Number(amount) || 0) : 0,
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#E04D1B] focus:border-[#E04D1B] outline-none transition-all';

  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/payments">
            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider mb-2">
              <ArrowLeft size={14} /> Back to Payments
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Record Payment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Log a new settlement against an existing invoice</p>
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
            Payment Form
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
            Live Receipt Preview
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
                
                {/* Select Invoice */}
                <div>
                  <label className={labelClass}>Select Invoice *</label>
                  <select required value={invoiceId} onChange={handleSelectInvoice} className={inputClass}>
                    <option value="">-- Choose an unpaid invoice --</option>
                    {eligibleInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customer_name} (Balance: {fmt(inv.balance_due)})
                      </option>
                    ))}
                    {/* Fallback if current invoiceId is not in eligible (e.g. fully paid or direct link) */}
                    {selectedInvoice && !eligibleInvoices.some(i => i.id === selectedInvoice.id) && (
                      <option value={selectedInvoice.id}>
                        {selectedInvoice.invoice_number} - {selectedInvoice.customer_name} (Status: {selectedInvoice.status})
                      </option>
                    )}
                  </select>
                </div>

                {/* Selected Invoice Summary Banner */}
                {selectedInvoice && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Invoice Total</p>
                      <p className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">{fmt(selectedInvoice.total_amount)}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{selectedInvoice.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#E04D1B] tracking-wider">Balance Due</p>
                      <p className="font-extrabold text-base sm:text-lg text-[#E04D1B]">{fmt(selectedInvoice.balance_due)}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Inv #{selectedInvoice.invoice_number}</p>
                    </div>
                  </div>
                )}

                {/* Amount and Date */}
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
                        max={selectedInvoice?.balance_due ? Number(selectedInvoice.balance_due) : undefined}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className={`${inputClass} pl-14 font-extrabold text-lg`}
                        placeholder="0.00"
                      />
                    </div>
                    {selectedInvoice && amount !== '' && Number(amount) < Number(selectedInvoice.balance_due) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2 flex items-center gap-1">
                        Part payment. Remaining: {fmt(Number(selectedInvoice.balance_due) - Number(amount))}.
                      </p>
                    )}
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
                  <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
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
                    placeholder="e.g. Transaction ID, Bank Branch, Cheque #, MoMo Reference"
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
                disabled={createMutation.isPending || !invoiceId || amount === '' || Number(amount) <= 0} 
                className="w-full sm:w-auto bg-[#E04D1B] hover:bg-[#c93f12] text-white font-bold px-8 py-2.5 shadow-md transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving Settlement...' : 'Record Payment & Issue Receipt'}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className={`xl:col-span-6 2xl:col-span-7 space-y-3 ${activeTab === 'form' ? 'hidden xl:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Live Receipt Preview
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Updates in real-time as you enter details
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
