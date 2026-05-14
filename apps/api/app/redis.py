import logging

from redis.asyncio import Redis, from_url

from app.config import settings

logger = logging.getLogger(__name__)

_redis: Redis | None = None


async def get_redis() -> Redis | None:
    global _redis
    if _redis is None:
        try:
            client = from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
            await client.ping()
            _redis = client
        except Exception:
            logger.warning("Redis unavailable — bar caching disabled")
            return None
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
