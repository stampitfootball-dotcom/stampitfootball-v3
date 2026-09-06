const BASE = 'https://v3.football.api-sports.io';

export function hasFootballKey() {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

export async function apiFootball(path, params = {}, revalidate = 30) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY is not configured');

  const url = new URL(`${BASE}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    headers: { 'x-apisports-key': key, Accept: 'application/json' },
    next: { revalidate },
  });

  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
  const data = await res.json();
  const errors = data?.errors;
  if (errors && ((Array.isArray(errors) && errors.length) || (!Array.isArray(errors) && Object.keys(errors).length))) {
    throw new Error(`API-Football: ${JSON.stringify(errors)}`);
  }
  return data;
}

export function mapEvent(e) {
  return {
    elapsed: e?.time?.elapsed ?? null,
    extra: e?.time?.extra ?? null,
    team: e?.team?.name || '',
    teamLogo: e?.team?.logo || '',
    player: e?.player?.name || '',
    assist: e?.assist?.name || '',
    type: e?.type || '',
    detail: e?.detail || '',
    comments: e?.comments || '',
  };
}

export function mapFixture(x) {
  const f = x?.fixture || {};
  const s = f?.status || {};
  return {
    id: f.id,
    referee: f.referee || '',
    timezone: f.timezone || 'UTC',
    utcDate: f.date,
    timestamp: f.timestamp,
    venue: f?.venue?.name || '',
    city: f?.venue?.city || '',
    status: s.short || '',
    statusLong: s.long || '',
    minute: s.elapsed ?? null,
    extra: s.extra ?? null,
    competition: x?.league?.name || '',
    leagueId: x?.league?.id ?? null,
    country: x?.league?.country || '',
    leagueLogo: x?.league?.logo || '',
    flag: x?.league?.flag || '',
    round: x?.league?.round || '',
    home: x?.teams?.home?.name || '',
    homeId: x?.teams?.home?.id ?? null,
    homeLogo: x?.teams?.home?.logo || '',
    homeWinner: x?.teams?.home?.winner ?? null,
    away: x?.teams?.away?.name || '',
    awayId: x?.teams?.away?.id ?? null,
    awayLogo: x?.teams?.away?.logo || '',
    awayWinner: x?.teams?.away?.winner ?? null,
    homeScore: x?.goals?.home ?? null,
    awayScore: x?.goals?.away ?? null,
    halftime: x?.score?.halftime || null,
    fulltime: x?.score?.fulltime || null,
    extratime: x?.score?.extratime || null,
    penalty: x?.score?.penalty || null,
    events: (x?.events || []).map(mapEvent),
  };
}
