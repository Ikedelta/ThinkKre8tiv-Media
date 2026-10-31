'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Coins,
  Send,
  Users,
  Sparkles,
  Calendar,
  Gift,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface SmsLog {
  id: number;
  recipient_name?: string;
  recipient_phone: string;
  message: string;
  status: string;
  sent_by?: string;
  credits_used?: number;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  total_outstanding?: number | string;
}

const FESTIVE_TEMPLATES = [
  {
    title: 'Christmas & New Year Wish',
    icon: Gift,
    text: 'Dear Valued Client, Think Kre8tiv Media wishes you a Merry Christmas and a Prosperous New Year! Thank you for your continued trust and partnership.',
  },
  {
    title: 'Easter Blessings',
    icon: Sparkles,
    text: 'Happy Easter from all of us at Think Kre8tiv Media! May this season bring renewed success, joy, and peace to you and your enterprise.',
  },
  {
    title: 'Promo & Discount Announcement',
    icon: Calendar,
    text: 'Special Offer: Enjoy up to 20% discount on all premium branding, printing, and vehicle branding projects this month at Think Kre8tiv Media. Call 0244681391 to book.',
  },
  {
    title: 'Friendly Settlement Reminder',
    icon: FileText,
    text: 'Dear Client, this is a gentle reminder regarding your outstanding invoice with Think Kre8tiv Media. Kindly arrange settlement to facilitate seamless workflow. Thank you.',
  },
];

