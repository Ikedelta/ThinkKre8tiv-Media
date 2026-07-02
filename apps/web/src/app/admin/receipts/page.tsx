'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Eye, Download, Trash2, Plus, Receipt as ReceiptIcon, X, CheckCircle2, XCircle, FileText, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  status: string;
  approval_status: string;
  created_by?: string;
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
  const { data: session } = authClient.useSession();

  // Unified Modal states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<'invoice' | 'receipt'>('invoice');
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [editDocId, setEditDocId] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([{ id: '1', description: '', quantity: 1, unit_price: 0 }]);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const vatRate = 0.20; // 20% VAT
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
    setEditDocId(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDueDate('');
    setLineItems([{ id: '1', description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleEditDoc = () => {
    if (!viewedDoc) return;
    setGenerateType(viewedDoc.total_amount === viewedDoc.amount ? 'receipt' : 'invoice');
    setEditDocId(viewedDoc.id);
    setCustomerName(viewedDoc.customer_name || '');
    setCustomerEmail(viewedDoc.customer_email || '');
    setCustomerPhone(viewedDoc.customer_phone || '');
    setDueDate(viewedDoc.due_date ? new Date(viewedDoc.due_date).toISOString().split('T')[0] : '');
    
    if (viewedDoc.items && viewedDoc.items.length > 0) {
      setLineItems(viewedDoc.items.map((item: any) => ({
        id: item.id || Math.random().toString(),
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price || (item.total_price / item.quantity)
      })));
    } else {
      setLineItems([{ id: '1', description: 'Total Amount', quantity: 1, unit_price: viewedDoc.subtotal || viewedDoc.amount || 0 }]);
    }
    
    setViewDocId(null);
    setIsGenerateOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const isInvoice = generateType === 'invoice';
      const endpoint = isInvoice ? '/api/invoices' : '/api/receipts';
      
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        invoice_number: `INV-2026-${Date.now().toString().slice(-6)}`,
        subtotal: subtotal,
        total_amount: grandTotal,
        amount: grandTotal, // for receipt
        vat_rate: vatRate * 100,
        vat_amount: vatAmount,
        due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: isInvoice ? '' : 'Direct receipt generated',
        created_by: session?.user?.name || 'System User',
        items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        }))
      };

      const res = await fetch(endpoint, {
        method: editDocId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDocId ? { id: editDocId, ...payload } : payload),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`${generateType === 'invoice' ? 'Invoice' : 'Receipt'} ${editDocId ? 'updated' : 'created'} successfully!`);
      resetForm();
    },
    onError: () => toast.error(`Failed to create ${generateType}`),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: session?.user?.id || null }),
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

        {/* 4 Metric Cards - Admin Only */}
        {(session?.user as any)?.role === 'admin' && (
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
        )}

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
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Loading documents...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">No documents found</td>
                  </tr>
                ) : (
                  filtered.map((doc) => {
                    const dateStr = doc.created_at ? new Date(doc.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
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
                          <div className="font-medium text-slate-900 dark:text-slate-200 text-xs">
                            {doc.created_by || 'System User'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {isPending && (session?.user as any)?.role === 'admin' && (
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
                            {(session?.user as any)?.role === 'admin' && (
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
                            )}
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
                  {editDocId ? 'Edit' : 'Generate'} {generateType === 'invoice' ? 'Invoice' : 'Receipt'}
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
            
            <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">
              {/* Left Column: Form */}
              <div className="w-full xl:w-[55%] p-6 overflow-y-auto space-y-8 bg-white dark:bg-[#0B0F19]">
                
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
              <div className="hidden xl:flex w-full xl:w-[45%] p-6 overflow-y-auto bg-slate-50/50 dark:bg-[#06080D]/50 border-l border-slate-100 dark:border-slate-800/60 relative justify-center">
                <div className="w-full max-w-sm">
                  <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                    Real-Time Sheet Preview
                  </h3>
                  
                  {/* The Preview Sheet */}
                  <div className="bg-white border border-slate-200 shadow-2xl p-0 relative overflow-hidden transition-all duration-300 transform scale-[0.85] origin-top-center w-[115%] -ml-[7.5%]">
                    <div className="absolute top-6 right-6 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-200 shadow-sm z-20">
                      Draft Preview
                    </div>
                    
                    {/* Header Section */}
                    <div className="relative z-10 flex border-b-[6px] border-[#001F3F]">
                      <div className="bg-[#001F3F] text-white p-6 w-[60%] flex flex-col justify-between">
                        <div>
                          <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-12 h-12 object-contain mb-3 brightness-0 invert" />
                          <h3 className="text-xl font-black tracking-tight leading-none mb-1">THINK KRE8TIV MEDIA</h3>
                          <p className="text-[9px] text-blue-200 font-medium tracking-wide">CREATIVE EXCELLENCE</p>
                        </div>
                        <div className="mt-4 space-y-0.5 text-[8px] text-blue-100/80 font-medium">
                          <p>OSU haramani Sport complex</p>
                          <p>+233 20 000 0000</p>
                          <p>info@thinkkre8tivmedia.com</p>
                        </div>
                      </div>
                      <div className="w-[40%] p-6 flex flex-col justify-between items-end bg-slate-50">
                        <h1 className="text-2xl font-black text-[#FF5722] uppercase tracking-widest mb-3">{generateType === 'invoice' ? 'INVOICE' : 'RECEIPT'}</h1>
                        <div className="text-right space-y-1.5 w-full">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Doc No.</span>
                            <span className="text-[10px] font-black text-[#001F3F]">{generateType === 'invoice' ? 'INV-DRAFT' : 'REC-DRAFT'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                            <span className="text-[9px] font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-6 grid grid-cols-2 gap-6 relative z-10">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2 inline-block">Billed To</p>
                        <p className="text-sm font-extrabold text-[#001F3F] leading-tight">{customerName || 'Client Name'}</p>
                        <div className="text-[8px] text-slate-600 font-medium pt-1 space-y-0.5">
                          {customerPhone && <p className="flex items-center gap-1.5"><span className="text-slate-400">P:</span> {customerPhone}</p>}
                          {customerEmail && <p className="flex items-center gap-1.5"><span className="text-slate-400">E:</span> {customerEmail}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 w-40 shadow-sm mt-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                            <span className="text-xs font-black text-[#FF5722]">₵{grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 flex-1 relative z-10">
                      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm mb-6">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <tr className="text-[8px] font-black uppercase tracking-widest">
                              <th className="py-2 px-3 text-left">Description</th>
                              <th className="py-2 px-3 text-center w-12">Qty</th>
                              <th className="py-2 px-3 text-right w-20">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lineItems.map((item, i) => (
                              <tr key={item.id} className={cn("transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                <td className="py-2 px-3 text-[9px] font-bold text-slate-800 truncate max-w-[120px]">{item.description || <span className="text-slate-300 italic">New Line Item</span>}</td>
                                <td className="py-2 px-3 text-[9px] text-center font-bold text-slate-600">{item.quantity}</td>
                                <td className="py-2 px-3 text-[9px] text-right font-black text-[#001F3F]">₵{(item.quantity * item.unit_price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end mb-6">
                        <div className="w-[180px]">
                          <div className="space-y-1.5 px-2">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                              <span className="font-bold text-slate-700">₵{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="font-black text-slate-400 uppercase tracking-widest">VAT (20%)</span>
                              <span className="font-bold text-slate-700">₵{vatAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="bg-[#001F3F] rounded-lg p-3 mt-3 text-white shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase tracking-widest text-blue-200">Total</span>
                              <span className="text-sm font-black text-white">₵{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-[8px] font-bold text-slate-400">
                      <p>Thank you for choosing Think Kre8tiv Media!</p>
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
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-start justify-center p-4 sm:p-8 overflow-auto print:p-0 print:bg-white print:block backdrop-blur-sm">
          
          {/* A4 Paper Container */}
          <div className="bg-white shadow-2xl min-w-[800px] max-w-[800px] min-h-[1130px] relative flex flex-col print:shadow-none print:w-full print:max-w-none print:min-w-0 print:min-h-0 print:m-0 my-auto">
            
            {/* Action buttons (Hidden during print) */}
            <div className="absolute top-0 left-0 right-0 -translate-y-full pb-4 flex flex-wrap justify-end gap-3 print:hidden z-50">
              {viewedDoc.approval_status === 'pending' && (session?.user as any)?.role === 'admin' && (
                <>
                  <Button 
                    onClick={() => {
                      approveMutation.mutate({ id: viewDocId!, approval_status: 'approved' });
                      setViewDocId(null);
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold px-6"
                  >
                    <CheckCircle2 size={16} className="mr-2" /> Approve
                  </Button>
                  <Button 
                    onClick={() => {
                      approveMutation.mutate({ id: viewDocId!, approval_status: 'rejected' });
                      setViewDocId(null);
                    }} 
                    className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 font-bold px-6"
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </Button>
                  <div className="w-px h-8 bg-slate-200/20 mx-1"></div>
                </>
              )}
              <Button variant="secondary" onClick={handleEditDoc} className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md shadow-lg font-semibold">
                <Edit2 size={16} className="mr-2" /> Edit
              </Button>
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 font-bold px-6">
                <Download size={16} className="mr-2" /> Print PDF
              </Button>
              <Button variant="outline" onClick={() => setViewDocId(null)} className="font-semibold bg-white text-slate-900 border-none shadow-lg">
                <X size={18} />
              </Button>
            </div>

            {/* Print Area */}
            <div className="flex-1 flex flex-col text-slate-800 relative bg-white">
              
              {/* Watermark & PAID Stamp */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
                <img src="/logo.png" alt="Watermark" className="w-[600px] h-[600px] object-contain grayscale" />
              </div>
              {viewedDoc.total_amount === viewedDoc.amount && viewedDoc.approval_status === 'approved' && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-0 opacity-10">
                  <div className="text-[120px] font-black text-emerald-500 border-[8px] border-emerald-500 rounded-xl px-12 py-4 uppercase tracking-widest">PAID</div>
                </div>
              )}

              {/* Header Section */}
              <div className="relative z-10 flex border-b-[8px] border-[#001F3F] print:border-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="bg-[#001F3F] text-white p-10 w-[60%] flex flex-col justify-between print:bg-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div>
                    <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-20 h-20 object-contain mb-4 brightness-0 invert" />
                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">THINK KRE8TIV MEDIA</h3>
                    <p className="text-sm text-blue-200 font-medium tracking-wide">CREATIVE EXCELLENCE</p>
                  </div>
                  <div className="mt-8 space-y-1 text-xs text-blue-100/80 font-medium">
                    <p>OSU haramani Sport complex</p>
                    <p>+233 20 000 0000</p>
                    <p>info@thinkkre8tivmedia.com</p>
                  </div>
                </div>
                <div className="w-[40%] p-10 flex flex-col justify-between items-end bg-slate-50 print:bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <h1 className="text-4xl font-black text-[#FF5722] uppercase tracking-widest mb-4 print:text-[#FF5722]">
                    {viewedDoc.total_amount === viewedDoc.amount ? 'RECEIPT' : 'INVOICE'}
                  </h1>
                  <div className="text-right space-y-2 w-full">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc No.</span>
                      <span className="text-sm font-black text-[#001F3F]">{viewedDoc.invoice_number || viewedDoc.receipt_number}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="text-xs font-bold text-slate-700">{new Date(viewedDoc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {viewedDoc.due_date && (
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                        <span className="text-xs font-bold text-[#FF5722]">{new Date(viewedDoc.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  {viewedDoc.approval_status !== 'approved' && (
                    <span className="inline-block mt-4 bg-rose-50 text-rose-600 px-3 py-1 rounded-md text-[10px] font-black tracking-widest border border-rose-200 uppercase shadow-sm">
                      Draft (Unapproved)
                    </span>
                  )}
                </div>
              </div>

              {/* Parties */}
              <div className="px-12 py-10 grid grid-cols-2 gap-12 relative z-10">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 inline-block">Billed To</p>
                  <p className="text-xl font-extrabold text-[#001F3F]">{viewedDoc.customer_name}</p>
                  <div className="text-sm text-slate-600 font-medium pt-2 space-y-1">
                    {viewedDoc.customer_phone && <p className="flex items-center gap-2"><span className="text-slate-400">P:</span> {viewedDoc.customer_phone}</p>}
                    {viewedDoc.customer_email && <p className="flex items-center gap-2"><span className="text-slate-400">E:</span> {viewedDoc.customer_email}</p>}
                    {viewedDoc.customer_address && <p className="flex items-center gap-2 mt-2 max-w-[250px] leading-relaxed"><span className="text-slate-400">A:</span> {viewedDoc.customer_address}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-start pt-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 w-64 shadow-sm print:border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount</span>
                      <span className="text-xl font-black text-[#FF5722]">{fmt(viewedDoc.total_amount || viewedDoc.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="px-12 flex-1 relative z-10">
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm print:border-slate-300">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700 print:bg-slate-100 border-b border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <tr className="text-[10px] font-black uppercase tracking-widest">
                        <th className="py-4 px-5 text-left">Description</th>
                        <th className="py-4 px-5 text-center w-24">Qty</th>
                        <th className="py-4 px-5 text-right w-40">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewedDoc.items && viewedDoc.items.length > 0 ? (
                        viewedDoc.items.map((item: any, i: number) => (
                          <tr key={item.id} className={cn("transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <td className="py-4 px-5 font-bold text-slate-800">{item.description}</td>
                            <td className="py-4 px-5 text-center font-bold text-slate-600">{item.quantity}</td>
                            <td className="py-4 px-5 text-right font-black text-[#001F3F]">{fmt(item.total_price || (item.quantity * item.unit_price))}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-8 px-5 font-bold text-slate-400 italic text-center">Custom Document Total</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-8">
                  <div className="w-[350px]">
                    <div className="space-y-3 px-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-slate-800">{fmt(viewedDoc.subtotal || viewedDoc.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">VAT (20%)</span>
                        <span className="font-bold text-slate-800">{fmt(viewedDoc.vat_amount || ((viewedDoc.subtotal || viewedDoc.amount) * 0.2))}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#001F3F] rounded-xl p-6 mt-5 text-white shadow-lg print:bg-[#001F3F]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black uppercase tracking-widest text-blue-200">Grand Total</span>
                        <span className="text-2xl font-black">{fmt(viewedDoc.total_amount || viewedDoc.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-12 py-10 mt-auto relative z-10">
                <div className="border-t-2 border-slate-100 pt-8 flex justify-between items-end">
                  <div className="max-w-md space-y-6">
                    <div className="text-xs text-slate-500">
                      <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest mb-1.5">Thank you for choosing Think Kre8tiv Media!</p>
                      <p className="font-medium leading-relaxed">Payment is due upon receipt. Please make all checks payable to Think Kre8tiv Media.</p>
                    </div>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="relative">
                      <img src="/logo.png" alt="Signature Stamp" className="w-24 h-24 object-contain opacity-20 grayscale absolute -top-8 -left-8" />
                      <div className="w-48 border-b-2 border-[#001F3F] mt-16 mb-2 relative z-10"></div>
                    </div>
                    <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest">Authorized Signatory</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Think Kre8tiv Media</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
