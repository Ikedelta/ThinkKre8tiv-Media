import sql from '@/app/api/utils/sql';

// Flag ensuring database indexes are ensured once on cold start without slowing every query
let indexesEnsured = false;

export async function ensureDatabaseIndexes() {
  if (indexesEnsured) return;
  try {
    indexesEnsured = true;
    await sql`
      -- Structural columns ensured once at cold start
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unpaid';

      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT;
      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_port INT;
      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_user TEXT;
      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_password TEXT;
      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_from_name TEXT;
      ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS smtp_from_email TEXT;

      -- High performance database lookup indexes
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(balance_due);
      CREATE INDEX IF NOT EXISTS idx_invoices_approval_status ON invoices(approval_status);

      CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customer_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_receipts_approval_status ON receipts(approval_status);

      CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_vendor_id ON expenses(vendor_id);

      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource, resource_id);
    `;
  } catch (err) {
    console.error('Non-critical: Failed to ensure database indexes', err);
  }
}

