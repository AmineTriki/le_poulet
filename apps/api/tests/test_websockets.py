import pytest

from app.websockets.manager import ConnectionManager


@pytest.mark.asyncio
async def test_manager_connect_disconnect():
    manager = ConnectionManager()
    assert len(manager._connections) == 0


@pytest.mark.asyncio
async def test_manager_sends_to_empty_game():
    manager = ConnectionManager()
    # Should not raise even with no connections
    await manager.broadcast("nonexistent_game", {"type": "test"})


@pytest.mark.asyncio
async def test_manager_send_to_absent_player():
    manager = ConnectionManager()
    # Should not raise even if player not connected
    await manager.send_to_player("ghost_player", {"type": "ping"})


@pytest.mark.asyncio
async def test_manager_disconnect_nonexistent():
    manager = ConnectionManager()

    class FakeWS:
        pass

    ws = FakeWS()
    # Should not raise
    manager.disconnect("game123", "player123", ws)  # type: ignore[arg-type]
