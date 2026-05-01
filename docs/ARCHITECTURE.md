# Le Poulet — Architecture Reference

## Overview

Le Poulet is a city-wide chicken hunt game. One player (the Chicken) hides at a bar somewhere in the city. Teams of hunters use GPS tracking, a shrinking zone circle, and photo/video challenges to find them. The game is free, bilingual (FR/EN), and built as an open-source monorepo.

---

## Monorepo Structure

```
le-poulet/
├── apps/
│   ├── api/                        FastAPI backend (Python 3.12)
│   │   ├── app/
│   │   │   ├── main.py             FastAPI app + CORS + lifespan
│   │   │   ├── config.py           Pydantic settings from env
│   │   │   ├── database.py         SQLModel async engine + session factory
│   │   │   ├── redis.py            aioredis connection pool
│   │   │   ├── models/             SQLModel ORM table definitions
│   │   │   │   ├── game.py         Game, GameStatus, CostumePolicy
│   │   │   │   ├── player.py       Player, PlayerRole
│   │   │   │   ├── team.py         Team
│   │   │   │   ├── challenge.py    Challenge, ChallengeSubmission
│   │   │   │   ├── location.py     LocationUpdate (time-series)
│   │   │   │   ├── weapon.py       WeaponUse, WeaponType, WEAPON_CONFIG
│   │   │   │   └── chicken.py      ChickenHide record
│   │   │   ├── routers/            FastAPI APIRouter modules
│   │   │   │   ├── games.py        CRUD + start + end
│   │   │   │   ├── players.py      join + get by token
│   │   │   │   ├── teams.py        list teams + scores
│   │   │   │   ├── challenges.py   random + submit + score
│   │   │   │   ├── locations.py    update (rate-limited 4 s)
│   │   │   │   ├── bars.py         Overpass API proxy (Redis cached)
│   │   │   │   ├── weapons.py      fire weapon
│   │   │   │   ├── chickens.py     chicken check-in
│   │   │   │   └── costumes.py     costume voting
│   │   │   ├── services/           Business logic layer
│   │   │   │   ├── game_service.py create/start/end game lifecycle
│   │   │   │   ├── bar_service.py  Overpass query + Redis cache
│   │   │   │   ├── challenge_engine.py  random selection + scoring
│   │   │   │   ├── chicken_picker.py    roulette selection logic
│   │   │   │   ├── circle_engine.py     shrinking zone math
│   │   │   │   ├── team_builder.py      auto-balance teams
│   │   │   │   ├── power_up_engine.py   weapon cost + effects
│   │   │   │   ├── geocode_service.py   Nominatim reverse geocode
│   │   │   │   └── notification_service.py  Expo push notifications
│   │   │   ├── schemas/            Pydantic request/response models
│   │   │   ├── utils/              codes.py, geo.py, i18n.py
│   │   │   └── websockets/         WS manager + event types + handler
│   │   ├── data/
│   │   │   ├── cities.json         City config (center, bbox, tz, etc.)
│   │   │   ├── challenges_en.json  60+ English challenges
│   │   │   └── challenges_fr.json  60+ French challenges
│   │   ├── migrations/             Alembic migration scripts
│   │   ├── tests/                  pytest async test suite
│   │   ├── pyproject.toml          uv project config + ruff + mypy
│   │   └── Dockerfile              Multi-stage Python image
│   │
│   ├── web/                        Next.js 14 App Router (TypeScript)
│   │   ├── app/
│   │   │   ├── layout.tsx          Root layout (fonts, metadata)
│   │   │   ├── globals.css         Tailwind base + custom properties
│   │   │   ├── (marketing)/        Public pages (SSG)
│   │   │   │   ├── page.tsx        Landing page
│   │   │   │   └── rules/page.tsx  Game rules
│   │   │   └── (game)/             Game pages (SSR / client)
│   │   │       ├── layout.tsx      Game shell layout
│   │   │       ├── create/         Create new hunt
│   │   │       ├── join/           Join by code
│   │   │       ├── lobby/[code]/   Pre-game lobby
│   │   │       ├── hunt/[code]/    Hunter map view
│   │   │       ├── chicken/[code]/ Chicken hiding view
│   │   │       ├── results/[code]/ Post-game scoreboard
│   │   │       └── challenge/      Camera challenge modal
│   │   ├── components/
│   │   │   ├── LeafletMap.tsx      Dynamic OSM map (no SSR)
│   │   │   └── RouletteWheel.tsx   CSS roulette animation
│   │   ├── next.config.ts          Transpile packages, bundle analyzer
│   │   ├── tailwind.config.ts      Poulet color tokens
│   │   └── tsconfig.json           Path aliases
│   │
│   └── mobile/                     Expo 51 + Expo Router (iOS-first)
│       ├── app/
│       │   ├── _layout.tsx         Root stack navigator
│       │   ├── (tabs)/             Bottom tab navigator
│       │   │   ├── index.tsx       Home screen
│       │   │   └── hunt.tsx        Hunt tab (active game map)
│       │   └── game/               Game screens
│       │       ├── create.tsx      Create hunt form
│       │       ├── join.tsx        Enter code + name
│       │       ├── lobby/[code]    Waiting room (polls API)
│       │       ├── hunt/[code]     MapKit live hunt view
│       │       ├── chicken/[code]  Chicken POV map
│       │       ├── challenge/[code] Camera challenge
│       │       └── results/[code]  Final scoreboard
│       ├── components/
│       │   ├── NativeMap.tsx       react-native-maps wrapper + dark style
│       │   ├── CameraChallenge.tsx expo-camera challenge UI
│       │   ├── NativeRoulette.tsx  Reanimated 3 spin wheel
│       │   └── HapticButton.tsx    Haptic-feedback touchable
│       └── hooks/
│           ├── useBackgroundLocation.ts  GPS tracking + API sync
│           └── usePushNotifications.ts   Expo push token registration
│
├── packages/
│   ├── shared/                     Shared TypeScript library
│   │   └── src/
│   │       ├── types/              Game, Player, Challenge, Event types
│   │       ├── hooks/              useGame, useWebSocket, useShrinkingCircle
│   │       ├── api/                Typed API client + endpoint constants
│   │       ├── utils/              gameCode, geo, scoring helpers
│   │       └── i18n/               en.ts + fr.ts translation strings
│   │
│   ├── ui/                         Cross-platform component library
│   │   └── src/
│   │       ├── components/         Button, Card, Badge, Timer, Scoreboard…
│   │       └── tokens/             colors, spacing, typography, shadows
│   │
│   └── config/                     Shared config files
│       ├── typescript/             base.json, nextjs.json, react-native.json
│       ├── eslint/                 Shared ESLint config
│       └── tailwind/               Shared Tailwind base config
│
├── .github/workflows/              CI/CD pipelines
│   ├── ci.yml                      PR checks (Python + Node)
│   ├── deploy-web.yml              Vercel on main push
│   ├── deploy-api.yml              Railway on main push
│   ├── deploy-mobile.yml           EAS build + submit on tag
│   └── release.yml                 release-please changelog
├── docker-compose.yml              Postgres 16 + Redis 7 for local dev
├── Makefile                        Developer shortcuts
├── pnpm-workspace.yaml             PNPM workspace config
├── turbo.json                      Turborepo pipeline
└── package.json                    Root package (scripts, engines)
```

