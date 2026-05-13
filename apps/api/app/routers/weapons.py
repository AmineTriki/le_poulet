from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.player import Player
from app.models.team import Team
from app.models.weapon import WeaponType
from app.services.power_up_engine import fire_weapon

router = APIRouter()


class WeaponFireRequest(BaseModel):
    player_token: str
    weapon_type: WeaponType
    target_team_id: str | None = None


@router.post("/fire")
async def fire_weapon_endpoint(
    req: WeaponFireRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    player_result = await session.exec(select(Player).where(Player.token == req.player_token))
    player = player_result.first()
    if not player or not player.team_id:
        raise HTTPException(status_code=401, detail="Invalid token or no team")

    team = await session.get(Team, player.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    result = await fire_weapon(session, player.game_id, team, req.target_team_id, req.weapon_type)
    if not result:
        raise HTTPException(status_code=400, detail="Not enough chaos points or invalid weapon")
    return {"status": "fired", "weapon": result.weapon_type, "chaos_points_remaining": team.chaos_points}


@router.get("/config")
async def get_weapon_config() -> dict:
    from app.models.weapon import WEAPON_CONFIG

    return {k: v for k, v in WEAPON_CONFIG.items()}
