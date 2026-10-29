import sql from '@/app/api/utils/sql';
import { requireAdmin } from '@/lib/api-security';

// In-memory cache for rapid sub-millisecond responses on serverless instances
let cachedCms: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCms && (now - lastFetchTime) < CACHE_TTL_MS) {
      return Response.json(cachedCms, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      });
    }

    const content = await sql`
      SELECT * FROM cms_content ORDER BY section, sort_order
    `;
    cachedCms = content;
    lastFetchTime = now;

    return Response.json(content, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error(error);
    if (cachedCms) {
      return Response.json(cachedCms);
    }
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

    // Invalidate local memory cache immediately so updates reflect instantly
    cachedCms = null;
    lastFetchTime = 0;

    return Response.json({ success: true });
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

    // Invalidate local memory cache immediately
    cachedCms = null;
    lastFetchTime = 0;

    return Response.json({ success: true });
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

    // Invalidate local memory cache immediately
    cachedCms = null;
    lastFetchTime = 0;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
