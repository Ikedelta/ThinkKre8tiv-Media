'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await fetch(`/api/receipts?id=${id}`);
      if (!res.ok) throw new Error('Failed');
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
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      toast.success('Payment updated successfully!');
      router.push('/admin/payments');
    },
    onError: () => toast.error('Failed to update payment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Amount is required');
      return;
    }
    updateMutation.mutate({
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date: new Date(paymentDate).toISOString(),
      notes
    });
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all';

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading payment details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/payments">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Back to Payments
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Payment</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Update payment {receipt?.receipt_number}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            
            <div>
              <label className={labelClass}>Invoice</label>
              <select disabled value={invoiceId} className={`${inputClass} bg-slate-50 cursor-not-allowed`}>
                <option value={receipt?.invoice_id}>{receipt?.invoice_number} - {receipt?.customer_name}</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Invoice cannot be changed once a payment is recorded.</p>
            </div>

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
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`${inputClass} pl-10 font-bold text-lg`}
                  />
                </div>
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

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/admin/payments">
            <Button type="button" variant="outline" className="font-semibold">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending || !amount} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-sm">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
