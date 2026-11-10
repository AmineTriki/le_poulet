import random
from dataclasses import dataclass, field

from app.models.player import Player
from app.models.team import TEAM_NAMES_EN, TEAM_NAMES_FR, Team

TEAM_COLORS = [
    "#E63946",
    "#457B9D",
    "#2DC653",
    "#F5C518",
    "#8338EC",
    "#FB5607",
    "#3A86FF",
    "#FF006E",
]


@dataclass
class TeamDraft:
    team: Team
    players: list[Player] = field(default_factory=list)

    @property
    def name(self) -> str:
        return self.team.name

    @property
    def color(self) -> str:
        return self.team.color


async def build_teams(players: list[Player], team_size: int, language: str) -> list[TeamDraft]:
    if team_size < 1:
        raise ValueError("team_size must be >= 1")
    random.shuffle(players)
    names = list(TEAM_NAMES_FR if language == "fr" else TEAM_NAMES_EN)
    random.shuffle(names)

    drafts: list[TeamDraft] = []
    for idx, i in enumerate(range(0, len(players), team_size)):
        chunk = players[i : i + team_size]
        team = Team(
            game_id="",
            # Past the end of the name list, add a round number so team names stay unique.
            name=names[idx % len(names)] if idx < len(names) else f"{names[idx % len(names)]} {idx // len(names) + 1}",
            color=TEAM_COLORS[idx % len(TEAM_COLORS)],
        )
        drafts.append(TeamDraft(team=team, players=chunk))

    return drafts
