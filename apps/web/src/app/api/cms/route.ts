import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const content = await sql`
      SELECT * FROM cms_content ORDER BY section, sort_order
    `;
    return Response.json(content);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch CMS content' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
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
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, section, title, content, image_url, sort_order } = body;
    if (!id || !section)
      return Response.json({ error: 'ID and section required' }, { status: 400 });

    await sql`
      INSERT INTO cms_content (id, section, title, content, image_url, sort_order)
      VALUES (${id}, ${section}, ${title ?? null}, ${content ?? null}, ${image_url ?? null}, ${sort_order ?? 0})
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          image_url = EXCLUDED.image_url,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
    `;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