---

## API Stack

### Core Framework
- **FastAPI 0.110+** — async-native Python web framework, automatic OpenAPI docs at `/docs`
- **SQLModel** — combines SQLAlchemy ORM + Pydantic validation in one class definition
- **Alembic** — database migrations, configured in `alembic.ini` and `migrations/env.py`
- **asyncpg** — high-performance async PostgreSQL driver (used via `sqlalchemy[asyncio]`)
- **aioredis** — async Redis client for caching and pub/sub
- **httpx** — async HTTP client for Overpass API calls
- **uv** — ultra-fast Python package manager and virtual environment tool

### Config & Observability
- **Pydantic Settings** — typed env var loading via `app/config.py`
- **Sentry SDK** — error tracking, initialized in lifespan if `SENTRY_DSN` is set
- **ruff** — linting + formatting (replaces flake8, black, isort)
- **mypy** — static type checking with strict settings
- **pytest-asyncio** — async test execution

---

## Web Stack

### Framework
- **Next.js 14** with the **App Router** — file-based routing, React Server Components by default
- Server Components render the initial HTML on the server (faster FCP, better SEO)
- Client Components (`"use client"`) used for interactive elements: map, roulette, WebSocket hooks

### Map
- **Leaflet** + **OpenStreetMap** tiles — loaded dynamically (`next/dynamic`, `{ ssr: false }`) to avoid SSR crashes
- Custom dark tile layer matching poulet-black aesthetic
- Zone circle drawn with `L.circle()`, updated via WebSocket events

