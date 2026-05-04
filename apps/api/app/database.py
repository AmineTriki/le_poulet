from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from app.config import settings
import app.models  # noqa: F401 — ensures all models are registered with SQLModel metadata

_is_sqlite = settings.database_url.startswith("sqlite")

engine = create_async_engine(
    settings.database_url,
    # SQLite doesn't support connection pool settings
    **({} if _is_sqlite else {
        "pool_size": settings.database_pool_min,
        "max_overflow": settings.database_pool_max - settings.database_pool_min,
        "pool_pre_ping": True,
    }),
    echo=settings.debug,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
