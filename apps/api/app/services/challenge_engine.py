import json
import random
from pathlib import Path
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.challenge import Challenge, ChallengeSubmission, SubmissionStatus
from app.models.team import Team

DATA_DIR = Path(__file__).parent.parent.parent / "data"


async def load_challenges_from_json(session: AsyncSession, language: str = "en") -> None:
    path = DATA_DIR / f"challenges_{language}.json"
    challenges_data: list[dict[str, Any]] = json.loads(path.read_text())
    for c in challenges_data:
        existing = await session.get(Challenge, c["id"])
        if not existing:
            challenge = Challenge(**c)
            session.add(challenge)
    await session.commit()


async def get_random_challenge(
    session: AsyncSession,
    game_id: str,
    team_id: str,
    city: str,
) -> Challenge | None:
    used_ids_result = await session.exec(
        select(ChallengeSubmission.challenge_id).where(
            ChallengeSubmission.game_id == game_id,
            ChallengeSubmission.team_id == team_id,
        )
    )
    used_ids = set(used_ids_result.all())

    result = await session.exec(
        select(Challenge).where(Challenge.is_active == True)  # noqa: E712
    )
    available = [c for c in result.all() if c.id not in used_ids]

    if not available:
        return None

    weights = [c.points for c in available]
    return random.choices(available, weights=weights, k=1)[0]


async def score_submission(
    session: AsyncSession,
    submission_id: str,
    chicken_score: int,
    approved: bool,
) -> ChallengeSubmission | None:
    submission = await session.get(ChallengeSubmission, submission_id)
    if not submission:
        return None

    submission.status = SubmissionStatus.APPROVED if approved else SubmissionStatus.REJECTED
    submission.chicken_score = chicken_score

    if approved:
        challenge = await session.get(Challenge, submission.challenge_id)
        if challenge:
            points = int(challenge.points * (chicken_score / 100))
            submission.points_awarded = points
            team = await session.get(Team, submission.team_id)
            if team:
                team.score += points
                session.add(team)

    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return submission
