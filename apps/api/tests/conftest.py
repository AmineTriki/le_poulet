import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

import app.models.challenge  # noqa: F401
import app.models.chicken  # noqa: F401

# Import all models so metadata is populated before create_all
import app.models.game  # noqa: F401
import app.models.location  # noqa: F401
import app.models.player  # noqa: F401
import app.models.team  # noqa: F401
import app.models.weapon  # noqa: F401
from app.database import get_session
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_lepoulet.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def session():
    async with TestSessionLocal() as s:
        yield s


@pytest_asyncio.fixture
async def client(session):
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
