from typing import Any

import httpx

from app.config import settings


async def geocode(address: str) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{settings.nominatim_url}/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "LePouletGame/0.1"},
        )
        results = resp.json()
        if results:
            r = results[0]
            return {"lat": float(r["lat"]), "lng": float(r["lon"]), "display_name": r["display_name"]}
    return None
