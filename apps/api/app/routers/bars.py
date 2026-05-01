from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from app.redis import get_redis
from app.services.bar_service import search_bars

router = APIRouter()


@router.get("/search")
async def search_bars_endpoint(
    lat: float,
    lng: float,
    radius_m: int = 1500,
    redis: Redis = Depends(get_redis),
) -> list[dict]:
    return await search_bars(lat, lng, radius_m, redis)
