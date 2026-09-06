import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, groups: [] });
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league');
  const season = searchParams.get('season');
  if (!league || !season) return NextResponse.json({ configured: true, groups: [], error: 'league and season are required' }, { status: 400 });

  try {
    const data = await apiFootball('standings', { league, season }, 3600);
    const root = data.response?.[0]?.league;
    const groups = (root?.standings || []).map((group, idx) => ({
      name: group?.[0]?.group || (root?.standings?.length > 1 ? `Group ${idx + 1}` : 'Table'),
      rows: (group || []).map(r => ({
        rank: r.rank,
        teamId: r.team?.id,
        team: r.team?.name || '',
        logo: r.team?.logo || '',
        points: r.points ?? 0,
        goalsDiff: r.goalsDiff ?? 0,
        played: r.all?.played ?? 0,
        win: r.all?.win ?? 0,
        draw: r.all?.draw ?? 0,
        lose: r.all?.lose ?? 0,
        goalsFor: r.all?.goals?.for ?? 0,
        goalsAgainst: r.all?.goals?.against ?? 0,
        form: r.form || '',
        description: r.description || '',
        movement: r.status || '',
      }))
    }));
    return NextResponse.json(
      { configured: true, league: { id: root?.id, name: root?.name, logo: root?.logo, country: root?.country, season: root?.season }, groups },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' } }
    );
  } catch {
    return NextResponse.json({ configured: true, groups: [], error: 'Standings temporarily unavailable' }, { status: 502 });
  }
}
