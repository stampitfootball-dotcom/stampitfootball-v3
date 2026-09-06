import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey, mapFixture } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, matches: [] });
  try {
    const data = await apiFootball('fixtures', { live: 'all' }, 20);
    return NextResponse.json(
      { configured: true, fetchedAt: Date.now(), matches: (data.response || []).map(mapFixture) },
      { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=20' } }
    );
  } catch (e) {
    return NextResponse.json({ configured: true, matches: [], error: 'Live scores temporarily unavailable' }, { status: 502 });
  }
}
