import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.game import Game
    from app.models.player import Player


TEAM_NAMES_EN = [
    "Red Foxes",
    "Blue Wolves",
    "Green Vipers",
    "Purple Panthers",
    "Orange Tigers",
    "Yellow Hawks",
    "Black Bears",
    "White Eagles",
]

TEAM_NAMES_FR = [
    "Les Renards Rouges",
    "Les Loups Bleus",
    "Les Vipères Vertes",
    "Les Panthers Violets",
    "Les Tigres Orange",
    "Les Faucons Jaunes",
    "Les Ours Noirs",
    "Les Aigles Blancs",
]


class Team(SQLModel, table=True):
    __tablename__ = "teams"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    name: str = Field(max_length=100)
    color: str = Field(default="#F5C518", max_length=7)
    score: int = Field(default=0, ge=0)
    found_chicken_at: datetime | None = Field(default=None)
    found_order: int | None = Field(default=None)
    chaos_points: int = Field(default=0, ge=0)
    weapons_available: int = Field(default=3)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    game: Optional["Game"] = Relationship(back_populates="teams")
    players: list["Player"] = Relationship(back_populates="team")
