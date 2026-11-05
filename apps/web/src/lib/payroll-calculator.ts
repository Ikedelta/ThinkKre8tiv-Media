/**
 * Ghana GRA PAYE Tax & SSNIT Statutory Payroll Engine
 * 
 * Statutory Breakdown:
 * - Employee SSNIT (Tier 1 + 2 contribution): 5.5% of Basic Salary (Tax exempt)
 * - Employer SSNIT (Tier 1 + 2 contribution): 13.0% of Basic Salary (Employer cost)
 * - Total SSNIT Contribution to SSNIT/Trustee: 18.5%
 * 
 * GRA PAYE Monthly Tax Bands (Current Standard Ghana Revenue Authority Schedule):
 * - First GH₵ 490.00 @ 0% (Tax-free threshold)
 * - Next  GH₵ 110.00 @ 5%
 * - Next  GH₵ 130.00 @ 10%
 * - Next  GH₵ 3,166.67 @ 17.5%
 * - Next  GH₵ 16,000.00 @ 25%
 * - Next  GH₵ 30,500.00 @ 30%
 * - Exceeding GH₵ 50,396.67 @ 35%
 */

export interface EmployeeCompensationInput {
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  otherAllowances?: number;
  overtimePay?: number;
  bonusAmount?: number;
  salaryAdvanceDeduction?: number;
  loanDeduction?: number;
  welfareDeduction?: number;
  otherDeductions?: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  overtimePay: number;
  bonusAmount: number;
  grossSalary: number;
  
  // SSNIT
  ssnitEmployee55: number;
  ssnitEmployer13: number;
  ssnitTotal185: number;
  
  // Tax
  taxableIncome: number;
  payeTax: number;
  
  // Deductions
  salaryAdvanceDeduction: number;
  loanDeduction: number;
  welfareDeduction: number;
  otherDeductions: number;
  totalVoluntaryDeductions: number;
  totalDeductions: number; // SSNIT 5.5% + PAYE + Voluntary
  
  // Take-home
  netSalary: number;
  employerTotalCost: number; // Gross + Employer SSNIT 13%
}

export function calculateGhanaPAYE(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  
  let remaining = taxableIncome;
  let tax = 0;

  // Band 1: First 490 @ 0%
  const b1 = Math.min(remaining, 490);
  remaining -= b1;

  // Band 2: Next 110 @ 5%
  if (remaining > 0) {
    const b2 = Math.min(remaining, 110);
    tax += b2 * 0.05;
    remaining -= b2;
  }

  // Band 3: Next 130 @ 10%
  if (remaining > 0) {
    const b3 = Math.min(remaining, 130);
    tax += b3 * 0.10;
    remaining -= b3;
  }

  // Band 4: Next 3,166.67 @ 17.5%
  if (remaining > 0) {
    const b4 = Math.min(remaining, 3166.67);
    tax += b4 * 0.175;
    remaining -= b4;
  }

  // Band 5: Next 16,000 @ 25%
  if (remaining > 0) {
    const b5 = Math.min(remaining, 16000);
    tax += b5 * 0.25;
    remaining -= b5;
  }

  // Band 6: Next 30,500 @ 30%
  if (remaining > 0) {
    const b6 = Math.min(remaining, 30500);
    tax += b6 * 0.30;
    remaining -= b6;
  }

  // Band 7: Exceeding 50,396.67 @ 35%
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  return Math.round(tax * 100) / 100;
}

export function computeEmployeePayroll(input: EmployeeCompensationInput): PayrollCalculationResult {
  const basicSalary = Number(input.baseSalary || 0);
  const transportAllowance = Number(input.transportAllowance || 0);
  const housingAllowance = Number(input.housingAllowance || 0);
  const otherAllowances = Number(input.otherAllowances || 0);
  const totalAllowances = transportAllowance + housingAllowance + otherAllowances;
  const overtimePay = Number(input.overtimePay || 0);
  const bonusAmount = Number(input.bonusAmount || 0);

  const grossSalary = basicSalary + totalAllowances + overtimePay + bonusAmount;

  // SSNIT Statutory contributions based on Basic Salary
  const ssnitEmployee55 = Math.round(basicSalary * 0.055 * 100) / 100;
  const ssnitEmployer13 = Math.round(basicSalary * 0.13 * 100) / 100;
  const ssnitTotal185 = Math.round((ssnitEmployee55 + ssnitEmployer13) * 100) / 100;

  // Taxable income = Gross Salary - Employee SSNIT contribution (tax exempt by Ghana Law)
  const taxableIncome = Math.max(0, grossSalary - ssnitEmployee55);
  const payeTax = calculateGhanaPAYE(taxableIncome);

  // Voluntary / Company Deductions
  const salaryAdvanceDeduction = Number(input.salaryAdvanceDeduction || 0);
  const loanDeduction = Number(input.loanDeduction || 0);
  const welfareDeduction = Number(input.welfareDeduction || 0);
  const otherDeductions = Number(input.otherDeductions || 0);
  const totalVoluntaryDeductions = salaryAdvanceDeduction + loanDeduction + welfareDeduction + otherDeductions;

  // Total deductions taken from employee
  const totalDeductions = Math.round((ssnitEmployee55 + payeTax + totalVoluntaryDeductions) * 100) / 100;

  // Take-home pay
  const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

  // Total cost to employer
  const employerTotalCost = Math.round((grossSalary + ssnitEmployer13) * 100) / 100;

  return {
    basicSalary,
    transportAllowance,
    housingAllowance,
    otherAllowances,
    totalAllowances,
    overtimePay,
    bonusAmount,
    grossSalary,
    ssnitEmployee55,
    ssnitEmployer13,
    ssnitTotal185,
    taxableIncome,
    payeTax,
    salaryAdvanceDeduction,
    loanDeduction,
    welfareDeduction,
    otherDeductions,
    totalVoluntaryDeductions,
    totalDeductions,
    netSalary,
    employerTotalCost,
  };
}

