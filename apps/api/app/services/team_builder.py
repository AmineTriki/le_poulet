import random
from app.models.player import Player
from app.models.team import Team, TEAM_NAMES_EN, TEAM_NAMES_FR

TEAM_COLORS = [
    "#E63946", "#457B9D", "#2DC653", "#F5C518",
    "#8338EC", "#FB5607", "#3A86FF", "#FF006E",
]


async def build_teams(players: list[Player], team_size: int, language: str) -> list[Team]:
    random.shuffle(players)
    names = TEAM_NAMES_FR if language == "fr" else TEAM_NAMES_EN
    random.shuffle(names)

    teams: list[Team] = []
    for i in range(0, len(players), team_size):
        chunk = players[i:i + team_size]
        team = Team(
            game_id="",
            name=names[len(teams) % len(names)],
            color=TEAM_COLORS[len(teams) % len(TEAM_COLORS)],
        )
        team.players = chunk  # type: ignore[assignment]
        teams.append(team)

    return teams