export default function SmsPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'logs'>('broadcast');
  const [search, setSearch] = useState('');
  
  // Broadcast Composer State
  const [targetAudience, setTargetAudience] = useState<'all' | 'outstanding' | 'custom'>('all');
  const [message, setMessage] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const queryClient = useQueryClient();

  // Fetch SMS data (live balance + logs)
  const { data: smsData, isLoading: isLoadingSms, refetch: refetchSms, isFetching } = useQuery<{
    balance: number;
    logs: SmsLog[];
  }>({
    queryKey: ['sms-logs-page'],
    queryFn: async () => {
      const res = await fetch('/api/sms');
      if (!res.ok) throw new Error('Failed to load SMS data');
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Fetch Customers for Audience Selection
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['sms-broadcast-customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to load customers');
      return res.json();
    },
    enabled: isAdmin,
  });

  const logs = smsData?.logs || [];
  const balance = smsData?.balance ?? 0;

  // Compute recipient list based on selection
  const validCustomers = useMemo(() => {
    return customers.filter((c) => c.phone && c.phone.trim().length >= 9);
  }, [customers]);

  const outstandingCustomers = useMemo(() => {
    return validCustomers.filter((c) => Number(c.total_outstanding || 0) > 0);
  }, [validCustomers]);

  const targetRecipients = useMemo(() => {
    if (targetAudience === 'all') {
      return validCustomers.map((c) => ({ name: c.name, phone: c.phone }));
    }
    if (targetAudience === 'outstanding') {
      return outstandingCustomers.map((c) => ({ name: c.name, phone: c.phone }));
    }
    // Custom selection
    return validCustomers
      .filter((c) => selectedCustomerIds.includes(c.id))
      .map((c) => ({ name: c.name, phone: c.phone }));
  }, [targetAudience, validCustomers, outstandingCustomers, selectedCustomerIds]);

  // Points & Credits Calculations
  const messageLength = message.length;
  // 1 GSM segment = 160 characters; concatenated SMS = 153 characters per segment
  const segmentsPerMessage = messageLength === 0 ? 0 : messageLength <= 160 ? 1 : Math.ceil(messageLength / 153);
  const totalRecipientsCount = targetRecipients.length;
  const totalCreditsNeeded = segmentsPerMessage * totalRecipientsCount;

  // Toggle selection for custom
  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedCustomerIds(validCustomers.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedCustomerIds([]);
  };

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (targetRecipients.length === 0) throw new Error('Please select at least one recipient.');
      if (!message.trim()) throw new Error('Message cannot be empty.');

      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targetRecipients,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch broadcast');
      return data;
    },
    onSuccess: (data) => {
      setFeedback({
        type: 'success',
        message: `Broadcast successfully sent to ${data.sent} recipient(s). Expended ${data.creditsUsed ?? totalCreditsNeeded} SMS credits.`,
      });
      queryClient.invalidateQueries({ queryKey: ['sms-logs-page'] });
      setMessage('');
      if (targetAudience === 'custom') setSelectedCustomerIds([]);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Error occurred while broadcasting.' });
    },
  });

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.recipient_name && log.recipient_name.toLowerCase().includes(q)) ||
      log.recipient_phone.includes(q) ||
      log.message.toLowerCase().includes(q) ||
      (log.sent_by && log.sent_by.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> SMS &amp; Customer Broadcasts
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Customer Broadcasts &amp; SMS History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast promotional updates, festive greetings, and system dispatches to all customers with real-time credit tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Live Balance:</span>
            <span className="font-mono font-black text-sm">{balance}</span>
            <span className="text-[10px] text-amber-600 font-semibold">credits</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSms()}
            disabled={isFetching}
            className="text-xs h-9 font-semibold gap-2 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
            activeTab === 'broadcast'
              ? 'border-[#E04D1B] text-[#E04D1B]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Send className="w-3.5 h-3.5" /> Compose Customer Broadcast
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
            activeTab === 'logs'
              ? 'border-[#E04D1B] text-[#E04D1B]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Clock className="w-3.5 h-3.5" /> SMS Delivery Logs &amp; Points ({logs.length})
        </button>
      </div>

      {/* TAB 1: Broadcast Composer */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Compose & Audience Form */}
          <div className="lg:col-span-2 space-y-6">
            {feedback && (
              <div
                className={cn(
                  'p-4 rounded-xl border text-xs font-semibold flex items-start justify-between gap-3',
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800'
                )}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-5">
                {/* 1. Audience Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                    1. Target Recipient Group
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetAudience('all')}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        targetAudience === 'all'
                          ? 'border-[#E04D1B] bg-orange-50/50 dark:bg-orange-950/20 text-[#E04D1B]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">All Customers</span>
                        <Users className="w-3.5 h-3.5 opacity-70" />
                      </div>
                      <p className="text-[11px] text-slate-500">{validCustomers.length} registered clients</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetAudience('outstanding')}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        targetAudience === 'outstanding'
                          ? 'border-[#E04D1B] bg-orange-50/50 dark:bg-orange-950/20 text-[#E04D1B]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">Debtors / Balances</span>
                        <FileText className="w-3.5 h-3.5 opacity-70" />
                      </div>
                      <p className="text-[11px] text-slate-500">{outstandingCustomers.length} with due amounts</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetAudience('custom')}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        targetAudience === 'custom'
                          ? 'border-[#E04D1B] bg-orange-50/50 dark:bg-orange-950/20 text-[#E04D1B]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">Custom Select</span>
                        <CheckSquare className="w-3.5 h-3.5 opacity-70" />
                      </div>
                      <p className="text-[11px] text-slate-500">{selectedCustomerIds.length} individually selected</p>
                    </button>
                  </div>
                </div>

                {/* Custom customer selection modal/picker if 'custom' is active */}
                {targetAudience === 'custom' && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Pick Individual Customers ({selectedCustomerIds.length} of {validCustomers.length} picked)
                      </span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={selectAllFiltered}
                          className="text-[#E04D1B] font-bold hover:underline"
                        >
                          Select All
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={deselectAll}
                          className="text-slate-500 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                      {validCustomers.map((c) => {
                        const isPicked = selectedCustomerIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleSelectCustomer(c.id)}
                            className={cn(
                              'flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors border',
                              isPicked
                                ? 'bg-orange-50 border-orange-200 text-slate-900 dark:bg-orange-950/30 dark:border-orange-900/60'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              {isPicked ? (
                                <CheckSquare className="w-4 h-4 text-[#E04D1B]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="font-bold">{c.name}</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500">{c.phone}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Message Composer */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      2. Message Text
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Sender ID: <span className="font-bold text-slate-700 dark:text-slate-200">ThinkKre8</span>
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your announcement, festival wish, or message here..."
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#E04D1B] leading-relaxed resize-y font-sans"
                  />

                  {/* Real-time characters and segments calculation */}
                  <div className="flex flex-wrap justify-between items-center mt-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-3">
                      <span>
                        Characters: <strong className="text-slate-800 dark:text-white font-mono">{messageLength}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Segments per client:{' '}
                        <strong className="text-[#E04D1B] font-mono">{segmentsPerMessage}</strong>{' '}
                        {segmentsPerMessage > 1 ? `(${segmentsPerMessage} credits / recipient)` : '(1 credit / recipient)'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Standard: 160 chars = 1 credit &bull; Multi-part: 153 chars/segment
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <Button
                    onClick={() => broadcastMutation.mutate()}
                    disabled={
                      broadcastMutation.isPending ||
                      targetRecipients.length === 0 ||
                      !message.trim() ||
                      totalCreditsNeeded > balance
                    }
                    className="w-full bg-[#E04D1B] hover:bg-[#c93f12] text-white font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {broadcastMutation.isPending
                      ? 'Dispatching SMS Broadcast...'
                      : `Dispatch Broadcast to ${totalRecipientsCount} Recipient(s) (${totalCreditsNeeded} Credits)`}
                  </Button>

                  {totalCreditsNeeded > balance && (
                    <p className="text-xs text-rose-600 font-bold mt-2 text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Insufficient credits: Requires {totalCreditsNeeded} credits, but current balance is {balance}.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Points Calculation & Festive Templates */}
          <div className="space-y-6">
            {/* Live Points Tracker Card */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Coins className="w-4 h-4 text-[#E04D1B]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Point &amp; Cost Estimation
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500">Recipients Count:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{totalRecipientsCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500">Credits Per Recipient:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{segmentsPerMessage} pt(s)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500">Total Points to Deduct:</span>
                    <span className="font-mono font-black text-[#E04D1B] text-sm">{totalCreditsNeeded} credits</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Estimated Balance After:</span>
                    <span
                      className={cn(
                        'font-mono font-black text-sm',
                        balance - totalCreditsNeeded >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {balance - totalCreditsNeeded} credits
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 p-3 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Each recipient is logged in the SMS audit logs with the exact points deducted for transparency.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Festive & Quick Templates */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Festive &amp; Campaign Presets
                  </h3>
                </div>

                <div className="space-y-2">
                  {FESTIVE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => setMessage(tmpl.text)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/40 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <tmpl.icon className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{tmpl.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{tmpl.text}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SMS Delivery Logs & Exact Points */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer name, phone number, or message text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              />
            </div>
            <span className="text-xs font-medium text-slate-400">
              Showing {filteredLogs.length} delivery records
            </span>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Recipient</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">Message Content</th>
                    <th className="px-5 py-3.5 text-center">Points / Credits</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Sent By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingSms ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading SMS transmission logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No SMS transmission logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                              {(log.recipient_name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {log.recipient_name || 'Customer'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {log.recipient_phone}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-md">
                          <p className="line-clamp-2 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            {log.message}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                            <Coins className="w-3 h-3 text-amber-600" />
                            {log.credits_used ?? 1} pt{(log.credits_used ?? 1) > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] uppercase font-bold">
                            {log.status || 'sent'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {log.sent_by || 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
