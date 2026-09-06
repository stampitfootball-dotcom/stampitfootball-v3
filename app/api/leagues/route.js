import { NextResponse } from 'next/server';
import { apiFootball, hasFootballKey } from '../_lib/apiFootball';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasFootballKey()) return NextResponse.json({ configured: false, leagues: [] });
  try {
    const data = await apiFootball('leagues', { current: 'true' }, 86400);
    const leagues = (data.response || []).flatMap(item => {
      const current = (item.seasons || []).find(s => s.current) || item.seasons?.[0];
      if (!current || current?.coverage?.standings !== true) return [];
      return [{
        id: item.league?.id,
        name: item.league?.name || '',
        type: item.league?.type || '',
        logo: item.league?.logo || '',
        country: item.country?.name || '',
        code: item.country?.code || '',
        flag: item.country?.flag || '',
        season: current.year,
      }];
    }).filter(x => x.id && x.name);
    leagues.sort((a, b) => `${a.country} ${a.name}`.localeCompare(`${b.country} ${b.name}`));
    return NextResponse.json(
      { configured: true, leagues },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ configured: true, leagues: [], error: 'Leagues temporarily unavailable' }, { status: 502 });
  }
}
