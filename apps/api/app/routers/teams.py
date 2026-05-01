from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.team import Team

router = APIRouter()


@router.get("/{game_id}/all")
async def list_teams(game_id: str, session: AsyncSession = Depends(get_session)) -> list[dict]:
    result = await session.exec(select(Team).where(Team.game_id == game_id))
    return [
        {
            "id": t.id,
            "name": t.name,
            "color": t.color,
            "score": t.score,
            "found_order": t.found_order,
            "chaos_points": t.chaos_points,
            "weapons_available": t.weapons_available,
        }
        for t in result.all()
    ]
