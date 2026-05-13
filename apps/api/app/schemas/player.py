from datetime import datetime

from pydantic import BaseModel

from app.models.player import PlayerRole


class PlayerCreate(BaseModel):
    game_id: str
    name: str
    emoji: str | None = None


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
    lat: float
    lng: float
    accuracy_m: float = 0.0
    heading: float | None = None
    speed_ms: float | None = None
