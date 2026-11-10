from datetime import datetime

from pydantic import BaseModel, Field

from app.models.game import CostumePolicy, GameStatus


class GameCreate(BaseModel):
    # Bounds mirror the Game table model (table models do not validate on construction).
    name: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=50)
    language: str = Field(default="en", max_length=5)
    num_chickens: int = Field(default=1, ge=1, le=4)
    head_start_minutes: int = Field(default=30, ge=10, le=60)
    game_duration_hours: float = Field(default=2.0, ge=1.0, le=4.0)
    team_size: int = Field(default=4, ge=2, le=10)
    gps_shrink_interval_minutes: int = Field(default=15, ge=5, le=30)
    buy_in_amount: int = Field(default=0, ge=0, le=100_000)
    costume_policy: CostumePolicy = CostumePolicy.ENCOURAGED
    chaos_mode: bool = False
    allow_calls: bool = True
    allow_texts: bool = True
    allow_hints: bool = False
    allow_social_media: bool = True
    scheduled_at: datetime | None = None


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
    bar_name: str | None
    bar_lat: float | None
    bar_lng: float | None
    head_start_ends_at: datetime | None
    game_ends_at: datetime | None
    created_at: datetime
    player_count: int = 0
    team_count: int = 0


class GameStartRequest(BaseModel):
    host_token: str
    bar_id: str | None = Field(default=None, max_length=100)
    bar_name: str | None = Field(default=None, max_length=200)
    bar_lat: float | None = Field(default=None, ge=-90, le=90)
    bar_lng: float | None = Field(default=None, ge=-180, le=180)


class CircleState(BaseModel):
    center_lat: float
    center_lng: float
    radius_m: float
    next_shrink_at: datetime | None
    shrink_count: int
