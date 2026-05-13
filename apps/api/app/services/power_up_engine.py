from datetime import datetime, timedelta

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.team import Team
from app.models.weapon import WEAPON_CONFIG, WeaponType, WeaponUse


async def fire_weapon(
    session: AsyncSession,
    game_id: str,
    by_team: Team,
    target_team_id: str | None,
    weapon_type: WeaponType,
) -> WeaponUse | None:
    config = WEAPON_CONFIG.get(weapon_type)
    if not config:
        return None

    cost: int = config["cost"]
    if by_team.chaos_points < cost:
        return None

    by_team.chaos_points -= cost
    session.add(by_team)

    expires_at: datetime | None = None
    if config["cooldown_minutes"] > 0:
        expires_at = datetime.utcnow() + timedelta(minutes=config["cooldown_minutes"])

    weapon_use = WeaponUse(
        game_id=game_id,
        by_team_id=by_team.id,
        target_team_id=target_team_id,
        weapon_type=weapon_type,
        points_spent=cost,
        expires_at=expires_at,
    )
    session.add(weapon_use)
    await session.commit()
    await session.refresh(weapon_use)
    return weapon_use
