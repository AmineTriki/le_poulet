import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._player_sockets: dict[str, WebSocket] = {}

    async def connect(self, game_id: str, player_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[game_id].append(ws)
        self._player_sockets[player_id] = ws

    def disconnect(self, game_id: str, player_id: str, ws: WebSocket) -> None:
        connections = self._connections.get(game_id)
        if connections is not None:
            if ws in connections:
                connections.remove(ws)
            if not connections:
                del self._connections[game_id]
        # A reconnect may already have replaced this player's socket; only drop our own.
        if self._player_sockets.get(player_id) is ws:
            del self._player_sockets[player_id]

    async def broadcast(self, game_id: str, event: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(game_id, [])):
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        for ws in dead:
            connections = self._connections.get(game_id)
            if connections is not None and ws in connections:
                connections.remove(ws)

    async def send_to_player(self, player_id: str, event: dict[str, Any]) -> None:
        ws = self._player_sockets.get(player_id)
        if ws:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                self._player_sockets.pop(player_id, None)


manager = ConnectionManager()
