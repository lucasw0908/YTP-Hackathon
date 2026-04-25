import logging
import os
from typing import Optional, override

from fastapi import Request, HTTPException
from google.auth.transport import requests
from google_auth_oauthlib.flow import Flow
from google.auth.exceptions import GoogleAuthError
from google.oauth2 import id_token
from oauthlib.oauth2.rfc6749.errors import OAuth2Error
from sqlalchemy.ext.asyncio import AsyncSession
from zenora import APIClient, APIError

from ..config import Settings
from ..models.users import Users, get_user


log = logging.getLogger(__name__)


class OAuthManager(object):
    @override
    def __init__(self, settings: Settings): ...

    @override
    async def auth(self, request: Request, session: AsyncSession) -> Optional[Users]: ...


class DiscordOAuthManager(OAuthManager):
    def __init__(self, settings: Settings):
        self.discord_client = APIClient(
            settings.oauth.DISCORD_TOKEN, 
            client_secret=settings.oauth.DISCORD_CLIENT_SECRET, 
            validate_token=False
        )
        self.redirect_uri = settings.oauth.REDIRECT_URI + "oauth/discord/callback"
    
    async def auth(self, request: Request, session: AsyncSession) -> Optional[Users]:
        log.debug(request.items())
        if "code" not in request.query_params.keys():
            log.warning("No code provided in request arguments")
            return None
        
        code = request.query_params["code"]
        
        try: 
            access_token = self.discord_client.oauth.get_access_token(code, self.redirect_uri).access_token
            
        except APIError as e: 
            log.warning(f"Failed to get access token: {e}")
            return None
        
        bearer_client = APIClient(access_token, bearer=True)
        current_user = bearer_client.users.get_current_user()
        
        try:
            user = await get_user(session, discord_id=current_user.id)
            
        except HTTPException:
            user = Users(
                discord_id = current_user.id,
                username = current_user.username,
                email = current_user.email,
                avatar_url = current_user.avatar_url,
                locale = current_user.locale
            )
        
        return user
    
    
class GoogleOAuthManager(OAuthManager):
    def __init__(self, settings: Settings):
        self.google_client_id = settings.oauth.GOOGLE_CLIENT_ID
        self.google_flow = Flow.from_client_config(
            settings.oauth.GOOGLE_CONFIG,
            scopes=settings.oauth.GOOGLE_SCOPES,
            redirect_uri=settings.oauth.REDIRECT_URI + "oauth/google/callback"
        )
        self.redirect_uri = settings.oauth.REDIRECT_URI
        
    async def auth(self, request: Request, session: AsyncSession) -> Optional[Users]:
        if not self.redirect_uri.startswith("https"):
            log.warning("Insecure transport for OAuth2, only for development use.")
            os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
        
        try:
            self.google_flow.fetch_token(authorization_response=request.url)
            credentials = self.google_flow.credentials
            
        except OAuth2Error as e:
            log.warning(f"Failed to fetch token: {e}")
            return None
        
        try:
            idinfo = id_token.verify_oauth2_token(
                credentials._id_token,
                requests.Request(),
                self.google_client_id
            )
            
        except (GoogleAuthError, ValueError) as e:
            log.warning(f"Failed to verify ID token: {e}")
            return None
        
        if idinfo is None:
            log.warning("ID info is None")
            return None
        
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            log.warning(f"Wrong issuer: {idinfo['iss']}")
            return None
        
        try:
            user = await get_user(session, google_id=idinfo["sub"])
            
        except HTTPException:
            user = Users(
                google_id = idinfo["sub"],
                username = idinfo["name"],
                email = idinfo["email"],
                avatar_url = idinfo["picture"],
                locale = idinfo["locale"]
            )
        
        return user