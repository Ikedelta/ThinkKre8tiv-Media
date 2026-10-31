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
  nhil_rate: number;
  invoice_prefix: string;
  quotation_prefix: string;
  receipt_prefix: string;
  sms_api_key: string;
  sms_sender_id: string;
  resend_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from_name?: string;
  smtp_from_email?: string;
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
  company_phone: '+233 24 468 1391',
  company_address: 'Accra OSU, Haramani Sport',
  currency: 'GH₵',
  currency_code: 'GHS',
  vat_rate: 15.0,
  nhil_rate: 5.0,
  invoice_prefix: 'TK-INV',
  quotation_prefix: 'TK-QT',
  receipt_prefix: 'TK-RCT',
  sms_api_key: '',
  sms_sender_id: 'ThinkKr8',
  resend_api_key: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  smtp_from_name: 'Think Kre8tiv Media',
  smtp_from_email: '',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div>
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
              <p className="text-[10px] text-slate-400 mt-1">Ghana standard VAT (15%)</p>
            </div>
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <Percent size={11} /> NHIL Rate (%)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.nhil_rate}
                onChange={(e) => update('nhil_rate', parseFloat(e.target.value) || 0)}
                className={inputClass}
                placeholder="5.0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ghana standard NHIL (5%)</p>
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

      {/* SMTP & Resend Email Configuration */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <Globe size={16} className="text-emerald-600" /> Resend &amp; Email Dispatch (Staff Invitations &amp; System Alerts)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Configure Resend or custom SMTP to power invitations, document dispatches, and alerts. When an API key is entered, the system routes directly through the official Resend SDK.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Resend API Key (Recommended)
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Fast &amp; Reliable</span>
            </div>
            <input
              type="password"
              value={form.resend_api_key || ''}
              onChange={(e) => update('resend_api_key', e.target.value)}
              className={inputClass}
              placeholder="re_1234567890abcdef..."
            />
            <p className="text-[11px] text-slate-500">
              Create an API key in your <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Resend Dashboard</a>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sender Display Name</label>
              <input
                value={form.smtp_from_name || ''}
                onChange={(e) => update('smtp_from_name', e.target.value)}
                className={inputClass}
                placeholder="Think Kre8tiv Media"
              />
            </div>
            <div>
              <label className={labelClass}>Sender Email Address</label>
              <input
                value={form.smtp_from_email || ''}
                onChange={(e) => update('smtp_from_email', e.target.value)}
                className={inputClass}
                placeholder="notifications@thinkkre8tivmedia.com"
              />
              <p className="text-[10px] text-slate-400 mt-1">Must be on your verified Resend domain</p>
            </div>
          </div>

          <details className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <summary className="cursor-pointer font-bold text-slate-700 hover:text-blue-600 mb-3">
              Optional: Custom SMTP Server Fallback (if not using Resend)
            </summary>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>SMTP Host</label>
                  <input
                    value={form.smtp_host || ''}
                    onChange={(e) => update('smtp_host', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>SMTP Port</label>
                  <input
                    type="number"
                    value={form.smtp_port || 587}
                    onChange={(e) => update('smtp_port', parseInt(e.target.value) || 587)}
                    className={inputClass}
                    placeholder="587 or 465"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SMTP Username / Email</label>
                  <input
                    value={form.smtp_user || ''}
                    onChange={(e) => update('smtp_user', e.target.value)}
                    className={inputClass}
                    placeholder="notifications@thinkkre8tivmedia.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>SMTP Password / App Password</label>
                  <input
                    type="password"
                    value={form.smtp_password || ''}
                    onChange={(e) => update('smtp_password', e.target.value)}
                    className={inputClass}
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>
            </div>
          </details>
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
