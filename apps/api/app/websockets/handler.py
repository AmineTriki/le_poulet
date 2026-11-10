from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import select

from app.database import AsyncSessionLocal
from app.models.player import Player
from app.websockets.manager import manager

router = APIRouter()

MAX_MESSAGE_CHARS = 4096
WS_POLICY_VIOLATION = 1008


async def _is_valid_member(game_id: str, player_id: str, token: str | None) -> bool:
    async with AsyncSessionLocal() as session:
        result = await session.exec(select(Player).where(Player.id == player_id))
        player = result.first()
    if player is None or player.game_id != game_id:
        return False
    # The token is optional for backwards compatibility, but must match when supplied.
    return token is None or token == player.token


@router.websocket("/{game_id}/{player_id}")
async def websocket_endpoint(ws: WebSocket, game_id: str, player_id: str, token: str | None = None) -> None:
    if not await _is_valid_member(game_id, player_id, token):
        await ws.close(code=WS_POLICY_VIOLATION)
        return
    await manager.connect(game_id, player_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            if len(data) > MAX_MESSAGE_CHARS:
                continue
            await manager.broadcast(game_id, {"from": player_id, "data": data})
    except WebSocketDisconnect:
        manager.disconnect(game_id, player_id, ws)
        await manager.broadcast(game_id, {"type": "player:left", "player_id": player_id})
