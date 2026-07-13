'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  FileText, 
  Search, 
  Printer, 
  CheckCircle2, 
  Scissors, 
  Package,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

interface Job {
  id: string;
  customer_name: string;
  quotation_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  total_amount: number;
  created_at: string;
}

const STAGES = [
  { id: 'sent', label: 'Proofing', icon: FileText, color: 'border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400' },
  { id: 'accepted', label: 'Printing', icon: Printer, color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400' },
  { id: 'rejected', label: 'Finishing', icon: Scissors, color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400' },
  { id: 'converted', label: 'Completed', icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400' },
];

export default function JobsBoardPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
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
      toast.success('Job moved to new stage!');
    },
    onError: () => toast.error('Failed to move job'),
  });

  if (!mounted) return null;

  // Filter out drafts (they are just quotes, not active jobs)
  const activeJobs = jobs.filter(
    (q) => q.status !== 'draft' && 
    (q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
     q.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] p-6 lg:p-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-500" /> Print Jobs Board
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track the production stage of active orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white w-64"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageJobs = activeJobs.filter(j => j.status === stage.id);
            return (
              <div key={stage.id} className="flex flex-col gap-4 min-w-[280px]">
                <div className={cn("px-4 py-3 rounded-lg border flex items-center justify-between shadow-sm", stage.color)}>
                  <div className="flex items-center gap-2">
                    <stage.icon className={cn("w-4 h-4", stage.text)} />
                    <h2 className={cn("font-semibold text-sm", stage.text)}>{stage.label}</h2>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-black/20", stage.text)}>
                    {stageJobs.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {stageJobs.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      No jobs here
                    </div>
                  ) : (
                    stageJobs.map((job) => (
                      <div key={job.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                            {job.quotation_number}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            GH₵{Number(job.total_amount).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                          {job.customer_name}
                        </h3>
                        
                        {/* Quick Actions to move job */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <select 
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500"
                            value={job.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: job.id, status: e.target.value })}
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id}>Move to {s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
