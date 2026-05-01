# Le Poulet API Reference

Base URL: `https://api.lepoulet.gg` (production) / `http://localhost:8000` (local)

All endpoints return JSON. Errors follow `{ "detail": "message" }` format.

Interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## Health

### GET /health

Returns server status and version.

```http
GET /health
```

Response `200`:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

## Games

### POST /api/v1/games/

Create a new game. The caller becomes the host.

```http
POST /api/v1/games/?host_name=Alice
Content-Type: application/json

{
  "name": "Friday Night Hunt",
  "city": "montreal",
  "language": "fr",
  "num_chickens": 1,
  "head_start_minutes": 30,
  "game_duration_hours": 2.0,
  "team_size": 4,
  "gps_shrink_interval_minutes": 15,
  "buy_in_amount": 0,
  "costume_policy": "encouraged",
  "chaos_mode": false
}
```

Query params:
- `host_name` (required) — display name for the host player

Response `200`:
```json
{
  "game_code": "ABCD12",
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "host_token": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

The `host_token` is the host's player auth token. Store it in the client.

---

### GET /api/v1/games/{code}

Fetch game metadata by its 6-character code.

```http
GET /api/v1/games/ABCD12
```

Response `200`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "ABCD12",
  "name": "Friday Night Hunt",
  "city": "montreal",
  "language": "fr",
  "status": "lobby",
  "chaos_mode": false,
  "player_count": 8,
  "buy_in_amount": 0
}
```

Status values: `lobby` | `head_start` | `active` | `ended`

Response `404`:
```json
{ "detail": "Game not found" }
```

---

### POST /api/v1/games/{code}/start

Start the game. Only the host can call this.

```http
POST /api/v1/games/ABCD12/start
Content-Type: application/json

{
  "host_token": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "bar_name": "Le Barrack",
  "bar_lat": 45.5231,
  "bar_lng": -73.5812
}
```

Fields:
- `host_token` (required) — host player auth token
- `bar_name` / `bar_lat` / `bar_lng` (optional) — override the bar if not set yet

Response `200`:
```json
{
  "status": "head_start",
  "head_start_ends_at": "2024-05-01 21:30:00"
}
```

Starting triggers:
1. Game status set to `head_start`
2. `head_start_ends_at` set to now + `head_start_minutes`
3. `game:started` WebSocket event broadcast to all players
4. Teams auto-built from joined players
5. Chicken role assigned via roulette

---

### POST /api/v1/games/{code}/end

End the game early. Only the host can call this.

```http
POST /api/v1/games/ABCD12/end?host_token=7c9e6679-7425-40de-944b-e07fc1f90ae7
```

Response `200`:
```json
{
  "status": "ended",
  "ended_at": "2024-05-01 23:15:00"
}
```

---

## Players

### POST /api/v1/players/

Join a game as a new player.

```http
POST /api/v1/players/
Content-Type: application/json

{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Amine",
  "emoji": "🦊"
}
```

Fields:
- `game_id` (required) — use the `id` from GET /games/{code}
- `name` (required) — display name, max 50 characters
- `emoji` (optional) — if omitted, a random animal emoji is assigned

Response `200`:
```json
{
  "player_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emoji": "🦊"
}
```

The `token` is the player's auth token for all subsequent calls. Store in AsyncStorage / localStorage.

Response `404`:
```json
{ "detail": "Game not found" }
```

---

### GET /api/v1/players/{game_id}/all

List all players in a game.

```http
GET /api/v1/players/550e8400-e29b-41d4-a716-446655440000/all
```

Response `200`:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Amine",
    "emoji": "🦊",
    "role": "hunter",
    "score": 150
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Alice",
    "emoji": "🐺",
    "role": "host",
    "score": 0
  },
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "name": "Youssef",
    "emoji": "🐔",
    "role": "chicken",
    "score": 200
  }
]
```

Role values: `hunter` | `chicken` | `host`

---

### GET /api/v1/players/me/{token}

Get a player's own info by token.

```http
GET /api/v1/players/me/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

Response `200`:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Amine",
  "emoji": "🦊",
  "role": "hunter",
  "score": 150,
  "team_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "game_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Teams

### GET /api/v1/teams/{game_id}/all

List all teams with scores.

```http
GET /api/v1/teams/550e8400-e29b-41d4-a716-446655440000/all
```

