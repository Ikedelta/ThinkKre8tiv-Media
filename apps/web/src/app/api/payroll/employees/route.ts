import sql from '@/app/api/utils/sql';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/api-security';
import { logActivity } from '@/app/api/utils/audit';

export async function GET(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [employee] = await sql`
        SELECT * FROM payroll_employees WHERE id = ${id}
      `;
      if (!employee) return Response.json({ error: 'Employee not found' }, { status: 404 });
      return Response.json(employee);
    }

    const employees = await sql`
      SELECT * FROM payroll_employees ORDER BY created_at ASC
    `;
    return Response.json(employees);
  } catch (error: any) {
    console.error('Error fetching payroll employees:', error);
    return Response.json({ error: error.message || 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      ghana_card_number,
      tin_number,
      ssnit_number,
      department,
      job_title,
      employment_type,
      hire_date,
      status,
      base_salary,
      payment_method,
      bank_name,
      bank_branch,
      account_number,
      momo_network,
      momo_number,
    } = body;

    if (!first_name || !last_name || !job_title) {
      return Response.json({ error: 'First name, last name and job title are required' }, { status: 400 });
    }

    const [{ count }] = await sql`SELECT count(*) as count FROM payroll_employees`;
    const employee_id = `TK-EMP-${String(Number(count) + 1).padStart(3, '0')}`;

    const [employee] = await sql`
      INSERT INTO payroll_employees (
        employee_id, first_name, last_name, email, phone, ghana_card_number,
        tin_number, ssnit_number, department, job_title, employment_type,
        hire_date, status, base_salary, payment_method, bank_name,
        bank_branch, account_number, momo_network, momo_number
      ) VALUES (
        ${employee_id}, ${first_name}, ${last_name}, ${email || null}, ${phone || null}, ${ghana_card_number || null},
        ${tin_number || null}, ${ssnit_number || null}, ${department || 'Production'}, ${job_title}, ${employment_type || 'full_time'},
        ${hire_date || new Date().toISOString().split('T')[0]}, ${status || 'active'}, ${base_salary || 0}, ${payment_method || 'bank_transfer'}, ${bank_name || null},
        ${bank_branch || null}, ${account_number || null}, ${momo_network || null}, ${momo_number || null}
      ) RETURNING *
    `;

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Created Employee Record',
      resource: 'payroll_employees',
      resource_id: employee.id,
      details: `Added employee ${first_name} ${last_name} (${employee_id}) with basic salary GH₵${base_salary}`
    });

    return Response.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return Response.json({ error: error.message || 'Failed to create employee' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const {
      id,
      first_name,
      last_name,
      email,
      phone,
      ghana_card_number,
      tin_number,
      ssnit_number,
      department,
      job_title,
      employment_type,
      hire_date,
      status,
      base_salary,
      payment_method,
      bank_name,
      bank_branch,
      account_number,
      momo_network,
      momo_number,
    } = body;

    if (!id) return Response.json({ error: 'Employee ID is required' }, { status: 400 });

    const [updated] = await sql`
      UPDATE payroll_employees SET
        first_name = ${first_name},
        last_name = ${last_name},
        email = ${email || null},
        phone = ${phone || null},
        ghana_card_number = ${ghana_card_number || null},
        tin_number = ${tin_number || null},
        ssnit_number = ${ssnit_number || null},
        department = ${department || 'Production'},
        job_title = ${job_title},
        employment_type = ${employment_type || 'full_time'},
        hire_date = ${hire_date},
        status = ${status || 'active'},
        base_salary = ${base_salary || 0},
        payment_method = ${payment_method || 'bank_transfer'},
        bank_name = ${bank_name || null},
        bank_branch = ${bank_branch || null},
        account_number = ${account_number || null},
        momo_network = ${momo_network || null},
        momo_number = ${momo_number || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Updated Employee Record',
      resource: 'payroll_employees',
      resource_id: id,
      details: `Updated details for ${first_name} ${last_name}`
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return Response.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return Response.json({ error: 'Employee ID required' }, { status: 400 });

    // Check if employee has payslips
    const [payslipCheck] = await sql`
      SELECT count(*) as count FROM payroll_payslips WHERE employee_id = ${id}
    `;

    if (parseInt(payslipCheck.count) > 0) {
      // Soft-delete / deactivate instead
      const [deactivated] = await sql`
        UPDATE payroll_employees SET status = 'inactive', updated_at = NOW() WHERE id = ${id} RETURNING *
      `;
      return Response.json({ message: 'Employee archived because historical payslips exist', employee: deactivated });
    }

    await sql`DELETE FROM payroll_employees WHERE id = ${id}`;

    await logActivity({
      user_name: user.name || 'Admin',
      action: 'Deleted Employee',
      resource: 'payroll_employees',
      resource_id: id,
      details: `Deleted employee ID ${id}`
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return Response.json({ error: error.message || 'Failed to delete employee' }, { status: 500 });
  }
}

