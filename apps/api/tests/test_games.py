import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_game(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/games/",
        params={"host_name": "Alice"},
        json={"name": "Test Hunt", "city": "montreal", "language": "en"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "game_code" in data
    assert len(data["game_code"]) == 6
    assert "host_token" in data
    assert "game_id" in data


@pytest.mark.asyncio
async def test_get_game(client: AsyncClient) -> None:
    create_resp = await client.post(
        "/api/v1/games/",
        params={"host_name": "Bob"},
        json={"name": "My Hunt", "city": "montreal"},
    )
    code = create_resp.json()["game_code"]
    resp = await client.get(f"/api/v1/games/{code}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == code
    assert data["status"] == "lobby"


@pytest.mark.asyncio
async def test_get_game_state(client: AsyncClient) -> None:
    create_resp = await client.post(
        "/api/v1/games/",
        params={"host_name": "Charlie"},
        json={"name": "State Hunt", "city": "montreal"},
    )
    code = create_resp.json()["game_code"]
    resp = await client.get(f"/api/v1/games/{code}/state")
    assert resp.status_code == 200
    data = resp.json()
    assert "game" in data
    assert "players" in data
    assert "teams" in data
    assert data["game"]["code"] == code


@pytest.mark.asyncio
async def test_get_game_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/games/XXXXXX")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_join_game(client: AsyncClient) -> None:
    create_resp = await client.post(
        "/api/v1/games/",
        params={"host_name": "Host"},
        json={"name": "Join Test", "city": "montreal"},
    )
    game_id = create_resp.json()["game_id"]
    join_resp = await client.post(
        "/api/v1/players/",
        json={"game_id": game_id, "name": "Hunter1"},
    )
    assert join_resp.status_code == 200
    assert "token" in join_resp.json()
    assert "player_id" in join_resp.json()
