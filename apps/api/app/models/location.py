import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class LocationUpdate(SQLModel, table=True):
    __tablename__ = "location_updates"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    player_id: str = Field(foreign_key="players.id", index=True)
    lat: float
    lng: float
    accuracy_m: float = Field(default=0.0)
    heading: float | None = Field(default=None)
    speed_ms: float | None = Field(default=None)
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
