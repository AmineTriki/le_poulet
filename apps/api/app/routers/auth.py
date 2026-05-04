from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_session
from app.models.user import User
from app.config import settings

router = APIRouter()

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.secret_key, algorithm=ALGORITHM)


async def get_current_user(token: str, session: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub", "")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _user_response(user: User, token: Optional[str] = None) -> dict:
    d: dict = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "instagram_url": user.instagram_url,
        "vsco_url": user.vsco_url,
        "games_played": user.games_played,
        "chickens_caught": user.chickens_caught,
        "times_chicken": user.times_chicken,
        "created_at": user.created_at.isoformat(),
    }
    if token:
        d["access_token"] = token
    return d


# ── Register ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    username: str
    display_name: str
    password: str


@router.post("/register")
async def register(data: RegisterRequest, session: AsyncSession = Depends(get_session)) -> dict:
    # Check uniqueness
    existing_email = await session.exec(select(User).where(User.email == data.email.lower()))
    if existing_email.first():
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = await session.exec(select(User).where(User.username == data.username.lower()))
    if existing_username.first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email.lower(),
        username=data.username.lower(),
        display_name=data.display_name,
        hashed_password=pwd_ctx.hash(data.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token(user.id)
    return _user_response(user, token)


# ── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(data: LoginRequest, session: AsyncSession = Depends(get_session)) -> dict:
    result = await session.exec(select(User).where(User.email == data.email.lower()))
    user = result.first()
    if not user or not user.hashed_password or not pwd_ctx.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return _user_response(user, token)


# ── Me ───────────────────────────────────────────────────────────────────────

@router.get("/me")
async def me(authorization: str, session: AsyncSession = Depends(get_session)) -> dict:
    token = authorization.removeprefix("Bearer ").strip()
    user = await get_current_user(token, session)
    return _user_response(user)


# ── Profile update ───────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    instagram_url: Optional[str] = None
    vsco_url: Optional[str] = None


@router.patch("/profile")
async def update_profile(
    data: ProfileUpdate,
    authorization: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    token = authorization.removeprefix("Bearer ").strip()
    user = await get_current_user(token, session)
    if data.display_name is not None:
        user.display_name = data.display_name
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.instagram_url is not None:
        user.instagram_url = data.instagram_url
    if data.vsco_url is not None:
        user.vsco_url = data.vsco_url
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return _user_response(user)


# ── Public profile ───────────────────────────────────────────────────────────

@router.get("/profile/{username}")
async def get_profile(username: str, session: AsyncSession = Depends(get_session)) -> dict:
    result = await session.exec(select(User).where(User.username == username.lower()))
    user = result.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)
