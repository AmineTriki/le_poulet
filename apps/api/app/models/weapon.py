from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


class WeaponType(str, Enum):
    AIR_STRIKE = "air_strike"
    SPY = "spy"
    BOOBY_TRAP = "booby_trap"
    STEAL = "steal"
    DECOY = "decoy"
    SILENCE = "silence"


WEAPON_CONFIG: dict[str, dict] = {
    WeaponType.AIR_STRIKE: {"cost": 80, "cooldown_minutes": 20, "once_per_game": False},
    WeaponType.SPY: {"cost": 60, "cooldown_minutes": 15, "once_per_game": False},
    WeaponType.BOOBY_TRAP: {"cost": 50, "cooldown_minutes": 0, "once_per_game": True},
    WeaponType.STEAL: {"cost": 40, "cooldown_minutes": 10, "once_per_game": False},
    WeaponType.DECOY: {"cost": 100, "cooldown_minutes": 0, "once_per_game": True},
    WeaponType.SILENCE: {"cost": 70, "cooldown_minutes": 20, "once_per_game": False},
}


class WeaponUse(SQLModel, table=True):
    __tablename__ = "weapon_uses"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    game_id: str = Field(foreign_key="games.id", index=True)
    by_team_id: str = Field(foreign_key="teams.id")
    target_team_id: Optional[str] = Field(default=None, foreign_key="teams.id")
    weapon_type: WeaponType
    points_spent: int
    effect_data: str = Field(default="{}")
    expires_at: Optional[datetime] = Field(default=None)
    fired_at: datetime = Field(default_factory=datetime.utcnow)
