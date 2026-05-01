from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
import uuid

if TYPE_CHECKING:
    from app.models.game import Game
    from app.models.team import Team


class PlayerRole(str, Enum):
    HUNTER = "hunter"
    CHICKEN = "chicken"
    HOST = "host"


class Player(SQLModel, table=True):
    __tablename__ = "players"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    team_id: Optional[str] = Field(default=None, foreign_key="teams.id")
    name: str = Field(max_length=50)
    emoji: str = Field(default="🐔", max_length=10)
    role: PlayerRole = Field(default=PlayerRole.HUNTER)
    is_online: bool = Field(default=True)
    last_seen_at: datetime = Field(default_factory=datetime.utcnow)
    last_lat: Optional[float] = Field(default=None)
    last_lng: Optional[float] = Field(default=None)
    last_location_at: Optional[datetime] = Field(default=None)
    score: int = Field(default=0, ge=0)
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    game: Optional["Game"] = Relationship(back_populates="players")
    team: Optional["Team"] = Relationship(back_populates="players")
