'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

interface Quotation {
  id: string;
  customer_name: string;
  quotation_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function CustomerOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  
  useEffect(() => setMounted(true), []);

  const { data: orders = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: mounted,
  });

  if (!mounted) return null;

  // Filter out drafts (estimates) to only show converted "orders"
  const activeOrders = orders.filter(
    (q) => (q.status === 'accepted' || q.status === 'converted') && 
    (q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
     q.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] p-6 lg:p-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" /> Customer Orders
          </h1>
          <p className="text-slate-500 text-sm mt-1">View all accepted customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-[#080B12]">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Date Placed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No customer orders found.</td>
                </tr>
              ) : (
                activeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#0D121F] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{order.quotation_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300">{order.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">GH₵{Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/quotations/${order.id}/edit`}>
                          <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                            View Details
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
