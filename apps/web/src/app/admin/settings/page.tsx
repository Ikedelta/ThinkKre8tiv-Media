'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Building2, CreditCard, MessageSquare, Globe, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Settings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  currency: string;
  currency_code: string;
  vat_rate: number;
  invoice_prefix: string;
  quotation_prefix: string;
  receipt_prefix: string;
  sms_api_key: string;
  sms_sender_id: string;
  website_tagline: string;
  website_about: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
}

const defaultSettings: Settings = {
  company_name: 'Think Kre8tiv Media',
  company_email: 'hello@thinkkre8tivmedia.com',
  company_phone: '+233 20 000 0000',
  company_address: 'OSU haramani Sport complex',
  currency: 'GH₵',
  currency_code: 'GHS',
  vat_rate: 15.0,
  invoice_prefix: 'TK-INV',
  quotation_prefix: 'TK-QT',
  receipt_prefix: 'TK-RCT',
  sms_api_key: '',
  sms_sender_id: 'ThinkKr8',
  website_tagline: 'Premium Printing & Branding Studio',
  website_about: "Think Kre8tiv Media is Ghana's premier printing and branding agency.",
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  useEffect(() => {
    if (settings && !loaded) {
      setForm({ ...defaultSettings, ...settings });
      setLoaded(true);
    }
  }, [settings, loaded]);

  const saveMutation = useMutation({
    mutationFn: async (data: Settings) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const update = (key: keyof Settings, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const labelClass = 'text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5';
  const inputClass =
    'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-black text-[#001F3F]">
            Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Configure your system preferences</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(form)}
          className="bg-blue-600 hover:bg-blue-700 font-bold"
          disabled={saveMutation.isPending}
        >
          <Save size={16} className="mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Company Info */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <Building2 size={16} className="text-blue-600" /> Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.company_email}
                onChange={(e) => update('company_email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                value={form.company_phone}
                onChange={(e) => update('company_phone', e.target.value)}
                className={inputClass}
                placeholder="+233 20 000 0000"
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                value={form.company_address}
                onChange={(e) => update('company_address', e.target.value)}
                className={inputClass}
                placeholder="OSU haramani Sport complex"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <CreditCard size={16} className="text-blue-600" /> Billing & Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Currency Symbol</label>
              <input
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className={inputClass}
                placeholder="GH₵"
              />
            </div>
            <div>
              <label className={labelClass}>Currency Code</label>
              <input
                value={form.currency_code}
                onChange={(e) => update('currency_code', e.target.value)}
                className={inputClass}
                placeholder="GHS"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <Percent size={11} /> VAT Rate (%)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.vat_rate}
                onChange={(e) => update('vat_rate', parseFloat(e.target.value) || 0)}
                className={inputClass}
                placeholder="15.0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ghana standard VAT is 15%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Invoice Prefix</label>
              <input
                value={form.invoice_prefix}
                onChange={(e) => update('invoice_prefix', e.target.value)}
                className={inputClass}
                placeholder="TK-INV"
              />
            </div>
            <div>
              <label className={labelClass}>Quotation Prefix</label>
              <input
                value={form.quotation_prefix}
                onChange={(e) => update('quotation_prefix', e.target.value)}
                className={inputClass}
                placeholder="TK-QT"
              />
            </div>
            <div>
              <label className={labelClass}>Receipt Prefix</label>
              <input
                value={form.receipt_prefix}
                onChange={(e) => update('receipt_prefix', e.target.value)}
                className={inputClass}
                placeholder="TK-RCT"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Settings */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <MessageSquare size={16} className="text-blue-600" /> SMS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SMS Sender ID</label>
              <input
                value={form.sms_sender_id}
                onChange={(e) => update('sms_sender_id', e.target.value)}
                className={inputClass}
                placeholder="ThinkKr8"
              />
              <p className="text-[10px] text-slate-400 mt-1">Max 11 characters</p>
            </div>
            <div>
              <label className={labelClass}>SMS API Key</label>
              <input
                type="password"
                value={form.sms_api_key}
                onChange={(e) => update('sms_api_key', e.target.value)}
                className={inputClass}
                placeholder="Your SMS provider API key"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website / Social */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <Globe size={16} className="text-blue-600" /> Website & Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <label className={labelClass}>Website Tagline</label>
            <input
              value={form.website_tagline}
              onChange={(e) => update('website_tagline', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>About Us Text</label>
            <textarea
              value={form.website_about}
              onChange={(e) => update('website_about', e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'social_facebook', label: 'Facebook URL' },
              { key: 'social_instagram', label: 'Instagram URL' },
              { key: 'social_twitter', label: 'Twitter / X URL' },
              { key: 'social_linkedin', label: 'LinkedIn URL' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  value={form[key as keyof Settings] as string}
                  onChange={(e) => update(key as keyof Settings, e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          className="bg-blue-600 hover:bg-blue-700 font-bold px-8"
          disabled={saveMutation.isPending}
        >
          <Save size={16} className="mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
