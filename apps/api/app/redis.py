import aioredis
from app.config import settings

redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global redis
    if redis is None:
        redis = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis


async def close_redis() -> None:
    global redis
    if redis is not None:
        await redis.close()
        redis = None
