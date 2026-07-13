'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export default function RecordExpensePage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [vendorInput, setVendorInput] = useState('');
  const [vendorId, setVendorId] = useState('');
  
  const [accountInput, setAccountInput] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(''); // Optional for now

  // Fetch existing vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  // Fetch existing accounts
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Expense recorded successfully!');
      router.push('/admin/expenses');
    },
    onError: () => toast.error('Failed to record expense'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Amount is required');
      return;
    }

    createMutation.mutate({
      vendor_id: vendorId || null,
      vendor_name: !vendorId ? vendorInput : null, // Backend auto-creates if new
      account_id: accountId || null,
      account_name: !accountId ? accountInput : null, // Backend auto-creates if new
      account_type: 'expense',
      amount: Number(amount),
      payment_method: paymentMethod,
      date: new Date(date).toISOString(),
      notes,
      receipt_url: receiptUrl || null,
      created_by: session?.user?.name || 'System User'
    });
  };

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setVendorId('');
    } else {
      setVendorId(val);
      setVendorInput('');
    }
  };

  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setAccountId('');
    } else {
      setAccountId(val);
      setAccountInput('');
    }
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all';

  // Standard pre-defined categories for Quick Select
  const defaultExpenseCategories = [
    'Office Supplies', 'Advertising & Marketing', 'Software Subscriptions', 
    'Contractor Payments', 'Equipment Maintenance', 'Utilities', 'Travel & Meals'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/expenses">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Back to Expenses
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Expense</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Log cash outflows and categorize your spending</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            
            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-rose-50 p-6 rounded-xl border border-rose-100">
              <div>
                <label className={cn(labelClass, "text-rose-700")}>Total Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-rose-400">GH₵</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`${inputClass} pl-10 font-bold text-xl text-rose-600 border-rose-200 focus:ring-rose-500`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className={cn(labelClass, "text-rose-700")}>Date of Expense *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputClass} border-rose-200 focus:ring-rose-500`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Payee / Vendor */}
              <div className="space-y-3">
                <label className={labelClass}>Payee / Vendor *</label>
                <select value={vendorId} onChange={handleVendorSelect} className={inputClass}>
                  <option value="">-- Select existing payee --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                  <option value="NEW">+ Add New Payee</option>
                </select>
                
                {(!vendorId || vendorId === 'NEW') && (
                  <input
                    type="text"
                    required
                    placeholder="Enter payee name (e.g., MTN, Facebook)"
                    value={vendorInput}
                    onChange={(e) => {
                      setVendorInput(e.target.value);
                      setVendorId('');
                    }}
                    className={inputClass}
                  />
                )}
              </div>

              {/* Category / Account */}
              <div className="space-y-3">
                <label className={labelClass}>Expense Category *</label>
                <select value={accountId} onChange={handleAccountSelect} className={inputClass}>
                  <option value="">-- Select category --</option>
                  {accounts.filter(a => a.type === 'expense').map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                  <option value="NEW">+ Add New Category</option>
                </select>
                
                {(!accountId || accountId === 'NEW') && (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Office Supplies"
                      value={accountInput}
                      onChange={(e) => {
                        setAccountInput(e.target.value);
                        setAccountId('');
                      }}
                      className={inputClass}
                      list="default-categories"
                    />
                    <datalist id="default-categories">
                      {defaultExpenseCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className={labelClass}>Payment Method</label>
                <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Receipt URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Link to scanned receipt image/PDF"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="What was this expense for?"
                required
              />
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={createMutation.isPending || !amount} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-sm">
            {createMutation.isPending ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
