from datetime import datetime, timedelta
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.game import Game, GameStatus
from app.models.player import Player, PlayerRole
from app.models.team import Team
from app.schemas.game import GameCreate
from app.utils.codes import generate_game_code
from app.services.team_builder import build_teams
from app.services.chicken_picker import pick_chickens


async def create_game(session: AsyncSession, data: GameCreate, host_name: str) -> tuple[Game, Player]:
    code = await generate_game_code(session)
    game = Game(code=code, **data.model_dump())
    session.add(game)
    await session.flush()

    host = Player(
        game_id=game.id,
        name=host_name,
        emoji="👑",
        role=PlayerRole.HOST,
    )
    session.add(host)
    game.host_player_id = host.id
    await session.commit()
    await session.refresh(game)
    return game, host


async def start_game(
    session: AsyncSession,
    game: Game,
) -> Game:
    now = datetime.utcnow()
    game.status = GameStatus.HEAD_START
    game.head_start_ends_at = now + timedelta(minutes=game.head_start_minutes)
    game.game_ends_at = now + timedelta(
        minutes=game.head_start_minutes,
        hours=game.game_duration_hours,
    )

    players = (await session.exec(select(Player).where(Player.game_id == game.id))).all()
    chickens = await pick_chickens(list(players), game.num_chickens)
    for c in chickens:
        c.role = PlayerRole.CHICKEN
        session.add(c)

    hunters = [p for p in players if p not in chickens]
    teams = await build_teams(hunters, game.team_size, game.language)
    for team in teams:
        team.game_id = game.id
        session.add(team)
        await session.flush()
        for p in team.players:
            p.team_id = team.id
            session.add(p)

    await session.commit()
    await session.refresh(game)
    return game


async def end_game(session: AsyncSession, game: Game) -> Game:
    game.status = GameStatus.ENDED
    game.ended_at = datetime.utcnow()
    session.add(game)
    await session.commit()
    await session.refresh(game)
    return game
