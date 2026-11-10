from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.game import Game, GameStatus
from app.models.location import LocationUpdate
from app.models.player import Player, PlayerRole
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

    game = await session.get(Game, player.game_id)
    if game is not None and game.status == GameStatus.ENDED:
        return {"status": "game_ended"}

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

    # A chicken's position is the game's secret: it is stored but never broadcast to the other players.
    if player.role == PlayerRole.CHICKEN:
        return {"status": "ok"}

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
