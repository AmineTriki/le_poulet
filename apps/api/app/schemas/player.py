from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.player import PlayerRole


class PlayerCreate(BaseModel):
    game_id: str
    name: str
    emoji: Optional[str] = None


class PlayerRead(BaseModel):
    id: str
    game_id: str
    team_id: Optional[str]
    name: str
    emoji: str
    role: PlayerRole
    is_online: bool
    score: int
    last_lat: Optional[float]
    last_lng: Optional[float]
    token: str
    created_at: datetime


class LocationUpdateRequest(BaseModel):
    player_token: str
    lat: float
    lng: float
    accuracy_m: float = 0.0
    heading: Optional[float] = None
    speed_ms: Optional[float] = None
