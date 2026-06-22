'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Plus, MessageSquare, Users, CheckCircle2, X, Phone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SmsLog {
  id: string;
  recipient_name: string | null;
  recipient_phone: string;
  message: string;
  status: string;
  sent_by: string;
  credits_used: number;
  created_at: string;
}
interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

const TEMPLATES = [
  {
    label: 'Invoice Ready',
    text: 'Dear {name}, your invoice from Think Kre8tive is ready. Please contact us to arrange payment. Thank you!',
  },
  {
    label: 'Order Ready',
    text: 'Dear {name}, great news! Your order is complete and ready for pickup/delivery. Call +233 20 000 0000. Think Kre8tive.',
  },
  {
    label: 'Payment Reminder',
    text: 'Dear {name}, this is a friendly reminder that your invoice is due. Please arrange payment at your earliest convenience. Think Kre8tive.',
  },
  {
    label: 'Quotation Ready',
    text: 'Dear {name}, your quotation from Think Kre8tive is ready for review. Call or visit us to discuss. Thank you!',
  },
  {
    label: 'Promotion',
    text: 'Hi {name}! 🎉 Think Kre8tive has a special offer this month. Get 10% off all large format prints. Call +233 20 000 0000.',
  },
];

export default function SmsPage() {
  const [message, setMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [mode, setMode] = useState<'customers' | 'manual' | 'all'>('customers');
  const [todayStr, setTodayStr] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const { data, isLoading } = useQuery<{ balance: number; logs: SmsLog[] }>({
    queryKey: ['sms'],
    queryFn: async () => {
      const res = await fetch('/api/sms');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sms'] });
      toast.success(`SMS sent to ${data.sent} recipient(s)!`);
      setMessage('');
      setSelectedCustomers([]);
      setManualPhone('');
      setManualName('');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send SMS'),
  });

  const topupMutation = useMutation({
    mutationFn: async (credits: number) => {
      const res = await fetch('/api/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sms'] });
      toast.success(`Credits added! New balance: ${data.balance}`);
      setShowTopup(false);
      setTopupAmount('');
    },
    onError: () => toast.error('Failed to add credits'),
  });

  const customersWithPhone = customers.filter((c) => c.phone);

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    let recipients: { name?: string; phone: string }[] = [];
    if (mode === 'customers') {
      recipients = customersWithPhone
        .filter((c) => selectedCustomers.includes(c.id))
        .map((c) => ({ name: c.name, phone: c.phone! }));
    } else if (mode === 'manual') {
      if (!manualPhone) {
        toast.error('Enter a phone number');
        return;
      }
      recipients = [{ name: manualName || undefined, phone: manualPhone }];
    } else {
      recipients = customersWithPhone.map((c) => ({ name: c.name, phone: c.phone! }));
    }
    if (recipients.length === 0) {
      toast.error('No recipients selected');
      return;
    }
    sendMutation.mutate({ recipients, message });
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const balance = data?.balance ?? 0;
  const logs = data?.logs ?? [];
  const todaySent = todayStr ? logs.filter((l) => l.created_at?.startsWith(todayStr)).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-black text-[#001F3F]">
            SMS Center
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Send SMS messages to customers</p>
        </div>
        <Button onClick={() => setShowTopup(true)} variant="outline" className="font-bold border-2">
          <Plus size={16} className="mr-2" /> Top Up Credits
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-blue-50">
                <Zap size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Balance</p>
            <p
              className={cn(
                'text-2xl font-black',
                balance < 20 ? 'text-red-500' : 'text-[#001F3F]'
              )}
            >
              {balance}
            </p>
            {balance < 20 && <p className="text-[10px] text-red-400 font-bold">Low balance!</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-green-50">
                <Send size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sent Today</p>
            <p className="text-2xl font-black text-[#001F3F]">{todaySent}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-purple-50">
                <MessageSquare size={16} className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sent</p>
            <p className="text-2xl font-black text-[#001F3F]">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <Card className="border-none shadow-sm lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-[#001F3F]">
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Mode */}
            <div className="flex gap-2">
              {(['customers', 'manual', 'all'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all',
                    mode === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  )}
                >
                  {m === 'customers'
                    ? 'Select Customers'
                    : m === 'manual'
                      ? 'Manual'
                      : 'All Customers'}
                </button>
              ))}
            </div>

            {/* Recipients */}
            {mode === 'manual' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                    Name
                  </label>
                  <input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Recipient name"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                    Phone *
                  </label>
                  <input
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+233 20 000 0000"
                  />
                </div>
              </div>
            )}

            {mode === 'customers' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Select Customers ({selectedCustomers.length} selected)
                  </label>
                  <button
                    onClick={() =>
                      setSelectedCustomers(
                        selectedCustomers.length === customersWithPhone.length
                          ? []
                          : customersWithPhone.map((c) => c.id)
                      )
                    }
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {selectedCustomers.length === customersWithPhone.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {customersWithPhone.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 text-center">
                      No customers with phone numbers
                    </p>
                  ) : (
                    customersWithPhone.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(c.id)}
                          onChange={() => toggleCustomer(c.id)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-slate-700">{c.name}</span>
                        <span className="text-xs text-slate-400 ml-auto">{c.phone}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {mode === 'all' && (
              <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                <Users size={14} className="text-blue-600" />
                <p className="text-sm font-bold text-blue-700">
                  Will send to {customersWithPhone.length} customers with phone numbers
                </p>
              </div>
            )}

            {/* Templates */}
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
                Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setMessage(t.text)}
                    className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-full text-slate-600 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Message *
                </label>
                <span
                  className={cn(
                    'text-xs font-bold',
                    message.length > 160 ? 'text-red-500' : 'text-slate-400'
                  )}
                >
                  {message.length}/160
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Type your message... Use {name} to personalize."
              />
            </div>

            <Button
              onClick={handleSend}
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={sendMutation.isPending || balance === 0}
            >
              <Send size={16} className="mr-2" />
              {sendMutation.isPending
                ? 'Sending...'
                : `Send SMS ${balance === 0 ? '(No credits)' : ''}`}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-montserrat font-bold text-[#001F3F]">
              Recent SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-xl" />
                  ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No messages sent yet</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-bold text-slate-900 text-xs">
                          {log.recipient_name || log.recipient_phone}
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          'border-none text-[9px] font-bold',
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        <CheckCircle2 size={10} className="mr-0.5" />
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{log.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {log.created_at?.split('T')[0]} · by {log.sent_by}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topup Modal */}
      {showTopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-montserrat font-black text-lg text-[#001F3F]">
                Top Up SMS Credits
              </h2>
              <button
                onClick={() => setShowTopup(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Current balance: <strong className="text-[#001F3F]">{balance} credits</strong>
              </p>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Credits to Add
                </label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  min={1}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="flex gap-2">
                {[100, 500, 1000].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopupAmount(String(n))}
                    className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowTopup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => topupAmount && topupMutation.mutate(parseInt(topupAmount))}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
                  disabled={topupMutation.isPending || !topupAmount}
                >
                  {topupMutation.isPending ? 'Adding...' : 'Add Credits'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
