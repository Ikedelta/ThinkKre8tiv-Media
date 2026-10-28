'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  company: string;
}
interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const emptyItem: LineItem = { description: '', quantity: 1, unit_price: 0, total_price: 0 };

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [vatRate, setVatRate] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const res = await fetch(`/api/quotations?id=${id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (quotation) {
      setCustomerId(quotation.customer_id || '');
      setVatRate(Number(quotation.vat_rate) || 0);
      setDiscountAmount(Number(quotation.discount_amount) || 0);
      setValidUntil(quotation.valid_until ? quotation.valid_until.split('T')[0] : '');
      setNotes(quotation.notes || '');
      
      if (quotation.items && quotation.items.length > 0) {
        setItems(quotation.items.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
        })));
      }
    }
  }, [quotation]);

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('Quotation updated successfully!');
      router.push('/admin/quotations');
    },
    onError: () => toast.error('Failed to update quotation'),
  });

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total_price =
        Number(updated[index].quantity) * Number(updated[index].unit_price);
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + Number(i.total_price), 0);
  const subtotalAfterDiscount = Math.max(0, subtotal - Number(discountAmount));
  const vatAmount = (subtotalAfterDiscount * vatRate) / 100;
  const total = subtotalAfterDiscount + vatAmount;
  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (items.some((i) => !i.description)) {
      toast.error('All items need a description');
      return;
    }
    updateMutation.mutate({
      customer_id: customerId,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      discount_amount: discountAmount,
      total_amount: total,
      valid_until: validUntil || null,
      notes: notes || null,
      items,
    });
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading quotation details...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quotations">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#001F3F] transition-colors">
            <ArrowLeft size={16} /> Back to Quotations
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[#001F3F] tracking-tight">Edit Quotation</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Update quotation {quotation?.quotation_number}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-slate-100 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-[#001F3F] mb-4">Quotation Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Customer *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#001F3F]">Line Items</h2>
              <button
                type="button"
                onClick={() => setItems([...items, { ...emptyItem }])}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-12 gap-3 mb-2 px-1">
                  <span className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Description
                  </span>
                  <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Qty
                  </span>
                  <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Unit Price
                  </span>
                  <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Total
                  </span>
                  <span className="col-span-1" />
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg"
                    >
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Item description"
                        className="col-span-5 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                        className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        min={0}
                        onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Price"
                      />
                      <div className="col-span-2 font-bold text-[#001F3F] text-sm pl-1">
                        {fmt(item.total_price)}
                      </div>
                      <button
                        type="button"
                        onClick={() => items.length > 1 && setItems(items.filter((_, i) => i !== idx))}
                        disabled={items.length === 1}
                        className="col-span-1 p-1.5 text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border border-slate-100 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-[#001F3F] mb-4">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Terms, conditions, delivery info..."
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-[#001F3F] mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-[#001F3F]">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Discount</span>
                    <input
                      type="number"
                      value={discountAmount}
                      min={0}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span className="font-bold text-red-500">-{fmt(Number(discountAmount))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">VAT (%)</span>
                    <input
                      type="number"
                      value={vatRate}
                      min={0}
                      max={100}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="font-bold text-[#001F3F]">{fmt(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-[#001F3F] border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span className="text-xl">{fmt(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link href="/admin/quotations">
            <Button type="button" variant="outline" className="font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[#001F3F] hover:bg-[#002a52] font-bold px-8"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
