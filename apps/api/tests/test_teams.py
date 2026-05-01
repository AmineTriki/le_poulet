import pytest
from app.models.player import Player
from app.services.team_builder import build_teams


@pytest.mark.asyncio
async def test_build_teams_even():
    players = [Player(game_id="g1", name=f"P{i}", emoji="🦊") for i in range(8)]
    teams = await build_teams(players, 4, "en")
    assert len(teams) == 2
    total_players = sum(len(t.players) for t in teams)
    assert total_players == 8


@pytest.mark.asyncio
async def test_build_teams_odd():
    players = [Player(game_id="g1", name=f"P{i}", emoji="🦊") for i in range(7)]
    teams = await build_teams(players, 3, "fr")
    assert len(teams) == 3


@pytest.mark.asyncio
async def test_build_teams_french_names():
    players = [Player(game_id="g1", name=f"P{i}", emoji="🐔") for i in range(4)]
    teams = await build_teams(players, 4, "fr")
    assert len(teams) == 1
    fr_names = [
        "Les Renards Rouges", "Les Loups Bleus", "Les Viperes Vertes", "Les Panthers Violets",
        "Les Tigres Orange", "Les Faucons Jaunes", "Les Ours Noirs", "Les Aigles Blancs",
    ]
    # Team name should be one of the French names
    assert teams[0].name in [
        "Les Renards Rouges", "Les Loups Bleus", "Les Vipères Vertes", "Les Panthers Violets",
        "Les Tigres Orange", "Les Faucons Jaunes", "Les Ours Noirs", "Les Aigles Blancs",
    ]


@pytest.mark.asyncio
async def test_build_teams_single_player():
    players = [Player(game_id="g1", name="Solo", emoji="🦁")]
    teams = await build_teams(players, 4, "en")
    assert len(teams) == 1
    assert len(teams[0].players) == 1


@pytest.mark.asyncio
async def test_build_teams_colors_assigned():
    players = [Player(game_id="g1", name=f"P{i}", emoji="🐔") for i in range(8)]
    teams = await build_teams(players, 2, "en")
    for team in teams:
        assert team.color.startswith("#")
        assert len(team.color) == 7
