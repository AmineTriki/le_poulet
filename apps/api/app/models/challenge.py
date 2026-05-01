from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


class ChallengeCategory(str, Enum):
    SOCIAL = "social"
    PHYSICAL = "physical"
    BAR = "bar"
    CREATIVE = "creative"
    EMBARRASSING = "embarrassing"
    CITY = "city"


class ChallengeDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MediaType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Challenge(SQLModel, table=True):
    __tablename__ = "challenges"

    id: str = Field(primary_key=True)
    category: ChallengeCategory
    difficulty: ChallengeDifficulty
    points: int = Field(ge=0)
    media_type: MediaType
    title_en: str
    title_fr: str
    desc_en: str
    desc_fr: str
    tags: str = Field(default="")
    min_players: int = Field(default=1, ge=1)
    time_limit_sec: int = Field(default=120, ge=30)
    city: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)


class ChallengeSubmission(SQLModel, table=True):
    __tablename__ = "challenge_submissions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    challenge_id: str = Field(foreign_key="challenges.id")
    team_id: str = Field(foreign_key="teams.id")
    player_id: str = Field(foreign_key="players.id")
    media_url: Optional[str] = Field(default=None)
    status: SubmissionStatus = Field(default=SubmissionStatus.PENDING)
    points_awarded: int = Field(default=0)
    chicken_score: Optional[int] = Field(default=None)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    scored_at: Optional[datetime] = Field(default=None)
