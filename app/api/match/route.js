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

    const [statsResult, eventsResult, lineupsResult, homeFormResult, awayFormResult, h2hResult] = await Promise.allSettled([
      apiFootball('fixtures/statistics', { fixture: id }, 15),
      apiFootball('fixtures/events', { fixture: id }, 15),
      apiFootball('fixtures/lineups', { fixture: id }, 60),
      apiFootball('fixtures', { team: raw.teams?.home?.id, last: 5 }, 300),
      apiFootball('fixtures', { team: raw.teams?.away?.id, last: 5 }, 300),
      apiFootball('fixtures/headtohead', { h2h: `${raw.teams?.home?.id}-${raw.teams?.away?.id}`, last: 5 }, 300),
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
    const completed = x => ['FT','AET','PEN'].includes(x?.fixture?.status?.short) && Number(x?.fixture?.id) !== Number(id);
    const formRows = (result, teamId) => {
      const rows = result.status === 'fulfilled' ? result.value.response || [] : [];
      return rows.filter(completed).slice(-5).reverse().map(x => {
        const m = mapFixture(x);
        const home = Number(m.homeId) === Number(teamId);
        const gf = home ? m.homeScore : m.awayScore, ga = home ? m.awayScore : m.homeScore;
        return { ...m, result: gf > ga ? 'W' : gf < ga ? 'L' : 'D' };
      });
    };
    match.form = { home: formRows(homeFormResult, match.homeId), away: formRows(awayFormResult, match.awayId) };
    match.h2h = (h2hResult.status === 'fulfilled' ? h2hResult.value.response || [] : []).filter(completed).slice(-5).reverse().map(mapFixture);

    return NextResponse.json(
      { configured: true, match },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=15' } }
    );
  } catch {
    return NextResponse.json({ configured: true, match: null, error: 'Match details temporarily unavailable' }, { status: 502 });
  }
}
