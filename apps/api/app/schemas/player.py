from datetime import datetime

from pydantic import BaseModel, Field

from app.models.player import PlayerRole


class PlayerCreate(BaseModel):
    game_id: str
    name: str = Field(min_length=1, max_length=50)
    emoji: str | None = Field(default=None, max_length=10)


class PlayerRead(BaseModel):
    id: str
    game_id: str
    team_id: str | None
    name: str
    emoji: str
    role: PlayerRole
    is_online: bool
    score: int
    last_lat: float | None
    last_lng: float | None
    token: str
    created_at: datetime


class LocationUpdateRequest(BaseModel):
    player_token: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(default=0.0, ge=-1, le=100_000)
    heading: float | None = Field(default=None, ge=-1, le=360)
    speed_ms: float | None = Field(default=None, ge=-1, le=500)