Response `200`:
```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "name": "Red Foxes",
    "color": "#C1121F",
    "score": 450,
    "found_order": 1,
    "chaos_points": 80,
    "weapons_available": 2
  },
  {
    "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "name": "Blue Wolves",
    "color": "#457B9D",
    "score": 300,
    "found_order": null,
    "chaos_points": 120,
    "weapons_available": 3
  }
]
```

---

## Locations

### POST /api/v1/locations/update

Update a player's GPS location. Rate-limited: minimum 4 seconds between accepted updates.

```http
POST /api/v1/locations/update
Content-Type: application/json

{
  "player_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "lat": 45.5231,
  "lng": -73.5812,
  "accuracy_m": 8.5,
  "heading": 270.0,
  "speed_ms": 1.4
}
```

Fields:
- `player_token` (required)
- `lat` / `lng` (required) — WGS-84 decimal degrees
- `accuracy_m` (required) — GPS accuracy in metres
- `heading` (optional) — bearing in degrees 0–360
- `speed_ms` (optional) — speed in metres per second

Response `200`:
```json
{ "status": "ok" }
```

Rate-limited response `200`:
```json
{ "status": "rate_limited" }
```

Response `401`:
```json
{ "detail": "Invalid token" }
```

On success, a `location:update` WebSocket event is broadcast to all players in the game.

---

## Bars

### GET /api/v1/bars/search

Search for bars near a coordinate using OpenStreetMap Overpass API. Results are cached in Redis for 1 hour.

```http
GET /api/v1/bars/search?lat=45.5231&lng=-73.5812&radius_m=1500
```

Query params:
- `lat` (required) — latitude
- `lng` (required) — longitude
- `radius_m` (optional, default 1500) — search radius in metres

Response `200`:
```json
[
  {
    "id": "osm:12345678",
    "name": "Le Barrack",
    "lat": 45.5198,
    "lng": -73.5789,
    "address": "Rue Saint-Denis",
    "house_number": "1134",
    "phone": "+1-514-555-0100",
    "website": "https://lebarrack.com",
    "opening_hours": "Mon-Sun 15:00-03:00"
  }
]
```

Returns up to 20 results. Queries OSM `amenity=bar`, `amenity=pub`, `amenity=nightclub`.

---

## Challenges

### GET /api/v1/challenges/random/{game_id}/{team_id}

Get a random challenge not yet assigned to this team in this game.

```http
GET /api/v1/challenges/random/550e8400.../d4e5f6a7...?city=montreal
```

Query params:
- `city` (optional, default `montreal`) — include city-specific challenges

Response `200`:
```json
{
  "id": "ch_mtl_001",
  "title_en": "Get a selfie with a stranger wearing a hat",
  "title_fr": "Fais un selfie avec un inconnu portant un chapeau",
  "desc_en": "Find someone wearing any kind of hat and get a photo together. They must be smiling.",
  "desc_fr": "Trouve quelqu'un avec un chapeau et prenez une photo ensemble. Il doit sourire.",
  "points": 150,
  "media_type": "photo",
  "time_limit_sec": 120,
  "category": "social",
  "difficulty": "easy",
  "min_players": 1
}
```

Response `404`:
```json
{ "detail": "No more challenges available" }
```

---

### POST /api/v1/challenges/submit

Submit a completed challenge with photo or video.

```http
POST /api/v1/challenges/submit
Content-Type: application/json

{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "challenge_id": "ch_mtl_001",
  "team_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "player_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "media_url": "https://storage.lepoulet.gg/submissions/abc123.jpg"
}
```

Response `200`:
```json
{
  "submission_id": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
  "status": "pending"
}
```

The host reviews pending submissions at `GET /api/v1/challenges/submissions/{game_id}/pending`.

---

### POST /api/v1/challenges/{submission_id}/score

Score a challenge submission. Only callable by the host.

```http
POST /api/v1/challenges/f1e2d3c4-b5a6-7890-fedc-ba9876543210/score
Content-Type: application/json

{
  "score": 150,
  "approved": true
}
```

Fields:
- `score` — points to award (can be less than max for partial credit)
- `approved` — `true` = approved, `false` = rejected

Response `200`:
```json
{
  "status": "approved",
  "points_awarded": 150
}
```