### Styling
- **Tailwind CSS 3** with custom `poulet-*` color tokens defined in `tailwind.config.ts`
- CSS custom properties for brand colors in `globals.css`
- No component library — all UI from `@le-poulet/ui` package

### Data Fetching
- Server Components use `fetch()` directly (with `cache: "no-store"` for live game data)
- Client Components use `@le-poulet/shared` hooks (`useGame`, `useWebSocket`)

---

## Mobile Stack

### Framework
- **Expo 51** — managed workflow with EAS (Expo Application Services) for builds
- **Expo Router 3.5** — file-based navigation on top of React Navigation
- **TypeScript** throughout with strict mode

### Maps
- **react-native-maps 1.14** — uses Apple MapKit on iOS (no API key required)
- Dark custom map style array applied via `customMapStyle` prop
- `react-native-maps` Circle overlay for the shrinking zone
- User location shown via built-in `showsUserLocation`

### Animation
- **react-native-reanimated 3.10** — worklet-based animations running on UI thread
- Used in `NativeRoulette` (spin physics with `withTiming` + `Easing.cubic`)
- Used in `NativeMap` for zone circle pulse effect
- **react-native-gesture-handler** — required peer dependency

### Background GPS
- **expo-location** — foreground + background location permissions
- **expo-task-manager** — registers `le-poulet-bg-location` task that runs when app is backgrounded
- `UIBackgroundModes: ["location"]` declared in `app.json` `infoPlist`
- `setInterval` in foreground posts to `POST /api/v1/locations/update` every 5 seconds
- Rate limit on API side (4-second minimum between accepted updates)

### Notifications
- **expo-notifications** — Expo push notification infrastructure
- Token registered at game join, stored in player record
- Notification service sends via Expo's push API: circle shrink alerts, chicken found, challenge scored

---

## Database Schema

Seven tables managed by SQLModel + Alembic:

### `games`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| code | VARCHAR(10) | UNIQUE, indexed — the 6-char join code |
| name | VARCHAR(100) | Display name |
| city | VARCHAR(50) | Key into cities.json |
| language | VARCHAR(5) | "en" or "fr" |
| status | ENUM | lobby / head_start / active / ended |
| host_player_id | UUID (FK) | References players.id |
| num_chickens | INT | 1–4 |
| head_start_minutes | INT | 10–60 |
| game_duration_hours | FLOAT | 1.0–4.0 |
| bar_lat / bar_lng | FLOAT | Chicken's chosen bar location |
| head_start_ends_at | TIMESTAMP | When hunters are unblocked |
| game_ends_at | TIMESTAMP | Hard deadline |
| created_at | TIMESTAMP | |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| game_id | UUID (FK) | References games.id |
| team_id | UUID (FK) | References teams.id, nullable |
| name | VARCHAR(50) | Display name |
| emoji | VARCHAR(10) | Random animal emoji |
| role | ENUM | hunter / chicken / host |
| token | UUID | Secret auth token returned at join |
| last_lat / last_lng | FLOAT | Most recent location |
| last_location_at | TIMESTAMP | For rate limiting |
| score | INT | Personal score accumulator |

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| game_id | UUID (FK) | |
| name | VARCHAR(100) | Auto-assigned (e.g. "Red Foxes") |
| color | VARCHAR(7) | Hex color for map marker |
| score | INT | Total team score |
| found_order | INT | 1st, 2nd, 3rd team to find chicken |
| chaos_points | INT | Currency for weapons |
| found_chicken_at | TIMESTAMP | When they cracked the location |

### `challenges`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR (PK) | Stable slug, e.g. "ch_mtl_001" |
| category | ENUM | social / physical / bar / creative / embarrassing / city |
| difficulty | ENUM | easy / medium / hard |
| points | INT | Score reward |
| media_type | ENUM | photo / video |
| title_en / title_fr | TEXT | Bilingual title |
| desc_en / desc_fr | TEXT | Bilingual description |
| time_limit_sec | INT | Default 120 |
| city | VARCHAR | NULL = universal, "montreal" = city-specific |
| min_players | INT | Minimum players required for this challenge |

