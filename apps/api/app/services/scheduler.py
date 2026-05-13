"""
Background scheduler that drives game lifecycle events:
  - HEAD_START → ACTIVE transition
  - Shrinking circle broadcasts at configured intervals
  - Chicken proximity alerts when a team is within 200m
  - ACTIVE → ENDED when game_ends_at is reached
"""

import asyncio
import logging
from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import AsyncSessionLocal
from app.models.game import Game, GameStatus
from app.models.player import Player, PlayerRole
from app.services.circle_engine import CircleState, initial_circle, shrink_circle
from app.services.game_service import end_game
from app.utils.geo import haversine_distance
from app.websockets.manager import manager

logger = logging.getLogger(__name__)

# In-memory circle state keyed by game_id
_circles: dict[str, CircleState] = {}

TICK_SECONDS = 10
DANGER_RADIUS_M = 200.0


async def _get_active_games(session: AsyncSession) -> list[Game]:
    result = await session.exec(
        select(Game).where(Game.status.in_([GameStatus.HEAD_START, GameStatus.ACTIVE]))  # type: ignore[attr-defined]
    )
    return list(result.all())


async def _transition_to_active(session: AsyncSession, game: Game) -> None:
    game.status = GameStatus.ACTIVE
    session.add(game)
    await session.commit()
    await manager.broadcast(game.id, {"type": "game:started", "game_id": game.id})
    logger.info("Game %s transitioned HEAD_START → ACTIVE", game.code)


async def _maybe_shrink_circle(session: AsyncSession, game: Game) -> None:
    if game.bar_lat is None or game.bar_lng is None:
        return

    state = _circles.get(game.id)
    if state is None:
        state = initial_circle(game.bar_lat, game.bar_lng)
        _circles[game.id] = state

    interval_sec = game.gps_shrink_interval_minutes * 60
    now = datetime.now(UTC)

    # Determine if enough time has passed since last shrink (or game start)
    reference = game.head_start_ends_at or game.game_ends_at
    if reference is None:
        return

    if reference.tzinfo is None:
        reference = reference.replace(tzinfo=UTC)

    elapsed_since_start = (now - reference).total_seconds()
    expected_shrinks = max(0, int(elapsed_since_start // interval_sec))

    if expected_shrinks > state.shrink_count:
        state = shrink_circle(state, game.bar_lat, game.bar_lng)
        _circles[game.id] = state

        next_shrink_ts = int(reference.timestamp() + (state.shrink_count) * interval_sec)

        await manager.broadcast(
            game.id,
            {
                "type": "circle:shrink",
                "lat": state.center_lat,
                "lng": state.center_lng,
                "radius_m": state.radius_m,
                "next_shrink_at": next_shrink_ts,
            },
        )
        logger.debug(
            "Game %s circle shrunk → %.0fm (shrink #%d)",
            game.code,
            state.radius_m,
            state.shrink_count,
        )


async def _check_proximity_alerts(session: AsyncSession, game: Game) -> None:
    if game.bar_lat is None or game.bar_lng is None:
        return

    players_result = await session.exec(select(Player).where(Player.game_id == game.id))
    players = list(players_result.all())

    chickens = [p for p in players if p.role == PlayerRole.CHICKEN]
    hunters = [p for p in players if p.role != PlayerRole.CHICKEN and p.last_lat is not None and p.last_lng is not None]

    for hunter in hunters:
        assert hunter.last_lat is not None and hunter.last_lng is not None
        dist = haversine_distance(
            hunter.last_lat,
            hunter.last_lng,
            game.bar_lat,
            game.bar_lng,
        )
        if dist < DANGER_RADIUS_M:
            # Alert the chicken
            for chicken in chickens:
                await manager.send_to_player(
                    chicken.id,
                    {
                        "type": "chicken:alert",
                        "distance_m": round(dist, 1),
                        "team_id": hunter.team_id or "",
                    },
                )


async def _tick() -> None:
    async with AsyncSessionLocal() as session:
        games = await _get_active_games(session)
        now = datetime.now(UTC)

        for game in games:
            try:
                # Transition HEAD_START → ACTIVE
                if game.status == GameStatus.HEAD_START and game.head_start_ends_at:
                    ends_at = game.head_start_ends_at
                    if ends_at.tzinfo is None:
                        ends_at = ends_at.replace(tzinfo=UTC)
                    if now >= ends_at:
                        await _transition_to_active(session, game)
                        game.status = GameStatus.ACTIVE

                # End game when time is up
                if game.status == GameStatus.ACTIVE and game.game_ends_at:
                    game_ends = game.game_ends_at
                    if game_ends.tzinfo is None:
                        game_ends = game_ends.replace(tzinfo=UTC)
                    if now >= game_ends:
                        await end_game(session, game)
                        _circles.pop(game.id, None)
                        await manager.broadcast(game.id, {"type": "game:ended", "game_id": game.id})
                        logger.info("Game %s ended (time limit reached)", game.code)
                        continue

                # Circle shrinking + proximity
                if game.status == GameStatus.ACTIVE:
                    await _maybe_shrink_circle(session, game)
                    await _check_proximity_alerts(session, game)

            except Exception:
                logger.exception("Scheduler error for game %s", game.id)


async def run_scheduler() -> None:
    logger.info("Game scheduler started (tick every %ds)", TICK_SECONDS)
    while True:
        await asyncio.sleep(TICK_SECONDS)
        try:
            await _tick()
        except Exception:
            logger.exception("Scheduler tick failed")
