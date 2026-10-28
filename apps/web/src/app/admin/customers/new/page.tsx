'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Share2,
  Calendar,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company: '',
  notes: '',
  industry: '',
};

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
      router.push('/admin/customers');
    },
    onError: () => toast.error('Failed to create customer'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#D22630] transition-colors mb-1"
          >
            <ArrowLeft size={14} /> Back to Customer Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#D22630] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Plus size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                New Customer Account
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Add an individual or corporate client to your directory
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/customers">
            <Button type="button" variant="outline" className="border-slate-200 text-slate-700 text-xs font-semibold h-10 px-4">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold uppercase tracking-wider h-10 px-6 shadow-sm cursor-pointer"
          >
            <Save size={14} className="mr-1.5" />
            {createMutation.isPending ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Sections (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Primary Profile */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <User size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Primary Identity</h3>
                  <p className="text-[11px] text-slate-400">Basic contact and official billing entity details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                      placeholder="e.g. Kofi Boateng"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                      placeholder="e.g. Boateng & Co."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                      placeholder="kofi@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                      placeholder="+233 24 000 0000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Segmentation */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Briefcase size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Classification &amp; Location</h3>
                  <p className="text-[11px] text-slate-400">Industry classification and operational location</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Industry / Business Niche
                </label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                    placeholder="e.g. Retail, Real Estate, Banking, Media"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Physical / Billing Address
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none font-medium"
                    placeholder="e.g. Plot 14, Ring Road Central, Osu, Accra"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Notes */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <FileText size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Notes &amp; Special Preferences</h3>
                  <p className="text-[11px] text-slate-400">Internal notes visible only to staff and administrators</p>
                </div>
              </div>

              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D22630] focus:border-transparent outline-none resize-none font-normal"
                placeholder="Prefer offset spot colors, net 15 payment terms, requires CTP proofs before mass print..."
              />
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Preview & Submit (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/70 dark:bg-slate-900/60">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Summary</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  New Customer
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.company || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.phone || '—'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-[#D22630] hover:bg-[#b81d26] text-white font-bold text-xs uppercase tracking-wider h-11 shadow-sm cursor-pointer"
                >
                  <Save size={15} className="mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Create Customer Record'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </form>
    </div>
  );
}
