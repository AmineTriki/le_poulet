import random
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.game import Game, GameStatus
from app.models.player import Player
from app.schemas.player import PlayerCreate
from app.websockets.manager import manager

router = APIRouter()

EMOJIS = ["🦊", "🐺", "🦁", "🐯", "🐻", "🦅", "🐉", "🦄", "🐸", "🦋", "🐬", "🦉"]


@router.post("/", response_model=dict)
async def join_game(data: PlayerCreate, session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    game_result = await session.exec(select(Game).where(Game.id == data.game_id))
    game = game_result.first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.status == GameStatus.ENDED:
        raise HTTPException(status_code=409, detail="Game has ended")
    count_result = await session.exec(select(Player).where(Player.game_id == game.id))
    if len(count_result.all()) >= settings.max_players_per_game:
        raise HTTPException(status_code=409, detail="Game is full")
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name must not be blank")
    player = Player(
        game_id=data.game_id,
        name=name,
        emoji=data.emoji or random.choice(EMOJIS),
    )
    session.add(player)
    await session.commit()
    await session.refresh(player)
    await manager.broadcast(
        player.game_id,
        {
            "type": "player:joined",
            "player_id": player.id,
            "name": player.name,
            "emoji": player.emoji,
        },
    )
    return {"player_id": player.id, "token": player.token, "emoji": player.emoji}


@router.get("/{game_id}/all", response_model=list[dict[str, Any]])
async def list_players(game_id: str, session: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    result = await session.exec(select(Player).where(Player.game_id == game_id))
    return [{"id": p.id, "name": p.name, "emoji": p.emoji, "role": p.role, "score": p.score} for p in result.all()]


@router.get("/me/{token}", response_model=dict)
async def get_player_by_token(token: str, session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    result = await session.exec(select(Player).where(Player.token == token))
    player = result.first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "id": player.id,
        "name": player.name,
        "emoji": player.emoji,
        "role": player.role,
        "score": player.score,
        "team_id": player.team_id,
        "game_id": player.game_id,
    }
