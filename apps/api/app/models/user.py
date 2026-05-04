from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=50)
    display_name: str = Field(max_length=100)
    hashed_password: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=300)
    instagram_url: Optional[str] = Field(default=None, max_length=255)
    vsco_url: Optional[str] = Field(default=None, max_length=255)
    games_played: int = Field(default=0, ge=0)
    chickens_caught: int = Field(default=0, ge=0)
    times_chicken: int = Field(default=0, ge=0)
    # OAuth provider IDs
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    apple_id: Optional[str] = Field(default=None, unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
