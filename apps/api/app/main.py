from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
from app.config import settings
from app.database import init_db
from app.redis import close_redis
from app.routers import games, players, teams, chickens, challenges, locations, bars, weapons, costumes
from app.websockets.handler import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1)
    await init_db()
    yield
    await close_redis()


app = FastAPI(
    title="Le Poulet API",
    description="City-wide chicken hunt game — free, bilingual, chaotic.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router, prefix="/api/v1/games", tags=["games"])
app.include_router(players.router, prefix="/api/v1/players", tags=["players"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(chickens.router, prefix="/api/v1/chickens", tags=["chickens"])
app.include_router(challenges.router, prefix="/api/v1/challenges", tags=["challenges"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["locations"])
app.include_router(bars.router, prefix="/api/v1/bars", tags=["bars"])
app.include_router(weapons.router, prefix="/api/v1/weapons", tags=["weapons"])
app.include_router(costumes.router, prefix="/api/v1/costumes", tags=["costumes"])
app.include_router(ws_router, prefix="/ws", tags=["websocket"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}
