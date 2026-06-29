'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Eye, Download, Trash2, Plus, Receipt as ReceiptIcon, X, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  status: string;
  approval_status: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

export default function BillingAndReceiptsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Unified Modal states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<'invoice' | 'receipt'>('invoice');
  const [viewDocId, setViewDocId] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([{ id: '1', description: '', quantity: 1, unit_price: 0 }]);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const vatRate = 0.15; // 15% VAT
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;

  useEffect(() => setMounted(true), []);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: mounted,
  });


  const { data: viewedDoc } = useQuery({
    queryKey: ['invoice', viewDocId],
    queryFn: async () => {
      if (!viewDocId) return null;
      const res = await fetch(`/api/invoices?id=${viewDocId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!viewDocId,
  });

  const resetForm = () => {
    setIsGenerateOpen(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDueDate('');
    setLineItems([{ id: '1', description: '', quantity: 1, unit_price: 0 }]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const isInvoice = generateType === 'invoice';
      const endpoint = isInvoice ? '/api/invoices' : '/api/receipts';
      
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotal: subtotal,
        total_amount: grandTotal,
        amount: grandTotal, // for receipt
        vat_rate: vatRate * 100,
        vat_amount: vatAmount,
        due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: isInvoice ? '' : 'Direct receipt generated',
        items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        }))
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`${generateType === 'invoice' ? 'Invoice' : 'Receipt'} created successfully!`);
      resetForm();
    },
    onError: () => toast.error(`Failed to create ${generateType}`),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: 'Admin' }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice approved!');
    },
    onError: () => toast.error('Failed to update approval'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setViewDocId(null);
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  if (!mounted) return null;

  const filtered = invoices.filter(
    (i) =>
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      i.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (i.customer_email && i.customer_email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDocuments = invoices.length;
  const estimatedRevenue = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const pendingApproval = invoices.filter(i => i.approval_status === 'pending').length;
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-slate-300 font-sans p-6 lg:p-10 selection:bg-[#FF5722]/30">
      
      {/* Hide main UI when printing */}
      <div className="print:hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Invoices & Receipts</h1>
            <p className="text-slate-500 text-sm font-medium">
              Approve before sending — drafts are held until admin approves
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setGenerateType('invoice'); setIsGenerateOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5722] hover:bg-[#FF7043] text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-[#FF5722]/20"
            >
              <Plus size={16} strokeWidth={3} /> Invoice
            </button>
            <button 
              onClick={() => { setGenerateType('receipt'); setIsGenerateOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-[#FF5722]/40 hover:border-[#FF5722] text-[#FF5722] text-sm font-bold rounded-lg transition-colors shadow-sm dark:shadow-none"
            >
              <ReceiptIcon size={16} /> Receipt
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Total Documents</p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalDocuments}</p>
          </div>
          <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Estimated Revenue</p>
            <p className="text-3xl font-black text-[#FF5722]">{fmt(estimatedRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pending Approval</p>
            <p className="text-3xl font-black text-amber-500">{pendingApproval}</p>
          </div>
          <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Paid Invoices</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{paidInvoices}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by customer, email, or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] dark:focus:border-[#FF5722]/50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all shadow-sm dark:shadow-none"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Filter:</span>
            <button className="flex items-center justify-between min-w-[130px] px-4 py-3 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-sm dark:shadow-none">
              All Types <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
            </button>
            <button className="flex items-center justify-between min-w-[130px] px-4 py-3 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-sm dark:shadow-none">
              All Statuses <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-[#080B12]">
                <tr>
                  <th className="px-6 py-4">Document #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 flex items-center gap-1">Date <ChevronDown size={12} /></th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Approval</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading documents...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No documents found</td>
                  </tr>
                ) : (
                  filtered.map((doc) => {
                    const dateStr = doc.created_at ? doc.created_at.split('T')[0] : '—';
                    const isPending = doc.approval_status === 'pending';
                    
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#0D121F] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-bold text-[#FF5722] mb-1">{doc.invoice_number}</div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <FileText size={10} /> Invoice
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 dark:text-slate-200 mb-0.5">{doc.customer_name}</div>
                          <div className="text-xs text-slate-500">{doc.customer_email || '—'}</div>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-slate-200">
                          {fmt(doc.total_amount)}
                        </td>
                        <td className="px-6 py-5 text-slate-500 dark:text-slate-400 font-medium">
                          {dateStr.replace(/-/g, '/')}
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#1A2235] text-slate-600 dark:text-slate-300 text-[10px] font-bold tracking-wider uppercase border border-slate-200 dark:border-none">
                            {doc.status || 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full border border-amber-600 dark:border-amber-500" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" /> Approved
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {isPending && (
                              <button
                                onClick={() => approveMutation.mutate({ id: doc.id, approval_status: 'approved' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-full text-xs font-bold transition-all"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                            )}
                            <button 
                              onClick={() => setViewDocId(doc.id)}
                              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button 
                              onClick={() => {
                                setViewDocId(doc.id);
                                setTimeout(() => window.print(), 500);
                              }}
                              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                            >
                              <Download size={14} /> PDF
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this document?')) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white rounded-full transition-all border border-rose-100 dark:border-rose-500/20"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Modals Below (Hidden when not active) */}
      {/* Generate Invoice/Receipt Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ReceiptIcon className="text-[#FF5722]" size={24} />
                  Generate {generateType === 'invoice' ? 'Invoice' : 'Receipt'}
                </h2>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200 dark:border-slate-700/50">
                  <button 
                    onClick={() => setGenerateType('invoice')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all", generateType === 'invoice' ? "bg-[#FF5722] text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
                  >
                    Invoice
                  </button>
                  <button 
                    onClick={() => setGenerateType('receipt')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all", generateType === 'receipt' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
                  >
                    Receipt
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-400 hidden sm:block">• Requires admin approval before sending</p>
              </div>
              <button onClick={resetForm} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Column: Form */}
              <div className="w-full md:w-[55%] p-6 overflow-y-auto space-y-8 bg-white dark:bg-[#0B0F19]">
                
                {/* Quick Fill Section */}
                <div className="bg-orange-50/50 dark:bg-[#FF5722]/5 border border-orange-100 dark:border-[#FF5722]/20 rounded-xl p-5">
                  <h3 className="text-[10px] font-extrabold text-[#FF5722] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search size={12} /> Quick Fill From Requests Or Customers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Linked Service Request</label>
                      <select className="w-full bg-white dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none">
                        <option>-- Don't link request --</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Existing Customer Profile</label>
                      <select className="w-full bg-white dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none">
                        <option>-- Don't link profile --</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div>
                  <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Customer Name <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="email"
                        placeholder="e.g. client@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Phone Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. +233 50 000 0000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Payment Due Date</label>
                      <input 
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Line Items
                    </h3>
                    <button 
                      onClick={() => setLineItems([...lineItems, { id: Math.random().toString(), description: '', quantity: 1, unit_price: 0 }])}
                      className="text-xs font-bold text-[#FF5722] hover:text-[#FF7043] flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input 
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].description = e.target.value;
                              setLineItems(newItems);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                          />
                        </div>
                        <div className="w-20">
                          <input 
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].quantity = parseInt(e.target.value) || 0;
                              setLineItems(newItems);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                          />
                        </div>
                        <div className="w-32">
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].unit_price = parseFloat(e.target.value) || 0;
                              setLineItems(newItems);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#FF5722]"
                          />
                        </div>
                        <button 
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                          disabled={lineItems.length === 1}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 mt-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Preview */}
              <div className="w-full md:w-[45%] p-6 overflow-y-auto bg-slate-50/50 dark:bg-[#06080D]/50 border-l border-slate-100 dark:border-slate-800/60 relative flex justify-center">
                <div className="w-full max-w-sm">
                  <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                    Real-Time Sheet Preview
                  </h3>
                  
                  {/* The Preview Sheet */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-6 right-6 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      Draft Preview
                    </div>
                    
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl mb-2">
                        TK
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ThinkKre8tive</p>
                    </div>

                    <div className="flex justify-between items-start mb-8 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[9px]">Bill To</p>
                        <p className="font-bold text-slate-800">{customerName || 'Client Name'}</p>
                        <p className="text-slate-500">{customerEmail || 'email@example.com'}</p>
                        <p className="text-slate-500">{customerPhone || '+233 ...'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[9px]">Details</p>
                        <p className="text-slate-600"><span className="text-slate-400">#</span> <span className="text-[#FF5722] font-bold">INV-PREVIEW</span></p>
                        <p className="text-slate-500">Issued: {new Date().toLocaleDateString()}</p>
                        <p className="text-slate-500">Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
                      </div>
                    </div>

                    <table className="w-full mb-6">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {lineItems.map((item, i) => (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0 text-slate-600">
                            <td className="py-2 pr-2 truncate max-w-[120px]">{item.description || <span className="text-slate-300 italic">New Line Item</span>}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right font-medium">₵{(item.quantity * item.unit_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>₵{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>VAT (15%):</span>
                        <span>₵{vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-800 text-sm pt-2 mt-2 border-t border-slate-100">
                        <span>Total:</span>
                        <span>₵{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] flex justify-end gap-3">
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !customerName.trim()} 
                className="px-6 py-2.5 bg-[#FF5722] hover:bg-[#FF7043] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : `Save ${generateType === 'invoice' ? 'Invoice' : 'Receipt'} (Pending Approval)`}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* View/Print Document Modal */}
      {viewDocId && viewedDoc && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
          
          {/* Action buttons (Hidden during print) */}
          <div className="absolute top-4 right-4 flex gap-2 print:hidden z-50">
            <button onClick={() => window.print()} className="bg-[#FF5722] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
              <Download size={16} /> Print / Save PDF
            </button>
            <button onClick={() => setViewDocId(null)} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-lg shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>

          {/* Actual Document to Print */}
          <div className="bg-white text-black w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:rounded-xl p-8 sm:p-12 shadow-2xl print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">INVOICE</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{viewedDoc.invoice_number}</p>
                {viewedDoc.approval_status !== 'approved' && (
                  <span className="inline-block mt-2 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-bold border border-rose-200">
                    DRAFT (UNAPPROVED)
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-black">THINK KRE8TIV</p>
                <p className="text-sm text-slate-600">Accra, Ghana</p>
                <p className="text-sm text-slate-600">info@thinkkre8tive.com</p>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
                <p className="font-bold text-lg">{viewedDoc.customer_name}</p>
                <p className="text-sm text-slate-600">{viewedDoc.customer_email || 'No email provided'}</p>
                {viewedDoc.customer_phone && <p className="text-sm text-slate-600">{viewedDoc.customer_phone}</p>}
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                  <p className="font-bold">{viewedDoc.created_at.split('T')[0]}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                  <p className="font-black text-2xl text-[#FF5722]">{fmt(viewedDoc.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full mb-12">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Qty</th>
                  <th className="py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewedDoc.items && viewedDoc.items.length > 0 ? (
                  viewedDoc.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4 font-bold">{item.description}</td>
                      <td className="py-4 text-center">{item.quantity}</td>
                      <td className="py-4 text-right font-bold">{fmt(item.total_price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 font-bold text-slate-400">Custom Invoice Total</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="w-full max-w-sm ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                <span className="font-bold">{fmt(viewedDoc.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-black pt-3">
                <span className="font-bold text-sm uppercase tracking-wider">Total</span>
                <span className="font-black text-2xl text-[#FF5722]">{fmt(viewedDoc.total_amount)}</span>
              </div>
            </div>

            <div className="mt-20 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
              Thank you for choosing Think Kre8tiv! Payment is due upon receipt.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
