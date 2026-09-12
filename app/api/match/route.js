import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey, mapFixture, mapEvent } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

const mapStats = rows => (rows || []).map(s => ({
  team: s.team?.name || '',
  teamId: s.team?.id ?? null,
  logo: s.team?.logo || '',
  stats: (s.statistics || []).map(x => ({ type: x.type, value: x.value }))
}));

const mapLineups = rows => (rows || []).map(l => ({
  team: l.team?.name || '',
  teamId: l.team?.id ?? null,
  logo: l.team?.logo || '',
  formation: l.formation || '',
  startXI: (l.startXI || []).map(x => ({ id: x.player?.id, name: x.player?.name || '', number: x.player?.number, pos: x.player?.pos || '', grid: x.player?.grid || '' })),
  substitutes: (l.substitutes || []).map(x => ({ id: x.player?.id, name: x.player?.name || '', number: x.player?.number, pos: x.player?.pos || '' }))
}));

export async function GET(req) {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, match: null });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ configured: true, match: null, error: 'id is required' }, { status: 400 });

  try {
    const fixtureData = await apiFootball('fixtures', { id }, 15);
    const raw = fixtureData.response?.[0];
    if (!raw) return NextResponse.json({ configured: true, match: null }, { status: 404 });

    const [statsResult, eventsResult, lineupsResult] = await Promise.allSettled([
      apiFootball('fixtures/statistics', { fixture: id }, 15),
      apiFootball('fixtures/events', { fixture: id }, 15),
      apiFootball('fixtures/lineups', { fixture: id }, 60),
    ]);

    const match = mapFixture(raw);
    const statRows = statsResult.status === 'fulfilled' ? statsResult.value.response : raw.statistics;
    const eventRows = eventsResult.status === 'fulfilled' ? eventsResult.value.response : raw.events;
    const lineupRows = lineupsResult.status === 'fulfilled' ? lineupsResult.value.response : raw.lineups;

    match.statistics = mapStats(statRows);
    match.events = (eventRows || []).map(mapEvent);
    match.lineups = mapLineups(lineupRows);
    match.hasStatistics = match.statistics.some(t => t.stats?.some(s => s.value !== null && s.value !== undefined));
    match.hasLineups = match.lineups.some(t => t.startXI?.length);

    return NextResponse.json(
      { configured: true, match },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=15' } }
    );
  } catch {
    return NextResponse.json({ configured: true, match: null, error: 'Match details temporarily unavailable' }, { status: 502 });
  }
}
