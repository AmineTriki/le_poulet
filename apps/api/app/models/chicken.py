from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


class Chicken(SQLModel, table=True):
    __tablename__ = "chickens"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    player_id: str = Field(foreign_key="players.id", index=True)
    bar_id: Optional[str] = Field(default=None)
    bar_name: Optional[str] = Field(default=None)
    bar_lat: Optional[float] = Field(default=None)
    bar_lng: Optional[float] = Field(default=None)
    is_active: bool = Field(default=True)
    total_pings: int = Field(default=0)
    last_alert_sent_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
