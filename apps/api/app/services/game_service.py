from datetime import datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.chicken import Chicken
from app.models.game import Game, GameStatus
from app.models.player import Player, PlayerRole
from app.schemas.game import GameCreate
from app.services.chicken_picker import pick_chickens
from app.services.team_builder import build_teams
from app.utils.codes import generate_game_code


class GameStartError(ValueError):
    """Raised when a game cannot be started in its current state."""


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
    await session.flush()
    game.host_player_id = host.id
    session.add(game)
    await session.commit()
    await session.refresh(game)
    return game, host


async def start_game(session: AsyncSession, game: Game) -> Game:
    if game.status != GameStatus.LOBBY:
        raise GameStartError("Game has already started")

    players_result = await session.exec(select(Player).where(Player.game_id == game.id))
    players = list(players_result.all())
    if len(players) <= game.num_chickens:
        raise GameStartError("Not enough players: need more players than chickens")

    now = datetime.utcnow()
    game.status = GameStatus.HEAD_START
    game.head_start_ends_at = now + timedelta(minutes=game.head_start_minutes)
    game.game_ends_at = now + timedelta(
        minutes=game.head_start_minutes,
        hours=game.game_duration_hours,
    )
    session.add(game)
    await session.flush()

    chickens = await pick_chickens(players, game.num_chickens)
    chicken_ids = {p.id for p in chickens}
    for p in players:
        if p.id in chicken_ids:
            p.role = PlayerRole.CHICKEN
            session.add(p)
            session.add(Chicken(game_id=game.id, player_id=p.id))

    hunters = [p for p in players if p.id not in chicken_ids]
    drafts = await build_teams(hunters, game.team_size, game.language)

    for draft in drafts:
        draft.team.game_id = game.id
        session.add(draft.team)
        await session.flush()
        for player in draft.players:
            player.team_id = draft.team.id
            session.add(player)

    await session.commit()
    await session.refresh(game)
    return game


async def get_game_by_code(session: AsyncSession, code: str) -> Game | None:
    result = await session.exec(select(Game).where(Game.code == code.upper()))
    return result.first()


async def viewer_is_chicken(session: AsyncSession, game_id: str, player_token: str | None) -> bool:
    """True when player_token belongs to a chicken of this game (who may see the bar)."""
    if not player_token:
        return False
    result = await session.exec(select(Player).where(Player.token == player_token))
    player = result.first()
    return bool(player and player.game_id == game_id and player.role == PlayerRole.CHICKEN)


async def end_game(session: AsyncSession, game: Game) -> Game:
    game.status = GameStatus.ENDED
    game.ended_at = datetime.utcnow()
    session.add(game)
    await session.commit()
    await session.refresh(game)
    return game
