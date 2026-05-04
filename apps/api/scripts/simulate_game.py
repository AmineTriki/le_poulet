"""
Simulate a full Le Poulet game with fake players moving toward the bar.

Run: uv run python -m scripts.simulate_game --players 8 --duration 60
"""
import argparse
import asyncio
import math
import random
import string
import time

import httpx

# Montreal bar as default destination
DEFAULT_BAR_LAT = 45.5086
DEFAULT_BAR_LNG = -73.5541
DEFAULT_BAR_NAME = "Le Lab"

# Spawn hunters ~1km away from the bar in a ring
SPAWN_RADIUS_M = 1000

PLAYER_EMOJIS = ["🦊", "🐺", "🦁", "🐯", "🐻", "🦅", "🦋", "🐸", "🦎", "🐠"]
TEAM_COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C"]
TEAM_NAMES = ["Red Foxes", "Blue Wolves", "Green Vipers", "Purple Panthers", "Orange Tigers", "Teal Sharks"]


def random_code(n: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase, k=n))


def offset_latlng(lat: float, lng: float, bearing_deg: float, dist_m: float) -> tuple[float, float]:
    R = 6_371_000
    bearing = math.radians(bearing_deg)
    lat1 = math.radians(lat)
    lng1 = math.radians(lng)
    lat2 = math.asin(math.sin(lat1) * math.cos(dist_m / R) + math.cos(lat1) * math.sin(dist_m / R) * math.cos(bearing))
    lng2 = lng1 + math.atan2(math.sin(bearing) * math.sin(dist_m / R) * math.cos(lat1), math.cos(dist_m / R) - math.sin(lat1) * math.sin(lat2))
    return math.degrees(lat2), math.degrees(lng2)


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def simulate(n_players: int, duration_s: int, api: str, fast: bool) -> None:
    print(f"\n🐔 Le Poulet Simulator — {n_players} players, {duration_s}s, API: {api}")

    async with httpx.AsyncClient(base_url=api, timeout=15) as client:
        # 1. Create game
        code = random_code()
        game_resp = await client.post("/api/v1/games/", json={
            "name": f"Sim-{code}",
            "city": "montreal",
            "language": "en",
            "num_chickens": 1,
            "head_start_minutes": 1 if fast else 5,
            "game_duration_hours": max(1.0, duration_s / 3600),
            "team_size": max(2, n_players // 2),
            "chaos_mode": True,
            "buy_in_amount": 10,
            "bar_name": DEFAULT_BAR_NAME,
            "bar_lat": DEFAULT_BAR_LAT,
            "bar_lng": DEFAULT_BAR_LNG,
        })
        if game_resp.status_code not in (200, 201):
            print(f"  ✗ Failed to create game: {game_resp.text}")
            return
        game = game_resp.json()
        game_id = game["id"]
        code = game["code"]
        print(f"  ✓ Game created — code: {code}")

        # 2. Create teams
        n_teams = max(2, n_players // 4)
        team_ids = []
        for i in range(n_teams):
            t_resp = await client.post("/api/v1/teams/", json={
                "game_id": game_id,
                "name": TEAM_NAMES[i % len(TEAM_NAMES)],
                "color": TEAM_COLORS[i % len(TEAM_COLORS)],
            })
            if t_resp.status_code in (200, 201):
                team_ids.append(t_resp.json()["id"])
        print(f"  ✓ {len(team_ids)} teams created")

        # 3. Join players
        players: list[dict] = []
        for i in range(n_players):
            bearing = (360 / n_players) * i
            lat, lng = offset_latlng(DEFAULT_BAR_LAT, DEFAULT_BAR_LNG, bearing, SPAWN_RADIUS_M + random.uniform(-100, 100))
            join_resp = await client.post("/api/v1/players/", json={
                "game_code": code,
                "name": f"Player{i + 1}",
                "emoji": PLAYER_EMOJIS[i % len(PLAYER_EMOJIS)],
                "team_id": team_ids[i % len(team_ids)] if team_ids else None,
            })
            if join_resp.status_code in (200, 201):
                data = join_resp.json()
                players.append({"token": data["token"], "id": data["player"]["id"], "lat": lat, "lng": lng})
        print(f"  ✓ {len(players)} players joined")

        # 4. Set host and start
        host_token = players[0]["token"] if players else None
        if host_token:
            await client.post(f"/api/v1/games/{code}/start", json={"player_token": host_token})
            print(f"  ✓ Game started (head start phase)")

        # 5. Simulate movement
        start = time.time()
        tick = 0
        found = False

        print(f"\n  Simulating {duration_s}s of game...")

        while time.time() - start < duration_s and not found:
            tick += 1
            elapsed = time.time() - start

            tasks = []
            for p in players:
                # Move ~30m toward the bar per tick, with jitter
                dist = haversine_m(p["lat"], p["lng"], DEFAULT_BAR_LAT, DEFAULT_BAR_LNG)
                step = min(30 + random.uniform(-10, 10), dist)
                dlat = DEFAULT_BAR_LAT - p["lat"]
                dlng = DEFAULT_BAR_LNG - p["lng"]
                norm = math.sqrt(dlat ** 2 + dlng ** 2) or 1
                scale = step / 111_000
                p["lat"] += dlat / norm * scale + random.uniform(-0.0002, 0.0002)
                p["lng"] += dlng / norm * scale + random.uniform(-0.0002, 0.0002)

                tasks.append(client.post("/api/v1/locations/update", json={
                    "player_token": p["token"],
                    "lat": p["lat"],
                    "lng": p["lng"],
                    "accuracy_m": random.uniform(5, 20),
                }))

            await asyncio.gather(*tasks, return_exceptions=True)

            # Check closest player
            dists = [haversine_m(p["lat"], p["lng"], DEFAULT_BAR_LAT, DEFAULT_BAR_LNG) for p in players]
            closest = min(dists)
            closest_idx = dists.index(closest)

            if tick % 5 == 0 or closest < 50:
                print(f"  [{elapsed:.0f}s] tick {tick} — closest: {closest:.0f}m (Player{closest_idx + 1})")

            # Auto-find when within 50m
            if closest < 50 and not found:
                finder = players[closest_idx]
                find_resp = await client.post(f"/api/v1/chickens/found", json={
                    "game_id": game_id,
                    "player_token": finder["token"],
                })
                found = True
                print(f"\n  🏆 Player{closest_idx + 1} found the chicken! ({closest:.0f}m from bar)")

            await asyncio.sleep(2 if fast else 5)

        # 6. End game
        if host_token:
            await client.post(f"/api/v1/games/{code}/end", json={"player_token": host_token})

        print(f"\n  ✅ Simulation complete — {tick} ticks, {time.time() - start:.0f}s")
        print(f"  Results: {api}/api/v1/games/{code}/state")


def main() -> None:
    parser = argparse.ArgumentParser(description="Simulate a Le Poulet game")
    parser.add_argument("--players", type=int, default=8, help="Number of fake players (default: 8)")
    parser.add_argument("--duration", type=int, default=60, help="Simulation duration in seconds (default: 60)")
    parser.add_argument("--api", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--fast", action="store_true", help="Fast mode: short head start, quick ticks")
    args = parser.parse_args()

    asyncio.run(simulate(args.players, args.duration, args.api, args.fast))


if __name__ == "__main__":
    main()
