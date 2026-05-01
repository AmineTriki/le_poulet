from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.chicken import Chicken

router = APIRouter()


@router.get("/{game_id}/active")
async def get_active_chickens(game_id: str, session: AsyncSession = Depends(get_session)) -> list[dict]:
    result = await session.exec(
        select(Chicken).where(Chicken.game_id == game_id, Chicken.is_active == True)  # noqa: E712
    )
    return [{"id": c.id, "player_id": c.player_id, "bar_name": c.bar_name} for c in result.all()]


@router.post("/{game_id}/bar")
async def set_chicken_bar(
    game_id: str,
    player_token: str,
    bar_id: str,
    bar_name: str,
    bar_lat: float,
    bar_lng: float,
    session: AsyncSession = Depends(get_session),
) -> dict:
    from app.models.player import Player
    player_result = await session.exec(select(Player).where(Player.token == player_token))
    player = player_result.first()
    if not player or player.game_id != game_id:
        raise HTTPException(status_code=401, detail="Invalid token")

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
