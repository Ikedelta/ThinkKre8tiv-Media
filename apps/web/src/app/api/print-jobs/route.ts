import sql from '@/app/api/utils/sql';

// Simple check to see if database URL is configured
const isDbConfigured = !!process.env.DATABASE_URL;

// Helper to translate DB status to Tracking Stage
function mapDbStatusToTracking(status: string) {
  switch (status) {
    case 'draft':
      return 'submitted';
    case 'sent':
      return 'proofing';
    case 'accepted':
      return 'printing';
    case 'rejected':
      return 'finishing';
    case 'converted':
      return 'completed';
    default:
      return 'submitted';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return Response.json({ error: 'Tracking code is required' }, { status: 400 });
    }

    if (!isDbConfigured) {
      // Offline/Local Development Simulation Mode
      // We will generate a mock job status if the database is not configured
      const numCode = code.replace(/[^0-9]/g, '');
      const seed = numCode ? parseInt(numCode, 10) % 5 : 0;
      const statusMap = ['submitted', 'proofing', 'printing', 'finishing', 'completed'];
      const currentStatus = statusMap[seed] || 'submitted';

      return Response.json({
        id: 'mock-id',
        tracking_code: code,
        status: currentStatus,
        customer_name: 'Jane Doe (Simulated Client)',
        customer_email: 'jane@example.com',
        customer_phone: '+233 24 000 0000',
        product: 'Premium Silk Flyers',
        specs: {
          paper: '300gsm Art Card',
          color: 'CMYK Full Color',
          finish: 'Matte Lamination',
          qty: 250,
          dimensions: 'A5 size',
          filename: 'brochure_draft_final.pdf'
        },
        total_amount: 125.00,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
        is_mock: true
      });
    }

    // Database lookup
    const [job] = await sql`
      SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      WHERE q.quotation_number = ${code}
    `;

    if (!job) {
      return Response.json({ error: 'Print job tracking record not found' }, { status: 404 });
    }

    let parsedSpecs = {};
    try {
      if (job.notes && job.notes.startsWith('{')) {
        parsedSpecs = JSON.parse(job.notes);
      } else {
        parsedSpecs = { notes: job.notes };
      }
    } catch {
      parsedSpecs = { notes: job.notes };
    }

    return Response.json({
      id: job.id,
      tracking_code: job.quotation_number,
      status: mapDbStatusToTracking(job.status),
      customer_name: job.customer_name,
      customer_email: job.customer_email,
      customer_phone: job.customer_phone,
      specs: parsedSpecs,
      total_amount: Number(job.total_amount),
      created_at: job.created_at,
      is_mock: false
    });

  } catch (error: any) {
    console.error('Error fetching print job status:', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const company = formData.get('company') as string;
    const address = formData.get('address') as string;
    const product = formData.get('product') as string;
    const paper = formData.get('paper') as string;
    const color = formData.get('color') as string;
    const finish = formData.get('finish') as string;
    const qty = parseInt(formData.get('qty') as string) || 1;
    const width = formData.get('width') as string;
    const height = formData.get('height') as string;
    let filename = formData.get('filename') as string;
    const notes = formData.get('notes') as string;
    const total = parseFloat(formData.get('total') as string) || 0;
    
    const file = formData.get('file') as File | null;
    let fileUrl = null;

    if (!name || !email || !phone || !product) {
      return Response.json({ error: 'Required contact fields or products are missing' }, { status: 400 });
    }
    
    if (file && file.size > 0) {
      filename = file.name;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      
      const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filepath = join(uploadDir, safeFilename);
      await writeFile(filepath, buffer);
      
      fileUrl = `/uploads/${safeFilename}`;
    }

    // Generate tracking code sequence
    const uniqueRand = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `TK-2026-${uniqueRand}`;

    if (!isDbConfigured) {
      // Offline/Local Development Simulation Mode
      return Response.json({
        success: true,
        tracking_code: trackingCode,
        is_mock: true,
        message: 'Print job submitted successfully (Simulated mode)'
      });
    }

    // Try to locate existing customer by email
    let customerId = '';
    const [existingCustomer] = await sql`
      SELECT id FROM customers WHERE email = ${email} LIMIT 1
    `;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const [newCustomer] = await sql`
        INSERT INTO customers (name, email, phone, company, address)
        VALUES (${name}, ${email}, ${phone}, ${company || null}, ${address || null})
        RETURNING id
      `;
      customerId = newCustomer.id;
    }

    // Prepare JSON metadata notes
    const specDetailsJson = JSON.stringify({
      product,
      paper,
      color,
      finish,
      qty,
      width: width || null,
      height: height || null,
      filename: filename || 'no-file-attached',
      client_notes: notes || ''
    });

    const [quotation] = await sql`
      INSERT INTO quotations (customer_id, quotation_number, subtotal, vat_rate, vat_amount, discount_amount, total_amount, notes, status, file_url)
      VALUES (
        ${customerId}, 
        ${trackingCode}, 
        ${total || 0}, 
        7.5, 
        0, 
        0, 
        ${total || 0}, 
        ${specDetailsJson}, 
        'draft',
        ${fileUrl}
      )
      RETURNING *
    `;

    // Insert items list
    await sql`
      INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
      VALUES (
        ${quotation.id}, 
        ${product + ' (' + paper + ', ' + color + ')'}, 
        ${qty || 1}, 
        ${total ? (total / (qty || 1)).toFixed(2) : 0}, 
        ${total || 0}
      )
    `;

    return Response.json({
      success: true,
      tracking_code: trackingCode,
      id: quotation.id,
      is_mock: false,
      file_url: fileUrl
    });

  } catch (error: any) {
    console.error('Error submitting print job:', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

