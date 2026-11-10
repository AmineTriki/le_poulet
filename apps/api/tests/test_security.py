"""Authorisation and secrecy tests: the chicken's bar and position must not leak to hunters."""

from typing import Any

import pytest
from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.challenge import Challenge, ChallengeCategory, ChallengeDifficulty, MediaType
from app.models.player import Player

BAR = {"bar_id": "osm:1", "bar_name": "Secret Bar", "bar_lat": 45.52, "bar_lng": -73.58}


async def _started_game(client: AsyncClient, session: AsyncSession) -> dict[str, Any]:
    created = (
        await client.post("/api/v1/games/", params={"host_name": "Host"}, json={"name": "G", "city": "montreal"})
    ).json()
    players: list[dict[str, Any]] = []
    for i in range(5):
        resp = await client.post("/api/v1/players/", json={"game_id": created["game_id"], "name": f"P{i}"})
        players.append(resp.json())
    start = await client.post(
        f"/api/v1/games/{created['game_code']}/start", json={"host_token": created["host_token"], **BAR}
    )
    assert start.status_code == 200, start.text
    all_players = (await client.get(f"/api/v1/players/{created['game_id']}/all")).json()
    chicken_id = next(p["id"] for p in all_players if p["role"] == "chicken")
    chicken = await session.get(Player, chicken_id)
    assert chicken is not None
    hunter = next(
        p
        for p in [*players, {"player_id": created["host_player_id"], "token": created["host_token"]}]
        if p["player_id"] != chicken_id
    )
    return {"created": created, "chicken": chicken, "hunter_token": hunter["token"], "code": created["game_code"]}


@pytest.mark.asyncio
async def test_bar_hidden_from_hunters_visible_to_chicken(client: AsyncClient, session: AsyncSession) -> None:
    g = await _started_game(client, session)
    for path in (f"/api/v1/games/{g['code']}", f"/api/v1/games/{g['code']}/state"):
        anon = (await client.get(path)).json()
        data = anon.get("game", anon)
        assert data["bar_name"] is None and data["bar_lat"] is None and data["bar_lng"] is None

        hunter = (await client.get(path, params={"player_token": g["hunter_token"]})).json()
        assert hunter.get("game", hunter)["bar_name"] is None

        chicken = (await client.get(path, params={"player_token": g["chicken"].token})).json()
        assert chicken.get("game", chicken)["bar_name"] == "Secret Bar"


@pytest.mark.asyncio
async def test_chicken_position_hidden_in_state(client: AsyncClient, session: AsyncSession) -> None:
    g = await _started_game(client, session)
    resp = await client.post(
        "/api/v1/locations/update", json={"player_token": g["chicken"].token, "lat": 45.52, "lng": -73.58}
    )
    assert resp.json()["status"] == "ok"

    state = (await client.get(f"/api/v1/games/{g['code']}/state")).json()
    chicken_row = next(p for p in state["players"] if p["id"] == g["chicken"].id)
    assert chicken_row["last_lat"] is None and chicken_row["last_lng"] is None

    own = (await client.get(f"/api/v1/games/{g['code']}/state", params={"player_token": g["chicken"].token})).json()
    own_row = next(p for p in own["players"] if p["id"] == g["chicken"].id)
    assert own_row["last_lat"] == 45.52


@pytest.mark.asyncio
async def test_start_twice_is_rejected(client: AsyncClient, session: AsyncSession) -> None:
    g = await _started_game(client, session)
    resp = await client.post(f"/api/v1/games/{g['code']}/start", json={"host_token": g["created"]["host_token"], **BAR})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_start_requires_enough_players(client: AsyncClient) -> None:
    created = (
        await client.post("/api/v1/games/", params={"host_name": "Solo"}, json={"name": "G", "city": "montreal"})
    ).json()
    resp = await client.post(f"/api/v1/games/{created['game_code']}/start", json={"host_token": created["host_token"]})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_start_with_wrong_host_token_is_forbidden(client: AsyncClient) -> None:
    created = (
        await client.post("/api/v1/games/", params={"host_name": "H"}, json={"name": "G", "city": "montreal"})
    ).json()
    resp = await client.post(f"/api/v1/games/{created['game_code']}/start", json={"host_token": "nope"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_game_rejects_out_of_range_rules(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/games/",
        params={"host_name": "H"},
        json={"name": "G", "city": "montreal", "team_size": 0},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_location_update_rejects_invalid_coordinates(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/locations/update", json={"player_token": "x", "lat": 200, "lng": 0})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_only_chicken_can_score_submission(client: AsyncClient, session: AsyncSession) -> None:
    g = await _started_game(client, session)
    session.add(
        Challenge(
            id="c1",
            category=ChallengeCategory.SOCIAL,
            difficulty=ChallengeDifficulty.EASY,
            points=100,
            media_type=MediaType.PHOTO,
            title_en="t",
            title_fr="t",
            desc_en="d",
            desc_fr="d",
        )
    )
    await session.commit()

    hunter = (await session.exec(select(Player).where(Player.token == g["hunter_token"]))).first()
    assert hunter is not None and hunter.team_id is not None

    submitted = await client.post(
        "/api/v1/challenges/submit",
        json={
            "game_id": hunter.game_id,
            "challenge_id": "c1",
            "team_id": hunter.team_id,
            "player_token": hunter.token,
        },
    )
    assert submitted.status_code == 200, submitted.text
    sid = submitted.json()["submission_id"]

    # Another team's id is refused at submission time.
    spoof = await client.post(
        "/api/v1/challenges/submit",
        json={"game_id": hunter.game_id, "challenge_id": "c1", "team_id": "other", "player_token": hunter.token},
    )
    assert spoof.status_code == 403

    # A hunter cannot score their own submission.
    denied = await client.post(f"/api/v1/challenges/{sid}/score", json={"chicken_token": hunter.token, "score": 100})
    assert denied.status_code == 403

    # The chicken can, but only once.
    ok = await client.post(f"/api/v1/challenges/{sid}/score", json={"chicken_token": g["chicken"].token, "score": 50})
    assert ok.status_code == 200
    assert ok.json()["points_awarded"] == 50
    again = await client.post(
        f"/api/v1/challenges/{sid}/score", json={"chicken_token": g["chicken"].token, "score": 100}
    )
    assert again.status_code == 409
