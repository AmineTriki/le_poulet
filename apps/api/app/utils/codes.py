import random
import string

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.config import settings

ALPHABET = string.ascii_uppercase + string.digits


async def generate_game_code(session: AsyncSession) -> str:
    from app.models.game import Game

    for _ in range(20):
        code = "".join(random.choices(ALPHABET, k=settings.game_code_length))
        result = await session.execute(select(Game).where(Game.code == code))
        if not result.scalars().first():
            return code
    raise RuntimeError("Could not generate unique game code after 20 attempts")
