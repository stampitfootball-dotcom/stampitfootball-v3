import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey, mapFixture } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, matches: [] });
  try {
    const { searchParams } = new URL(req.url);
    const requestedDate = searchParams.get('date');
    const days = Math.max(1, Math.min(Number(searchParams.get('days') || 2), 3));
    const base = requestedDate ? new Date(`${requestedDate}T12:00:00Z`) : new Date();
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + i);
      return ymd(d);
    });

    const chunks = await Promise.all(
      dates.map(date => apiFootball('fixtures', { date }, 300).then(d => d.response || []))
    );
    const seen = new Set();
    const matches = chunks.flat().map(mapFixture).filter(m => m.id && !seen.has(m.id) && seen.add(m.id));
    matches.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return NextResponse.json(
      { configured: true, dates, matches },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } }
    );
  } catch {
    return NextResponse.json({ configured: true, matches: [], error: 'Fixtures temporarily unavailable' }, { status: 502 });
  }
}
