from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.location import LocationUpdate
from app.models.player import Player
from app.schemas.player import LocationUpdateRequest
from app.websockets.manager import manager

router = APIRouter()


@router.post("/update")
async def update_location(
    data: LocationUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    player_result = await session.exec(select(Player).where(Player.token == data.player_token))
    player = player_result.first()
    if not player:
        raise HTTPException(status_code=401, detail="Invalid token")

    rate_cutoff = datetime.utcnow() - timedelta(seconds=settings.location_rate_limit_seconds)
    if player.last_location_at and player.last_location_at > rate_cutoff:
        return {"status": "rate_limited"}

    player.last_lat = data.lat
    player.last_lng = data.lng
    player.last_location_at = datetime.utcnow()
    session.add(player)

    loc = LocationUpdate(
        game_id=player.game_id,
        player_id=player.id,
        lat=data.lat,
        lng=data.lng,
        accuracy_m=data.accuracy_m,
        heading=data.heading,
        speed_ms=data.speed_ms,
    )
    session.add(loc)
    await session.commit()

    await manager.broadcast(
        player.game_id,
        {
            "type": "location:update",
            "player_id": player.id,
            "lat": data.lat,
            "lng": data.lng,
            "ts": int(datetime.utcnow().timestamp() * 1000),
        },
    )

    return {"status": "ok"}
