import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.player import Player
    from app.models.team import Team


class GameStatus(StrEnum):
    LOBBY = "lobby"
    HEAD_START = "head_start"
    ACTIVE = "active"
    ENDED = "ended"


class CostumePolicy(StrEnum):
    REQUIRED = "required"
    ENCOURAGED = "encouraged"
    OPTIONAL = "optional"
    NONE = "none"


class Game(SQLModel, table=True):
    __tablename__ = "games"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    code: str = Field(unique=True, index=True, max_length=10)
    name: str = Field(max_length=100)
    city: str = Field(max_length=50)
    language: str = Field(default="en", max_length=5)
    status: GameStatus = Field(default=GameStatus.LOBBY)
    host_player_id: str | None = Field(default=None)

    # Rules config
    num_chickens: int = Field(default=1, ge=1, le=4)
    head_start_minutes: int = Field(default=30, ge=10, le=60)
    game_duration_hours: float = Field(default=2.0, ge=1.0, le=4.0)
    team_size: int = Field(default=4, ge=2, le=10)
    gps_shrink_interval_minutes: int = Field(default=15, ge=5, le=30)
    buy_in_amount: int = Field(default=0, ge=0)
    costume_policy: CostumePolicy = Field(default=CostumePolicy.ENCOURAGED)
    chaos_mode: bool = Field(default=False)

    # Communication toggles
    allow_calls: bool = Field(default=True)
    allow_texts: bool = Field(default=True)
    allow_hints: bool = Field(default=False)
    allow_social_media: bool = Field(default=True)

    # Bar selection
    bar_id: str | None = Field(default=None)
    bar_name: str | None = Field(default=None)
    bar_lat: float | None = Field(default=None)
    bar_lng: float | None = Field(default=None)

    # Timing
    scheduled_at: datetime | None = Field(default=None)
    head_start_ends_at: datetime | None = Field(default=None)
    game_ends_at: datetime | None = Field(default=None)
    ended_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    players: list["Player"] = Relationship(back_populates="game")
    teams: list["Team"] = Relationship(back_populates="game")
