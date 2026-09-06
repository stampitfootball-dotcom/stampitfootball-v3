# Stamp It Football — API-Football Live Data Build

This Next.js launch build connects Stamp It Football to API-Football through server-side Vercel routes.

## Environment variables

- `API_FOOTBALL_KEY` — required for live scores, fixtures, leagues, standings and match details.
- `GNEWS_API_KEY` — optional; news integration remains separate.

Never place the API-Football key in client-side code or GitHub.

## Live-data behavior

- `/api/live` — all currently live matches worldwide; upstream data cached for 20 seconds.
- `/api/fixtures?days=2` — worldwide fixtures for today and tomorrow; cached for 5 minutes.
- `/api/leagues` — current competitions with standings coverage; cached for 24 hours.
- `/api/standings?league=ID&season=YEAR` — competition standings; cached for 1 hour.
- `/api/match?id=FIXTURE_ID` — match details including timeline/events, statistics and lineups when the provider has them; cached for 30 seconds.

The browser polls the live endpoint every 20 seconds. API-Football states live fixture/event data is updated about every 15 seconds. Server/CDN caching prevents each visitor from directly consuming an upstream API request.

## Deploy

Upload the changed files to the existing GitHub repository. Vercel is already connected to `main`, so a commit will trigger a production deployment. `API_FOOTBALL_KEY` must exist in Vercel Production environment variables.
