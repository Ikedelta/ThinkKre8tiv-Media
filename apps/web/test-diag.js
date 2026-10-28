const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function testAll() {
  const dashExpenses = await sql`
    SELECT ex.*, v.name as vendor_name, a.name as account_name 
    FROM expenses ex 
    LEFT JOIN vendors v ON ex.vendor_id = v.id 
    LEFT JOIN accounts a ON ex.account_id = a.id 
    ORDER BY ex.date DESC 
    LIMIT 5
  `;
  console.log('Expenses query verified, rows:', dashExpenses.length);

  const [testCust] = await sql`
    INSERT INTO customers (name, email, phone, company, address, notes, industry)
    VALUES ('Verification Co', 'verify@test.com', '0240000000', 'Verify Ltd', 'Accra', 'Test notes', 'Printing')
    RETURNING *
  `;
  console.log('Customer inserted successfully:', testCust.name, testCust.id);

  await sql`DELETE FROM customers WHERE id = ${testCust.id}`;
  console.log('Test customer cleanly removed.');
}

testAll().catch(console.error);
