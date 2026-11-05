import sql from '@/app/api/utils/sql';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';
import { computeEmployeePayroll } from '@/lib/payroll-calculator';

export async function GET(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return Response.json({ error: 'Payslip ID required' }, { status: 400 });

    const [payslip] = await sql`
      SELECT p.*,
             r.period_month, r.period_year, r.period_label, r.run_number, r.status as run_status,
             e.employee_id, e.first_name, e.last_name, e.email, e.phone, e.department, e.job_title,
             e.employment_type, e.ghana_card_number, e.ssnit_number, e.tin_number,
             e.payment_method, e.bank_name, e.bank_branch, e.account_number, e.momo_network, e.momo_number,
             (SELECT company_name FROM app_settings WHERE id = 'default') as company_name,
             (SELECT company_email FROM app_settings WHERE id = 'default') as company_email,
             (SELECT company_phone FROM app_settings WHERE id = 'default') as company_phone,
             (SELECT company_address FROM app_settings WHERE id = 'default') as company_address,
             (SELECT authorized_signature_url FROM app_settings WHERE id = 'default') as authorized_signature_url
      FROM payroll_payslips p
      JOIN payroll_runs r ON p.payroll_run_id = r.id
      JOIN payroll_employees e ON p.employee_id = e.id
      WHERE p.id = ${id}
    `;

    if (!payslip) return Response.json({ error: 'Payslip not found' }, { status: 404 });

    return Response.json(payslip);
  } catch (error: any) {
    console.error('Error fetching payslip:', error);
    return Response.json({ error: error.message || 'Failed to fetch payslip' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;

    const body = await request.json();
    const {
      id,
      transport_allowance,
      housing_allowance,
      other_allowances,
      overtime_pay,
      bonus_amount,
      salary_advance_deduction,
      loan_deduction,
      welfare_deduction,
      other_deductions,
      notes,
    } = body;

    if (!id) return Response.json({ error: 'Payslip ID is required' }, { status: 400 });

    // Fetch existing payslip and employee base salary
    const [existing] = await sql`
      SELECT p.*, r.status as run_status, e.base_salary
      FROM payroll_payslips p
      JOIN payroll_runs r ON p.payroll_run_id = r.id
      JOIN payroll_employees e ON p.employee_id = e.id
      WHERE p.id = ${id}
    `;

    if (!existing) return Response.json({ error: 'Payslip not found' }, { status: 404 });
    if (existing.run_status === 'paid') {
      return Response.json({ error: 'Cannot edit payslip of a disbursed/paid payroll run' }, { status: 400 });
    }

    const calc = computeEmployeePayroll({
      baseSalary: Number(existing.base_salary),
      transportAllowance: Number(transport_allowance ?? existing.transport_allowance),
      housingAllowance: Number(housing_allowance ?? existing.housing_allowance),
      otherAllowances: Number(other_allowances ?? existing.other_allowances),
      overtimePay: Number(overtime_pay ?? existing.overtime_pay),
      bonusAmount: Number(bonus_amount ?? existing.bonus_amount),
      salaryAdvanceDeduction: Number(salary_advance_deduction ?? existing.salary_advance_deduction),
      loanDeduction: Number(loan_deduction ?? existing.loan_deduction),
      welfareDeduction: Number(welfare_deduction ?? existing.welfare_deduction),
      otherDeductions: Number(other_deductions ?? existing.other_deductions),
    });

    const [updated] = await sql`
      UPDATE payroll_payslips SET
        transport_allowance = ${calc.transportAllowance},
        housing_allowance = ${calc.housingAllowance},
        other_allowances = ${calc.otherAllowances},
        overtime_pay = ${calc.overtimePay},
        bonus_amount = ${calc.bonusAmount},
        gross_salary = ${calc.grossSalary},
        ssnit_tier1_employee = ${calc.ssnitEmployee55},
        ssnit_tier1_employer = ${calc.ssnitEmployer13},
        taxable_income = ${calc.taxableIncome},
        paye_tax = ${calc.payeTax},
        salary_advance_deduction = ${calc.salaryAdvanceDeduction},
        loan_deduction = ${calc.loanDeduction},
        welfare_deduction = ${calc.welfareDeduction},
        other_deductions = ${calc.otherDeductions},
        total_deductions = ${calc.totalDeductions},
        net_salary = ${calc.netSalary},
        notes = COALESCE(${notes}, notes)
      WHERE id = ${id}
      RETURNING *
    `;

    // Recalculate parent run aggregates
    const [aggregates] = await sql`
      SELECT
        COALESCE(SUM(gross_salary), 0) as total_gross,
        COALESCE(SUM(ssnit_tier1_employee), 0) as total_ssnit_employee,
        COALESCE(SUM(ssnit_tier1_employer), 0) as total_ssnit_employer,
        COALESCE(SUM(paye_tax), 0) as total_paye,
        COALESCE(SUM(transport_allowance + housing_allowance + other_allowances), 0) as total_allowances,
        COALESCE(SUM(total_deductions), 0) as total_deductions,
        COALESCE(SUM(bonus_amount), 0) as total_bonuses,
        COALESCE(SUM(net_salary), 0) as total_net
      FROM payroll_payslips
      WHERE payroll_run_id = ${existing.payroll_run_id}
    `;

    await sql`
      UPDATE payroll_runs SET
        total_gross = ${aggregates.total_gross},
        total_ssnit_employee = ${aggregates.total_ssnit_employee},
        total_ssnit_employer = ${aggregates.total_ssnit_employer},
        total_paye = ${aggregates.total_paye},
        total_allowances = ${aggregates.total_allowances},
        total_deductions = ${aggregates.total_deductions},
        total_bonuses = ${aggregates.total_bonuses},
        total_net = ${aggregates.total_net},
        updated_at = NOW()
      WHERE id = ${existing.payroll_run_id}
    `;

    return Response.json(updated);
  } catch (error: any) {
    console.error('Error updating payslip:', error);
    return Response.json({ error: error.message || 'Failed to update payslip' }, { status: 500 });
  }
}

