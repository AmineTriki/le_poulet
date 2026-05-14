from datetime import datetime

from pydantic import BaseModel

from app.models.challenge import (
    ChallengeCategory,
    ChallengeDifficulty,
    MediaType,
    SubmissionStatus,
)


class ChallengeRead(BaseModel):
    id: str
    category: ChallengeCategory
    difficulty: ChallengeDifficulty
    points: int
    media_type: MediaType
    title_en: str
    title_fr: str
    desc_en: str
    desc_fr: str
    tags: str
    min_players: int
    time_limit_sec: int


class SubmissionCreate(BaseModel):
    game_id: str
    challenge_id: str
    team_id: str
    player_token: str
    media_url: str | None = None


class SubmissionRead(BaseModel):
    id: str
    game_id: str
    challenge_id: str
    team_id: str
    player_id: str
    media_url: str | None
    status: SubmissionStatus
    points_awarded: int
    chicken_score: int | None
    submitted_at: datetime


class ScoreSubmissionRequest(BaseModel):
    chicken_token: str
    score: int
    approved: bool = True
