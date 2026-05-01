from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.schemas.game import GameCreate, GameStartRequest
from app.services.game_service import create_game, start_game, end_game
from sqlmodel import select
from app.models.game import Game
from app.models.player import Player

router = APIRouter()


@router.post("/", response_model=dict)
async def create_new_game(
    data: GameCreate,
    host_name: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    game, host = await create_game(session, data, host_name)
    return {"game_code": game.code, "game_id": game.id, "host_token": host.token}


@router.get("/{code}", response_model=dict)
async def get_game(code: str, session: AsyncSession = Depends(get_session)) -> dict:
    result = await session.exec(select(Game).where(Game.code == code))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    players = await session.exec(select(Player).where(Player.game_id == game.id))
    player_list = players.all()
    return {
        "id": game.id, "code": game.code, "name": game.name, "city": game.city,
        "language": game.language, "status": game.status, "chaos_mode": game.chaos_mode,
        "player_count": len(player_list), "buy_in_amount": game.buy_in_amount,
    }


@router.post("/{code}/start")
async def start_existing_game(
    code: str,
    req: GameStartRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await session.exec(select(Game).where(Game.code == code))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    host = await session.get(Player, game.host_player_id)
    if not host or host.token != req.host_token:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if req.bar_name:
        game.bar_name = req.bar_name
        game.bar_lat = req.bar_lat
        game.bar_lng = req.bar_lng
    game = await start_game(session, game)
    return {"status": game.status, "head_start_ends_at": str(game.head_start_ends_at)}


@router.post("/{code}/end")
async def end_existing_game(
    code: str,
    host_token: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await session.exec(select(Game).where(Game.code == code))
    game = result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    host = await session.get(Player, game.host_player_id)
    if not host or host.token != host_token:
        raise HTTPException(status_code=403, detail="Unauthorized")
    game = await end_game(session, game)
    return {"status": game.status, "ended_at": str(game.ended_at)}
