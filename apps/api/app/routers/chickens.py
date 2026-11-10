from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.chicken import Chicken
from app.models.game import Game, GameStatus
from app.models.player import Player, PlayerRole

router = APIRouter()


@router.get("/{game_id}/active")
async def get_active_chickens(game_id: str, session: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    result = await session.exec(
        select(Chicken).where(Chicken.game_id == game_id, Chicken.is_active == True)  # noqa: E712
    )
    game = await session.get(Game, game_id)
    # The hiding bar is secret until the game is over.
    reveal = bool(game and game.status == GameStatus.ENDED)
    return [{"id": c.id, "player_id": c.player_id, "bar_name": c.bar_name if reveal else None} for c in result.all()]


@router.post("/{game_id}/bar")
async def set_chicken_bar(
    game_id: str,
    player_token: str,
    bar_id: str = Query(max_length=100),
    bar_name: str = Query(max_length=200),
    bar_lat: float = Query(ge=-90, le=90),
    bar_lng: float = Query(ge=-180, le=180),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    player_result = await session.exec(select(Player).where(Player.token == player_token))
    player = player_result.first()
    if not player or player.game_id != game_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    if player.role != PlayerRole.CHICKEN:
        raise HTTPException(status_code=403, detail="Only the chicken can set the bar")

    chicken_result = await session.exec(
        select(Chicken).where(Chicken.game_id == game_id, Chicken.player_id == player.id)
    )
    chicken = chicken_result.first()
    if not chicken:
        raise HTTPException(status_code=404, detail="Chicken record not found")

    chicken.bar_id = bar_id
    chicken.bar_name = bar_name
    chicken.bar_lat = bar_lat
    chicken.bar_lng = bar_lng
    session.add(chicken)
    await session.commit()
    return {"status": "ok", "bar_name": bar_name}
