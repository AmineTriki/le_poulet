from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.schemas.challenge import SubmissionCreate, ScoreSubmissionRequest
from app.models.challenge import ChallengeSubmission
from app.services.challenge_engine import get_random_challenge, score_submission
from sqlmodel import select

router = APIRouter()


@router.get("/random/{game_id}/{team_id}")
async def get_challenge(
    game_id: str,
    team_id: str,
    city: str = "montreal",
    session: AsyncSession = Depends(get_session),
) -> dict:
    challenge = await get_random_challenge(session, game_id, team_id, city)
    if not challenge:
        raise HTTPException(status_code=404, detail="No more challenges available")
    return {
        "id": challenge.id,
        "title_en": challenge.title_en, "title_fr": challenge.title_fr,
        "desc_en": challenge.desc_en, "desc_fr": challenge.desc_fr,
        "points": challenge.points, "media_type": challenge.media_type,
        "time_limit_sec": challenge.time_limit_sec,
        "category": challenge.category, "difficulty": challenge.difficulty,
        "min_players": challenge.min_players,
    }


@router.post("/submit")
async def submit_challenge(data: SubmissionCreate, session: AsyncSession = Depends(get_session)) -> dict:
    from app.models.player import Player
    player_result = await session.exec(select(Player).where(Player.token == data.player_token))
    player = player_result.first()
    if not player:
        raise HTTPException(status_code=401, detail="Invalid player token")

    submission = ChallengeSubmission(
        game_id=data.game_id,
        challenge_id=data.challenge_id,
        team_id=data.team_id,
        player_id=player.id,
        media_url=data.media_url,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return {"submission_id": submission.id, "status": submission.status}


@router.post("/{submission_id}/score")
async def score_challenge(
    submission_id: str,
    req: ScoreSubmissionRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    submission = await score_submission(session, submission_id, req.score, req.approved)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"status": submission.status, "points_awarded": submission.points_awarded}


@router.get("/submissions/{game_id}/pending")
async def list_pending_submissions(
    game_id: str,
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    from app.models.challenge import SubmissionStatus
    result = await session.exec(
        select(ChallengeSubmission).where(
            ChallengeSubmission.game_id == game_id,
            ChallengeSubmission.status == SubmissionStatus.PENDING,
        )
    )
    return [
        {
            "id": s.id,
            "challenge_id": s.challenge_id,
            "team_id": s.team_id,
            "player_id": s.player_id,
            "media_url": s.media_url,
            "submitted_at": str(s.submitted_at),
        }
        for s in result.all()
    ]
