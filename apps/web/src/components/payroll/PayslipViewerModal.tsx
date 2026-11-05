'use client';

import React from 'react';
import { Printer, DownloadCloud, X, CheckCircle2, ShieldCheck, Building2, User, Phone, Mail, Calendar, CreditCard, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayslipViewerModalProps {
  payslip: any;
  onClose: () => void;
}

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PayslipViewerModal({ payslip, onClose }: PayslipViewerModalProps) {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="document-modal-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-start overflow-hidden print:bg-white print:block">
      {/* Top Control Bar (Hidden on print) */}
      <div className="w-full bg-[#0F172A] border-b border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shrink-0 print:hidden shadow-lg z-50 max-w-7xl mx-auto rounded-b-xl">
        <div className="flex items-center gap-2 text-white">
          <div className="w-6 h-6 rounded-lg bg-[#D22630]/20 text-[#D22630] flex items-center justify-center font-bold text-xs">
            PS
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Ghana Statutory Payslip &bull; {payslip.payslip_number}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Period: {payslip.period_label || 'Current Cycle'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D22630] to-amber-500 text-white hover:opacity-95 transition text-xs font-bold shadow-xs"
          >
            <Printer size={14} />
            <span>Print / Save A4 PDF</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Payslip Body Wrapped in Responsive A4 Viewport */}
      <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible print:block">
        <div className="document-preview-wrapper w-full max-w-[760px] my-auto py-2 scale-[0.85] sm:scale-[0.90] md:scale-[0.95] origin-top transition-transform print:max-w-none print:w-full print:scale-100 print:m-0 print:p-0">
          <div className="document-viewer-a4 bg-white text-slate-900 shadow-2xl rounded-2xl print:rounded-none overflow-hidden border border-slate-200/90 print:border-none p-6 sm:p-8 print:p-8">
          
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl p-1.5 shrink-0 border border-slate-200 shadow-xs flex items-center justify-center">
                  <img src="/logo.png" alt="Think Kre8tiv" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-950 uppercase tracking-tight">
                    {payslip.company_name || 'Think Kre8tiv Media Limited'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {payslip.company_address || 'Accra OSU, Haramani Sport, Greater Accra, Ghana'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Phone: {payslip.company_phone || '+233 24 468 1391'} &bull; Email: {payslip.company_email || 'hello@thinkkre8tivmedia.com'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#D22630] text-white uppercase tracking-wider mb-1">
                  Confidential Payslip
                </span>
                <p className="text-xs text-slate-500 font-mono">Period: {payslip.period_label}</p>
                <p className="text-xs text-slate-500 font-mono">Run Ref: {payslip.run_number}</p>
              </div>
            </div>
          </div>

          {/* Employee & Statutory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900">{payslip.first_name} {payslip.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5" />
                <span className="font-semibold text-slate-500">Staff ID:</span>
                <span className="font-mono font-bold text-[#D22630]">{payslip.employee_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5" />
                <span className="font-semibold text-slate-500">Designation / Role:</span>
                <span className="text-slate-800 font-medium">{payslip.job_title} ({payslip.department})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5" />
                <span className="font-semibold text-slate-500">Employment Type:</span>
                <span className="capitalize text-slate-800">{payslip.employment_type?.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-500">SSNIT Number:</span>
                <span className="font-mono font-bold text-slate-900">{payslip.ssnit_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5" />
                <span className="font-semibold text-slate-500">Ghana Card:</span>
                <span className="font-mono text-slate-800">{payslip.ghana_card_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5" />
                <span className="font-semibold text-slate-500">TIN Number:</span>
                <span className="font-mono text-slate-800">{payslip.tin_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-500">Disbursement:</span>
                <span className="font-medium text-slate-800">
                  {payslip.payment_method === 'momo'
                    ? `MoMo (${payslip.momo_network || 'MTN'} - ${payslip.momo_number || 'N/A'})`
                    : `Bank (${payslip.bank_name || 'Bank'} - ${payslip.account_number || 'N/A'})`}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Earnings and Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Earnings & Allowances</span>
                <span className="text-[11px] font-semibold text-slate-500">Amount (GH₵)</span>
              </div>
              <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 font-medium">Basic Salary</span>
                  <span className="font-mono font-semibold text-slate-900">{fmt(payslip.basic_salary)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Transport Allowance</span>
                  <span className="font-mono text-slate-800">{fmt(payslip.transport_allowance)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Housing Allowance</span>
                  <span className="font-mono text-slate-800">{fmt(payslip.housing_allowance)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Overtime Compensation</span>
                  <span className="font-mono text-slate-800">{fmt(payslip.overtime_pay)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Performance Bonus</span>
                  <span className="font-mono text-slate-800">{fmt(payslip.bonus_amount)}</span>
                </div>
                {Number(payslip.other_allowances) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Other Allowances</span>
                    <span className="font-mono text-slate-800">{fmt(payslip.other_allowances)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 font-bold text-slate-900 text-sm border-t border-slate-200">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-slate-950">{fmt(payslip.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Statutory & Voluntary Deductions Column */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Statutory & Other Deductions</span>
                <span className="text-[11px] font-semibold text-slate-500">Amount (GH₵)</span>
              </div>
              <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">SSNIT Tier 1 & 2 (5.5% Employee)</span>
                  <span className="font-mono font-semibold text-rose-600">-{fmt(payslip.ssnit_tier1_employee)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">GRA PAYE Income Tax</span>
                  <span className="font-mono font-semibold text-rose-600">-{fmt(payslip.paye_tax)}</span>
                </div>
                {Number(payslip.salary_advance_deduction) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Salary Advance Repayment</span>
                    <span className="font-mono text-rose-600">-{fmt(payslip.salary_advance_deduction)}</span>
                  </div>
                )}
                {Number(payslip.loan_deduction) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Staff Loan Deduction</span>
                    <span className="font-mono text-rose-600">-{fmt(payslip.loan_deduction)}</span>
                  </div>
                )}
                {Number(payslip.welfare_deduction) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Staff Welfare Fund</span>
                    <span className="font-mono text-rose-600">-{fmt(payslip.welfare_deduction)}</span>
                  </div>
                )}
                {Number(payslip.other_deductions) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Other Deductions</span>
                    <span className="font-mono text-rose-600">-{fmt(payslip.other_deductions)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 font-bold text-slate-900 text-sm border-t border-slate-200">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-600">-{fmt(payslip.total_deductions)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Employer Statutory Cost Note (SSNIT Tier 1 Employer 13%) */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span>
                <strong>SSNIT Employer Contribution (13.0%):</strong> Paid directly by Think Kre8tiv Media to SSNIT on employee behalf:
              </span>
            </div>
            <span className="font-mono font-bold text-blue-950">{fmt(payslip.ssnit_tier1_employer)}</span>
          </div>

          {/* Net Pay Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg mb-8">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                Total Net Take-Home Salary
              </p>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Paid into verified bank account or Mobile Money wallet
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                {fmt(payslip.net_salary)}
              </span>
            </div>
          </div>

          {/* Signatures & Verification */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Employer Authorization:</p>
              {payslip.authorized_signature_url ? (
                <div className="h-14 py-1">
                  <img src={payslip.authorized_signature_url} alt="Authorized Signature" className="h-full object-contain" />
                </div>
              ) : (
                <div className="h-14 border-b border-dashed border-slate-300 flex items-end pb-1 text-[11px] text-slate-400">
                  Authorized Signatory
                </div>
              )}
              <p className="font-medium text-slate-700 mt-1">Managing Director / Finance Lead</p>
              <p className="text-[10px] text-slate-400">Think Kre8tiv Media Limited</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-800 mb-1">Employee Acknowledgment:</p>
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-end pb-1 text-[11px] text-slate-400">
                Signature
              </div>
              <p className="font-medium text-slate-700 mt-1">{payslip.first_name} {payslip.last_name}</p>
              <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100">
            This document is a computer-generated statutory payroll receipt from Think Kre8tiv Media ERP.
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}

