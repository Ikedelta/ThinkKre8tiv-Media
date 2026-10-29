import sql from '@/app/api/utils/sql';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || `cms_upload_${Date.now()}.jpg`;

    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Uploaded file body is empty' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const data_base64 = buffer.toString('base64');
    const size_bytes = buffer.length;

    // Detect MIME type from file extension or content
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      gif: 'image/gif',
      pdf: 'application/pdf',
    };
    const content_type = mimeMap[ext] || 'image/jpeg';

    // Generate unique storage identifier
    const id = `sb_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const public_url = `/api/storage/${id}`;

    // Ensure database table exists
    await sql`
      CREATE TABLE IF NOT EXISTS storage_bucket (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        data_base64 TEXT NOT NULL,
        public_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Insert file into storage_bucket table
    await sql`
      INSERT INTO storage_bucket (id, filename, content_type, size_bytes, data_base64, public_url)
      VALUES (${id}, ${filename}, ${content_type}, ${size_bytes}, ${data_base64}, ${public_url})
    `;

    console.log(`[Storage Bucket] Stored ${filename} (${(size_bytes / 1024).toFixed(1)} KB) -> ${public_url}`);

    return NextResponse.json({
      success: true,
      id,
      url: public_url,
      filename,
      size: size_bytes,
      contentType: content_type,
    });
  } catch (error: any) {
    console.error('Storage bucket upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file to storage bucket' }, { status: 500 });
  }
}
