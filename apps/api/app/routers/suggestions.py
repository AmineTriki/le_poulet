from fastapi import APIRouter, Depends
from typing import Optional
from redis.asyncio import Redis
from app.redis import get_redis
from app.services.bar_service import get_bar_areas

router = APIRouter()


def suggest_game_config(player_count: int) -> dict:
    n = max(1, player_count)

    if n <= 6:
        num_chickens = 1
        team_size = max(2, n - 1)
    elif n <= 12:
        num_chickens = 1
        team_size = 3
    elif n <= 20:
        num_chickens = 1
        team_size = 4
    elif n <= 30:
        num_chickens = 2
        team_size = 4
    elif n <= 45:
        num_chickens = 2
        team_size = 5
    else:
        num_chickens = 3
        team_size = 5

    hunters = n - num_chickens
    num_teams = max(1, round(hunters / team_size))
    actual_size = round(hunters / num_teams) if num_teams > 0 else team_size
    leftover = hunters - (num_teams * actual_size)

    buy_in_opts = [5, 10, 20, 50]
    desc_parts = [f"{num_teams} team{'s' if num_teams > 1 else ''} of ~{actual_size}"]
    if leftover > 0:
        desc_parts.append(f"(+{leftover} flex)")
    desc_parts.append(f"{'🐔🐔' if num_chickens > 1 else '🐔'} {num_chickens} chicken{'s' if num_chickens > 1 else ''}")

    return {
        "num_chickens": num_chickens,
        "team_size": actual_size,
        "num_teams": num_teams,
        "hunters": hunters,
        "leftover_players": max(0, leftover),
        "description": " · ".join(desc_parts),
        "buy_in_options": buy_in_opts,
        "pot_examples": {str(b): b * n for b in buy_in_opts},
    }


@router.get("/config")
async def get_game_config_suggestion(player_count: int = 10) -> dict:
    return suggest_game_config(player_count)


@router.get("/areas")
async def get_areas_for_city(
    city: str,
    redis: Optional[Redis] = Depends(get_redis),
) -> list[dict]:
    return await get_bar_areas(city, redis)
