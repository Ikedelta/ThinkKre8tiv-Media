import React from 'react';
import { CheckCircle2, XCircle, Edit2, MessageSquare, Download, X, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DocumentViewerProps {
  type: 'invoice' | 'receipt' | 'quotation';
  document: any;
  onClose?: () => void;
  onApprove?: (id: string, status: string) => void;
  onEdit?: () => void;
  onSendSMS?: () => void;
  isAdmin?: boolean;
  isSMSPending?: boolean;
  inline?: boolean;
}

export function DocumentViewer({ 
  type, 
  document, 
  onClose, 
  onApprove, 
  onEdit, 
  onSendSMS,
  isAdmin = false,
  isSMSPending = false,
  inline = false
}: DocumentViewerProps) {
  if (!document) return null;

  const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusConfig: Record<string, { color: string; label: string }> = {
    unpaid: { color: 'bg-rose-100 text-rose-700', label: 'Unpaid' },
    partial: { color: 'bg-amber-100 text-amber-700', label: 'Partial' },
    paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
    draft: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' }
  };

  const statusObj = statusConfig[document.status] || { color: 'bg-slate-100 text-slate-700', label: document.status || 'Unknown' };

  const content = (
    <div className={cn("bg-white shadow-2xl w-full max-w-[800px] relative flex flex-col shrink-0 print:shadow-none print:w-full print:max-w-none print:min-w-0 print:min-h-0 print:m-0 rounded-xl sm:rounded-none overflow-hidden sm:overflow-visible", inline ? "mx-auto border border-slate-200" : "my-auto")} style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>

            
            {/* Print Area */}
            <div className="flex-1 flex flex-col text-slate-800 relative bg-white">
              
              {/* Watermark & PAID Stamp */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
                <img src="/logo.png" alt="Watermark" className="w-[600px] h-[600px] object-contain grayscale" />
              </div>
              {document.status === 'paid' && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-0 opacity-10">
                  <div className="text-[120px] font-black text-emerald-500 border-[8px] border-emerald-500 rounded-xl px-12 py-4 uppercase tracking-widest">PAID</div>
                </div>
              )}

              {/* Header Section */}
              <div className="relative z-10">
                <div className="h-2 w-full bg-slate-800 print:bg-slate-800"></div>
                <div className="p-6 sm:p-12 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 print:flex-row print:p-12">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <img src="/logo.png" alt="Think Kre8tiv Media Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain print:w-20 print:h-20" />
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none mb-3 sm:mb-4 print:text-2xl uppercase">THINK KRE8TIV MEDIA</h3>
                      <div className="space-y-0.5 text-[10px] text-slate-500 font-medium">
                        <p>OSU haramani Sport complex</p>
                        <p>+233 20 000 0000 | info@thinkkre8tivmedia.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto print:items-end print:text-right">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-widest mb-4 sm:mb-6 print:text-slate-800 print:text-3xl" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      {type === 'invoice' ? 'INVOICE' : 'RECEIPT'}
                    </h1>
                    <div className="space-y-2 sm:space-y-3 bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-lg w-full sm:w-64 text-left print:bg-slate-50 print:w-64" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Doc No.</span>
                        <span className="text-sm font-bold text-slate-900">{document.invoice_number || document.receipt_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</span>
                        <span className="text-xs font-bold text-slate-700">{document.created_at ? new Date(document.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</span>
                      </div>
                      {document.due_date && type === 'invoice' && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</span>
                          <span className="text-xs font-bold text-slate-900">{new Date(document.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To Section */}
              <div className="px-6 sm:px-12 pb-6 sm:pb-8 border-b border-slate-200 mb-6 sm:mb-8 mx-6 sm:mx-12 mt-2 print:px-12 print:mx-12 flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Billed To</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mb-1 sm:mb-2 print:text-xl">{document.customer_name}</p>
                  <div className="text-xs text-slate-600 font-medium space-y-1">
                    {document.customer_phone && <p>{document.customer_phone}</p>}
                    {document.customer_email && <p className="break-all sm:break-normal">{document.customer_email}</p>}
                    {document.customer_address && <p className="max-w-full sm:max-w-[300px] leading-relaxed pt-1 print:max-w-[300px]">{document.customer_address}</p>}
                  </div>
                </div>
                {type === 'invoice' && (
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</span>
                    <Badge className={cn('border-none font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-md shadow-none', statusObj.color)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      {statusObj.label}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="px-4 sm:px-12 flex-1 relative z-10 print:px-12 overflow-x-auto">
                <table className="w-full text-sm mb-6 sm:mb-8 min-w-[400px]">
                  <thead className="border-b-2 border-slate-800">
                    <tr className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">
                      <th className="py-4 px-3 text-left">Description</th>
                      <th className="py-4 px-3 text-center w-24">Qty</th>
                      <th className="py-4 px-3 text-right w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {document.items && document.items.length > 0 ? (
                      document.items.map((item: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-3 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-4 px-3 text-center font-medium text-slate-600">{item.quantity}</td>
                          <td className="py-4 px-3 text-right font-bold text-slate-900">{fmt(item.total_price || (item.quantity * item.unit_price))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 px-5 font-medium text-slate-400 italic text-center">Standard Document Total</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mt-4 sm:mt-0">
                  <div className="w-full sm:w-[350px] print:w-[350px]">
                    <div className="space-y-3 sm:space-y-4 px-2 sm:px-3 pb-4 sm:pb-5 border-b border-slate-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Subtotal</span>
                        <span className="font-bold text-slate-800">{fmt(document.subtotal || document.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">VAT ({document.vat_rate || 0}%)</span>
                        <span className="font-bold text-slate-800">{fmt(document.vat_amount || 0)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 rounded-lg p-5 mt-4 text-white print:bg-slate-800" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Grand Total</span>
                        <span className="text-xl font-bold text-white">{fmt(document.total_amount || document.amount)}</span>
                      </div>
                      {document.amount_paid !== undefined && (
                        <div className="flex justify-between items-center text-xs font-medium mb-2 border-t border-white/20 pt-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Amount Paid</span>
                          <span className="text-slate-100">{fmt(document.amount_paid || 0)}</span>
                        </div>
                      )}
                      {document.balance_due !== undefined && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Balance Due</span>
                          <span className={cn('font-bold text-sm', Number(document.balance_due) > 0 ? 'text-white' : 'text-slate-200')}>
                            {fmt(document.balance_due)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-12 py-8 sm:py-10 mt-8 sm:mt-12 bg-white flex flex-col justify-between border-t-2 border-slate-100 print:bg-white print:px-12 print:mt-12" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 sm:gap-0 print:flex-row">
                  <div className="max-w-full sm:max-w-sm print:max-w-sm">
                    <p className="text-sm font-bold text-slate-800 mb-1.5 uppercase tracking-widest">Thank you for your business</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Payment is due upon receipt. Please make all checks payable to Think Kre8tiv Media. If you have any questions, please contact us.</p>
                  </div>
                  <div className="text-left sm:text-right print:text-right w-full sm:w-auto flex flex-col items-start sm:items-end print:items-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By</p>
                    <div className="relative mt-2 mb-1">
                      <img src="/logo.png" alt="Signature Stamp" className="h-12 object-contain opacity-20" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Think Kre8tiv Media</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );

  if (inline) {
    return (
      <div className="w-full overflow-hidden bg-slate-100 rounded-xl p-2 sm:p-4 md:p-8 flex justify-center border border-slate-200">
        <div className="w-full max-w-full overflow-x-auto custom-scrollbar flex justify-center">
          <div className="transform origin-top scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform" style={{ marginBottom: '-30%' }}>
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-start overflow-hidden print:bg-white print:block backdrop-blur-sm">
      <div className="w-full bg-[#0B0F19] border-b border-slate-800 p-4 flex justify-end gap-3 shrink-0 print:hidden shadow-md z-50">
        {document.approval_status === 'pending' && isAdmin && onApprove && (
          <>
            <Button onClick={() => onApprove(document.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold px-6">
              <CheckCircle2 size={16} className="mr-2" /> Approve
            </Button>
            <Button onClick={() => onApprove(document.id, 'rejected')} className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 font-bold px-6">
              <XCircle size={16} className="mr-2" /> Reject
            </Button>
            <div className="w-px h-8 bg-slate-200/20 mx-1"></div>
          </>
        )}
        {onEdit && (
          <Button variant="secondary" onClick={onEdit} className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md shadow-lg font-semibold">
            <Edit2 size={16} className="mr-2" /> Edit
          </Button>
        )}
        {onClose && (
          <Button variant="secondary" onClick={onClose} className="font-semibold bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-md">
            Close Preview
          </Button>
        )}
        {onSendSMS && (
          <Button onClick={onSendSMS} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 shadow-lg shadow-amber-900/20" disabled={isSMSPending}>
            <MessageSquare size={16} className="mr-2" /> Send SMS
          </Button>
        )}
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg shadow-blue-900/20">
          <Printer size={16} className="mr-2" /> Print PDF
        </Button>
      </div>

      <div className="flex-1 w-full overflow-auto p-4 sm:p-8 flex justify-center">
        {content}
      </div>
    </div>
  );
}
