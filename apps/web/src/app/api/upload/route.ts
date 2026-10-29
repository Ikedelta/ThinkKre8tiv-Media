import sql from '@/app/api/utils/sql';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

function getS3Client() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    forcePathStyle: true,
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

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

    // Also mirror directly into Neon S3 Object Storage bucket if configured
    try {
      const s3 = getS3Client();
      const bucket = process.env.NEON_STORAGE_BUCKET || 'cms-uploads';
      if (s3 && bucket) {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `uploads/${id}_${filename}`,
            Body: buffer,
            ContentType: content_type,
          })
        );
        console.log(`[Neon S3 Bucket] Uploaded to bucket ${bucket} as uploads/${id}_${filename}`);
      }
    } catch (s3Err: any) {
      console.warn('[Neon S3 Bucket] S3 upload skipped or warning:', s3Err?.message);
    }

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
