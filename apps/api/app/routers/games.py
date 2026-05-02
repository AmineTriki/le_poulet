from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.schemas.game import GameCreate, GameStartRequest
from app.services.game_service import create_game, start_game, end_game
from app.services.scheduler import _circles  # noqa: PLC2701
from app.models.game import Game
from app.models.player import Player
from app.models.team import Team
from app.websockets.manager import manager

router = APIRouter()


@router.post("/", response_model=dict)
async def create_new_game(
    data: GameCreate,
    host_name: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    game, host = await create_game(session, data, host_name)
    return {"game_code": game.code, "game_id": game.id, "host_token": host.token, "host_player_id": host.id}


@router.get("/{code}", response_model=dict)
async def get_game(code: str, session: AsyncSession = Depends(get_session)) -> dict:
    result = await session.exec(select(Game).where(Game.code == code.upper()))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    players_result = await session.exec(select(Player).where(Player.game_id == game.id))
    player_count = len(players_result.all())
    return {
        "id": game.id,
        "code": game.code,
        "name": game.name,
        "city": game.city,
        "language": game.language,
        "status": game.status,
        "chaos_mode": game.chaos_mode,
        "player_count": player_count,
        "buy_in_amount": game.buy_in_amount,
        "num_chickens": game.num_chickens,
        "head_start_minutes": game.head_start_minutes,
        "game_duration_hours": game.game_duration_hours,
        "bar_name": game.bar_name,
        "bar_lat": game.bar_lat,
        "bar_lng": game.bar_lng,
        "head_start_ends_at": game.head_start_ends_at.isoformat() if game.head_start_ends_at else None,
        "game_ends_at": game.game_ends_at.isoformat() if game.game_ends_at else None,
    }


@router.get("/{code}/state", response_model=dict)
async def get_game_state(code: str, session: AsyncSession = Depends(get_session)) -> dict:
    """Full game state snapshot — safe to call on reconnect."""
    result = await session.exec(select(Game).where(Game.code == code.upper()))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    players_result = await session.exec(select(Player).where(Player.game_id == game.id))
    players = [
        {
            "id": p.id, "name": p.name, "emoji": p.emoji, "role": p.role,
            "team_id": p.team_id, "score": p.score, "is_online": p.is_online,
            "last_lat": p.last_lat, "last_lng": p.last_lng,
        }
        for p in players_result.all()
    ]

    teams_result = await session.exec(select(Team).where(Team.game_id == game.id))
    teams = [
        {
            "id": t.id, "name": t.name, "color": t.color, "score": t.score,
            "found_order": t.found_order, "chaos_points": t.chaos_points,
        }
        for t in teams_result.all()
    ]

    circle = _circles.get(game.id)

    return {
        "game": {
            "id": game.id,
            "code": game.code,
            "name": game.name,
            "status": game.status,
            "city": game.city,
            "language": game.language,
            "chaos_mode": game.chaos_mode,
            "bar_name": game.bar_name,
            "bar_lat": game.bar_lat,
            "bar_lng": game.bar_lng,
            "head_start_ends_at": game.head_start_ends_at.isoformat() if game.head_start_ends_at else None,
            "game_ends_at": game.game_ends_at.isoformat() if game.game_ends_at else None,
        },
        "players": players,
        "teams": teams,
        "circle": {
            "center_lat": circle.center_lat,
            "center_lng": circle.center_lng,
            "radius_m": circle.radius_m,
            "shrink_count": circle.shrink_count,
        } if circle else None,
    }


@router.post("/{code}/start")
async def start_existing_game(
    code: str,
    req: GameStartRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await session.exec(select(Game).where(Game.code == code.upper()))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.host_player_id is None:
        raise HTTPException(status_code=400, detail="No host set for this game")

    host = await session.get(Player, game.host_player_id)
    if not host or host.token != req.host_token:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if req.bar_name:
        game.bar_name = req.bar_name
        game.bar_lat = req.bar_lat
        game.bar_lng = req.bar_lng
        session.add(game)

    game = await start_game(session, game)
    await manager.broadcast(game.id, {"type": "game:started", "game_id": game.id, "status": game.status})
    return {
        "status": game.status,
        "head_start_ends_at": game.head_start_ends_at.isoformat() if game.head_start_ends_at else None,
        "game_ends_at": game.game_ends_at.isoformat() if game.game_ends_at else None,
    }


@router.post("/{code}/end")
async def end_existing_game(
    code: str,
    host_token: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await session.exec(select(Game).where(Game.code == code.upper()))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.host_player_id is None:
        raise HTTPException(status_code=400, detail="No host set for this game")

    host = await session.get(Player, game.host_player_id)
    if not host or host.token != host_token:
        raise HTTPException(status_code=403, detail="Unauthorized")

    game = await end_game(session, game)
    _circles.pop(game.id, None)
    await manager.broadcast(game.id, {"type": "game:ended", "game_id": game.id})
    return {"status": game.status, "ended_at": game.ended_at.isoformat() if game.ended_at else None}
