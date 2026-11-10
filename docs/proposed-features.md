# Proposed Features

Ideas only. Nothing here is implemented or committed to, and none of it changes the current game rules unless a maintainer decides so. Each line: idea — value (H/M/L), effort (S/M/L).

1. Broadcast the already-defined `chicken:found`, `challenge:scored` and `weapon:fired` WebSocket events from the API so clients can react live — value: H, effort: S
2. Enforce weapon cooldowns and `once_per_game` limits server-side (config exists in `WEAPON_CONFIG`) — value: H, effort: S
3. Implement the documented weapon effects (spy reveal, GPS block, point steal, silence) with expiry tracked via `weapon_uses.expires_at` — value: H, effort: M
4. Add an endpoint and UI for a team to claim "found the Chicken" with photo confirmation, setting `found_order` — value: H, effort: M
5. First Alembic revision plus CI check that models and migrations agree, replacing `create_all` for production — value: M, effort: S
6. Server keep-alive ping and client auto-reconnect with state re-sync via `GET /games/{code}/state` — value: M, effort: S
7. Spectator mode: read-only WebSocket role that sees the map but cannot affect the game — value: M, effort: M
8. Per-game team chat over the existing WebSocket channel — value: M, effort: M
9. Post-game recap page with route traces, challenge photos and a shareable image — value: M, effort: M
10. Per-city leaderboards and historical stats (opt-in, name and score only) — value: L, effort: M
11. Add Tunis city challenges (`city_challenges` in `cities.json` references IDs that do not exist yet) and bar fallback data for the non-Montreal cities — value: M, effort: S
12. Challenge moderation queue UX for hosts: bulk approve/reject, photo zoom, undo — value: M, effort: S
13. Installable PWA for web (offline shell, home-screen icon) as a lighter alternative to the iOS app — value: M, effort: M
14. Android build through the existing Expo managed workflow — value: M, effort: L
15. Self-hosted one-command Docker Compose bundle (API, web, Postgres, Redis) — value: L, effort: M
