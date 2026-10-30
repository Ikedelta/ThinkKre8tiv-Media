import sql from '@/app/api/utils/sql';
import { requireAdmin } from '@/lib/api-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const content = await sql`
      SELECT * FROM cms_content ORDER BY section, sort_order
    `;

    return Response.json(content, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch CMS content' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, title, content, image_url, is_active } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    await sql`
      UPDATE cms_content
      SET title = ${title ?? null},
          content = ${content ?? null},
          image_url = ${image_url ?? null},
          is_active = ${is_active ?? true},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return Response.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const body = await request.json();
    const { id, section, title, content, image_url, sort_order } = body;
    if (!id || !section) return Response.json({ error: 'ID and Section required' }, { status: 400 });

    await sql`
      INSERT INTO cms_content (id, section, title, content, image_url, sort_order, is_active, updated_at)
      VALUES (${id}, ${section}, ${title ?? null}, ${content ?? null}, ${image_url ?? null}, ${sort_order ?? 0}, true, NOW())
      ON CONFLICT (id) DO UPDATE
      SET title = ${title ?? null},
          content = ${content ?? null},
          image_url = ${image_url ?? null},
          sort_order = ${sort_order ?? 0},
          updated_at = NOW()
    `;

    return Response.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof Response) return authResult;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    await sql`
      DELETE FROM cms_content WHERE id = ${id}
    `;

    return Response.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
