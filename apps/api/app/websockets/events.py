from typing import Any, Literal, Union
from pydantic import BaseModel


class GameStartedEvent(BaseModel):
    type: Literal["game:started"] = "game:started"
    game_id: str
    config: dict[str, Any]


class GameEndedEvent(BaseModel):
    type: Literal["game:ended"] = "game:ended"
    game_id: str
    scoreboard: list[dict[str, Any]]


class PlayerJoinedEvent(BaseModel):
    type: Literal["player:joined"] = "player:joined"
    player_id: str
    name: str
    emoji: str
    game_id: str


class PlayerLeftEvent(BaseModel):
    type: Literal["player:left"] = "player:left"
    player_id: str
    game_id: str


class LocationUpdateEvent(BaseModel):
    type: Literal["location:update"] = "location:update"
    player_id: str
    lat: float
    lng: float
    ts: int


class CircleShrinkEvent(BaseModel):
    type: Literal["circle:shrink"] = "circle:shrink"
    lat: float
    lng: float
    radius_m: float
    next_shrink_at: int


class ChickenAlertEvent(BaseModel):
    type: Literal["chicken:alert"] = "chicken:alert"
    distance_m: float
    team_id: str


class ChickenFoundEvent(BaseModel):
    type: Literal["chicken:found"] = "chicken:found"
    team_id: str
    team_name: str
    order: int


class ChallengeNewEvent(BaseModel):
    type: Literal["challenge:new"] = "challenge:new"
    challenge_id: str
    team_id: str
    title_en: str
    title_fr: str
    points: int
    time_limit_sec: int


class ChallengeSubmittedEvent(BaseModel):
    type: Literal["challenge:submitted"] = "challenge:submitted"
    submission_id: str
    team_id: str
    challenge_id: str
    media_url: str | None


class ChallengeScoredEvent(BaseModel):
    type: Literal["challenge:scored"] = "challenge:scored"
    submission_id: str
    team_id: str
    points: int
    approved: bool


class WeaponFiredEvent(BaseModel):
    type: Literal["weapon:fired"] = "weapon:fired"
    weapon: str
    by_team_id: str
    target_team_id: str | None


class WeaponHitEvent(BaseModel):
    type: Literal["weapon:hit"] = "weapon:hit"
    weapon: str
    effect: str
    target_team_id: str | None


class BarMarkedEvent(BaseModel):
    type: Literal["bar:marked"] = "bar:marked"
    bar_id: str
    team_id: str
    found: bool


GameEvent = Union[
    GameStartedEvent, GameEndedEvent, PlayerJoinedEvent, PlayerLeftEvent,
    LocationUpdateEvent, CircleShrinkEvent, ChickenAlertEvent, ChickenFoundEvent,
    ChallengeNewEvent, ChallengeSubmittedEvent, ChallengeScoredEvent,
    WeaponFiredEvent, WeaponHitEvent, BarMarkedEvent,
]
