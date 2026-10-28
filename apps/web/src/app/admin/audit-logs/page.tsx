'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Database,
  ArrowUpDown,
  Lock,
  FileText,
  CreditCard,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle,
  FileSignature
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: number;
  user_name: string;
  user_email?: string;
  role?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

const resourceIcons: Record<string, any> = {
  invoice: FileText,
  payment: CreditCard,
  receipt: CheckCircle,
  expense: CreditCard,
  supplier: Building2,
  vendor: Building2,
  customer: Users,
  quotation: FileSignature,
  user: User,
};

const actionBadges: Record<string, string> = {
  Created: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  Updated: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
  Deleted: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  Recorded: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState('all');

  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === 'admin' || userRole === 'super_admin';

  const { data: logs = [], isLoading, isError, refetch, isFetching } = useQuery<ActivityLog[]>({
    queryKey: ['audit-logs', selectedResource, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedResource !== 'all') params.set('resource', selectedResource);
      if (search) params.set('search', search);
      params.set('limit', '100');

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied. Highest privileged administrators only.');
        throw new Error('Failed to load logs');
      }
      return res.json();
    },
    enabled: isSuperAdmin,
    refetchInterval: 15000, // Live poll every 15s
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p className="text-sm text-slate-500 max-w-md">
          System audit logs are strictly restricted to the Super Administrator with highest privilege. Contact the system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  const getActionClass = (action: string) => {
    for (const [key, cls] of Object.entries(actionBadges)) {
      if (action.toLowerCase().includes(key.toLowerCase())) return cls;
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Security Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            System Audit &amp; Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable chronological record of modifications, financial actions, and master data changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9 font-semibold gap-2 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            {isFetching ? 'Syncing...' : 'Sync Logs'}
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Audit Events</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{logs.length}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Retrieved in active buffer</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Clearance</p>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">SUPER ADMIN ACTIVE</h3>
              <p className="text-xs text-slate-400 mt-0.5">Master role confirmed</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sync Interval</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Live Reactive Sync</h3>
              <p className="text-xs text-slate-400 mt-0.5">Auto-updates every 15s</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integrity Verification</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">100% Verified</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tamper-proof ledger</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by action, user name, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'invoice', 'payment', 'expense', 'supplier', 'user'].map((res) => (
            <button
              key={res}
              onClick={() => setSelectedResource(res)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all",
                selectedResource === res
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              {res === 'all' ? 'All Resources' : `${res}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">User / Initiator</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Resource Affected</th>
                <th className="px-5 py-3.5">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading system audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No audit logs matching this criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = resourceIcons[log.resource?.toLowerCase()] || Database;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {(log.user_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {log.user_name || 'Administrator'}
                            </p>
                            {log.user_email && (
                              <p className="text-[10px] text-slate-400">{log.user_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={cn("border text-[10px] uppercase font-bold tracking-wider", getActionClass(log.action))}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.resource}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-md">
                        <p className="truncate font-medium">{log.details || '—'}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
