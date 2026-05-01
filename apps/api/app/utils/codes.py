import random
import string
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.config import settings


ALPHABET = string.ascii_uppercase + string.digits


async def generate_game_code(session: AsyncSession) -> str:
    from app.models.game import Game

    for _ in range(20):
        code = "".join(random.choices(ALPHABET, k=settings.game_code_length))
        existing = await session.exec(select(Game).where(Game.code == code))
        if not existing.first():
            return code
    raise RuntimeError("Could not generate unique game code after 20 attempts")
