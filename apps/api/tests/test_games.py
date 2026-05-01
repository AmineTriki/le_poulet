import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_game(client: AsyncClient):
    resp = await client.post("/api/v1/games/", params={"host_name": "Alice"}, json={
        "name": "Test Hunt", "city": "montreal", "language": "en"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "game_code" in data
    assert len(data["game_code"]) == 6


@pytest.mark.asyncio
async def test_get_game(client: AsyncClient):
    create_resp = await client.post("/api/v1/games/", params={"host_name": "Bob"}, json={
        "name": "My Hunt", "city": "montreal"
    })
    code = create_resp.json()["game_code"]
    resp = await client.get(f"/api/v1/games/{code}")
    assert resp.status_code == 200
    assert resp.json()["code"] == code


@pytest.mark.asyncio
async def test_get_game_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/games/XXXXXX")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_game_defaults(client: AsyncClient):
    resp = await client.post("/api/v1/games/", params={"host_name": "Charlie"}, json={
        "name": "Default Hunt", "city": "paris"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "game_id" in data
    assert "host_token" in data
