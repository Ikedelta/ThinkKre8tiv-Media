import sql from '@/app/api/utils/sql';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';
import { computeEmployeePayroll } from '@/lib/payroll-calculator';
import { logActivity } from '@/app/api/utils/audit';

export async function GET(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [run] = await sql`
        SELECT * FROM payroll_runs WHERE id = ${id}
      `;
      if (!run) return Response.json({ error: 'Payroll run not found' }, { status: 404 });

      const payslips = await sql`
        SELECT p.*, e.employee_id, e.first_name, e.last_name, e.department, e.job_title,
               e.payment_method, e.bank_name, e.account_number, e.momo_network, e.momo_number, e.email, e.phone
        FROM payroll_payslips p
        JOIN payroll_employees e ON p.employee_id = e.id
        WHERE p.payroll_run_id = ${id}
        ORDER BY e.first_name ASC
      `;

      return Response.json({ ...run, payslips });
    }

    const runs = await sql`
      SELECT r.*,
             (SELECT count(*) FROM payroll_payslips WHERE payroll_run_id = r.id) as employee_count
      FROM payroll_runs r
      ORDER BY r.period_year DESC, r.period_month DESC, r.created_at DESC
    `;
    return Response.json(runs);
  } catch (error: any) {
    console.error('Error fetching payroll runs:', error);
    return Response.json({ error: error.message || 'Failed to fetch payroll runs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const {
      period_month,
      period_year,
      payment_date,
      notes,
      custom_entries = [], // Optional adjustments per employee { employee_id, transport_allowance, overtime_pay, bonus_amount, loan_deduction, etc. }
    } = body;

    if (!period_month || !period_year) {
      return Response.json({ error: 'Period month and year are required' }, { status: 400 });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthLabel = monthNames[parseInt(period_month) - 1] || `Month ${period_month}`;
    const period_label = `${monthLabel} ${period_year}`;

    // Generate unique run number
    const [{ count }] = await sql`SELECT count(*) as count FROM payroll_runs`;
    const run_number = `TK-PAY-${period_year}-${String(period_month).padStart(2, '0')}-${String(Number(count) + 1).padStart(3, '0')}`;

    // Fetch all active employees
    const employees = await sql`
      SELECT * FROM payroll_employees WHERE status = 'active'
    `;

    if (employees.length === 0) {
      return Response.json({ error: 'No active employees found in the directory' }, { status: 400 });
    }

    // Map overrides if provided
    const entryMap = new Map();
    for (const entry of custom_entries) {
      if (entry.employee_id) entryMap.set(entry.employee_id, entry);
    }

    // Create the payroll run in draft
    const [run] = await sql`
      INSERT INTO payroll_runs (
        run_number, period_month, period_year, period_label, payment_date, notes, status
      ) VALUES (
        ${run_number}, ${period_month}, ${period_year}, ${period_label},
        ${payment_date || new Date().toISOString().split('T')[0]},
        ${notes || null}, 'draft'
      ) RETURNING *
    `;

    let totalGross = 0;
    let totalSSNITEmployee = 0;
    let totalSSNITEmployer = 0;
    let totalPAYE = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalBonuses = 0;
    let totalNet = 0;

    // Process each employee payslip
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const custom = entryMap.get(emp.id) || {};

      const baseSalary = Number(emp.base_salary || 0);
      const transportAllowance = Number(custom.transport_allowance || 0);
      const housingAllowance = Number(custom.housing_allowance || 0);
      const otherAllowances = Number(custom.other_allowances || 0);
      const overtimePay = Number(custom.overtime_pay || 0);
      const bonusAmount = Number(custom.bonus_amount || 0);

      const salaryAdvanceDeduction = Number(custom.salary_advance_deduction || 0);
      const loanDeduction = Number(custom.loan_deduction || 0);
      const welfareDeduction = Number(custom.welfare_deduction || 0);
      const otherDeductions = Number(custom.other_deductions || 0);

      const calc = computeEmployeePayroll({
        baseSalary,
        transportAllowance,
        housingAllowance,
        otherAllowances,
        overtimePay,
        bonusAmount,
        salaryAdvanceDeduction,
        loanDeduction,
        welfareDeduction,
        otherDeductions,
      });

      const payslip_number = `PS-${period_year}${String(period_month).padStart(2, '0')}-${emp.employee_id}`;

      await sql`
        INSERT INTO payroll_payslips (
          payroll_run_id, employee_id, payslip_number, basic_salary,
          transport_allowance, housing_allowance, other_allowances,
          overtime_pay, bonus_amount, gross_salary,
          ssnit_tier1_employee, ssnit_tier1_employer, ssnit_tier2,
          taxable_income, paye_tax,
          salary_advance_deduction, loan_deduction, welfare_deduction, other_deductions,
          total_deductions, net_salary, payment_status, payment_date
        ) VALUES (
          ${run.id}, ${emp.id}, ${payslip_number}, ${calc.basicSalary},
          ${calc.transportAllowance}, ${calc.housingAllowance}, ${calc.otherAllowances},
          ${calc.overtimePay}, ${calc.bonusAmount}, ${calc.grossSalary},
          ${calc.ssnitEmployee55}, ${calc.ssnitEmployer13}, 0.00,
          ${calc.taxableIncome}, ${calc.payeTax},
          ${calc.salaryAdvanceDeduction}, ${calc.loanDeduction}, ${calc.welfareDeduction}, ${calc.otherDeductions},
          ${calc.totalDeductions}, ${calc.netSalary}, 'pending', ${payment_date || null}
        )
      `;

      totalGross += calc.grossSalary;
      totalSSNITEmployee += calc.ssnitEmployee55;
      totalSSNITEmployer += calc.ssnitEmployer13;
      totalPAYE += calc.payeTax;
      totalAllowances += calc.totalAllowances;
      totalDeductions += calc.totalDeductions;
      totalBonuses += calc.bonusAmount;
      totalNet += calc.netSalary;
    }

    // Update payroll run with calculated aggregates
    const [finalRun] = await sql`
      UPDATE payroll_runs SET
        total_gross = ${Math.round(totalGross * 100) / 100},
        total_ssnit_employee = ${Math.round(totalSSNITEmployee * 100) / 100},
        total_ssnit_employer = ${Math.round(totalSSNITEmployer * 100) / 100},
        total_paye = ${Math.round(totalPAYE * 100) / 100},
        total_allowances = ${Math.round(totalAllowances * 100) / 100},
        total_deductions = ${Math.round(totalDeductions * 100) / 100},
        total_bonuses = ${Math.round(totalBonuses * 100) / 100},
        total_net = ${Math.round(totalNet * 100) / 100},
        updated_at = NOW()
      WHERE id = ${run.id}
      RETURNING *
    `;

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Generated Payroll Run',
      resource: 'payroll_runs',
      resource_id: run.id,
      details: `Generated payroll for ${period_label} (${run_number}) with ${employees.length} employees. Net total: GH₵${finalRun.total_net}`
    });

    return Response.json(finalRun, { status: 201 });
  } catch (error: any) {
    console.error('Error generating payroll run:', error);
    return Response.json({ error: error.message || 'Failed to generate payroll' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) return Response.json({ error: 'ID and status are required' }, { status: 400 });

    const approved_by = status === 'approved' || status === 'paid' ? user.name : null;
    const approved_at = status === 'approved' || status === 'paid' ? new Date().toISOString() : null;

    const [updated] = await sql`
      UPDATE payroll_runs SET
        status = ${status},
        notes = COALESCE(${notes}, notes),
        approved_by = COALESCE(${approved_by}, approved_by),
        approved_at = COALESCE(${approved_at}::timestamptz, approved_at),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // If marked as paid, update all underlying payslips to paid
    if (status === 'paid') {
      await sql`
        UPDATE payroll_payslips SET payment_status = 'paid' WHERE payroll_run_id = ${id}
      `;
    }

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Updated Payroll Status',
      resource: 'payroll_runs',
      resource_id: id,
      details: `Updated payroll ${updated.run_number} to status: ${status}`
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error('Error updating payroll run:', error);
    return Response.json({ error: error.message || 'Failed to update payroll' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${id}`;
    if (!run) return Response.json({ error: 'Run not found' }, { status: 404 });

    if (run.status === 'paid') {
      return Response.json({ error: 'Cannot delete an already disbursed (paid) payroll run.' }, { status: 400 });
    }

    await sql`DELETE FROM payroll_runs WHERE id = ${id}`;

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Deleted Payroll Run',
      resource: 'payroll_runs',
      resource_id: id,
      details: `Deleted payroll run ${run.run_number}`
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payroll run:', error);
    return Response.json({ error: error.message || 'Failed to delete payroll run' }, { status: 500 });
  }
}

