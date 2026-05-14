import json
import logging
import math
from pathlib import Path
from typing import Any

import httpx
from redis.asyncio import Redis

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Local pre-seeded bar data (loaded once at import time)
# ---------------------------------------------------------------------------
_DATA_DIR = Path(__file__).parent.parent.parent / "data"
_CITY_BARS: dict[str, dict[str, Any]] = {}

for _path in _DATA_DIR.glob("*_bars.json"):
    try:
        with open(_path) as _f:
            _d = json.load(_f)
            _CITY_BARS[_d["city"]] = _d
    except Exception:
        pass


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def search_bars_local(
    lat: float,
    lng: float,
    radius_m: int,
    city: str = "montreal",
) -> list[dict[str, Any]]:
    """Return bars from the pre-seeded dataset within radius_m of (lat, lng)."""
    city_data = _CITY_BARS.get(city)
    if not city_data:
        return []

    results: list[dict[str, Any]] = []
    for cluster in city_data.get("clusters", []):
        for bar in cluster.get("bars", []):
            dist = _haversine_m(lat, lng, bar["lat"], bar["lng"])
            if dist <= radius_m:
                results.append({**bar, "_dist_m": round(dist)})

    results.sort(key=lambda b: b["_dist_m"])
    for r in results:
        r.pop("_dist_m", None)
    return results[:25]


def get_bar_clusters(city: str = "montreal") -> list[dict[str, Any]]:
    """Return neighborhood clusters with high bar density for the given city."""
    city_data = _CITY_BARS.get(city)
    if not city_data:
        return []
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "name_fr": c.get("name_fr", c["name"]),
            "center_lat": c["center_lat"],
            "center_lng": c["center_lng"],
            "radius_m": c["radius_m"],
            "bar_count": len(c.get("bars", [])),
        }
        for c in city_data.get("clusters", [])
    ]


# ---------------------------------------------------------------------------
# Overpass query template
# ---------------------------------------------------------------------------
OVERPASS_QUERY = """
[out:json][timeout:10];
(
  node["amenity"="bar"]({bbox});
  node["amenity"="pub"]({bbox});
  node["amenity"="nightclub"]({bbox});
);
out body;
"""


async def search_bars(
    lat: float,
    lng: float,
    radius_m: int,
    redis: Redis | None,
    city: str = "montreal",
) -> list[dict[str, Any]]:
    cache_key = f"bars:{lat:.3f}:{lng:.3f}:{radius_m}"

    # 1. Redis cache hit
    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)  # type: ignore[no-any-return]
        except Exception:
            pass  # Redis unavailable — fall through

    # 2. Try Overpass API
    try:
        delta = radius_m / 111_000
        bbox = f"{lat - delta},{lng - delta},{lat + delta},{lng + delta}"
        query = OVERPASS_QUERY.format(bbox=bbox)

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(settings.overpass_api_url, data={"data": query})
            resp.raise_for_status()
            data = resp.json()

        bars: list[dict[str, Any]] = []
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name")
            if not name:
                continue
            bars.append(
                {
                    "id": f"osm:{element['id']}",
                    "name": name,
                    "lat": element.get("lat", lat),
                    "lng": element.get("lon", lng),
                    "address": tags.get("addr:street", ""),
                    "house_number": tags.get("addr:housenumber", ""),
                    "phone": tags.get("phone", ""),
                    "website": tags.get("website", ""),
                    "opening_hours": tags.get("opening_hours", ""),
                }
            )

        bars = bars[:25]

        # Cache live results for 2 hours
        if redis is not None:
            try:
                await redis.setex(cache_key, 7_200, json.dumps(bars))
            except Exception:
                pass

        return bars

    except Exception as exc:
        logger.warning("Overpass API failed (%s) — falling back to local bar data", exc)

    # 3. Local pre-seeded fallback (always available, no network needed)
    local = search_bars_local(lat, lng, radius_m, city)

    # Cache local results for 30 minutes (shorter — Overpass may recover)
    if redis is not None and local:
        try:
            await redis.setex(cache_key, 1_800, json.dumps(local))
        except Exception:
            pass

    return local
