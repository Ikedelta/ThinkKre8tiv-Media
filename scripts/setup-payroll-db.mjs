import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Creating payroll tables...');

  await sql(`
    CREATE TABLE IF NOT EXISTS payroll_employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      ghana_card_number VARCHAR(50),
      tin_number VARCHAR(50),
      ssnit_number VARCHAR(50),
      department VARCHAR(100) NOT NULL DEFAULT 'Production',
      job_title VARCHAR(100) NOT NULL,
      employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
      hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
      bank_name VARCHAR(100),
      bank_branch VARCHAR(100),
      account_number VARCHAR(100),
      momo_network VARCHAR(50),
      momo_number VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await sql(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_number VARCHAR(50) UNIQUE NOT NULL,
      period_month INT NOT NULL,
      period_year INT NOT NULL,
      period_label VARCHAR(100) NOT NULL,
      payment_date DATE NOT NULL,
      total_gross NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_ssnit_employee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_ssnit_employer NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_paye NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_allowances NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_bonuses NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_net NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      approved_by VARCHAR(100),
      approved_at TIMESTAMP WITH TIME ZONE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await sql(`
    CREATE TABLE IF NOT EXISTS payroll_payslips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES payroll_employees(id) ON DELETE RESTRICT,
      payslip_number VARCHAR(50) UNIQUE NOT NULL,
      basic_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      transport_allowance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      housing_allowance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      other_allowances NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      overtime_pay NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      bonus_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      gross_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      ssnit_tier1_employee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      ssnit_tier1_employer NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      ssnit_tier2 NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      taxable_income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      paye_tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      salary_advance_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      loan_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      welfare_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      other_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_date DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed sample initial employees if table empty
  const employees = await sql(`SELECT count(*) as count FROM payroll_employees`);
  if (parseInt(employees[0].count) === 0) {
    console.log('Seeding initial employees...');
    await sql(`
      INSERT INTO payroll_employees (
        employee_id, first_name, last_name, email, phone, ghana_card_number, ssnit_number, tin_number,
        department, job_title, employment_type, hire_date, status, base_salary, payment_method, bank_name, account_number, momo_network, momo_number
      ) VALUES 
      ('TK-EMP-001', 'Isaac', 'Darko', 'asantedarkoisaac360@gmail.com', '+233 24 468 1391', 'GHA-72348912-1', 'C0284910294', 'P0002948192', 'Executive & Technology', 'Managing Director & Lead', 'full_time', '2022-01-15', 'active', 6500.00, 'bank_transfer', 'Ecobank Ghana', '1441002948201', 'MTN', '0244681391'),
      ('TK-EMP-002', 'Bernice', 'Borketey', 'berniceb@thinkkre8tiv.com', '+233 20 123 4567', 'GHA-84920194-2', 'C0192849104', 'P0009482014', 'Finance & Administration', 'Accounts Officer & Admin', 'full_time', '2023-03-01', 'active', 3800.00, 'momo', null, null, 'MTN', '0201234567'),
      ('TK-EMP-003', 'Kwame', 'Mensah', 'kwame.print@thinkkre8tiv.com', '+233 54 998 8776', 'GHA-91028401-3', 'C0928401924', 'P0008401928', 'Production & Press', 'Senior Large-Format Press Operator', 'full_time', '2023-06-10', 'active', 3200.00, 'momo', null, null, 'MTN', '0549988776'),
      ('TK-EMP-004', 'Abena', 'Osei', 'abena.design@thinkkre8tiv.com', '+233 24 555 1234', 'GHA-10294819-4', 'C0849201940', 'P0007492019', 'Creative & Pre-Press', 'Senior Graphic Designer', 'full_time', '2023-08-15', 'active', 3500.00, 'bank_transfer', 'GCB Bank', '2019482019482', 'Telecel', '0245551234');
    `);
  }

  console.log('Payroll tables setup complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
