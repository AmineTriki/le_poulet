from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import settings
from app.utils.codes import ALPHABET, generate_game_code


def _session_with_existing(existing: bool) -> AsyncMock:
    result = MagicMock()
    result.scalars.return_value.first.return_value = object() if existing else None
    session = AsyncMock()
    session.execute.return_value = result
    return session


@pytest.mark.asyncio
async def test_generate_game_code_shape() -> None:
    code = await generate_game_code(_session_with_existing(False))
    assert len(code) == settings.game_code_length
    assert set(code) <= set(ALPHABET)


@pytest.mark.asyncio
async def test_generate_game_code_gives_up_when_all_taken() -> None:
    session = _session_with_existing(True)
    with pytest.raises(RuntimeError):
        await generate_game_code(session)
    assert session.execute.await_count == 20
