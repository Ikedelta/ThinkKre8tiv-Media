import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit2,
  MessageSquare,
  Printer,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Hash,
  Sparkles,
  FileText,
  BadgeCheck,
  Receipt as ReceiptIcon,
} from 'lucide-react';
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
  onSendDocument?: () => void;
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
  onSendDocument,
  isAdmin = false, 
  isSMSPending = false, 
  inline = false 
}: DocumentViewerProps) {
  React.useEffect(() => {
    if (!inline) {
      window.document.body.classList.add('document-modal-active');
      return () => {
        window.document.body.classList.remove('document-modal-active');
      };
    }
  }, [inline]);

  if (!document) return null;

  const fmt = (n: number | string) =>
    `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isReceipt = type === 'receipt';
  const isInvoice = type === 'invoice';
  const isQuotation = type === 'quotation';

  const docNumber = document.receipt_number || document.invoice_number || document.quotation_number || 'N/A';
  const docDate = document.payment_date || document.created_at || new Date().toISOString();
  const paymentMethod = document.payment_method || 'Bank Transfer';

  const isApproved = document.approval_status === 'approved';
  const isPaid = document.status === 'paid' || (document.balance_due !== undefined && Number(document.balance_due) <= 0);

  // Dynamic Theme Palette: Emerald for Receipts, Crimson Red (#D22630) for Invoices & Quotations
  const themeStyles = isReceipt
    ? {
        headerGradient: 'from-emerald-950 via-emerald-800 to-teal-950',
        badgeBg: 'bg-emerald-950 text-emerald-100 border-emerald-400',
        badgeText: 'OFFICIAL RECEIPT',
        voucherLabel: 'Receipt Voucher',
        bannerBg: 'bg-emerald-50/90 border-emerald-300',
        bannerIcon: 'text-emerald-800',
        bannerTitle: 'text-emerald-950 font-black',
        bannerTitleText: 'Payment Cleared & Confirmed',
        bannerSubtext: 'text-emerald-900 font-bold',
        bannerTotalLabel: 'text-emerald-900',
        bannerTotalValue: 'text-emerald-950',
        accentBadge: 'text-emerald-900',
        stampColor: 'text-emerald-800',
        stampBorder: 'border-emerald-900',
      }
    : {
        headerGradient: 'from-[#600000] via-[#B71C1C] to-[#880E4F]',
        badgeBg: 'bg-red-950 text-red-100 border-red-400',
        badgeText: isInvoice ? 'COMMERCIAL INVOICE' : 'OFFICIAL ESTIMATE',
        voucherLabel: isInvoice ? 'Invoice Reference' : 'Estimate Reference',
        bannerBg: 'bg-red-50/90 border-red-300',
        bannerIcon: isPaid ? 'text-emerald-800' : 'text-[#B71C1C]',
        bannerTitle: isPaid ? 'text-emerald-950 font-black' : 'text-red-950 font-black',
        bannerTitleText: isPaid ? 'Invoice Settled (Paid Full)' : 'Invoice Billing & Settlement Due',
        bannerSubtext: isPaid ? 'text-emerald-900 font-bold' : 'text-red-900 font-bold',
        bannerTotalLabel: isPaid ? 'text-emerald-900' : 'text-red-900',
        bannerTotalValue: isPaid ? 'text-emerald-950' : 'text-red-950',
        accentBadge: isPaid ? 'text-emerald-900' : 'text-red-900',
        stampColor: isPaid ? 'text-emerald-800' : 'text-[#B71C1C]',
        stampBorder: isPaid ? 'border-emerald-900' : 'border-red-900',
      };

  const renderSharedDocumentTemplate = () => (
    <div
      className={cn(
        "document-viewer-a4 bg-white text-slate-900 shadow-2xl w-full max-w-[760px] relative flex flex-col shrink-0 print:shadow-none print:w-full print:max-w-none print:min-w-0 print:min-h-0 print:m-0 rounded-2xl print:rounded-none overflow-hidden border border-slate-200/90 print:border-none",
        inline ? "mx-auto" : "my-auto"
      )}
      style={{ fontFamily: 'var(--font-montserrat), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Top Voucher Stub Accent Header */}
      <div className={cn("bg-gradient-to-r text-white p-5 sm:p-6 relative overflow-hidden print:p-6", themeStyles.headerGradient)}>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-white rounded-xl p-2 shrink-0 shadow-lg flex items-center justify-center">
              <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                  THINK <span className={isReceipt ? "text-emerald-300" : "text-amber-300"}>KRE8TIV</span>
                </span>
                <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider border", themeStyles.badgeBg)}>
                  {themeStyles.badgeText}
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-200">
                Accra OSU, Haramani Sport &bull; +233 24 468 1391
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-black/25 border border-white/20 rounded-xl p-2.5 sm:px-3.5 sm:py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{themeStyles.voucherLabel}</p>
            <p className="text-base font-mono font-black text-white">{docNumber}</p>
          </div>
        </div>
      </div>

      {/* Decorative Perforated Ticket Divider Line */}
      <div className="relative h-4 bg-slate-50 flex items-center justify-between px-4 border-y border-dashed border-slate-300 print:bg-white">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rounded-full print:hidden" />
        <div className="w-full border-b border-dashed border-slate-300 mx-2" />
        <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400 px-3 bg-slate-50 font-bold shrink-0">
          {isReceipt ? 'Official Payment Receipt Voucher' : 'Commercial Invoice Document'}
        </span>
        <div className="w-full border-b border-dashed border-slate-300 mx-2" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rounded-full print:hidden" />
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 relative flex-1 flex flex-col justify-between bg-white space-y-5">
        
        {/* Verification Shield Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
          <BadgeCheck className="w-[300px] h-[300px] text-slate-900" />
        </div>

        {isPaid && isInvoice && (
          <div className="absolute top-1/3 right-10 -rotate-12 pointer-events-none z-0 opacity-15">
            <div className="text-5xl font-black text-emerald-600 border-4 border-emerald-600 rounded-2xl px-6 py-2 uppercase tracking-widest">
              PAID FULL
            </div>
          </div>
        )}

        <div className="relative z-10 space-y-5">
          
          {/* Main Top Summary Card */}
          <div className={cn("border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs", themeStyles.bannerBg)}>
            <div className="space-y-1">
              <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", themeStyles.bannerTitle)}>
                <CheckCircle2 size={16} className={themeStyles.bannerIcon} />
                <span>{themeStyles.bannerTitleText}</span>
              </span>
              <p className={cn("text-xs", themeStyles.bannerSubtext)}>
                Date:{' '}
                <strong>{docDate ? new Date(docDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong>
                {document.due_date && isInvoice && (
                  <span> &bull; Due: <strong className="text-[#D22630]">{new Date(document.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                )}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider block", themeStyles.bannerTotalLabel)}>
                {isReceipt ? 'Total Amount Paid' : 'Total Amount Due'}
              </span>
              <span className={cn("text-2xl sm:text-3xl font-black font-mono", themeStyles.bannerTotalValue)}>
                {fmt(isReceipt ? document.amount : (document.total_amount || document.amount))}
              </span>
            </div>
          </div>

          {/* Clean Client & Transaction Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 rounded-xl p-4 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                {isReceipt ? 'Received From' : 'Billed To'}
              </span>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {document.customer_name || 'Customer / Client'}
              </h4>
              {document.customer_company && (
                <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" />
                  <span>{document.customer_company}</span>
                </p>
              )}
              <div className="text-xs text-slate-500 font-medium space-y-0.5 pt-1">
                {document.customer_phone && <p>Tel: {document.customer_phone}</p>}
                {document.customer_email && <p>Email: {document.customer_email}</p>}
              </div>
            </div>

            <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-5 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">{isReceipt ? 'Payment Method:' : 'Payment Channel:'}</span>
                <span className="font-bold text-slate-900 capitalize px-2.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
              {document.invoice_number && isReceipt && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Invoice Ref:</span>
                  <span className="font-mono font-bold text-emerald-800">{document.invoice_number}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className={cn("font-bold text-xs", isPaid || isReceipt ? "text-emerald-700" : "text-[#D22630]")}>
                  {isReceipt ? 'Payment Cleared' : isPaid ? 'Paid in Full' : 'Payment Due'}
                </span>
              </div>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-3 text-center w-20">Qty</th>
                  <th className="py-3 px-4 text-right w-28">Rate</th>
                  <th className="py-3 px-4 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {document.items && document.items.length > 0 ? (
                  document.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-snug">{item.description}</p>
                        {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">{fmt(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {fmt(item.total_price || (item.quantity * item.unit_price))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">
                        {isReceipt
                          ? `Payment towards ${document.invoice_number ? `Invoice #${document.invoice_number}` : 'Commercial Printing Services'}`
                          : 'Commercial Printing & Brand Fabrication Services'}
                      </p>
                      {document.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {document.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-700 text-xs">1</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 text-xs">{fmt(document.amount || document.total_amount)}</td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-slate-900">
                      {fmt(document.amount || document.total_amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Account Summary & Payment Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
            {/* Payment Details Block */}
            <div className="sm:col-span-6 bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <CreditCard size={13} className={isReceipt ? "text-emerald-700" : "text-[#D22630]"} />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  Payment Channels
                </span>
              </div>
              <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Bank:</span>
                  <span className="font-bold text-slate-800">Stanbic Bank / GCB Bank</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Account:</span>
                  <span className="font-bold text-slate-800">Think Kre8tiv Media</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">MOMO:</span>
                  <span className="font-bold text-emerald-700">024 468 1391</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="sm:col-span-6 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs flex flex-col justify-center">
              {isReceipt ? (
                <>
                  {document.invoice_total_amount && (
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span className="font-medium">Total Billed:</span>
                      <span className="font-mono font-bold text-slate-900">{fmt(document.invoice_total_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-emerald-700 text-xs py-0.5">
                    <span className="font-bold">This Payment:</span>
                    <span className="font-mono font-bold text-sm">{fmt(document.amount)}</span>
                  </div>
                  {(() => {
                    const totalBilled = Number(document.invoice_total_amount || 0);
                    const paidUpTo = document.running_paid_up_to_receipt !== undefined 
                      ? Number(document.running_paid_up_to_receipt) 
                      : (totalBilled - Number(document.invoice_balance_due || 0));
                    const remainingBalance = Math.max(0, totalBilled - paidUpTo);

                    return (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                        <span className="font-bold text-slate-900">Remaining Balance:</span>
                        <span className={cn(
                          "font-mono font-black text-sm",
                          remainingBalance > 0 ? "text-[#D22630]" : "text-emerald-700"
                        )}>
                          {fmt(remainingBalance)}
                        </span>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-slate-600 text-xs">
                    <span className="font-medium text-slate-500">Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{fmt(document.subtotal || document.amount || document.total_amount)}</span>
                  </div>
                  {(Number(document.nhil_amount || 0) > 0 || (document.nhil_rate && Number(document.nhil_rate) > 0)) && (
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span className="font-medium text-slate-500">NHIL ({document.nhil_rate !== undefined ? document.nhil_rate : 5}%)</span>
                      <span className="font-mono font-bold text-slate-900">
                        {fmt(document.nhil_amount !== undefined ? document.nhil_amount : ((Number(document.subtotal || document.amount || document.total_amount) - Number(document.discount_amount || 0)) * (Number(document.nhil_rate || 5) / 100)))}
                      </span>
                    </div>
                  )}
                  {(Number(document.vat_amount || 0) > 0 || (document.vat_rate && Number(document.vat_rate) > 0)) && (
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span className="font-medium text-slate-500">VAT ({document.vat_rate !== undefined ? document.vat_rate : 15}%)</span>
                      <span className="font-mono font-bold text-slate-900">{fmt(document.vat_amount)}</span>
                    </div>
                  )}
                  {Number(document.discount_amount || 0) > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 text-xs">
                      <span className="font-medium">Discount</span>
                      <span className="font-mono font-bold">-{fmt(document.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5 border-y border-slate-900 text-slate-950">
                    <span className="text-xs font-black uppercase tracking-wider">Total</span>
                    <span className="text-base font-black font-mono">{fmt(document.total_amount || document.amount)}</span>
                  </div>
                  {document.amount_paid !== undefined && Number(document.amount_paid) > 0 && (
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span className="font-medium text-slate-500">Amount Paid</span>
                      <span className="font-mono font-bold text-emerald-700">{fmt(document.amount_paid)}</span>
                    </div>
                  )}
                  {document.balance_due !== undefined && (
                    <div className="flex justify-between items-center py-1.5 bg-white px-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Balance Due</span>
                      <span className={cn(
                        "text-sm font-black font-mono",
                        Number(document.balance_due) > 0 ? "text-[#D22630]" : "text-emerald-700"
                      )}>
                        {fmt(document.balance_due)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* Footer Sign-off & Verification */}
        <div className="relative z-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-xs text-slate-500">
          <div className="space-y-0.5 max-w-sm">
            <div className={cn("flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider", isReceipt ? "text-emerald-800" : "text-[#D22630]")}>
              <ShieldCheck size={13} className={isReceipt ? "text-emerald-600" : "text-[#D22630]"} />
              <span>Official Verification Stamp</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Official transaction document generated by Think Kre8tiv Media Cloud ERP.
            </p>
            <p className="text-[9px] text-slate-400/50 pt-0.5">
              System developed by Tech 34 Systems
            </p>
          </div>

          <div className="flex flex-col sm:items-end text-left sm:text-right space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Authorized Signature
            </span>
            <div className="h-7 flex items-center">
              <span className={cn("font-serif italic text-sm font-bold border-b pb-0.5", isReceipt ? "text-emerald-900 border-emerald-800" : "text-red-950 border-red-900")}>
                Think Kre8tiv Accounts
              </span>
            </div>
            <span className="text-[8px] text-slate-400/40">
              Verified by Tech 34 Systems
            </span>
          </div>
        </div>

      </div>
    </div>
  );

  const content = renderSharedDocumentTemplate();

  if (inline) {
    return (
      <div className="w-full bg-slate-100/80 dark:bg-slate-900/60 rounded-xl p-2 sm:p-3 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex justify-center">
        <div className="w-full max-w-[560px] py-1 scale-[0.72] sm:scale-[0.78] origin-top transition-transform">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="document-modal-overlay fixed inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-start overflow-hidden print:bg-white print:block backdrop-blur-md">
      <div className="w-full bg-[#0F172A] border-b border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shrink-0 print:hidden shadow-lg z-50 max-w-7xl mx-auto rounded-b-xl">
        <div className="flex items-center gap-2 text-white">
          {isReceipt ? <ReceiptIcon className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-amber-400" />}
          <span className="text-xs font-bold uppercase tracking-wider">
            {isReceipt ? 'Receipt Preview' : isInvoice ? 'Invoice Preview' : 'Estimate Preview'} &bull; {docNumber}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
          {document.approval_status === 'pending' && isAdmin && onApprove && (
            <>
              <Button onClick={() => onApprove(document.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 flex-1 sm:flex-none">
                <CheckCircle2 size={14} className="mr-1.5" /> Approve
              </Button>
              <Button onClick={() => onApprove(document.id, 'rejected')} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold h-8 flex-1 sm:flex-none">
                <XCircle size={14} className="mr-1.5" /> Reject
              </Button>
            </>
          )}
          {onEdit && (
            <Button variant="secondary" onClick={onEdit} className="bg-white/10 text-white hover:bg-white/20 border-none text-xs h-8 font-semibold flex-1 sm:flex-none">
              <Edit2 size={14} className="mr-1.5" /> Edit
            </Button>
          )}
          {onSendDocument ? (
            <Button onClick={onSendDocument} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 flex-1 sm:flex-none shadow-sm">
              <Mail size={14} className="mr-1.5" /> Send Email / SMS
            </Button>
          ) : onSendSMS ? (
            <Button onClick={onSendSMS} className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-8 flex-1 sm:flex-none" disabled={isSMSPending}>
              <MessageSquare size={14} className="mr-1.5" /> Send SMS
            </Button>
          ) : null}
          {/* Allow printing / export for estimates, approved invoices/receipts, or inline editor preview */}
          {(isQuotation || document.approval_status === 'approved' || inline) ? (
            <Button onClick={() => window.print()} className="bg-gradient-to-r from-[#D22630] to-amber-500 text-white font-bold text-xs h-8 shadow-sm flex-1 sm:flex-none">
              <Printer size={14} className="mr-1.5" /> Print / Export PDF
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[11px] font-bold">
              <span>Approval Required to Print</span>
            </div>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose} className="text-xs h-8 font-semibold bg-white/10 text-white border-slate-700 hover:bg-white/20">
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible print:block">
        <div className="document-preview-wrapper w-full max-w-[640px] my-auto py-2 scale-[0.82] sm:scale-[0.86] md:scale-[0.90] origin-top transition-transform print:max-w-none print:w-full print:scale-100 print:m-0 print:p-0">
          {content}
        </div>
      </div>
    </div>
  );
}
