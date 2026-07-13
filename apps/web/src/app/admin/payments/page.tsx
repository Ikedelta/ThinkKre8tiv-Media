'use client';

import { useConfirm } from '@/components/providers/ConfirmProvider';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CheckCircle2, FileText, Download, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { DocumentViewer } from '@/components/DocumentViewer';

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: receipts = [], isLoading } = useQuery<any[]>({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: receiptDetails } = useQuery<any>({
    queryKey: ['receipt-details', selectedReceiptId],
    queryFn: async () => {
      if (!selectedReceiptId) return null;
      const res = await fetch(`/api/receipts?id=${selectedReceiptId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!selectedReceiptId,
    staleTime: 60000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const res = await fetch('/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status, approved_by: session?.user?.id || null }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt-details'] });
      toast.success('Payment updated successfully');
    },
    onError: () => toast.error('Failed to update payment'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/receipts?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Payment deleted successfully');
    },
    onError: () => toast.error('Failed to delete payment'),
  });

  const filtered = receipts.filter(r => 
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments & Receipts</h1>
          <p className="text-sm text-slate-500">View logged payments and issue receipts.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/payments/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus size={16} className="mr-2" /> Record Payment
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search payments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/4">Receipt No.</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading payments...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">No payments found.</td></tr>
                ) : (
                  filtered.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{receipt.receipt_number}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Inv: {receipt.invoice_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{receipt.customer_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{receipt.created_at?.split('T')[0]}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {fmt(receipt.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 capitalize">
                        {receipt.payment_method?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn(
                          'font-semibold border-none',
                          receipt.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          receipt.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        )}>
                          {receipt.approval_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedReceiptId(receipt.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold px-2"
                            title="View Receipt"
                          >
                            <FileText size={16} />
                          </Button>
                          {(session?.user as any)?.role === 'admin' && (
                            <>
                              <Link href={`/admin/payments/${receipt.id}/edit`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={async () => {
                                  if (await confirm({ title: 'Confirmation', message: `Delete this payment?`, variant: 'destructive' })) deleteMutation.mutate(receipt.id);
                                }}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedReceiptId && receiptDetails && (
        <DocumentViewer
          type="receipt"
          document={receiptDetails}
          onClose={() => setSelectedReceiptId(null)}
          onApprove={(id, status) => {
            approveMutation.mutate({ id, approval_status: status });
            setSelectedReceiptId(null);
          }}
          isAdmin={(session?.user as any)?.role === 'admin'}
        />
      )}
    </div>
  );
}
