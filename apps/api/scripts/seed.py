"""
Seed the database with a test game, players, and all challenges.
Run: uv run python -m scripts.seed
"""
import asyncio
import json
from pathlib import Path

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import AsyncSessionLocal, init_db
from app.models.challenge import Challenge
from app.models.game import Game
from app.models.player import Player

DATA_DIR = Path(__file__).parent.parent / "data"

TEST_PLAYERS = [
    ("Alice", "🦊"),
    ("Bob", "🐺"),
    ("Charlie", "🦁"),
    ("Diana", "🐯"),
    ("Eve", "🐻"),
    ("Frank", "🦅"),
]


async def seed_challenges(session: AsyncSession) -> int:
    count = 0
    for lang in ("en", "fr"):
        path = DATA_DIR / f"challenges_{lang}.json"
        if not path.exists():
            print(f"  ⚠️  {path.name} not found, skipping")
            continue
        data: list[dict] = json.loads(path.read_text())
        for c in data:
            existing = await session.get(Challenge, c["id"])
            if not existing:
                session.add(Challenge(**c))
                count += 1
    await session.commit()
    return count


async def seed_test_game(session: AsyncSession) -> Game:
    # Wipe existing test game
    result = await session.exec(select(Game).where(Game.code == "TEST01"))
    existing = result.first()
    if existing:
        await session.delete(existing)
        await session.commit()

    from app.models.game import CostumePolicy
    game = Game(
        code="TEST01",
        name="Test Hunt (Seeded)",
        city="montreal",
        language="en",
        num_chickens=1,
        head_start_minutes=30,
        game_duration_hours=2.0,
        team_size=3,
        gps_shrink_interval_minutes=15,
        buy_in_amount=10,
        costume_policy=CostumePolicy.ENCOURAGED,
        chaos_mode=True,
        bar_name="Le Lab",
        bar_lat=45.5086,
        bar_lng=-73.5541,
    )
    session.add(game)
    await session.flush()

    players = []
    for name, emoji in TEST_PLAYERS:
        p = Player(game_id=game.id, name=name, emoji=emoji)
        session.add(p)
        players.append(p)

    await session.flush()
    game.host_player_id = players[0].id
    session.add(game)
    await session.commit()
    await session.refresh(game)
    return game


async def main() -> None:
    print("🐔 Le Poulet — Seeding database...")
    await init_db()
    async with AsyncSessionLocal() as session:
        print("  → Seeding challenges...")
        n = await seed_challenges(session)
        print(f"     Added {n} new challenges")

        print("  → Seeding test game (code: TEST01)...")
        game = await seed_test_game(session)
        print(f"     Game '{game.name}' created with {len(TEST_PLAYERS)} players")

        # Print host token
        player_result = await session.exec(select(Player).where(Player.game_id == game.id))
        host = player_result.first()
        if host:
            print(f"\n  Host token: {host.token}")

    print("\n✅ Seed complete. Run `make dev-api` to start the server.")


if __name__ == "__main__":
    asyncio.run(main())
