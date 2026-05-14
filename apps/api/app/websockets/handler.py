from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websockets.manager import manager

router = APIRouter()


@router.websocket("/{game_id}/{player_id}")
async def websocket_endpoint(ws: WebSocket, game_id: str, player_id: str) -> None:
    await manager.connect(game_id, player_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(game_id, {"from": player_id, "data": data})
    except WebSocketDisconnect:
        manager.disconnect(game_id, player_id, ws)
        await manager.broadcast(game_id, {"type": "player:left", "player_id": player_id})
