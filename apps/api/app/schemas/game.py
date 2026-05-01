from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.game import GameStatus, CostumePolicy


class GameCreate(BaseModel):
    name: str
    city: str
    language: str = "en"
    num_chickens: int = 1
    head_start_minutes: int = 30
    game_duration_hours: float = 2.0
    team_size: int = 4
    gps_shrink_interval_minutes: int = 15
    buy_in_amount: int = 0
    costume_policy: CostumePolicy = CostumePolicy.ENCOURAGED
    chaos_mode: bool = False
    allow_calls: bool = True
    allow_texts: bool = True
    allow_hints: bool = False
    allow_social_media: bool = True
    scheduled_at: Optional[datetime] = None


class GameRead(BaseModel):
    id: str
    code: str
    name: str
    city: str
    language: str
    status: GameStatus
    num_chickens: int
    head_start_minutes: int
    game_duration_hours: float
    team_size: int
    chaos_mode: bool
    buy_in_amount: int
    costume_policy: CostumePolicy
    bar_name: Optional[str]
    bar_lat: Optional[float]
    bar_lng: Optional[float]
    head_start_ends_at: Optional[datetime]
    game_ends_at: Optional[datetime]
    created_at: datetime
    player_count: int = 0
    team_count: int = 0


class GameStartRequest(BaseModel):
    host_token: str
    bar_id: Optional[str] = None
    bar_name: Optional[str] = None
    bar_lat: Optional[float] = None
    bar_lng: Optional[float] = None


class CircleState(BaseModel):
    center_lat: float
    center_lng: float
    radius_m: float
    next_shrink_at: Optional[datetime]
    shrink_count: int
