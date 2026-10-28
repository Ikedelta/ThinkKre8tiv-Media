import React, { useState } from 'react';
import { X, CreditCard, Banknote, Landmark } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  balanceDue: number;
  onClose: () => void;
}

export function RecordPaymentModal({ invoiceId, invoiceNumber, customerName, balanceDue, onClose }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState(balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-details', invoiceId] });
      toast.success('Payment recorded and receipt generated!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Record Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Invoice: {invoiceNumber}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{customerName}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance Due</span>
              <span className="text-lg font-black text-rose-500">GH₵{Number(balanceDue).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Amount to Pay (GH₵)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'bank_transfer' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50'}`}
              >
                <Landmark size={16} /> Bank
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50'}`}
              >
                <Banknote size={16} /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'momo' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50'}`}
              >
                <CreditCard size={16} /> MoMo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Transaction ID, reference, etc."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-slate-300"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => paymentMutation.mutate()}
            disabled={paymentMutation.isPending || !amount || parseFloat(amount) <= 0}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {paymentMutation.isPending ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
