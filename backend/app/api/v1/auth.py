import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse, UpdateProfileRequest, UserResponse
from app.services.google_oauth import verify_google_token

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _issue_tokens(response: Response, user_id: str) -> TokenResponse:
    from app.config import settings

    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    response.set_cookie(
        REFRESH_COOKIE,
        refresh,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
    )
    return TokenResponse(access_token=access)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=body.email, name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    return _issue_tokens(response, str(user.id))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _issue_tokens(response, str(user.id))


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    google_user = await verify_google_token(body.id_token)
    if not google_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    result = await db.execute(select(User).where(User.google_id == google_user["sub"]))
    user = result.scalar_one_or_none()

    if not user:
        email_result = await db.execute(select(User).where(User.email == google_user["email"]))
        user = email_result.scalar_one_or_none()
        if user:
            user.google_id = google_user["sub"]
            user.avatar_url = user.avatar_url or google_user.get("picture")
        else:
            user = User(
                email=google_user["email"],
                name=google_user.get("name", ""),
                google_id=google_user["sub"],
                avatar_url=google_user.get("picture"),
            )
            db.add(user)
        await db.flush()

    return _issue_tokens(response, str(user.id))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    from jose import JWTError

    try:
        user_id = decode_token(token, "refresh")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id), User.is_active == True)  # noqa: E712
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _issue_tokens(response, user_id)


@router.post("/logout")
async def logout(response: Response, _: User = Depends(get_current_user)):
    response.delete_cookie(REFRESH_COOKIE)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name is not None:
        current_user.name = body.name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    await db.flush()
    return current_user
