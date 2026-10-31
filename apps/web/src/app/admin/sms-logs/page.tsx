'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Coins,
  Send,
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

export default function SmsLogsPage() {
  const [search, setSearch] = useState('');
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const { data, isLoading, refetch, isFetching } = useQuery<{ balance: number; logs: SmsLog[] }>({
    queryKey: ['sms-logs-page'],
    queryFn: async () => {
      const res = await fetch('/api/sms');
      if (!res.ok) throw new Error('Failed to load SMS data');
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 20000,
  });

  const logs = data?.logs || [];
  const balance = data?.balance ?? 0;

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
              <MessageSquare className="w-3.5 h-3.5" /> Arkesel SMS Delivery Gateway
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            SMS Transmission Logs &amp; History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time delivery logs of customer invoices, receipt dispatches, password resets, and alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Balance:</span>
            <span className="font-mono font-black text-sm">{balance}</span>
            <span className="text-[10px] text-amber-600 font-semibold">credits</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9 font-semibold gap-2 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            {isFetching ? 'Refreshing...' : 'Refresh Logs'}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-400">Total SMS Dispatched</span>
            <Send className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-2">
            {logs.length}
          </p>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-400">Live SMS Points</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400 mt-2">
            {balance}
          </p>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-400">Gateway Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 text-base">
            Connected &bull; Arkesel V2
          </p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by customer name, phone number, or message text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>
        <span className="text-xs font-medium text-slate-400">
          Showing {filteredLogs.length} recent messages
        </span>
      </div>

      {/* SMS Logs Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Recipient</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">Message Content</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Sent By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading SMS delivery logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
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
  );
}
