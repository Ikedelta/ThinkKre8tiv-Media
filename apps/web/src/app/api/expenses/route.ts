import sql from '@/app/api/utils/sql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const [expense] = await sql`
        SELECT e.*, v.name as vendor_name, a.name as account_name 
        FROM expenses e
        LEFT JOIN vendors v ON e.vendor_id = v.id
        LEFT JOIN accounts a ON e.account_id = a.id
        WHERE e.id = ${id}
      `;
      if (!expense) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json(expense);
    }

    const expenses = await sql`
      SELECT e.*, v.name as vendor_name, a.name as account_name 
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      LEFT JOIN accounts a ON e.account_id = a.id
      ORDER BY e.date DESC
    `;
    return Response.json(expenses);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      vendor_id, 
      account_id, 
      amount, 
      payment_method, 
      date, 
      notes, 
      receipt_url,
      created_by,
      // For quick-create options
      vendor_name,
      account_name,
      account_type
    } = body;

    if (!amount) {
      return Response.json({ error: 'Amount is required' }, { status: 400 });
    }

    let finalVendorId = vendor_id;
    let finalAccountId = account_id;

    // Auto-create vendor if name is provided instead of ID
    if (!finalVendorId && vendor_name) {
      const [existingVendor] = await sql`SELECT id FROM vendors WHERE name ILIKE ${vendor_name} LIMIT 1`;
      if (existingVendor) {
        finalVendorId = existingVendor.id;
      } else {
        const [newVendor] = await sql`INSERT INTO vendors (name) VALUES (${vendor_name}) RETURNING id`;
        finalVendorId = newVendor.id;
      }
    }

    // Auto-create account if name is provided instead of ID
    if (!finalAccountId && account_name) {
      const [existingAccount] = await sql`SELECT id FROM accounts WHERE name ILIKE ${account_name} LIMIT 1`;
      if (existingAccount) {
        finalAccountId = existingAccount.id;
      } else {
        const [newAccount] = await sql`INSERT INTO accounts (name, type) VALUES (${account_name}, ${account_type || 'expense'}) RETURNING id`;
        finalAccountId = newAccount.id;
      }
    }

    const [expense] = await sql`
      INSERT INTO expenses (
        vendor_id, 
        account_id, 
        amount, 
        payment_method, 
        date, 
        notes, 
        receipt_url, 
        created_by
      )
      VALUES (
        ${finalVendorId ?? null}, 
        ${finalAccountId ?? null}, 
        ${parseFloat(amount)}, 
        ${payment_method ?? 'cash'}, 
        ${date ?? new Date().toISOString()}, 
        ${notes ?? null}, 
        ${receipt_url ?? null}, 
        ${created_by ?? 'System User'}
      )
      RETURNING *
    `;

    return Response.json(expense);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Failed to record expense' }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, vendor_id, vendor_name, account_id, account_name, amount, payment_method, date, notes } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    let finalVendorId = vendor_id;
    let finalAccountId = account_id;

    if (!finalVendorId && vendor_name) {
      const [existingVendor] = await sql`SELECT id FROM vendors WHERE name ILIKE ${vendor_name} LIMIT 1`;
      if (existingVendor) {
        finalVendorId = existingVendor.id;
      } else {
        const [newVendor] = await sql`INSERT INTO vendors (name) VALUES (${vendor_name}) RETURNING id`;
        finalVendorId = newVendor.id;
      }
    }

    if (!finalAccountId && account_name) {
      const [existingAccount] = await sql`SELECT id FROM accounts WHERE name ILIKE ${account_name} LIMIT 1`;
      if (existingAccount) {
        finalAccountId = existingAccount.id;
      } else {
        const [newAccount] = await sql`INSERT INTO accounts (name, type) VALUES (${account_name}, 'expense') RETURNING id`;
        finalAccountId = newAccount.id;
      }
    }

    const [updated] = await sql`
      UPDATE expenses
      SET vendor_id = COALESCE(${finalVendorId}, vendor_id),
          account_id = COALESCE(${finalAccountId}, account_id),
          amount = COALESCE(${amount}, amount),
          payment_method = COALESCE(${payment_method}, payment_method),
          date = COALESCE(${date}, date),
          notes = COALESCE(${notes}, notes)
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