On approval, a `challenge:scored` WebSocket event is sent to the team.

---

### GET /api/v1/challenges/submissions/{game_id}/pending

List pending challenge submissions for host review.

```http
GET /api/v1/challenges/submissions/550e8400.../pending
```

Response `200`:
```json
[
  {
    "id": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
    "challenge_id": "ch_mtl_001",
    "team_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "player_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "media_url": "https://storage.lepoulet.gg/submissions/abc123.jpg",
    "submitted_at": "2024-05-01 21:45:30"
  }
]
```

---

## Weapons

### POST /api/v1/weapons/fire

Fire a weapon using chaos points. Chaos points are earned by completing challenges.

```http
POST /api/v1/weapons/fire
Content-Type: application/json

{
  "player_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "weapon_type": "spy",
  "target_team_id": "e5f6a7b8-c9d0-1234-efab-345678901234"
}
```

Weapon types and costs:
| Weapon | Cost | Effect |
|--------|------|--------|
| `spy` | 60 pts | See target team's location for 60 seconds |
| `air_strike` | 80 pts | Block target team's GPS updates for 90 seconds |
| `steal` | 40 pts | Steal 50 chaos points from target team |
| `silence` | 70 pts | Prevent target team from submitting challenges for 2 min |
| `booby_trap` | 50 pts | Next team to enter your zone loses 30 pts (one-time) |
| `decoy` | 100 pts | Place a false location marker on the map (one-time) |

Response `200`:
```json
{
  "status": "fired",
  "weapon": "spy",
  "chaos_points_remaining": 60
}
```

Response `400`:
```json
{ "detail": "Not enough chaos points or invalid weapon" }
```

---

### GET /api/v1/weapons/config

Get weapon cost and cooldown configuration.

```http
GET /api/v1/weapons/config
```

Response `200`:
```json
{
  "air_strike": { "cost": 80, "cooldown_minutes": 20, "once_per_game": false },
  "spy": { "cost": 60, "cooldown_minutes": 15, "once_per_game": false },
  "booby_trap": { "cost": 50, "cooldown_minutes": 0, "once_per_game": true },
  "steal": { "cost": 40, "cooldown_minutes": 10, "once_per_game": false },
  "decoy": { "cost": 100, "cooldown_minutes": 0, "once_per_game": true },
  "silence": { "cost": 70, "cooldown_minutes": 20, "once_per_game": false }
}
```

---

## WebSocket

### WS /ws/{game_id}/{player_id}

Real-time game events connection.

```
ws://localhost:8000/ws/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

The server sends JSON text frames. All events have a `type` field.

#### Inbound Events (server → client)

**`game:started`**
```json
{
  "type": "game:started",
  "game_id": "550e8400...",
  "config": {
    "head_start_minutes": 30,
    "game_duration_hours": 2.0,
    "gps_shrink_interval_minutes": 15
  }
}
```

**`location:update`**
```json
{
  "type": "location:update",
  "player_id": "a1b2c3d4...",
  "lat": 45.5231,
  "lng": -73.5812,
  "ts": 1714500000000
}
```

**`circle:shrink`**
```json
{
  "type": "circle:shrink",
  "lat": 45.5198,
  "lng": -73.5789,
  "radius_m": 360.0,
  "next_shrink_at": 1714502700000
}
```

**`chicken:found`**
```json
{
  "type": "chicken:found",
  "team_id": "d4e5f6a7...",
  "team_name": "Red Foxes",
  "order": 1
}
```

**`challenge:scored`**
```json
{
  "type": "challenge:scored",
  "submission_id": "f1e2d3c4...",
  "team_id": "d4e5f6a7...",
  "points": 150,
  "approved": true
}
```

**`weapon:fired`**
```json
{
  "type": "weapon:fired",
  "weapon": "spy",
  "by_team_id": "d4e5f6a7...",
  "target_team_id": "e5f6a7b8..."
}
```

**`game:ended`**
```json
{
  "type": "game:ended",
  "game_id": "550e8400...",
  "scoreboard": [
    { "team_name": "Red Foxes", "score": 450, "found_order": 1 },
    { "team_name": "Blue Wolves", "score": 300, "found_order": null }
  ]
}
```

The connection is kept alive with server-sent `{"type": "ping"}` messages every 30 seconds.
Clients should reconnect with exponential backoff on disconnect.