### `challenge_submissions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| game_id / challenge_id / team_id / player_id | UUID (FK) | |
| media_url | TEXT | Uploaded photo/video URL |
| status | ENUM | pending / approved / rejected |
| points_awarded | INT | Set when scored |
| submitted_at | TIMESTAMP | |
| scored_at | TIMESTAMP | When host reviewed |

### `location_updates`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| game_id / player_id | UUID (FK) | |
| lat / lng | FLOAT | WGS-84 coordinates |
| accuracy_m | FLOAT | GPS accuracy |
| heading | FLOAT | Direction of travel (degrees) |
| speed_ms | FLOAT | Speed in m/s |
| recorded_at | TIMESTAMP | Server-side write time |

### `weapon_uses`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| game_id / by_team_id / target_team_id | UUID | |
| weapon_type | ENUM | air_strike / spy / booby_trap / steal / decoy / silence |
| points_spent | INT | Chaos points deducted |
| effect_data | JSON (TEXT) | Weapon-specific payload |
| expires_at | TIMESTAMP | For timed effects |
| fired_at | TIMESTAMP | |

---

## Redis Usage

### Bar Search Cache
- **Key pattern**: `bars:{lat:.3f}:{lng:.3f}:{radius_m}`
- **TTL**: 3600 seconds (1 hour)
- **Value**: JSON array of bar objects from Overpass API
- Avoids hammering the free Overpass API on repeated searches in the same area
- Cache miss → POST to `https://overpass-api.de/api/interpreter` → parse → cache → return

### Game State Cache (planned)
- **Key pattern**: `game:state:{game_id}`
- **TTL**: 30 seconds
- **Value**: Serialized circle state + active player count
- Allows fast reads for WebSocket broadcasts without hitting Postgres
- Invalidated on circle shrink events

### WebSocket Pub/Sub (planned)
- **Channel**: `game:{game_id}:events`
- Enables horizontal scaling — multiple API instances can broadcast to all connected players
- Subscriber per game room, publishes via `manager.broadcast()`

---

## GPS Pipeline

```
Client POST /api/v1/locations/update
  │  body: { player_token, lat, lng, accuracy_m, heading, speed_ms }
  │
  ├── Auth: lookup player by token
  │
  ├── Rate limit: check player.last_location_at
  │     if < 4 seconds ago → return {"status": "rate_limited"}
  │
  ├── DB write:
  │     UPDATE players SET last_lat, last_lng, last_location_at
  │     INSERT INTO location_updates (game_id, player_id, lat, lng, ...)
  │     await session.commit()
  │
  └── WebSocket broadcast to game room:
        {
          "type": "location:update",
          "player_id": "...",
          "lat": 45.5123,
          "lng": -73.5456,
          "ts": 1714500000000
        }
        → manager.broadcast(game_id, event)
        → sends to all WebSocket connections in that game
```

The mobile client posts every 5 seconds via `setInterval` in `useBackgroundLocation`.
The web client receives via `useWebSocket` hook and updates the Leaflet marker.

---

## WebSocket Event System

### Connection
```
WS /ws/{game_id}/{player_id}
```
- Client connects after joining, passes `player_id` as URL param
- `handler.py` accepts, registers in `ConnectionManager._connections[game_id]`
- Sends `{"type": "ping"}` every 30s to keep alive

### Event Types (from `websockets/events.py`)

| Event type | Direction | Trigger |
|------------|-----------|---------|
| `game:started` | Server → All | Host calls POST /games/{code}/start |
| `game:ended` | Server → All | Host ends game or timer expires |
| `player:joined` | Server → All | New player joins lobby |
| `player:left` | Server → All | WebSocket disconnects |
| `location:update` | Server → All | Player posts GPS position |
| `circle:shrink` | Server → All | Scheduled shrink fires |
| `chicken:alert` | Server → Team | Team enters proximity threshold |
| `chicken:found` | Server → All | Team confirms finding the chicken |
| `challenge:new` | Server → Team | New challenge assigned to a team |
| `challenge:submitted` | Server → Host | Team submits photo/video |
| `challenge:scored` | Server → Team | Host approves/rejects submission |
| `weapon:fired` | Server → All | Team fires a weapon |
| `weapon:hit` | Server → Target | Weapon effect applied |
| `bar:marked` | Server → All | Team marks a bar as visited |

