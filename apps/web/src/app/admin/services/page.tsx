'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Trash2, Edit, Plus, AlertCircle, X, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: string | number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export default function ServicesPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    base_price: '',
    unit: 'unit',
    is_active: true
  });

  useEffect(() => setMounted(true), []);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: mounted,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingId ? 'PUT' : 'POST';
      const body = { ...formData, id: editingId, base_price: parseFloat(formData.base_price || '0') };
      const res = await fetch('/api/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(editingId ? 'Service updated successfully!' : 'Service created successfully!');
      closeModal();
    },
    onError: () => toast.error('Failed to save service'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service removed from catalog');
    },
    onError: () => toast.error('Failed to delete service'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const res = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...rest, is_active: !rest.is_active }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Status updated');
    },
  });

  if (!mounted) return null;

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeServices = services.filter(s => s.is_active).length;
  const categoriesCount = new Set(services.map(s => s.category)).size;

  const fmt = (n: any) => `GH₵${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || '',
      base_price: service.base_price.toString(),
      unit: service.unit || 'unit',
      is_active: service.is_active
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', category: '', description: '', base_price: '', unit: 'unit', is_active: true });
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-slate-300 font-sans p-6 lg:p-10 selection:bg-indigo-500/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Services & Products Catalog</h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage the printing services you offer to customers and set base pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} strokeWidth={3} /> New Service
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Total Offerings</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{services.length}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Active Now</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{activeServices}</p>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Categories</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{categoriesCount}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search catalog by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-500/50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all shadow-sm dark:shadow-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-[#080B12]">
              <tr>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Base Pricing</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                      <Package size={24} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No services found</p>
                    <p className="text-xs text-slate-500 mt-1">Click the "New Service" button to add one.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-[#0D121F] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 dark:text-slate-200 mb-0.5">{service.name}</div>
                      <div className="text-xs text-slate-500 max-w-[300px] truncate">{service.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold tracking-wider">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 dark:text-slate-200">{fmt(service.base_price)}</div>
                      <div className="text-[10px] font-medium text-slate-500">per {service.unit}</div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleStatusMutation.mutate(service)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors border",
                          service.is_active 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" 
                            : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", service.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                        {service.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEdit(service)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${service.name}" from the catalog?`)) deleteMutation.mutate(service.id);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add / Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Service' : 'New Service'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Service Name</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Premium Business Cards"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Stationery, Large Format..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Base Price (GH₵)</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Unit</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. unit, 100pcs, sqft"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Brief details about what is included..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06080D] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editingId ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
