import random
from app.models.player import Player


async def pick_chickens(players: list[Player], count: int) -> list[Player]:
    count = min(count, len(players))
    return random.sample(players, count)
