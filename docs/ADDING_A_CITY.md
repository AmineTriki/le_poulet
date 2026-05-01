# Adding a New City to Le Poulet

This guide walks you through everything required to add a new city where players can run a Le Poulet chicken hunt.

---

## Overview

Each city requires:
1. A city config entry in `cities.json`
2. At least 5 city-specific challenges in both `challenges_en.json` and `challenges_fr.json`
3. Updated city selectors in the web create page and mobile create screen
4. A verified Overpass bbox that returns bars in the city
5. A PR following the checklist at the bottom of this document

---

## Step 1 — cities.json Schema

File: `apps/api/data/cities.json`

Add a new entry using this schema:

```json
{
  "<city_slug>": {
    "name_en": "City Name in English",
    "name_fr": "Nom de la ville en français",
    "country": "XX",
    "default_language": "en",
    "center": { "lat": 0.0000, "lng": 0.0000 },
    "bbox": [south_lat, west_lng, north_lat, east_lng],
    "default_radius_m": 1500,
    "timezone": "Continent/City",
    "currency": "XXX",
    "starting_neighborhoods": ["Neighborhood 1", "Neighborhood 2", "Neighborhood 3", "Neighborhood 4"],
    "city_challenges": ["ch_xxx_001", "ch_xxx_002", "ch_xxx_003", "ch_xxx_004", "ch_xxx_005"]
  }
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `name_en` | string | English display name |
| `name_fr` | string | French display name |
| `country` | string | ISO 3166-1 alpha-2 country code (e.g. `CA`, `FR`, `DE`) |
| `default_language` | `"en"` or `"fr"` | Language used when player hasn't set a preference |
| `center.lat` / `center.lng` | float | Geographic center for initial map view and circle origin |
| `bbox` | [S, W, N, E] | Overpass API bounding box in decimal degrees |
| `default_radius_m` | int | Starting circle radius in metres. Use 1500 for dense urban areas, 2000+ for sprawling cities |
| `timezone` | string | IANA timezone identifier (e.g. `"America/Toronto"`, `"Europe/Berlin"`) |
| `currency` | string | ISO 4217 currency code — informational only (e.g. `"CAD"`, `"EUR"`) |
| `starting_neighborhoods` | string[] | 4 interesting neighborhoods shown to the Chicken during bar selection |
| `city_challenges` | string[] | IDs of challenges specific to this city (must exist in challenge files) |

### Example — Berlin

```json
{
  "berlin": {
    "name_en": "Berlin",
    "name_fr": "Berlin",
    "country": "DE",
    "default_language": "en",
    "center": { "lat": 52.5200, "lng": 13.4050 },
    "bbox": [52.34, 13.09, 52.68, 13.76],
    "default_radius_m": 2000,
    "timezone": "Europe/Berlin",
    "currency": "EUR",
    "starting_neighborhoods": ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Neukölln"],
    "city_challenges": ["ch_ber_001", "ch_ber_002", "ch_ber_003", "ch_ber_004", "ch_ber_005"]
  }
}
```

### Challenge ID convention

City-specific challenge IDs follow the pattern `ch_{city_code}_{3-digit-number}`:
- Montreal: `ch_mtl_001`, `ch_mtl_002`, ...
- Paris: `ch_par_001`, ...
- Berlin: `ch_ber_001`, ...
- Toronto: `ch_tor_001`, ...

Use a 3-letter abbreviation that won't collide with existing cities.

---

## Step 2 — Add Challenges

City-specific challenges reference local landmarks, foods, slang, or cultural norms that make the game feel rooted in place.

### challenges_en.json

Add at least 5 entries to `apps/api/data/challenges_en.json`:

```json
{
  "id": "ch_ber_001",
  "category": "city",
  "difficulty": "easy",
  "points": 100,
  "media_type": "photo",
  "title_en": "Find a currywurst stand",
  "desc_en": "Get a photo of your whole team eating currywurst from a street stand. Everyone must be holding a sausage.",
  "tags": "berlin,food,currywurst",
  "min_players": 2,
  "time_limit_sec": 180,
  "city": "berlin"
}
```

### challenges_fr.json

Add the French translation for each city challenge to `apps/api/data/challenges_fr.json`:

```json
{
  "id": "ch_ber_001",
  "category": "city",
  "difficulty": "easy",
  "points": 100,
  "media_type": "photo",
  "title_fr": "Trouve un stand de currywurst",
  "desc_fr": "Prenez une photo de toute votre équipe en train de manger du currywurst dans un stand de rue. Chacun doit tenir une saucisse.",
  "tags": "berlin,nourriture,currywurst",
  "min_players": 2,
  "time_limit_sec": 180,
  "city": "berlin"
}
```

### Challenge design guidelines

- **Easy** (50–150 pts): Doable in 5 minutes, no special equipment needed
- **Medium** (150–250 pts): Requires some effort or coordination between team members
- **Hard** (250–400 pts): Requires courage, creativity, or a lot of luck

- Each challenge must work in the context of a bar-hopping city hunt
- Avoid challenges that require spending money
- At least 2 of the 5 must be `media_type: "photo"` (shorter time commitment)
- Write descriptions that work even if players don't know the city well
- Avoid challenges that could cause legal issues or endanger participants

---

## Step 3 — Test the Overpass Bbox

Before committing, verify the bbox returns bars in the expected area.

### Test via curl

```bash
curl -s "https://overpass-api.de/api/interpreter" \
  --data-urlencode 'data=[out:json][timeout:10];
