from datetime import datetime, timedelta

from sqlalchemy import update
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.game import Game, GameStatus
from app.models.team import Team
from app.models.weapon import WEAPON_CONFIG, WeaponType, WeaponUse


class WeaponError(ValueError):
    """Raised when a weapon cannot be fired; the message is safe to show to the player."""


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

    game = await session.get(Game, game_id)
    if game is None or game.status != GameStatus.ACTIVE:
        raise WeaponError("Weapons can only be fired while the game is active")
    if by_team.game_id != game_id:
        raise WeaponError("Team does not belong to this game")

    if target_team_id is not None:
        target = await session.get(Team, target_team_id)
        if target is None or target.game_id != game_id:
            raise WeaponError("Invalid target team")
        if target.id == by_team.id:
            raise WeaponError("Cannot target your own team")

    previous_result = await session.exec(
        select(WeaponUse).where(WeaponUse.by_team_id == by_team.id, WeaponUse.weapon_type == weapon_type)
    )
    now = datetime.utcnow()
    for previous in previous_result.all():
        if config["once_per_game"]:
            raise WeaponError("This weapon can only be used once per game")
        if previous.expires_at is not None and previous.expires_at > now:
            raise WeaponError("Weapon is on cooldown")

    cost: int = config["cost"]
    # Atomic conditional spend: two concurrent shots cannot both succeed on the same points.
    spent = await session.execute(
        update(Team)
        .where(col(Team.id) == by_team.id, col(Team.chaos_points) >= cost)
        .values(chaos_points=Team.chaos_points - cost)
    )
    if spent.rowcount == 0:  # type: ignore[attr-defined]
        await session.rollback()
        raise WeaponError("Not enough chaos points")

    expires_at: datetime | None = None
    if config["cooldown_minutes"] > 0:
        expires_at = now + timedelta(minutes=config["cooldown_minutes"])

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
    await session.refresh(by_team)
    return weapon_use
