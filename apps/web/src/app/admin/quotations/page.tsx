'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, X, Check, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Quotation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  quotation_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string;
  valid_until: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-700' },
};

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
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
      toast.success('Status updated');
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
      toast.success('Quotation deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = quotations.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Quotations</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-medium">
            Create and manage price quotations
          </p>
        </div>
        <Link href="/admin/quotations/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold w-full sm:w-auto text-white">
            <Plus size={16} className="mr-2" /> New Quotation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = quotations.filter((q) => q.status === status).length;
          return (
            <Card key={status} className="border-none shadow-sm dark:bg-slate-900">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {cfg.label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search quotations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm dark:bg-slate-900 dark:border-slate-800"
        />
      </div>

      {/* Table / Card List */}
      <Card className="border-none shadow-sm overflow-hidden hidden md:block dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                {['Quotation #', 'Customer', 'Amount', 'Valid Until', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400 font-bold">
                    No quotations found
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const cfg = statusConfig[q.status];
                  const date = q.valid_until ? q.valid_until.split('T')[0] : '—';
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors group">
                      <td className="px-4 py-3 font-bold text-indigo-600 text-sm">
                        {q.quotation_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-sm">{q.customer_name}</p>
                        <p className="text-xs text-slate-500">{q.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-200 text-sm">
                        {fmt(q.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">{date}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            'border-none font-bold uppercase text-[10px] tracking-wider',
                            cfg.color
                          )}
                        >
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {q.status === 'draft' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: q.id, status: 'sent' })
                              }
                              className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <Send size={12} /> Send
                            </button>
                          )}
                          {q.status === 'sent' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: q.id, status: 'accepted' })
                              }
                              className="px-2 py-1 text-xs font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                            >
                              <Check size={12} /> Accept
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this quotation?')) deleteMutation.mutate(q.id);
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      </Card>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No quotations found</div>
        ) : (
          filtered.map((q) => {
            const cfg = statusConfig[q.status];
            const date = q.valid_until ? q.valid_until.split('T')[0] : '—';
            return (
              <Card key={q.id} className="border border-slate-100 dark:border-slate-800 shadow-none dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-indigo-600 text-sm">{q.quotation_number}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                        {q.customer_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{q.customer_email}</p>
                    </div>
                    <Badge
                      className={cn(
                        'border-none font-bold uppercase text-[10px] tracking-wider shadow-none px-2.5 py-1 rounded-full',
                        cfg.color
                      )}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Total Amount
                      </p>
                      <p className="font-black text-slate-800 dark:text-white text-sm">
                        {fmt(q.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                        Valid Until
                      </p>
                      <p className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                        {date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {q.status === 'draft' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'sent' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg border border-blue-200 transition-colors"
                      >
                        <Send size={13} /> Send
                      </button>
                    )}
                    {q.status === 'sent' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: q.id, status: 'accepted' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-green-50 text-green-600 rounded-lg border border-green-200 transition-colors"
                      >
                        <Check size={13} /> Accept
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete?')) deleteMutation.mutate(q.id);
                      }}
                      className="py-1.5 px-3 text-xs font-bold bg-red-50 text-red-500 rounded-lg border border-red-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
