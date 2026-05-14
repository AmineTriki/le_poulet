import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Chicken(SQLModel, table=True):
    __tablename__ = "chickens"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    player_id: str = Field(foreign_key="players.id", index=True)
    bar_id: str | None = Field(default=None)
    bar_name: str | None = Field(default=None)
    bar_lat: float | None = Field(default=None)
    bar_lng: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    total_pings: int = Field(default=0)
    last_alert_sent_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