(
  node["amenity"="bar"](52.34,13.09,52.68,13.76);
  node["amenity"="pub"](52.34,13.09,52.68,13.76);
  node["amenity"="nightclub"](52.34,13.09,52.68,13.76);
);
out body;' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"elements\"])} bars found')"
```

Expected output: `> 20 bars found`

### Common bbox mistakes

- **Too large**: bbox covering an entire country will timeout (Overpass 10s limit). Keep the area to the urban core.
- **Coordinate order**: Overpass uses `[south, west, north, east]` — not `[min_lat, min_lng, max_lat, max_lng]`.
- **Wrong hemisphere**: Double-check sign (- vs +) for southern/western coordinates.
- **No bars returned**: Try expanding the bbox slightly, or check that the city has OSM bar data by browsing https://www.openstreetmap.org.

### Test via API

Once the city entry is in `cities.json`, test locally:

```bash
# Start the API locally
make dev-api

# Search with the city center
curl "http://localhost:8000/api/v1/bars/search?lat=52.52&lng=13.405&radius_m=1500"
```

Should return at least 5 bars.

---

## Step 4 — Update Frontend Selectors

### Web (Create Game page)

File: `apps/web/app/(game)/create/page.tsx`

Add the city to the city list:

```tsx
// Find the cities array
const CITIES = [
  { id: "montreal", name: "Montréal", flag: "🇨🇦" },
  { id: "paris", name: "Paris", flag: "🇫🇷" },
  { id: "london", name: "London", flag: "🇬🇧" },
  { id: "nyc", name: "New York", flag: "🇺🇸" },
  { id: "tunis", name: "Tunis", flag: "🇹🇳" },
  // Add your city here:
  { id: "berlin", name: "Berlin", flag: "🇩🇪" },
];
```

### Mobile (Create Hunt screen)

File: `apps/mobile/app/game/create.tsx`

Add the city slug to the `CITIES` constant:

```tsx
const CITIES = ["montreal", "paris", "london", "nyc", "tunis", "berlin"] as const;
```

### README cities table

Update `README.md` to add the city to the Cities section. Change the status from "Coming soon" to the appropriate indicator once the city is live.

---

## Step 5 — Run the Migration

The `Challenge` table is seeded from JSON files, not migrations. To load the new challenges:

```bash
cd apps/api
uv run python -m scripts.seed --city berlin
# or full reseed:
uv run python -m scripts.seed
```

Verify the challenges loaded:

```bash
uv run python -c "
import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from app.models.challenge import Challenge

async def check():
    engine = create_async_engine('sqlite+aiosqlite:///./test.db')
    async with AsyncSession(engine) as s:
        r = await s.exec(select(Challenge).where(Challenge.city == 'berlin'))
        print(f'Found {len(r.all())} Berlin challenges')

asyncio.run(check())
"
```

---

## PR Checklist

Before opening your PR, verify all items:

- [ ] City entry added to `apps/api/data/cities.json` with all required fields
- [ ] At least 5 challenge entries added to `challenges_en.json`
- [ ] Matching French translations added to `challenges_fr.json`
- [ ] All challenge IDs follow `ch_xxx_NNN` convention and are unique
- [ ] Challenge IDs referenced in `city_challenges` array actually exist in challenge files
- [ ] Overpass bbox tested — returns more than 10 bars
- [ ] Bbox does not exceed ~50 km x 50 km (to avoid Overpass timeout)
- [ ] City center coordinates verified on a map (not just copied from Wikipedia)
- [ ] Timezone is a valid IANA identifier (verify at https://www.iana.org/time-zones)
- [ ] City added to `CITIES` constant in `apps/web/app/(game)/create/page.tsx`
- [ ] City slug added to `CITIES` array in `apps/mobile/app/game/create.tsx`
- [ ] Challenges seeded and verified locally via API
- [ ] At least 2 photo challenges and 1 video challenge included
- [ ] No challenges reference spending money, illegal activities, or private property
- [ ] PR title follows convention: `feat(api): add berlin city`

Thank you for expanding the hunt! 🐔