### Broadcast vs Targeted
- `manager.broadcast(game_id, event)` → all players in that game
- `manager.send_to_player(player_id, event)` → specific player only (chicken alerts, challenge scores)

---

## Shrinking Circle Algorithm

The zone circle starts at 1000 m radius centered on the city center.
Every `gps_shrink_interval_minutes` minutes (default: 15), it shrinks:

```python
# From apps/api/app/services/circle_engine.py

INITIAL_RADIUS_M = 1000.0
MIN_RADIUS_M = 75.0
JITTER_FACTOR = 0.15

def shrink_circle(state: CircleState, bar_lat: float, bar_lng: float) -> CircleState:
    # 1. Reduce radius by 40% each shrink, floor at 75m
    new_radius = max(state.radius_m * 0.6, MIN_RADIUS_M)

    # 2. Add positional jitter (15% of new radius) so center doesn't
    #    snap to exactly the bar — keeps uncertainty alive
    jitter_m = new_radius * JITTER_FACTOR
    jitter_lat = (random() - 0.5) * 2 * jitter_m / 111_000
    jitter_lng = (random() - 0.5) * 2 * jitter_m / (111_000 * cos(radians(bar_lat)))

    # 3. Lerp center toward bar location proportional to how much
    #    we've shrunk (alpha approaches 1.0 as radius approaches 0)
    alpha = 1 - (new_radius / INITIAL_RADIUS_M)
    new_lat = state.center_lat + (bar_lat - state.center_lat) * alpha + jitter_lat
    new_lng = state.center_lng + (bar_lng - state.center_lng) * alpha + jitter_lng

    return CircleState(new_lat, new_lng, new_radius, state.shrink_count + 1)
```

Shrink schedule (default settings, 2-hour game, 15-min interval):
- T+0:00 — 1000 m radius, city center
- T+0:15 — 600 m, drifting toward bar
- T+0:30 — 360 m, clearly pointing at neighborhood
- T+0:45 — 216 m, within a few blocks
- T+1:00 — 130 m, nearly on top of the bar
- T+1:15 — 78 m (capped at 75 m minimum)

---

## Deployment Topology

```
                    ┌─────────────────────────────────────────┐
                    │              Clients                     │
                    │  iOS App   Web Browser   Admin Panel     │
                    └──────┬──────────┬───────────────────────┘
                           │          │
                    HTTPS  │          │  HTTPS
                           ▼          ▼
          ┌────────────────────────────────────────────┐
          │              Vercel Edge Network            │
          │         Next.js 14 (apps/web)              │
          │   SSG marketing pages + SSR game pages     │
          └──────────────────┬─────────────────────────┘
                             │ fetch / WebSocket
                             ▼
          ┌────────────────────────────────────────────┐
          │              Railway.app                    │
          │         FastAPI + uvicorn workers          │
          │         (apps/api / Dockerfile)            │
          └──────┬─────────────────┬───────────────────┘
                 │                 │
         asyncpg │         aioredis│
                 ▼                 ▼
    ┌────────────────┐   ┌─────────────────────┐
    │  Supabase      │   │  Upstash Redis       │
    │  PostgreSQL 15 │   │  (bar cache,         │
    │  (managed)     │   │   game state)        │
    └────────────────┘   └─────────────────────┘

    ┌────────────────────────────────────────────┐
    │              Expo EAS                       │
    │   iOS builds (TestFlight + App Store)      │
    │   Push notification delivery               │
    └────────────────────────────────────────────┘
```

### Services Summary
| Service | Provider | Purpose |
|---------|----------|---------|
| API | Railway | FastAPI app, auto-deploys on `main` push |
| Web | Vercel | Next.js, CDN edge, auto-deploys on `main` push |
| Database | Supabase | Managed Postgres, connection pooling via pgBouncer |
| Cache | Upstash | Serverless Redis, bar cache + future game state |
| Mobile | Expo EAS | iOS binary builds, OTA updates, TestFlight distribution |
| Monitoring | Sentry | Error tracking on API and mobile |

### Environment Variables
- API: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `SENTRY_DSN`, `ALLOWED_ORIGINS`, `OVERPASS_API_URL`
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- Mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WS_URL`, `SENTRY_DSN`
