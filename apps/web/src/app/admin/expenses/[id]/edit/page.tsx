'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, UploadCloud, FileCheck, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  
  const [vendorInput, setVendorInput] = useState('');
  const [vendorId, setVendorId] = useState('');
  
  const [accountInput, setAccountInput] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?id=${id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (expense) {
      setVendorId(expense.vendor_id || '');
      setAccountId(expense.account_id || '');
      setAmount(Number(expense.amount) || '');
      setPaymentMethod(expense.payment_method || 'cash');
      setDate(expense.date ? expense.date.split('T')[0] : '');
      setNotes(expense.notes || '');
      setReceiptUrl(expense.receipt_url || '');
    }
  }, [expense]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploadingReceipt(true);
      toast.info('Uploading receipt image...');
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) throw new Error('Failed to upload file');
      const data = await res.json();
      const uploadedUrl = data.public_url || data.url;
      setReceiptUrl(uploadedUrl);
      toast.success('Receipt successfully uploaded and attached!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to upload receipt');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      toast.success('Expense updated successfully!');
      router.push('/admin/expenses');
    },
    onError: () => toast.error('Failed to update expense'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Amount is required');
      return;
    }

    updateMutation.mutate({
      vendor_id: vendorId || null,
      vendor_name: !vendorId ? vendorInput : null,
      account_id: accountId || null,
      account_name: !accountId ? accountInput : null,
      amount: Number(amount),
      payment_method: paymentMethod,
      date: new Date(date).toISOString(),
      notes,
      receipt_url: receiptUrl || null
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

  const defaultExpenseCategories = [
    'Office Supplies', 'Advertising & Marketing', 'Software Subscriptions', 
    'Contractor Payments', 'Equipment Maintenance', 'Utilities', 'Travel & Meals'
  ];

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading expense details...</div>;
  }

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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Expense</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Update expense details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            
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

            {/* Payment Method */}
            <div className="pt-3 border-t border-slate-100">
              <div className="space-y-1.5 max-w-md">
                <label className={labelClass}>Payment Method *</label>
                <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                  <option value="mobile_money">Mobile Money (MTN / Telecel / AT)</option>
                  <option value="bank_transfer">Bank Transfer (GCB / Stanbic)</option>
                  <option value="cash">Cash on Hand</option>
                  <option value="credit_card">Debit / Credit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Scan / Take Picture / Upload Physical Receipt */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className={cn(labelClass, "mb-0.5 text-slate-800")}>Physical Receipt / Bill Document</label>
                  <p className="text-xs text-slate-500">Scan or take a picture with your phone camera, or upload a receipt image/PDF</p>
                </div>
                {receiptUrl && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <FileCheck size={14} /> Receipt Attached
                  </span>
                )}
              </div>

              {receiptUrl ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={receiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Scanned Receipt Stored</p>
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 mt-0.5">
                        <Eye size={12} /> View Full Receipt
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptUrl('')}
                    className="text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                  >
                    <X size={13} className="mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="cursor-pointer flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={isUploadingReceipt}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Camera size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Take Photo / Camera Scan</p>
                      <p className="text-[11px] text-slate-500">Snap directly using device camera</p>
                    </div>
                  </label>

                  <label className="cursor-pointer flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/80 hover:bg-slate-100 transition-all">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={isUploadingReceipt}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UploadCloud size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Upload Image or PDF</p>
                      <p className="text-[11px] text-slate-500">Pick from photo library or drive</p>
                    </div>
                  </label>
                </div>
              )}

              {isUploadingReceipt && (
                <p className="text-xs font-semibold text-rose-600 animate-pulse flex items-center gap-1.5">
                  <UploadCloud size={14} className="animate-bounce" /> Uploading and attaching receipt...
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className={labelClass}>Notes / Reference</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="What was this expense for?"
              />
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/admin/expenses">
            <Button type="button" variant="outline" className="font-semibold">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending || !amount} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-sm">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
