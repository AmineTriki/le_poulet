from typing import Optional
from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from app.redis import get_redis
from app.services.bar_service import search_bars, get_bar_clusters

router = APIRouter()


@router.get("/search")
async def search_bars_endpoint(
    lat: float,
    lng: float,
    radius_m: int = 1500,
    city: str = "montreal",
    redis: Optional[Redis] = Depends(get_redis),
) -> list[dict]:
    """
    Search for bars near (lat, lng) within radius_m metres.
    Tries Overpass API first; falls back to pre-seeded local data on failure.
    Results are Redis-cached (2h for live data, 30min for local fallback).
    """
    return await search_bars(lat, lng, radius_m, redis, city)


@router.get("/zones/{city}")
async def get_bar_zones(city: str) -> list[dict]:
    """
    Return neighbourhood clusters with high bar density for the given city.
    Used by clients to suggest good hide zones to the Chicken without doing
    a live GPS search.
    """
    return get_bar_clusters(city)
