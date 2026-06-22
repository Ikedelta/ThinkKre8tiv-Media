import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const logs = await sql`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return Response.json(logs);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
