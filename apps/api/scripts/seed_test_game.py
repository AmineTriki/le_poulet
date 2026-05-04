"""
Seed a ready-to-test game with code TEST01, 6 pre-added players, 2 teams, and a bar.
Chicken is Fatima. Game is in LOBBY state.

Run: uv run python -m scripts.seed_test_game
"""
import asyncio

from sqlmodel import select

from app.database import AsyncSessionLocal, init_db
from app.models.game import Game, CostumePolicy
from app.models.player import Player, PlayerRole
from app.models.team import Team

PLAYERS = [
    ("Amine", "🐓", PlayerRole.HOST),
    ("Marie", "🦊", PlayerRole.HUNTER),
    ("Carlos", "🐺", PlayerRole.HUNTER),
    ("Fatima", "🐔", PlayerRole.CHICKEN),
    ("Alex", "🦁", PlayerRole.HUNTER),
    ("Soph", "🐯", PlayerRole.HUNTER),
]

TEAMS = [
    ("Red Foxes", "#E74C3C"),
    ("Blue Wolves", "#3498DB"),
]

# Le Lab bar — Montreal
BAR_LAT = 45.5086
BAR_LNG = -73.5541
BAR_NAME = "Le Lab"


async def main() -> None:
    print("🐔 Le Poulet — Seeding TEST01...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Remove existing TEST01
        result = await session.exec(select(Game).where(Game.code == "TEST01"))
        existing = result.first()
        if existing:
            # Delete players and teams first
            players_res = await session.exec(select(Player).where(Player.game_id == existing.id))
            for p in players_res.all():
                await session.delete(p)
            teams_res = await session.exec(select(Team).where(Team.game_id == existing.id))
            for t in teams_res.all():
                await session.delete(t)
            await session.delete(existing)
            await session.commit()
            print("  → Removed existing TEST01")

        game = Game(
            code="TEST01",
            name="Test Hunt",
            city="montreal",
            language="en",
            num_chickens=1,
            head_start_minutes=10,
            game_duration_hours=2.0,
            team_size=3,
            gps_shrink_interval_minutes=15,
            buy_in_amount=20,
            costume_policy=CostumePolicy.ENCOURAGED,
            chaos_mode=True,
            bar_name=BAR_NAME,
            bar_lat=BAR_LAT,
            bar_lng=BAR_LNG,
        )
        session.add(game)
        await session.flush()

        # Create teams
        teams = []
        for name, color in TEAMS:
            t = Team(game_id=game.id, name=name, color=color)
            session.add(t)
            teams.append(t)
        await session.flush()

        # Create players
        players = []
        for i, (name, emoji, role) in enumerate(PLAYERS):
            team = teams[i % 2] if role != PlayerRole.CHICKEN else None
            p = Player(
                game_id=game.id,
                team_id=team.id if team else None,
                name=name,
                emoji=emoji,
                role=role,
            )
            session.add(p)
            players.append(p)
        await session.flush()

        game.host_player_id = players[0].id
        session.add(game)
        await session.commit()

        print(f"  ✓ Game created — code: TEST01, pot: ${game.buy_in_amount * len(players)}")
        print(f"  ✓ Teams: {', '.join(t.name for t in teams)}")
        print(f"  ✓ Players:")
        for p, (_, _, role) in zip(players, PLAYERS):
            team_name = next((t.name for t in teams if t.id == p.team_id), "no team")
            print(f"       {p.emoji} {p.name} [{role.value}] — team: {team_name} — token: {p.token}")

        api = "http://localhost:8000"
        print(f"\n  Join URL: {api}/api/v1/games/TEST01")
        print(f"  Web URL:  http://localhost:3000/lobby/TEST01")
        print(f"\n  Host token (Amine): {players[0].token}")


if __name__ == "__main__":
    asyncio.run(main())
