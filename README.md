# 🐔 Le Poulet

[![CI](https://github.com/aminetriki/le-poulet/actions/workflows/ci.yml/badge.svg)](https://github.com/aminetriki/le-poulet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Made with Next.js](https://img.shields.io/badge/Web-Next.js%2014-black?logo=next.js)](https://nextjs.org)
[![Made with Expo](https://img.shields.io/badge/Mobile-Expo%2051-1B1F23?logo=expo)](https://expo.dev)

> **One player hides at a bar. Everyone else hunts them across the city using GPS, a shrinking circle, and photo challenges. Completely free. Gloriously chaotic.**

---

## What is Le Poulet?

Le Poulet ("The Chicken") is a city-wide hide-and-seek game played in real bars. One unlucky player — the Chicken — gets a 30-minute head start to disappear into the city and hide at a bar. The rest of the group splits into teams and uses GPS tracking, a shrinking zone circle, and their collective bar knowledge to track them down.

Points come from finding the Chicken first, completing photo and video challenges, and deploying chaos weapons against rival teams. It's free to play, works on web and iOS, and runs in multiple cities.

---

## Features

- **Real-time GPS tracking** — see your teammates and rivals on a live map
- **Shrinking zone circle** — the search area narrows every 15 minutes, homing in on the Chicken's bar
- **60+ photo and video challenges** — earn points and chaos currency by completing ridiculous tasks
- **6 chaos weapons** — spy on rivals, air-strike their GPS, steal their points, drop decoys
- **Roulette-based Chicken selection** — no one volunteers; the wheel decides
- **Bilingual** — full English and French support throughout
- **Costume scoring** — optional chicken costume judging by the crowd
- **No ads, no purchases, no accounts required** — just a name and a game code
- **Open source** — MIT license, contributions welcome

---

## Cities

| City | Status | Default Language |
|------|--------|-----------------|
| Montreal | Live | French |
| Paris | Coming soon | French |
| London | Coming soon | English |
| New York City | Coming soon | English |
| Tunis | Coming soon | French |

Want to add your city? See [ADDING_A_CITY.md](docs/ADDING_A_CITY.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI 0.110, SQLModel, asyncpg, aioredis, Alembic |
| Web | Next.js 14 App Router, Tailwind CSS, Leaflet + OSM |
| Mobile | Expo 51, Expo Router, react-native-maps (MapKit), Reanimated 3 |
| Database | PostgreSQL 16 (Supabase) |
| Cache | Redis 7 (Upstash) |
| Hosting | Railway (API), Vercel (web), Expo EAS (iOS) |
| Monorepo | pnpm workspaces + Turborepo |
| Language | Python 3.12, TypeScript 5.4 |

---

## Quick Start

### Prerequisites

- Node 20+, pnpm 9+
- Python 3.12+ with [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Docker Desktop (for local Postgres + Redis)

### 1. Clone

```bash
git clone https://github.com/aminetriki/le-poulet.git
cd le-poulet
```

### 2. Install dependencies

```bash
pnpm install
cd apps/api && uv sync && cd ../..
```

### 3. Start infrastructure

```bash
docker compose up -d
# PostgreSQL 16 on :5432, Redis 7 on :6379
```

### 4. Configure and migrate

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# Run database migrations and seed data
cd apps/api
uv run alembic upgrade head
uv run python -m scripts.seed
cd ../..
```

### 5. Start all services

```bash
make dev
# API: http://localhost:8000
# Web: http://localhost:3000
# API docs: http://localhost:8000/docs
```

Or start services individually:

```bash
make dev-api     # FastAPI only
make dev-web     # Next.js only
make dev-mobile  # Expo only (separate terminal)
```

---

## How to Play

### Setup (5 minutes)

1. Open the app or go to [lepoulet.gg](https://lepoulet.gg)
2. The host creates a game — picks the city, rules, and duration
3. Everyone joins using the 6-character game code
4. The roulette spins to select the Chicken(s)

### Phase 1: Head Start (30 minutes)

- The Chicken gets 30 minutes to reach any bar in the city and check in
- Everyone else is shown a holding screen (no map yet)
- The Chicken should not reveal their location — no social media

### Phase 2: The Hunt (2 hours)

- Teams unlock the live map — GPS positions visible for all players
- A 1km zone circle appears, centered on the city center
- Every 15 minutes the circle shrinks toward the Chicken's bar
- Teams earn points by completing photo and video challenges
- Chaos points from challenges unlock weapons

### Phase 3: Endgame

- First team to find the Chicken and confirm (photo with the Chicken) wins the round bonus
- Game ends at the time limit or when the host calls it
- Final scoreboard shows challenge points + find bonus

---

## Make Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services (Docker + API + Web) |
| `make dev-api` | FastAPI with hot reload on :8000 |
| `make dev-web` | Next.js dev server on :3000 |
| `make dev-mobile` | Expo start (scan QR with Expo Go) |
| `make test` | Run Python tests + JS tests |
| `make lint` | Ruff + mypy + ESLint + tsc |
| `make migrate` | Run Alembic migrations to head |
| `make migrate-new MSG="desc"` | Generate new migration |
| `make seed` | Seed challenges and city data |
| `make build` | Production build (all apps) |
| `make deploy-web` | Deploy web to Vercel |
| `make deploy-api` | Deploy API to Railway |
| `make deploy-mobile` | EAS build + submit to App Store |
| `make add-city` | Interactive city addition script |
| `make reset` | Wipe DB and reseed (local only) |

---

## Project Structure

```
le-poulet/
├── apps/
│   ├── api/            FastAPI backend (Python)
│   ├── web/            Next.js web app (TypeScript)
│   └── mobile/         Expo iOS app (TypeScript)
├── packages/
│   ├── shared/         Shared types, hooks, API client
│   ├── ui/             Cross-platform component library
│   └── config/         Shared ESLint/TypeScript/Tailwind configs
├── docs/               Architecture, API, and setup guides
├── docker-compose.yml  Local Postgres + Redis
├── Makefile            Developer shortcuts
└── turbo.json          Turborepo pipeline config
```

Full architecture documentation: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Environment Variables

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lepoulet
REDIS_URL=redis://localhost:6379
SECRET_KEY=change-me-to-something-random-in-production
ALLOWED_ORIGINS=http://localhost:3000,https://lepoulet.gg
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
SENTRY_DSN=                    # optional
LOCATION_RATE_LIMIT_SECONDS=4
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_WS_URL=ws://localhost:8000
SENTRY_DSN=                    # optional
```

---

## Screenshots

> Screenshots coming soon. In the meantime, run `make dev` and open http://localhost:3000 to see the game.

| Home | Lobby | Hunt Map |
|------|-------|---------|
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

| Challenge | Results | Weapons |
|-----------|---------|---------|
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## API Reference

The API is fully documented with interactive examples at `/docs` when running locally, and at [docs/API.md](docs/API.md) in this repository.

Key endpoints:
- `POST /api/v1/games/` — create a game
- `GET /api/v1/games/{code}` — get game by code
- `POST /api/v1/players/` — join a game
- `POST /api/v1/locations/update` — update GPS (rate-limited 4s)
- `GET /api/v1/bars/search` — search bars via OSM
- `WS /ws/{game_id}/{player_id}` — real-time events

---

## Contributing

We welcome contributions of all kinds. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

Quick rules:
- Branch off `dev`, not `main`
- Follow Conventional Commits (`feat`, `fix`, `docs`, etc.)
- All new code needs tests
- Python: ruff + mypy must pass. TypeScript: eslint + tsc must pass
- Keep PRs focused — one feature or fix per PR

To add a new city: [docs/ADDING_A_CITY.md](docs/ADDING_A_CITY.md)
To set up iOS development: [docs/IOS_SETUP.md](docs/IOS_SETUP.md)

---

## Deployment

| Service | Deploy trigger | Target |
|---------|---------------|--------|
| API | Push to `main` with changes in `apps/api/` | Railway |
| Web | Push to `main` with changes in `apps/web/` | Vercel |
| iOS | Push a `v*` tag | Expo EAS → App Store |

Secrets required in GitHub Actions:
- `RAILWAY_TOKEN` — Railway deployment token
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — Vercel deployment
- `EXPO_TOKEN` — Expo EAS token

---

## Roadmap

- [ ] Android support (Expo managed workflow)
- [ ] Team chat (WebSocket)
- [ ] More cities (Berlin, Barcelona, Toronto, São Paulo)
- [ ] Spectator mode (follow the hunt without playing)
- [ ] Chicken costume photo judging
- [ ] Historical stats / leaderboards per city
- [ ] Self-hosted option with Docker Compose

---

## License

MIT — see [LICENSE](LICENSE).

Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Credits

Built by [Amine Triki](https://github.com/aminetriki) and contributors.

Inspired by the classic Montreal bar-hopping tradition of finding your friend hiding in the city.

Map data from [OpenStreetMap](https://www.openstreetmap.org) contributors.
Bar data from [Overpass API](https://overpass-api.de).

---

*Go find the chicken. 🐔*
