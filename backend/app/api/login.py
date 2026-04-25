import logging
from fastapi import APIRouter, Request, HTTPException
import jwt

from ..config import SettingsDep
from ..models import SessionDep
from ..utils.oauth import DiscordOAuthManager, GoogleOAuthManager


log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/user",
    tags=["user"]
)


@router.get("/oauth/google/login")
async def google_login(settings: SettingsDep):
    flow = GoogleOAuthManager(settings).google_flow

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent"
    )
    return {"url": auth_url}


@router.get("/oauth/google/callback")
async def google_callback(
    request: Request,
    settings: SettingsDep,
    session: SessionDep
):
    manager = GoogleOAuthManager(settings)
    user = await manager.auth(request, session)

    if user is None:
        raise HTTPException(status_code=400, detail="Google OAuth failed")

    token = jwt.encode(
        {"sub": str(user.id)},
        settings.security.SECRET_KEY,
        algorithm="HS256"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/oauth/discord/login")
async def discord_login(settings: SettingsDep):
    return {"url": settings.oauth.DISCORD_OAUTH_URL}


@router.get("/oauth/discord/callback")
async def discord_callback(
    request: Request,
    settings: SettingsDep,
    session: SessionDep
):
    manager = DiscordOAuthManager(settings)
    user = await manager.auth(request, session)

    if user is None:
        raise HTTPException(status_code=400, detail="Discord OAuth failed")

    token = jwt.encode(
        {"sub": str(user.id)},
        settings.security.SECRET_KEY,
        algorithm="HS256"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }