'use client';

import { useConfirm } from '@/components/providers/ConfirmProvider';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Trash2, CheckCircle2, Play, Check, Send, DownloadCloud, FileText, Edit2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

interface Quotation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  quotation_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  notes: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  draft: { label: 'Draft', dot: 'bg-slate-500', bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-500 dark:border-slate-500/20' },
  sent: { label: 'Sent', dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20' },
  accepted: { label: 'Accepted', dot: 'bg-emerald-500', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20' },
  rejected: { label: 'Rejected', dot: 'bg-rose-500', bg: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20' },
  converted: { label: 'Converted', dot: 'bg-indigo-500', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-500 dark:border-indigo-500/20' },
};

export default function QuotationsPage() {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  useEffect(() => setMounted(true), []);

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: mounted,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Production status updated!');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotations?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Print job removed');
    },
    onError: () => toast.error('Failed to delete'),
  });

  if (!mounted) return null;

  const estimates = quotations.filter(q => q.status === 'draft' || q.status === 'sent' || q.status === 'rejected');
  const filtered = estimates.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const sentQuotes = quotations.filter(q => q.status === 'sent').length;
  const newSubmissions = quotations.filter(q => q.status === 'draft').length;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-slate-300 font-sans p-6 lg:p-10 selection:bg-indigo-500/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Estimates & Quotations</h1>
          <p className="text-slate-500 text-sm font-medium">Manage estimates and send quotes to customers.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Total Estimates</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{estimates.length}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Draft Estimates</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{newSubmissions}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sent to Customer</p>
          <p className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{sentQuotes}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by job code or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-500/50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all shadow-sm dark:shadow-none"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Filter:</span>
          <button className="flex items-center justify-between min-w-[150px] px-4 py-3 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-sm dark:shadow-none">
            All Stages <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-[#080B12]">
              <tr>
                <th className="px-6 py-4">Estimate #</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading submissions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No print jobs found</td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const cfg = statusConfig[job.status] || statusConfig.draft;
                  const dateStr = job.created_at ? job.created_at.split('T')[0] : '—';
                  
                  let specs: any = { product: 'Custom Job', qty: 1, filename: 'No file' };
                  try {
                    if (job.notes && job.notes.startsWith('{')) {
                      specs = JSON.parse(job.notes);
                    }
                  } catch (e) {}

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-[#0D121F] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">{job.quotation_number}</div>
                        <div className="text-[10px] text-slate-500">{dateStr}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 dark:text-slate-200 mb-0.5">{job.customer_name}</div>
                        <div className="text-xs text-slate-500">{job.customer_email || '—'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 dark:text-slate-300 mb-0.5">{specs.product || 'Standard Job'}</div>
                        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 inline-block px-2 py-0.5 rounded">
                          {specs.qty || 1} units
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <FileText size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{specs.filename || 'no-file-attached'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase", cfg.bg)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {job.status === 'draft' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'sent' })}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Send size={12} /> Send Estimate
                            </button>
                          )}
                          {job.status === 'sent' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'accepted' })}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Check size={12} /> Mark Accepted
                            </button>
                          )}
                          {job.status === 'sent' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'rejected' })}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <AlertCircle size={12} /> Mark Rejected
                            </button>
                          )}
                          
                          
                          <button className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors shadow-sm font-medium" title="Download File">
                            <DownloadCloud size={16} />
                          </button>

                          <a
                            href={`/admin/invoices/new?customer_id=${job.customer_id}&description=${encodeURIComponent(specs.product || 'Custom Job')}`}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Convert to Invoice"
                          >
                            <FileText size={16} />
                          </a>
                          
                          {(session?.user as any)?.role === 'admin' && (
                            <>
                              <Link href={`/admin/quotations/${job.id}/edit`}>
                                <button
                                  className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors shadow-sm font-medium"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </Link>
                              <button
                                onClick={async () => {
                                  if (await confirm({ title: 'Confirmation', message: `Delete this submission?`, variant: 'destructive' })) deleteMutation.mutate(job.id);
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
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
  );
}
