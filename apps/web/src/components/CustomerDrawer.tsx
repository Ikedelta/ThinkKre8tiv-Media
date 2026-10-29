'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Receipt as ReceiptIcon,
  FileSignature,
  Activity,
  CreditCard,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Edit2,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  Briefcase,
  Cake,
  Share2,
  X,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

interface CustomerDrawerProps {
  customerId: string | null;
  onClose: () => void;
  onViewDocument?: (doc: any, type: 'invoice' | 'receipt' | 'quotation') => void;
}

export function CustomerDrawer({ customerId, onClose, onViewDocument }: CustomerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'receipts' | 'invoices' | 'quotations' | 'activities' | 'info'>('receipts');
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['customer_engagements', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers?id=${customerId}&engagements=true`);
      if (!res.ok) throw new Error('Failed to load customer profile');
      return res.json();
    },
    enabled: !!customerId,
  });

  const smsMutation = useMutation({
    mutationFn: async (payload: { recipients: { phone: string; name?: string }[], message: string }) => {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to send SMS');
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_engagements', customerId] });
      queryClient.invalidateQueries({ queryKey: ['sms_balance'] });
      toast.success('SMS sent successfully!');
      setSmsMessage('');
      setIsSendingSMS(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send SMS');
    }
  });

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.phone) {
      toast.error('Customer has no phone number on record.');
      return;
    }
    if (!smsMessage.trim()) return;

    smsMutation.mutate({
      recipients: [{ phone: customer.phone, name: customer.name }],
      message: smsMessage.trim(),
    });
  };

  const customer = data?.customer;
  const invoices = data?.invoices || [];
  const receipts = data?.receipts || [];
  const quotations = data?.quotations || [];
  const activities = data?.activities || [];

  const fmt = (n: number | string) =>
    `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalBilled = Number(customer?.total_billed || 0);
  const totalPaid = Number(customer?.total_paid || 0);
  const totalOutstanding = Number(customer?.total_outstanding || 0);

  return (
    <Sheet open={!!customerId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans"
      >
        {/* Top Header Banner */}
        <SheetHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ) : customer ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    'w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0',
                    [
                      'bg-gradient-to-tr from-[#D22630] to-rose-400',
                      'bg-gradient-to-tr from-indigo-600 to-purple-500',
                      'bg-gradient-to-tr from-emerald-600 to-teal-400',
                      'bg-gradient-to-tr from-amber-600 to-yellow-400',
                      'bg-gradient-to-tr from-blue-600 to-cyan-400',
                    ][customer.name.charCodeAt(0) % 5]
                  )}
                >
                  {customer.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {customer.name}
                    </SheetTitle>
                    {totalOutstanding > 0 ? (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900 text-[10px] font-bold">
                        Pending Balance
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[10px] font-bold">
                        Settled
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {customer.company && (
                      <span className="flex items-center gap-1 font-medium">
                        <Building2 size={12} className="text-slate-400" />
                        {customer.company}
                      </span>
                    )}
                    {customer.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} className="text-slate-400" />
                        {customer.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {customer.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSendingSMS(!isSendingSMS)}
                    className="h-8 text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <MessageSquare size={13} className="text-[#E04D1B]" />
                    <span>SMS</span>
                  </Button>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Mail size={13} className="mr-1.5 text-blue-500" />
                    Email
                  </a>
                )}
                {isAdmin && (
                  <Link href={`/admin/customers/${customer.id}/edit`}>
                    <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {/* Quick SMS Drawer Bar */}
          {isSendingSMS && customer?.phone && (
            <form onSubmit={handleSendSMS} className="mt-4 p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-[#E04D1B]" /> Send SMS to {customer.phone}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSendingSMS(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type your SMS message here..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#E04D1B]"
                required
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSendingSMS(false)}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={smsMutation.isPending}
                  className="bg-[#E04D1B] hover:bg-[#c43e14] text-white text-xs h-7 font-bold gap-1"
                >
                  <Send size={11} /> {smsMutation.isPending ? 'Sending...' : 'Send Now'}
                </Button>
              </div>
            </form>
          )}

          {/* Engagement Financial Metrics - Restricted to Admin */}
          {customer && isAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{fmt(totalBilled)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
                <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(totalPaid)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding</p>
                <p className={cn(
                  "text-sm sm:text-base font-extrabold mt-0.5",
                  totalOutstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
                )}>
                  {fmt(totalOutstanding)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoices Issued</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{invoices.length}</p>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 overflow-x-auto flex-shrink-0">
          {[
            { id: 'receipts', label: 'Receipts', icon: ReceiptIcon, count: receipts.length },
            { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
            { id: 'quotations', label: 'Estimates', icon: FileSignature, count: quotations.length },
            ...(isAdmin ? [{ id: 'activities', label: 'Activity Timeline', icon: Activity, count: activities.length }] : []),
            { id: 'info', label: 'Client Profile', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-[#E04D1B] text-[#E04D1B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                  activeTab === tab.id
                    ? "bg-[#E04D1B]/15 text-[#E04D1B]"
                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* TAB 1: RECEIPTS */}
              {activeTab === 'receipts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Receipts ({receipts.length})
                    </span>
                    <Link href={`/admin/payments/new?customer_id=${customer?.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-slate-700">
                        Record Payment
                      </Button>
                    </Link>
                  </div>

                  {receipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <ReceiptIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No payment receipts yet</p>
                      <p className="text-xs text-slate-500 mt-0.5">Receipts issued upon client payment will appear here.</p>
                    </div>
                  ) : (
                    receipts.map((rcpt: any) => (
                      <div
                        key={rcpt.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {rcpt.receipt_number}
                            </span>
                            {rcpt.approval_status === 'approved' ? (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px]">
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px]">
                                {rcpt.approval_status || 'Pending'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {new Date(rcpt.payment_date || rcpt.created_at).toLocaleDateString()}
                            </span>
                            <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                              {rcpt.payment_method?.replace('_', ' ') || 'Cash / Bank'}
                            </span>
                            {rcpt.invoice_number && (
                              <span className="text-slate-400">
                                Ref: #{rcpt.invoice_number}
                              </span>
                            )}
                          </div>
                          {rcpt.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                              "{rcpt.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {fmt(rcpt.amount)}
                          </span>
                          {onViewDocument && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewDocument(rcpt, 'receipt')}
                              className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-slate-700"
                            >
                              <Printer size={12} /> View Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: INVOICES */}
              {activeTab === 'invoices' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Billed Invoices ({invoices.length})
                    </span>
                    <Link href={`/admin/invoices/new?customer_id=${customer?.id}`}>
                      <Button size="sm" className="h-7 text-xs font-bold bg-[#E04D1B] hover:bg-[#c43e14] text-white">
                        Create Invoice
                      </Button>
                    </Link>
                  </div>

                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No invoices generated</p>
                      <p className="text-xs text-slate-500 mt-0.5">Commercial print invoices for this client will appear here.</p>
                    </div>
                  ) : (
                    invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {inv.invoice_number}
                            </span>
                            <span className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' :
                              inv.status === 'partial' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' :
                              'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            )}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {new Date(inv.created_at).toLocaleDateString()}
                            </span>
                            {inv.due_date && (
                              <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              {fmt(inv.total_amount)}
                            </p>
                            {Number(inv.balance_due) > 0 && (
                              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                Due: {fmt(inv.balance_due)}
                              </p>
                            )}
                          </div>
                          {onViewDocument && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewDocument(inv, 'invoice')}
                              className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-slate-700"
                            >
                              <Printer size={12} /> View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ESTIMATES / QUOTATIONS */}
              {activeTab === 'quotations' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Print Estimates ({quotations.length})
                    </span>
                    <Link href={`/admin/quotations/new?customer_id=${customer?.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-slate-300 dark:border-slate-700">
                        New Estimate
                      </Button>
                    </Link>
                  </div>

                  {quotations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <FileSignature className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No estimates logged</p>
                      <p className="text-xs text-slate-500 mt-0.5">Prepress quotes and fabrication estimates will show here.</p>
                    </div>
                  ) : (
                    quotations.map((qt: any) => (
                      <div
                        key={qt.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {qt.quotation_number}
                            </span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                              {qt.status || 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Created: {new Date(qt.created_at).toLocaleDateString()}</span>
                            {qt.valid_until && (
                              <span>Valid to: {new Date(qt.valid_until).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {fmt(qt.total_amount)}
                          </span>
                          {onViewDocument && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewDocument(qt, 'quotation')}
                              className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-slate-700"
                            >
                              <Printer size={12} /> View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY TIMELINE (ADMIN ONLY) */}
              {activeTab === 'activities' && isAdmin && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Audit Trail & Interaction History
                    </span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No logged activity</p>
                      <p className="text-xs text-slate-500 mt-0.5">System operations relating to this client will be recorded automatically.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {activities.map((act: any) => (
                        <div key={act.id} className="relative group">
                          <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-[#E04D1B] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E04D1B]" />
                          </div>
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                {act.action}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(act.created_at).toLocaleString()}
                              </span>
                            </div>
                            {act.details && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {act.details}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                              <span>By: {act.user_name || act.user_email || 'System'}</span>
                              <span>&bull;</span>
                              <span className="uppercase font-semibold">{act.resource}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CLIENT PROFILE DETAILS */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.email || 'None on record'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.phone || 'None on record'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Company / Organization</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.company || 'Individual client'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Industry</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.industry || 'General commercial'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Physical Address</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.address || 'No address provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Operational & Print Preferences
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-2">
                    <span>Client ID: {customer.id}</span>
                    <span>Added: {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

