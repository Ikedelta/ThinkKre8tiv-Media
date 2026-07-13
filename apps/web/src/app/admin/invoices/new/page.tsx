'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { DocumentViewer } from '@/components/DocumentViewer';

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

export default function NewInvoicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams?.get('customer_id') || '');
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem, description: searchParams?.get('description') || '' }]);
  const [vatRate, setVatRate] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invoice created successfully!');
      router.push('/admin/invoices');
    },
    onError: () => toast.error('Failed to create invoice'),
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

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      updateItem(index, 'description', product.name);
      updateItem(index, 'unit_price', product.default_price);
    }
  };

  const subtotal = items.reduce((s, i) => s + Number(i.total_price), 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount - Number(discountAmount);
  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  const selectedCustomer = customers.find(c => c.id === customerId);

  const previewDocument = {
    status: 'draft',
    invoice_number: 'INV-PREVIEW',
    created_at: new Date().toISOString(),
    due_date: dueDate,
    customer_name: selectedCustomer?.name || 'Select a customer',
    customer_phone: (selectedCustomer as any)?.phone || '',
    customer_email: (selectedCustomer as any)?.email || '',
    customer_address: selectedCustomer?.company || '',
    items,
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    amount: subtotal,
    total_amount: total,
    balance_due: total,
  };

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
    const invoiceNumber = `TK-INV-${String((invoices.length || 0) + 1).padStart(4, '0')}`;
    createMutation.mutate({
      customer_id: customerId,
      invoice_number: invoiceNumber,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      discount_amount: discountAmount,
      total_amount: total,
      due_date: dueDate || null,
      notes: notes || null,
      created_by: session?.user?.name || 'System User',
      items,
    });
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto pb-12">
      {/* Form Section */}
      <div className="flex-1 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#001F3F] transition-colors">
              <ArrowLeft size={16} /> Back to Invoices
            </button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#001F3F] tracking-tight">New Invoice</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Create an invoice for a customer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Date */}
        <Card className="border border-slate-100 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-[#001F3F] mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer *</label>
                  <Link href="/admin/customers/new" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    + New Customer
                  </Link>
                </div>
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
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
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

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 px-1">
              <span className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Description
              </span>
              <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Qty
              </span>
              <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Price
              </span>
              <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total
              </span>
              <span className="col-span-1"></span>
            </div>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="col-span-12 sm:col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className={inputClass}
                      required
                    />
                    {products.length > 0 && (
                      <div className="absolute right-2 top-1.5 opacity-50 hover:opacity-100 transition-opacity">
                        <select 
                          className="text-xs bg-transparent outline-none cursor-pointer border-none py-1"
                          onChange={(e) => selectProduct(idx, e.target.value)}
                          title="Quick select standard service"
                        >
                          <option value="">+ Standard Service</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="col-span-4 sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    min={0}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="col-span-4 sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Price"
                  />
                  <div className="col-span-3 sm:col-span-2 font-bold text-[#001F3F] text-sm pl-1">
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
          </CardContent>
        </Card>

        {/* Totals + Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border border-slate-100 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-[#001F3F] mb-4">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Payment terms, delivery instructions, etc."
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
                    <span className="text-slate-500 font-medium">VAT (%)</span>
                    <input
                      type="number"
                      value={vatRate}
                      min={0}
                      max={100}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none text-center font-semibold"
                    />
                  </div>
                  <span className="font-bold text-[#001F3F]">{fmt(vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Discount</span>
                    <input
                      type="number"
                      value={discountAmount}
                      min={0}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none text-center font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <span className="font-bold text-red-500">-{fmt(Number(discountAmount))}</span>
                </div>
                <div className="flex justify-between font-black text-[#001F3F] border-t border-slate-200 pt-3 mt-1">
                  <span>Total</span>
                  <span className="text-xl">{fmt(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link href="/admin/invoices">
            <Button type="button" variant="outline" className="font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[#001F3F] hover:bg-[#002a52] font-bold px-8"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
        </form>
      </div>

      {/* Live Preview Section */}
      <div className="w-full lg:w-[600px] xl:w-[700px] shrink-0 sticky top-6 self-start hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#001F3F]">Live A4 Preview</h2>
        </div>
        <DocumentViewer inline type="invoice" document={previewDocument} />
      </div>
    </div>
  );
}
