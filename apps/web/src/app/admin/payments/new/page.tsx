'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [invoiceId, setInvoiceId] = useState('');
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
  const selectedInvoice = eligibleInvoices.find(inv => inv.id === invoiceId);

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

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all';

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex-1 space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/payments">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Payments
            </button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Payment</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Log a new payment against an existing invoice</p>
        </div>

        <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            
            <div>
              <label className={labelClass}>Select Invoice *</label>
              <select required value={invoiceId} onChange={handleSelectInvoice} className={inputClass}>
                <option value="">-- Choose an unpaid invoice --</option>
                {eligibleInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.customer_name} (Balance: {fmt(inv.balance_due)})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Invoice Total</p>
                  <p className="font-bold text-slate-900">{fmt(selectedInvoice.total_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#FF5722] tracking-wider">Balance Due</p>
                  <p className="font-bold text-[#FF5722]">{fmt(selectedInvoice.balance_due)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Amount Paid *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">GH₵</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={selectedInvoice?.balance_due || undefined}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`${inputClass} pl-10 font-bold text-lg`}
                  />
                </div>
                {selectedInvoice && amount && Number(amount) < Number(selectedInvoice.balance_due) && (
                  <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
                    This will be recorded as a part payment. Remaining balance: {fmt(Number(selectedInvoice.balance_due) - Number(amount))}.
                  </p>
                )}
              </div>
              
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Notes / Reference Number (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="Transaction ID, Cheque Number, etc."
              />
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={createMutation.isPending || !invoiceId || !amount} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-sm">
            {createMutation.isPending ? 'Saving...' : 'Record Payment & Generate Receipt'}
          </Button>
        </div>
        </form>
      </div>

      {/* Live Preview Section */}
      <div className="w-full lg:w-[600px] xl:w-[700px] shrink-0 sticky top-6 self-start hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#001F3F]">Live A4 Preview</h2>
        </div>
        <DocumentViewer inline type="receipt" document={previewDocument} />
      </div>
    </div>
  );
}
