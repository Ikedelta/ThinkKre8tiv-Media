'use client';

import { useConfirm } from '@/components/providers/ConfirmProvider';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Calendar, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesPage() {
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const { data: expenses = [], isLoading } = useQuery<any[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const filtered = expenses.filter(e => 
    e.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.account_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-slate-500">Track and manage your outgoing cash flow.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/expenses/new">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold">
              <Plus size={16} className="mr-2" /> Log Expense
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search vendor, category, notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Vendor (Payee)</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading expenses...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium bg-slate-50/50">No expenses recorded yet.</td></tr>
                ) : (
                  filtered.map(expense => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {expense.date?.split('T')[0]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{expense.vendor_name || 'N/A'}</div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">{expense.payment_method?.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {expense.account_name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-xs">
                        {expense.notes || '-'}
                      </td>
                      <td className="px-6 py-4 font-black text-rose-600 text-right">
                        {fmt(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(session?.user as any)?.role === 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/expenses/${expense.id}/edit`}>
                              <button
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shadow-sm font-medium"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            </Link>
                            <button
                              onClick={async () => {
                                if (await confirm({ title: 'Confirmation', message: `Delete this expense?`, variant: 'destructive' })) deleteMutation.mutate(expense.id);
                              }}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
