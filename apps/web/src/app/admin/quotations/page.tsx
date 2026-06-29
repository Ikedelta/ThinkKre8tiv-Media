'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Trash2, CheckCircle2, Play, Check, Send, DownloadCloud, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  draft: { label: 'New Submission', dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20' },
  sent: { label: 'Proofing', dot: 'bg-purple-500', bg: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-500 dark:border-purple-500/20' },
  accepted: { label: 'Printing', dot: 'bg-yellow-500', bg: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20' },
  rejected: { label: 'Finishing', dot: 'bg-orange-500', bg: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20' },
  converted: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20' },
};

export default function SubmittedFilesPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

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

  const filtered = quotations.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const pendingJobs = quotations.filter(q => q.status !== 'converted').length;
  const newSubmissions = quotations.filter(q => q.status === 'draft').length;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-slate-300 font-sans p-6 lg:p-10 selection:bg-indigo-500/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Submitted Files & Jobs</h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage incoming customer designs and track production stages.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Total Submissions</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{quotations.length}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">New (Awaiting Review)</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{newSubmissions}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">In Production</p>
          <p className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{pendingJobs - newSubmissions}</p>
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
                <th className="px-6 py-4">Tracking Code</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Product Specs</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Production Stage</th>
                <th className="px-6 py-4">Advance Workflow</th>
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
                              <Play size={12} /> Start Proofing
                            </button>
                          )}
                          {job.status === 'sent' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'accepted' })}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white text-purple-600 dark:text-purple-500 border border-purple-200 dark:border-purple-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Check size={12} /> Send to Press
                            </button>
                          )}
                          {job.status === 'accepted' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'rejected' })}
                              className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-500 hover:text-yellow-900 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={12} /> Finish Post-Press
                            </button>
                          )}
                          {job.status === 'rejected' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'converted' })}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Send size={12} /> Mark Complete
                            </button>
                          )}
                          
                          <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Download File">
                            <DownloadCloud size={16} />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm('Delete this submission?')) deleteMutation.mutate(job.id);
                            }}
                            className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-100 dark:border-rose-500/20"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
  );
}
