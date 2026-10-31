'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface SendDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'invoice' | 'receipt' | 'quotation';
  document: any;
  onSuccess?: () => void;
}

export function SendDocumentModal({
  isOpen,
  onClose,
  documentType,
  document,
  onSuccess,
}: SendDocumentModalProps) {
  const [channel, setChannel] = useState<'both' | 'email' | 'sms'>('both');
  const [email, setEmail] = useState(document?.customer_email || '');
  const [phone, setPhone] = useState(document?.customer_phone || '');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    if (document) {
      setEmail(document.customer_email || '');
      setPhone(document.customer_phone || '');
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const docNumber = document.receipt_number || document.invoice_number || document.quotation_number || 'N/A';
  const docLabel = documentType === 'receipt' ? 'Receipt' : documentType === 'quotation' ? 'Quotation' : 'Invoice';

  const handleSend = async () => {
    if ((channel === 'email' || channel === 'both') && !email.trim()) {
      toast.error('Please enter a recipient email address.');
      return;
    }
    if ((channel === 'sms' || channel === 'both') && !phone.trim()) {
      toast.error('Please enter a recipient phone number.');
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch('/api/documents/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          documentType,
          documentId: document.id,
          customEmail: email.trim(),
          customPhone: phone.trim(),
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch document');

      const { emailSent, smsSent, emailError, smsError } = data.results || {};

      if (channel === 'both') {
        if (emailSent && smsSent) {
          toast.success(`✅ ${docLabel} sent successfully via Email and SMS!`);
        } else if (emailSent) {
          toast.success(`✅ ${docLabel} sent via Email! (SMS note: ${smsError || 'failed'})`);
        } else if (smsSent) {
          toast.success(`✅ ${docLabel} sent via SMS! (Email note: ${emailError || 'failed'})`);
        } else {
          toast.error(`Dispatch failed: ${emailError || smsError || 'Unknown error'}`);
        }
      } else if (channel === 'email') {
        if (emailSent) toast.success(`✅ ${docLabel} emailed to ${email}!`);
        else toast.error(`Email error: ${emailError}`);
      } else if (channel === 'sms') {
        if (smsSent) toast.success(`✅ ${docLabel} SMS sent to ${phone}!`);
        else toast.error(`SMS error: ${smsError}`);
      }

      if (emailSent || smsSent) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error sending document');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-[#D22630] text-white shadow-md">
              <Send size={18} />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base leading-tight">
                Send {docLabel}
              </h3>
              <p className="text-xs text-slate-400">
                Dispatch <strong>#{docNumber}</strong> to customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Dispatch Channel Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Select Delivery Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('both')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  channel === 'both'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Mail size={13} />
                  <span>+</span>
                  <MessageSquare size={13} />
                </div>
                <span>Email &amp; SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  channel === 'email'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mail size={15} />
                <span>Email Only</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  channel === 'sms'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquare size={15} />
                <span>SMS Only</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          {(channel === 'email' || channel === 'both') && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Recipient Email Address *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@domain.com"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          {(channel === 'sms' || channel === 'both') && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Recipient Mobile Number *
              </label>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="024 000 0000 or 233..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Dispatches via Arkesel SMS gateway with instant delivery</p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Custom Message / Note (Optional)
            </label>
            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personalized message or instructions..."
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:bg-slate-900"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-bold text-slate-900 dark:text-white">{document.customer_name || 'Client'}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm gap-1.5"
          >
            <Send size={13} />
            {isSending ? 'Dispatching...' : `Send ${docLabel}`}
          </Button>
        </div>

      </div>
    </div>
  );
}
