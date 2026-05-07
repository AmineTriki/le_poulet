import json
import httpx
from typing import Any, Optional
from redis.asyncio import Redis
from app.config import settings


OVERPASS_QUERY_TEMPLATE = """
[out:json][timeout:15];
(
  node["amenity"="bar"]({bbox});
  node["amenity"="pub"]({bbox});
  node["amenity"="nightclub"]({bbox});
  node["amenity"="restaurant"]["outdoor_seating"="yes"]({bbox});
);
out body;
"""

# City center coordinates for area suggestions
CITY_CENTERS: dict[str, tuple[float, float]] = {
    "montreal": (45.5017, -73.5673),
    "paris": (48.8566, 2.3522),
    "london": (51.5074, -0.1278),
    "nyc": (40.7128, -74.0060),
    "new_york": (40.7128, -74.0060),
    "tunis": (36.8065, 10.1815),
    "toronto": (43.6532, -79.3832),
    "barcelona": (41.3851, 2.1734),
    "berlin": (52.5200, 13.4050),
    "amsterdam": (52.3676, 4.9041),
    "brussels": (50.8503, 4.3517),
    "rome": (41.9028, 12.4964),
    "madrid": (40.4168, -3.7038),
    "lisbon": (38.7169, -9.1399),
    "chicago": (41.8781, -87.6298),
    "los_angeles": (34.0522, -118.2437),
    "miami": (25.7617, -80.1918),
    "san_francisco": (37.7749, -122.4194),
    "other": (45.5017, -73.5673),
}

# Human-readable neighbourhood names for well-known clusters (city → {grid_key → name})
AREA_NAMES: dict[str, dict[str, str]] = {
    "montreal": {
        "45.504_-73.572": "Plateau-Mont-Royal",
        "45.520_-73.572": "Mile End",
        "45.496_-73.568": "Quartier Latin",
        "45.496_-73.556": "Village",
        "45.484_-73.576": "Old Montreal",
        "45.500_-73.560": "Downtown",
    },
    "paris": {
        "48.852_2.348": "Saint-Germain",
        "48.864_2.340": "Marais",
        "48.880_2.344": "Montmartre",
        "48.868_2.352": "Bastille",
    },
    "london": {
        "51.512_-0.132": "Soho",
        "51.516_-0.120": "Shoreditch",
        "51.508_-0.124": "Covent Garden",
        "51.508_-0.176": "Notting Hill",
    },
}


async def search_bars(
    lat: float,
    lng: float,
    radius_m: int,
    redis: Optional[Redis],
) -> list[dict[str, Any]]:
    cache_key = f"bars:{lat:.3f}:{lng:.3f}:{radius_m}"

    if redis is not None:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)  # type: ignore[no-any-return]

    delta = radius_m / 111_000
    bbox = f"{lat - delta},{lng - delta},{lat + delta},{lng + delta}"
    query = OVERPASS_QUERY_TEMPLATE.format(bbox=bbox)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(settings.overpass_api_url, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    bars: list[dict[str, Any]] = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        bars.append({
            "id": f"osm:{element['id']}",
            "name": name,
            "lat": element.get("lat", lat),
            "lng": element.get("lon", lng),
            "address": tags.get("addr:street", ""),
            "house_number": tags.get("addr:housenumber", ""),
            "phone": tags.get("phone", ""),
            "website": tags.get("website", ""),
            "opening_hours": tags.get("opening_hours", ""),
        })

    bars = bars[:50]

    if redis is not None:
        await redis.setex(cache_key, 3600, json.dumps(bars))

    return bars


async def get_bar_areas(city: str, redis: Optional[Redis]) -> list[dict[str, Any]]:
    """Return the top bar-dense areas for a city, clustered by ~400m grid cells."""
    city_key = city.lower().replace(" ", "_").replace("-", "_")
    center = CITY_CENTERS.get(city_key)
    if not center:
        for k, v in CITY_CENTERS.items():
            if k in city_key or city_key in k:
                center = v
                break
    if not center:
        return []

    cache_key = f"areas:{city_key}"
    if redis is not None:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)  # type: ignore[no-any-return]

    lat, lng = center
    bars = await search_bars(lat, lng, 5000, redis)
    if not bars:
        return []

    # Cluster into ~400m grid cells (0.004° ≈ 444m at 45° latitude)
    GRID = 0.004
    cells: dict[tuple[float, float], list[dict[str, Any]]] = {}
    for bar in bars:
        cell_lat = round(bar["lat"] / GRID) * GRID
        cell_lng = round(bar["lng"] / GRID) * GRID
        key = (cell_lat, cell_lng)
        cells.setdefault(key, []).append(bar)

    city_area_names = AREA_NAMES.get(city_key, {})
    areas: list[dict[str, Any]] = []
    for (clat, clng), cell_bars in sorted(cells.items(), key=lambda x: -len(x[1])):
        grid_key = f"{clat:.3f}_{clng:.3f}"
        name = city_area_names.get(grid_key, f"Area near {cell_bars[0]['name']}")
        areas.append({
            "name": name,
            "center_lat": round(clat, 6),
            "center_lng": round(clng, 6),
            "bar_count": len(cell_bars),
            "bars": sorted(cell_bars, key=lambda b: b["name"])[:10],
        })

    result = areas[:6]

    if redis is not None:
        await redis.setex(cache_key, 7200, json.dumps(result))

    return result
