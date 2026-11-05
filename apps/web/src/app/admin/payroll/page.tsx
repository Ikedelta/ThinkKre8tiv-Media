'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, DollarSign, Calendar, Plus, Search, Filter, ShieldCheck,
  FileText, CheckCircle2, AlertCircle, Eye, Printer, Edit2, Trash2,
  Download, ArrowUpRight, ChevronRight, UserPlus, Building, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { PayslipViewerModal } from '@/components/payroll/PayslipViewerModal';
import { computeEmployeePayroll } from '@/lib/payroll-calculator';

const fmt = (n: number | string) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayrollAdminPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'runs' | 'employees' | 'calculator'>('runs');
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Modals state
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  // New Payroll Run Form
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [runMonth, setRunMonth] = useState(String(currentMonth));
  const [runYear, setRunYear] = useState(String(currentYear));
  const [runPayDate, setRunPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [runNotes, setRunNotes] = useState('');

  // Fetch Payroll Runs
  const { data: runs = [], isLoading: runsLoading } = useQuery<any[]>({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const res = await fetch('/api/payroll/runs');
      if (!res.ok) throw new Error('Failed to fetch runs');
      return res.json();
    },
  });

  // Fetch Employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<any[]>({
    queryKey: ['payroll-employees'],
    queryFn: async () => {
      const res = await fetch('/api/payroll/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
  });

  // Fetch Selected Run Details with Payslips
  const { data: currentRunDetails } = useQuery<any>({
    queryKey: ['payroll-run-details', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      const res = await fetch(`/api/payroll/runs?id=${selectedRunId}`);
      if (!res.ok) throw new Error('Failed to fetch run details');
      return res.json();
    },
    enabled: !!selectedRunId,
  });

  // Fetch Selected Payslip Detail
  const { data: currentPayslip } = useQuery<any>({
    queryKey: ['payroll-payslip-details', selectedPayslipId],
    queryFn: async () => {
      if (!selectedPayslipId) return null;
      const res = await fetch(`/api/payroll/payslips?id=${selectedPayslipId}`);
      if (!res.ok) throw new Error('Failed to fetch payslip details');
      return res.json();
    },
    enabled: !!selectedPayslipId,
  });

  // Create Run Mutation
  const createRunMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_month: parseInt(runMonth),
          period_year: parseInt(runYear),
          payment_date: runPayDate,
          notes: runNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate payroll run');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Generated payroll run ${data.run_number}!`);
      setIsNewRunModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      setSelectedRunId(data.id);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to generate payroll'),
  });

  // Status Mutation
  const updateRunStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/payroll/runs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Payroll status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-run-details', selectedRunId] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  // Delete Run Mutation
  const deleteRunMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payroll/runs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Payroll run deleted');
      setSelectedRunId(null);
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Employee Save Mutation
  const saveEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const isEdit = !!employeeData.id;
      const res = await fetch('/api/payroll/employees', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save employee');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Staff employee directory updated!');
      setIsNewEmployeeModalOpen(false);
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['payroll-employees'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Calculator State
  const [calcBase, setCalcBase] = useState('3500');
  const [calcTransport, setCalcTransport] = useState('300');
  const [calcHousing, setCalcHousing] = useState('0');
  const [calcOvertime, setCalcOvertime] = useState('0');
  const [calcBonus, setCalcBonus] = useState('0');
  const [calcAdvance, setCalcAdvance] = useState('0');

  const liveCalculation = computeEmployeePayroll({
    baseSalary: parseFloat(calcBase) || 0,
    transportAllowance: parseFloat(calcTransport) || 0,
    housingAllowance: parseFloat(calcHousing) || 0,
    overtimePay: parseFloat(calcOvertime) || 0,
    bonusAmount: parseFloat(calcBonus) || 0,
    salaryAdvanceDeduction: parseFloat(calcAdvance) || 0,
  });

  // Aggregated Summary Stats from All Active Employees & Runs
  const totalMonthlyPayrollCommitment = employees
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + Number(e.base_salary || 0), 0);

  const activeEmployeesCount = employees.filter((e) => e.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D22630]/10 text-[#D22630] flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Payroll & Compensation Management
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ghana Revenue Authority (GRA) PAYE, SSNIT Tier 1 & 2 statutory compliance, and electronic payslip issuance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setIsNewEmployeeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-xs font-semibold"
              >
                <UserPlus size={15} />
                <span>Add Employee</span>
              </button>

              <button
                onClick={() => setIsNewRunModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D22630] hover:bg-[#b51f28] text-white transition text-xs font-semibold shadow-xs"
              >
                <Plus size={15} />
                <span>Run Monthly Payroll</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff Count</span>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {activeEmployeesCount} <span className="text-xs font-normal text-slate-400">employees</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across Production, Pre-Press, & Admin</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Base Salary Commitment</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {fmt(totalMonthlyPayrollCommitment)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Monthly recurring gross basic</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">SSNIT Statutory Burden (18.5%)</span>
            <ShieldCheck size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {fmt(totalMonthlyPayrollCommitment * 0.185)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">5.5% Employee + 13.0% Employer cost</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disbursed Runs</span>
            <FileText size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {runs.length} <span className="text-xs font-normal text-slate-400">historical cycles</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Audited payroll cycles recorded</p>
        </div>

      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('runs');
            setSelectedRunId(null);
          }}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px',
            activeTab === 'runs'
              ? 'border-[#D22630] text-[#D22630]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          Payroll Runs & Periods ({runs.length})
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px',
            activeTab === 'employees'
              ? 'border-[#D22630] text-[#D22630]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          Staff & Compensation Directory ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px',
            activeTab === 'calculator'
              ? 'border-[#D22630] text-[#D22630]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          GRA PAYE & SSNIT Interactive Simulator
        </button>
      </div>

      {/* TAB 1: PAYROLL RUNS */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          {selectedRunId && currentRunDetails ? (
            /* Run Details & Payslips Table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <button
                    onClick={() => setSelectedRunId(null)}
                    className="text-xs font-bold text-[#D22630] hover:underline mb-1 inline-flex items-center gap-1"
                  >
                    &larr; Back to all payroll runs
                  </button>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{currentRunDetails.period_label}</span>
                    <span className="text-xs font-mono font-normal text-slate-500">({currentRunDetails.run_number})</span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        currentRunDetails.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : currentRunDetails.status === 'approved'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      )}
                    >
                      {currentRunDetails.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pay Date: {currentRunDetails.payment_date?.split('T')[0]} &bull; {currentRunDetails.payslips?.length || 0} Employees processed
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {currentRunDetails.status === 'draft' && (
                      <button
                        onClick={() => updateRunStatusMutation.mutate({ id: currentRunDetails.id, status: 'approved' })}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        Approve Cycle
                      </button>
                    )}
                    {currentRunDetails.status === 'approved' && (
                      <button
                        onClick={() => updateRunStatusMutation.mutate({ id: currentRunDetails.id, status: 'paid' })}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Mark as Disbursed / Paid
                      </button>
                    )}
                    {currentRunDetails.status !== 'paid' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this draft payroll cycle?')) {
                            deleteRunMutation.mutate(currentRunDetails.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                        title="Delete run"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payslips Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-5 py-3 font-semibold">Employee</th>
                        <th className="px-4 py-3 font-semibold">Department</th>
                        <th className="px-4 py-3 font-semibold text-right">Basic (GH₵)</th>
                        <th className="px-4 py-3 font-semibold text-right">Gross (GH₵)</th>
                        <th className="px-4 py-3 font-semibold text-right">SSNIT 5.5%</th>
                        <th className="px-4 py-3 font-semibold text-right">PAYE Tax</th>
                        <th className="px-4 py-3 font-semibold text-right">Deductions</th>
                        <th className="px-4 py-3 font-semibold text-right font-bold text-slate-900 dark:text-white">Net Pay</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentRunDetails.payslips?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">{p.employee_id}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            {p.department}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-medium">
                            {fmt(p.basic_salary)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {fmt(p.gross_salary)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-rose-600">
                            -{fmt(p.ssnit_tier1_employee)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-rose-600">
                            -{fmt(p.paye_tax)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                            -{fmt(p.total_deductions)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {fmt(p.net_salary)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                p.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                              )}
                            >
                              {p.payment_status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedPayslipId(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-xs transition"
                            >
                              <Eye size={12} />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                        <td className="px-5 py-3" colSpan={2}>
                          Cycle Aggregates ({currentRunDetails.payslips?.length} Staff)
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{fmt(currentRunDetails.total_gross)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmt(currentRunDetails.total_gross)}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600">-{fmt(currentRunDetails.total_ssnit_employee)}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600">-{fmt(currentRunDetails.total_paye)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">-{fmt(currentRunDetails.total_deductions)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          {fmt(currentRunDetails.total_net)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Runs Listing Table */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-5 py-3.5 font-semibold">Period / Month</th>
                      <th className="px-4 py-3.5 font-semibold">Reference</th>
                      <th className="px-4 py-3.5 font-semibold">Pay Date</th>
                      <th className="px-4 py-3.5 font-semibold">Headcount</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Total Gross</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Total GRA PAYE</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Total Net Disbursed</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {runsLoading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">Loading payroll runs...</td>
                      </tr>
                    ) : runs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <p className="font-semibold">No payroll runs found.</p>
                          <p className="text-xs mt-1">Click &quot;Run Monthly Payroll&quot; to generate your first pay cycle.</p>
                        </td>
                      </tr>
                    ) : (
                      runs.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {r.period_label}
                            </span>
                            <span className="text-[11px] text-slate-400">Created {new Date(r.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="px-4 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {r.run_number}
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            {r.payment_date?.split('T')[0]}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {r.employee_count} staff
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-medium">
                            {fmt(r.total_gross)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-rose-600 font-medium">
                            {fmt(r.total_paye)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {fmt(r.total_net)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                r.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : r.status === 'approved'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => setSelectedRunId(r.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#001F3F] text-white hover:bg-[#001730] font-semibold text-xs transition shadow-2xs"
                            >
                              <span>Manage Run</span>
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 font-semibold">Staff Employee</th>
                  <th className="px-4 py-3.5 font-semibold">Department & Role</th>
                  <th className="px-4 py-3.5 font-semibold">Statutory Numbers</th>
                  <th className="px-4 py-3.5 font-semibold">Disbursement Details</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Base Salary</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employeesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading directory...</td>
                  </tr>
                ) : employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">{emp.employee_id} &bull; {emp.phone || emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.job_title}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] space-y-0.5">
                      <p><span className="text-slate-400">SSNIT:</span> {emp.ssnit_number || 'N/A'}</p>
                      <p><span className="text-slate-400">GH Card:</span> {emp.ghana_card_number || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4 text-[11px]">
                      {emp.payment_method === 'momo' ? (
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          MoMo: {emp.momo_network} &bull; {emp.momo_number}
                        </p>
                      ) : (
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          Bank: {emp.bank_name || 'Bank'} &bull; {emp.account_number}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {fmt(emp.base_salary)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          emp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsNewEmployeeModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit employee"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GRA PAYE & SSNIT INTERACTIVE SIMULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Controls */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ghana Statutory Payroll Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Test compensation packages against current Ghana Revenue Authority (GRA) monthly graduated tax tiers and SSNIT Tier 1 & 2 schedules.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Base Salary (GH₵)
                </label>
                <input
                  type="number"
                  value={calcBase}
                  onChange={(e) => setCalcBase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Transport Allowance (GH₵)
                </label>
                <input
                  type="number"
                  value={calcTransport}
                  onChange={(e) => setCalcTransport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Housing Allowance (GH₵)
                </label>
                <input
                  type="number"
                  value={calcHousing}
                  onChange={(e) => setCalcHousing(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Overtime Pay (GH₵)
                </label>
                <input
                  type="number"
                  value={calcOvertime}
                  onChange={(e) => setCalcOvertime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Bonus / Incentive (GH₵)
                </label>
                <input
                  type="number"
                  value={calcBonus}
                  onChange={(e) => setCalcBonus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Salary Advance / Deductions (GH₵)
                </label>
                <input
                  type="number"
                  value={calcAdvance}
                  onChange={(e) => setCalcAdvance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Real-time Calculation Breakdown Output */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Live Statutory Breakdown</span>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
                Net Pay: {fmt(liveCalculation.netSalary)}
              </span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5 font-medium">
                <span className="text-slate-600 dark:text-slate-400">Total Gross Earnings</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{fmt(liveCalculation.grossSalary)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-400">Employee SSNIT Tier 1 & 2 (5.5%)</span>
                <span className="font-mono text-rose-600">-{fmt(liveCalculation.ssnitEmployee55)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-400">Statutory Taxable Base</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{fmt(liveCalculation.taxableIncome)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-400">GRA PAYE Income Tax (Graduated)</span>
                <span className="font-mono text-rose-600">-{fmt(liveCalculation.payeTax)}</span>
              </div>
              {liveCalculation.totalVoluntaryDeductions > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Voluntary Deductions / Advances</span>
                  <span className="font-mono text-rose-600">-{fmt(liveCalculation.totalVoluntaryDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                <span>Employee Take-Home Net Salary</span>
                <span className="font-mono">{fmt(liveCalculation.netSalary)}</span>
              </div>
            </div>

            {/* Employer Total Burden */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Employer SSNIT 13.0% Contribution:</span>
                <span className="font-mono font-bold text-blue-600">{fmt(liveCalculation.ssnitEmployer13)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Employer True Cost:</span>
                <span className="font-mono">{fmt(liveCalculation.employerTotalCost)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: RUN NEW PAYROLL */}
      {isNewRunModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Execute Monthly Payroll Run
            </h3>
            <p className="text-xs text-slate-500">
              This will automatically compile all active employees ({activeEmployeesCount} staff), calculate GRA PAYE tax bands and SSNIT contributions, and generate individual payslips.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Month
                  </label>
                  <select
                    value={runMonth}
                    onChange={(e) => setRunMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((m, idx) => (
                      <option key={m} value={String(idx + 1)}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={runYear}
                    onChange={(e) => setRunYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disbursement / Payment Date
                </label>
                <input
                  type="date"
                  value={runPayDate}
                  onChange={(e) => setRunPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Audit Remarks (Optional)
                </label>
                <textarea
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. November Regular Monthly Cycle"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewRunModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => createRunMutation.mutate()}
                disabled={createRunMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#D22630] text-white text-xs font-semibold hover:bg-[#b51f28] transition"
              >
                {createRunMutation.isPending ? 'Calculating...' : 'Generate Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {isNewEmployeeModalOpen && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => {
            setIsNewEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={(data: any) => saveEmployeeMutation.mutate(data)}
          isPending={saveEmployeeMutation.isPending}
        />
      )}

      {/* MODAL: PAYSLIP VIEWER */}
      {selectedPayslipId && currentPayslip && (
        <PayslipViewerModal
          payslip={currentPayslip}
          onClose={() => setSelectedPayslipId(null)}
        />
      )}

    </div>
  );
}

// Subcomponent: Employee Form Modal
function EmployeeFormModal({ employee, onClose, onSave, isPending }: any) {
  const [formData, setFormData] = useState({
    id: employee?.id || undefined,
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    ghana_card_number: employee?.ghana_card_number || '',
    tin_number: employee?.tin_number || '',
    ssnit_number: employee?.ssnit_number || '',
    department: employee?.department || 'Production',
    job_title: employee?.job_title || '',
    employment_type: employee?.employment_type || 'full_time',
    base_salary: employee?.base_salary || '',
    payment_method: employee?.payment_method || 'bank_transfer',
    bank_name: employee?.bank_name || '',
    bank_branch: employee?.bank_branch || '',
    account_number: employee?.account_number || '',
    momo_network: employee?.momo_network || 'MTN',
    momo_number: employee?.momo_number || '',
    status: employee?.status || 'active',
  });

  const handleChange = (k: string, v: any) => {
    setFormData((prev) => ({ ...prev, [k]: v }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.job_title) {
      toast.error('First name, last name and job title are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-2xl w-full my-auto space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {formData.id ? 'Edit Staff Member' : 'Register New Employee'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Production">Production & Press</option>
                <option value="Creative">Creative & Pre-Press</option>
                <option value="Finance">Finance & Admin</option>
                <option value="Sales">Sales & Marketing</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Job Designation *</label>
              <input
                type="text"
                required
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="e.g. Press Operator"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Base Monthly Salary (GH₵) *</label>
              <input
                type="number"
                required
                value={formData.base_salary}
                onChange={(e) => handleChange('base_salary', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">SSNIT Number</label>
              <input
                type="text"
                value={formData.ssnit_number}
                onChange={(e) => handleChange('ssnit_number', e.target.value)}
                placeholder="e.g. C0284910294"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ghana Card (NIA)</label>
              <input
                type="text"
                value={formData.ghana_card_number}
                onChange={(e) => handleChange('ghana_card_number', e.target.value)}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">TIN Number</label>
              <input
                type="text"
                value={formData.tin_number}
                onChange={(e) => handleChange('tin_number', e.target.value)}
                placeholder="P000XXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Disbursement Details */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
              Salary Disbursement Method
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value="bank_transfer"
                  checked={formData.payment_method === 'bank_transfer'}
                  onChange={() => handleChange('payment_method', 'bank_transfer')}
                />
                <span>Bank Account</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value="momo"
                  checked={formData.payment_method === 'momo'}
                  onChange={() => handleChange('payment_method', 'momo')}
                />
                <span>Mobile Money (MoMo)</span>
              </label>
            </div>

            {formData.payment_method === 'bank_transfer' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="e.g. Ecobank Ghana"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => handleChange('account_number', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Network</label>
                  <select
                    value={formData.momo_network}
                    onChange={(e) => handleChange('momo_network', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="MTN">MTN MoMo</option>
                    <option value="Telecel">Telecel Cash</option>
                    <option value="AT">AT Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">MoMo Phone Number</label>
                  <input
                    type="text"
                    value={formData.momo_number}
                    onChange={(e) => handleChange('momo_number', e.target.value)}
                    placeholder="024XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-[#D22630] text-white text-xs font-semibold hover:bg-[#b51f28] transition"
            >
              {isPending ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

