'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  notes: string;
  invoice_count: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  created_at: string;
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => `GH₵${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Customers</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your client database</p>
        </div>
        <Link href="/admin/customers/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold w-full sm:w-auto text-white">
            <Plus size={16} className="mr-2" /> New Customer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Customers',
            value: customers.length,
            display: String(customers.length),
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20',
          },
          {
            label: 'Total Billed',
            value: customers.reduce((a, c) => a + Number(c.total_billed), 0),
            display: fmt(customers.reduce((a, c) => a + Number(c.total_billed), 0)),
            icon: DollarSign,
            color: 'text-green-600 bg-green-50 dark:bg-green-950/20',
          },
          {
            label: 'Total Paid',
            value: customers.reduce((a, c) => a + Number(c.total_paid), 0),
            display: fmt(customers.reduce((a, c) => a + Number(c.total_paid), 0)),
            icon: TrendingUp,
            color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20',
          },
          {
            label: 'Outstanding',
            value: customers.reduce((a, c) => a + Number(c.total_outstanding), 0),
            display: fmt(customers.reduce((a, c) => a + Number(c.total_outstanding), 0)),
            icon: AlertCircle,
            color: 'text-red-600 bg-red-50 dark:bg-red-950/20',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', stat.color)}>
                  <stat.icon size={18} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stat.display}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
      </div>

      {/* Customer Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Users size={40} className="opacity-40" />
          </div>
          <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No customers yet</p>
          <p className="text-sm mt-1">Add your first customer to get started</p>
          <Link href="/admin/customers/new">
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold text-white">
              <Plus size={16} className="mr-2" /> Add First Customer
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden dark:bg-slate-900"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0',
                        [
                          'bg-blue-500',
                          'bg-purple-500',
                          'bg-green-500',
                          'bg-indigo-500',
                          'bg-teal-500',
                          'bg-pink-500',
                        ][customer.name.charCodeAt(0) % 6]
                      )}
                    >
                      {customer.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm leading-tight">
                        {customer.name}
                      </h3>
                      {customer.company && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building2 size={10} className="text-slate-400" />
                          <p className="text-xs text-slate-500">{customer.company}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (confirm('Delete this customer?')) deleteMutation.mutate(customer.id);
                      }}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 bg-blue-50 dark:bg-blue-950/20 rounded flex items-center justify-center flex-shrink-0">
                        <Mail size={10} className="text-blue-500" />
                      </div>
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 bg-green-50 dark:bg-green-950/20 rounded flex items-center justify-center flex-shrink-0">
                        <Phone size={10} className="text-green-500" />
                      </div>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-950/20 rounded flex items-center justify-center flex-shrink-0">
                        <MapPin size={10} className="text-indigo-400" />
                      </div>
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                      <FileText size={9} /> Invoices
                    </p>
                    <p className="font-black text-slate-800 dark:text-white text-sm">{customer.invoice_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Paid</p>
                    <p className="font-black text-green-600 text-sm">{fmt(customer.total_paid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Owed</p>
                    <p
                      className={cn(
                        'font-black text-sm',
                        Number(customer.total_outstanding) > 0 ? 'text-red-500' : 'text-slate-450 dark:text-slate-500'
                      )}
                    >
                      {fmt(customer.total_outstanding)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
