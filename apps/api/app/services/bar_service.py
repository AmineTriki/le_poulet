import json
import httpx
from typing import Any
import aioredis
from app.config import settings


OVERPASS_QUERY = """
[out:json][timeout:10];
(
  node["amenity"="bar"](bbox);
  node["amenity"="pub"](bbox);
  node["amenity"="nightclub"](bbox);
);
out body;
"""


async def search_bars(
    lat: float,
    lng: float,
    radius_m: int,
    redis: aioredis.Redis,
) -> list[dict[str, Any]]:
    cache_key = f"bars:{lat:.3f}:{lng:.3f}:{radius_m}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)  # type: ignore[no-any-return]

    delta = radius_m / 111_000
    bbox = f"{lat - delta},{lng - delta},{lat + delta},{lng + delta}"
    query = OVERPASS_QUERY.replace("bbox", bbox)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(settings.overpass_api_url, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    bars = []
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

    bars = bars[:20]
    await redis.setex(cache_key, 3600, json.dumps(bars))
    return bars
