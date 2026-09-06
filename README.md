# Stamp It Football — Launch V1

Football-first launch build. No character section.

## Public without sign-up
- Live scores
- Today/upcoming fixtures
- League table UI
- Breaking/minute-by-minute news UI
- Free predictions
- Merch

## Account-gated UI
- Weekly Draft
- Monthly Draft
- VIP Predictions

## Required production connections
- `FOOTBALL_DATA_API_KEY` for match data
- `GNEWS_API_KEY` for development news feed
- Production authentication/database before real member accounts
- VIP billing before charging for VIP access
- Standings endpoint/provider connection

The UI polls scores every 15 seconds and news every 60 seconds. Actual freshness is limited by upstream provider update frequency and API rate limits. Do not claim literal second-by-second data unless the chosen provider supports it.
