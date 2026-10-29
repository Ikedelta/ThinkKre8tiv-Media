import sql from '@/app/api/utils/sql';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const [file] = await sql`
      SELECT content_type, data_base64, filename 
      FROM storage_bucket 
      WHERE id = ${id} 
      LIMIT 1
    `;

    if (!file || !file.data_base64) {
      return new NextResponse('File not found in storage bucket', { status: 404 });
    }

    const buffer = Buffer.from(file.data_base64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': file.content_type || 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${file.filename}"`,
      },
    });
  } catch (error) {
    console.error('Storage bucket retrieval error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

