'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Eye, Download, Trash2, Plus, Receipt as ReceiptIcon, X, CheckCircle2, XCircle, FileText, Edit2, Phone, MessageSquare } from 'lucide-react';
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

  const smsMutation = useMutation({
    mutationFn: async (payload: { recipients: { phone: string; name?: string }[], message: string }) => {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
      return data;
    },
    onSuccess: () => {
      toast.success('SMS sent to customer!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send SMS');
    }
  });

  const handleSendSMS = (doc: any) => {
    if (!doc.customer_phone) {
      toast.error('Customer has no phone number on record.');
      return;
    }
    const isInvoice = doc.amount !== doc.total_amount;
    const docType = isInvoice ? 'invoice' : 'receipt';
    const msg = `Dear ${doc.customer_name}, your ${docType} (${doc.invoice_number}) from Think Kre8tiv Media for GHS ${doc.total_amount} is ready.`;
    if (confirm(`Send SMS to ${doc.customer_phone}? \n\nMessage: "${msg}"`)) {
      smsMutation.mutate({
        recipients: [{ phone: doc.customer_phone, name: doc.customer_name }],
        message: msg
      });
    }
  };

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
              <div className="flex w-full xl:w-[45%] p-4 sm:p-6 overflow-y-auto bg-slate-50/50 dark:bg-[#06080D]/50 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800/60 relative justify-center">
                <div className="w-full max-w-2xl">
                  <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                    Real-Time Sheet Preview
                  </h3>
                  
                  {/* The Preview Sheet */}
                  <div className="bg-white border border-slate-200 shadow-2xl p-0 relative overflow-hidden transition-all duration-300 w-full rounded-xl">
                    <div className="absolute top-6 right-6 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-200 shadow-sm z-20">
                      Draft Preview
                    </div>
                    
                    {/* Watermark Logo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none flex items-center justify-center z-0">
                      <img src="/logo.png" alt="Watermark" className="w-[400px] h-[400px] object-contain grayscale" />
                    </div>

                    <div className="relative z-10">
                      {/* Top Accent Line */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-[#001F3F] to-[#FF5722]"></div>
                      
                      {/* Header Section */}
                      <div className="p-4 sm:p-6 flex flex-col items-center text-center 2xl:text-left 2xl:flex-row justify-between 2xl:items-start gap-4">
                        <div className="flex flex-col 2xl:flex-row items-center gap-3 sm:gap-4 w-full 2xl:w-auto">
                          <div className="shrink-0">
                            <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-black tracking-tight text-[#001F3F] leading-none mb-2 uppercase">Think Kre8tiv Media</h3>
                            <div className="space-y-0.5 text-[7px] sm:text-[8px] text-slate-400 font-medium">
                              <p>OSU haramani Sport complex</p>
                              <p>+233 20 000 0000 | info@thinkkre8tivmedia.com</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center 2xl:items-end w-full 2xl:w-auto">
                          <h1 className="text-lg sm:text-xl font-black text-[#FF5722] uppercase tracking-widest mb-2 sm:mb-3">{generateType === 'invoice' ? 'INVOICE' : 'RECEIPT'}</h1>
                          <div className="space-y-1.5 bg-slate-50/80 border border-slate-100 p-2.5 rounded-lg w-full sm:w-48 text-left shadow-sm">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest shrink-0">Doc No.</span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-[#001F3F] truncate">{generateType === 'invoice' ? 'INV-DRAFT' : 'REC-DRAFT'}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest shrink-0">Date</span>
                              <span className="text-[7px] sm:text-[8px] font-bold text-slate-700 truncate">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className="px-6 pb-4 border-b border-slate-100 mb-4 mx-6 mt-1">
                      <p className="text-[7px] font-black text-[#FF5722] uppercase tracking-widest mb-1.5">Billed To</p>
                      <p className="text-xs font-extrabold text-[#001F3F] leading-tight mb-1">{customerName || 'Client Name'}</p>
                      <div className="text-[7px] text-slate-500 font-medium space-y-0.5">
                        {customerPhone && <p>{customerPhone}</p>}
                        {customerEmail && <p>{customerEmail}</p>}
                      </div>
                    </div>

                    <div className="px-6 flex-1 relative z-10">
                      <table className="w-full text-xs mb-4">
                        <thead className="border-b-2 border-slate-800">
                          <tr className="text-[7px] font-black text-slate-800 uppercase tracking-widest">
                            <th className="py-2 px-1 text-left">Description</th>
                            <th className="py-2 px-1 text-center w-12">Qty</th>
                            <th className="py-2 px-1 text-right w-16">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lineItems.map((item, i) => (
                            <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-1 text-[8px] font-bold text-slate-700 max-w-[120px]">{item.description || <span className="text-slate-300 italic font-medium">New Line Item</span>}</td>
                              <td className="py-2 px-1 text-[8px] text-center font-bold text-slate-600">{item.quantity}</td>
                              <td className="py-2 px-1 text-[8px] text-right font-black text-[#001F3F]">₵{(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex justify-end">
                        <div className="w-[160px]">
                          <div className="space-y-1.5 px-1 pb-2 border-b border-slate-100">
                            <div className="flex justify-between items-center text-[8px]">
                              <span className="font-bold text-slate-500">Subtotal</span>
                              <span className="font-bold text-slate-800">₵{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8px]">
                              <span className="font-bold text-slate-500">VAT (20%)</span>
                              <span className="font-bold text-slate-800">₵{vatAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 px-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#001F3F]">Total</span>
                            <span className="text-xs font-black text-[#FF5722]">₵{grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div className="px-6 py-4 mt-6 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                        <div>
                          <p className="text-[8px] font-black text-[#001F3F] mb-0.5">Thank you for your business!</p>
                          <p className="text-[7px] text-slate-500">If you have any questions about this document, please contact us.</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Authorized By</p>
                          <div className="relative mt-1.5 mb-1">
                            <img src="/logo.png" alt="Signature Stamp" className="h-6 object-contain opacity-20" />
                          </div>
                          <p className="text-[7px] font-black text-[#001F3F] uppercase tracking-widest">Think Kre8tiv Media</p>
                        </div>
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
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-start overflow-hidden print:bg-white print:block backdrop-blur-sm">
          
          {/* Action buttons (Sticky Top Bar) */}
          <div className="w-full bg-[#0B0F19] border-b border-slate-800 p-4 flex justify-end gap-3 shrink-0 print:hidden shadow-md z-50">
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
              <Button variant="secondary" onClick={() => setViewDocId(null)} className="font-semibold bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md">
                Close Preview
              </Button>
              <Button 
                onClick={() => handleSendSMS(viewedDoc)} 
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 shadow-lg shadow-amber-900/20"
                disabled={smsMutation.isPending}
              >
                <MessageSquare size={16} className="mr-2" /> Send SMS
              </Button>
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg shadow-blue-900/20">
                <Download size={16} className="mr-2" /> Print PDF
              </Button>
              <Button variant="outline" onClick={() => setViewDocId(null)} className="font-semibold bg-white text-slate-900 border-none shadow-lg">
                <X size={18} />
              </Button>
            </div>

            {/* Scrollable Document Area */}
            <div className="flex-1 w-full overflow-auto p-4 sm:p-8 flex justify-center">
              
              {/* A4 Paper Container */}
              <div className="bg-white shadow-2xl w-full max-w-[800px] relative flex flex-col shrink-0 print:shadow-none print:w-full print:max-w-none print:min-w-0 print:min-h-0 print:m-0 my-auto rounded-xl sm:rounded-none overflow-hidden sm:overflow-visible">
                
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
              <div className="relative z-10">
                <div className="h-2 w-full bg-gradient-to-r from-[#001F3F] to-[#FF5722] print:bg-[#001F3F]"></div>
                <div className="p-6 sm:p-12 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 print:flex-row print:p-12">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain print:w-20 print:h-20" />
                    <div>
                      <h3 className="text-xl sm:text-3xl font-black tracking-tight text-[#001F3F] leading-none mb-3 sm:mb-4 print:text-3xl uppercase">THINK KRE8TIV MEDIA</h3>
                      <div className="space-y-0.5 text-[9px] sm:text-[10px] text-slate-400 font-medium print:text-[10px]">
                        <p>OSU haramani Sport complex</p>
                        <p>+233 20 000 0000 | info@thinkkre8tivmedia.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto print:items-end print:text-right">
                    <h1 className="text-2xl sm:text-4xl font-black text-[#FF5722] uppercase tracking-widest mb-4 sm:mb-6 print:text-[#FF5722] print:text-4xl" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      {viewedDoc.total_amount === viewedDoc.amount ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <div className="space-y-2 sm:space-y-3 bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-xl w-full sm:w-64 text-left print:bg-slate-50 print:w-64" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc No.</span>
                        <span className="text-sm font-bold text-[#001F3F]">{viewedDoc.invoice_number || viewedDoc.receipt_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                        <span className="text-xs font-bold text-slate-700">{new Date(viewedDoc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {viewedDoc.due_date && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
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
              </div>

              {/* Billed To Section */}
              <div className="px-6 sm:px-12 pb-6 sm:pb-8 border-b border-slate-100 mb-6 sm:mb-8 mx-6 sm:mx-12 mt-2 print:px-12 print:mx-12">
                <p className="text-[10px] font-black text-[#FF5722] uppercase tracking-widest mb-2 sm:mb-3">Billed To</p>
                <p className="text-lg sm:text-xl font-extrabold text-[#001F3F] leading-tight mb-1 sm:mb-2 print:text-xl">{viewedDoc.customer_name}</p>
                <div className="text-xs text-slate-500 font-medium space-y-1">
                  {viewedDoc.customer_phone && <p>{viewedDoc.customer_phone}</p>}
                  {viewedDoc.customer_email && <p className="break-all sm:break-normal">{viewedDoc.customer_email}</p>}
                  {viewedDoc.customer_address && <p className="max-w-full sm:max-w-[300px] leading-relaxed pt-1 print:max-w-[300px]">{viewedDoc.customer_address}</p>}
                </div>
              </div>

              {/* Line Items */}
              <div className="px-4 sm:px-12 flex-1 relative z-10 print:px-12 overflow-x-auto">
                <table className="w-full text-sm mb-6 sm:mb-8 min-w-[400px]">
                  <thead className="border-b-2 border-slate-800">
                    <tr className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      <th className="py-4 px-3 text-left">Description</th>
                      <th className="py-4 px-3 text-center w-24">Qty</th>
                      <th className="py-4 px-3 text-right w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewedDoc.items && viewedDoc.items.length > 0 ? (
                      viewedDoc.items.map((item: any, i: number) => (
                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-3 font-bold text-slate-700">{item.description}</td>
                          <td className="py-4 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                          <td className="py-4 px-3 text-right font-black text-[#001F3F]">{fmt(item.total_price || (item.quantity * item.unit_price))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 px-5 font-bold text-slate-400 italic text-center">Custom Document Total</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mt-4 sm:mt-0">
                  <div className="w-full sm:w-[350px] print:w-[350px]">
                    <div className="space-y-3 sm:space-y-4 px-2 sm:px-3 pb-4 sm:pb-5 border-b border-slate-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Subtotal</span>
                        <span className="font-bold text-slate-800">{fmt(viewedDoc.subtotal || viewedDoc.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">VAT (20%)</span>
                        <span className="font-bold text-slate-800">{fmt(viewedDoc.vat_amount || ((viewedDoc.subtotal || viewedDoc.amount) * 0.2))}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-5 px-3">
                      <span className="text-sm font-black uppercase tracking-widest text-[#001F3F]">Grand Total</span>
                      <span className="text-2xl font-black text-[#FF5722]">{fmt(viewedDoc.total_amount || viewedDoc.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-12 py-8 sm:py-10 mt-8 sm:mt-12 bg-slate-50 flex flex-col justify-between border-t border-slate-200 print:bg-slate-50 print:px-12 print:mt-12" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 sm:gap-0 print:flex-row">
                  <div className="max-w-full sm:max-w-sm print:max-w-sm">
                    <p className="text-sm font-black text-[#001F3F] mb-1.5 uppercase tracking-widest">Thank you for your business!</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Payment is due upon receipt. Please make all checks payable to Think Kre8tiv Media. If you have any questions, please contact us.</p>
                  </div>
                  <div className="text-left sm:text-right print:text-right w-full sm:w-auto flex flex-col items-start sm:items-end print:items-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By</p>
                    <div className="relative mt-2 mb-1">
                      <img src="/logo.png" alt="Signature Stamp" className="h-12 object-contain opacity-20" />
                    </div>
                    <p className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest">Think Kre8tiv Media</p>
                  </div>
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
