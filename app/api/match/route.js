import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey, mapFixture } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, match: null });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ configured: true, match: null, error: 'id is required' }, { status: 400 });

  try {
    const data = await apiFootball('fixtures', { id }, 30);
    const raw = data.response?.[0];
    if (!raw) return NextResponse.json({ configured: true, match: null }, { status: 404 });
    const match = mapFixture(raw);
    match.lineups = (raw.lineups || []).map(l => ({
      team: l.team?.name || '', logo: l.team?.logo || '', formation: l.formation || '',
      startXI: (l.startXI || []).map(x => ({ id: x.player?.id, name: x.player?.name || '', number: x.player?.number, pos: x.player?.pos || '', grid: x.player?.grid || '' })),
      substitutes: (l.substitutes || []).map(x => ({ id: x.player?.id, name: x.player?.name || '', number: x.player?.number, pos: x.player?.pos || '' }))
    }));
    match.statistics = (raw.statistics || []).map(s => ({
      team: s.team?.name || '', logo: s.team?.logo || '',
      stats: (s.statistics || []).map(x => ({ type: x.type, value: x.value }))
    }));
    return NextResponse.json(
      { configured: true, match },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } }
    );
  } catch {
    return NextResponse.json({ configured: true, match: null, error: 'Match details temporarily unavailable' }, { status: 502 });
  }
}
