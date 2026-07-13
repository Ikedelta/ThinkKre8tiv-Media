'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const emptyForm = { name: '', email: '', phone: '', address: '', company: '', notes: '', industry: '', social_handle: '', birthday: '' };

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await fetch(`/api/customers?id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        company: customer.company || '',
        notes: customer.notes || '',
        industry: customer.industry || '',
        social_handle: customer.social_handle || '',
        birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Customer updated!');
      router.push('/admin/customers');
    },
    onError: () => toast.error('Failed to update customer'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading customer details...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#001F3F] transition-colors">
            <ArrowLeft size={16} /> Back to Customers
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[#001F3F] tracking-tight">Edit Customer</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Update details for {customer?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border border-slate-100 shadow-none">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-[#001F3F]">Contact Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Kofi Boateng"
                />
              </div>
              <div>
                <label className={labelClass}>Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Boateng & Co."
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+233 20 000 0000"
                />
              </div>
              <div>
                <label className={labelClass}>Industry / Niche</label>
                <input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Real Estate, Tech, Retail"
                />
              </div>
              <div>
                <label className={labelClass}>Social Media Handle</label>
                <input
                  value={form.social_handle}
                  onChange={(e) => setForm({ ...form, social_handle: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. @thinkkre8tiv"
                />
              </div>
              <div>
                <label className={labelClass}>Birthday / Anniversary</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
                placeholder="Street address, city, region"
              />
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Any additional notes about this customer..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button type="button" variant="outline" className="font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[#001F3F] hover:bg-[#002a52] font-bold px-8"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
