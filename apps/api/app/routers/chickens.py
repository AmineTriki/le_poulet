from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.chicken import Chicken
from app.models.player import Player, PlayerRole
from app.models.team import Team
from app.websockets.manager import manager

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

    await manager.broadcast(game_id, {
        "type": "chicken:bar_set",
        "bar_name": bar_name,
        "bar_lat": bar_lat,
        "bar_lng": bar_lng,
    })
    return {"status": "ok", "bar_name": bar_name}


@router.post("/{game_id}/found")
async def mark_chicken_found(
    game_id: str,
    player_token: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Called by a hunter whose team just caught the chicken."""
    player_result = await session.exec(select(Player).where(Player.token == player_token))
    player = player_result.first()
    if not player or player.game_id != game_id or not player.team_id:
        raise HTTPException(status_code=401, detail="Invalid token or no team")

    # Mark the first active chicken as found
    chicken_result = await session.exec(
        select(Chicken).where(Chicken.game_id == game_id, Chicken.is_active == True)  # noqa: E712
    )
    chicken = chicken_result.first()
    if not chicken:
        raise HTTPException(status_code=404, detail="No active chicken")

    chicken.is_active = False
    session.add(chicken)

    # Assign found_order to team
    teams_result = await session.exec(select(Team).where(Team.game_id == game_id))
    teams = list(teams_result.all())
    found_count = sum(1 for t in teams if t.found_order is not None)

    team = await session.get(Team, player.team_id)
    if team and team.found_order is None:
        team.found_order = found_count + 1
        team.found_chicken_at = datetime.utcnow()
        team.score = (team.score or 0) + 1000
        session.add(team)

    await session.commit()

    await manager.broadcast(game_id, {
        "type": "chicken:found",
        "team_id": player.team_id,
        "team_name": team.name if team else "Unknown",
        "found_order": team.found_order if team else 1,
    })

    return {"status": "found", "found_order": team.found_order if team else 1}
