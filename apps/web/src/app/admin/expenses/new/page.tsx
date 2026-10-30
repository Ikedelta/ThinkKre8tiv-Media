'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Camera, UploadCloud, FileCheck, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export default function RecordExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [vendorInput, setVendorInput] = useState(searchParams.get('vendor_name') || '');
  const [vendorId, setVendorId] = useState(searchParams.get('vendor_id') || '');
  
  const [accountInput, setAccountInput] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

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
  const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all shadow-xs';

  // Standard pre-defined categories for Quick Select
  const defaultExpenseCategories = [
    'Office Supplies', 'Advertising & Marketing', 'Software Subscriptions', 
    'Contractor Payments', 'Equipment Maintenance', 'Utilities', 'Travel & Meals'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/expenses">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Back to Expenses
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Record Expense</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Log cash outflows and categorize your business spending</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-7 space-y-6">
            
            {/* Amount & Date Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-gradient-to-br from-rose-50/80 to-amber-50/30 p-4 sm:p-6 rounded-xl border border-rose-100">
              <div className="space-y-1.5">
                <label className={cn(labelClass, "text-rose-700")}>Total Amount *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-rose-500">GH₵</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`${inputClass} pl-12 font-black text-xl sm:text-2xl text-rose-600 border-rose-200 focus:ring-rose-500/20 focus:border-rose-500`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className={cn(labelClass, "text-rose-700")}>Date of Expense *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputClass} border-rose-200 focus:ring-rose-500/20 focus:border-rose-500 font-medium`}
                />
              </div>
            </div>

            {/* Payee & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-2">
              {/* Payee / Vendor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Payee / Vendor *</label>
                  <span className="text-[11px] text-slate-400">Recipient of payment</span>
                </div>
                <div className="space-y-2.5">
                  <select 
                    value={vendorId || (vendorInput ? 'NEW' : '')} 
                    onChange={handleVendorSelect} 
                    className={inputClass}
                  >
                    <option value="">-- Select existing payee --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                    <option value="NEW">+ Add New Payee</option>
                  </select>
                  
                  {(!vendorId || vendorId === 'NEW') && (
                    <div className="pt-1">
                      <input
                        type="text"
                        required
                        placeholder="Type payee name (e.g., MTN, Total, Shell)"
                        value={vendorInput}
                        onChange={(e) => {
                          setVendorInput(e.target.value);
                          setVendorId('');
                        }}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category / Account */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Expense Category *</label>
                  <span className="text-[11px] text-slate-400">Accounting head</span>
                </div>
                <div className="space-y-2.5">
                  <select 
                    value={accountId || (accountInput ? 'NEW' : '')} 
                    onChange={handleAccountSelect} 
                    className={inputClass}
                  >
                    <option value="">-- Select category --</option>
                    {accounts.filter(a => a.type === 'expense').map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                    <option value="NEW">+ Add New Category</option>
                  </select>
                  
                  {(!accountId || accountId === 'NEW') && (
                    <div className="pt-1">
                      <input
                        type="text"
                        required
                        placeholder="Type or pick category (e.g., Office Supplies)"
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
                  {/* Option 1: Take Photo / Camera Scan */}
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

                  {/* Option 2: Upload File / Gallery */}
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

            {/* Description Notes */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className={labelClass}>Description / Notes *</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="Details of expense (e.g., A4 Paper reams purchase for factory production)"
                required
              />
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link href="/admin/expenses" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto font-semibold">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || !amount} 
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-sm h-10"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
