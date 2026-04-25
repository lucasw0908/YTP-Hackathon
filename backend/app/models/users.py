import logging
from typing import Optional, Any

from fastapi import HTTPException
from sqlalchemy import String, Boolean, select
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession

from . import Base, SessionDep
from .mixin import TimeStampMixin
from ..config import get_settings


log = logging.getLogger(__name__)
settings = get_settings()


class Users(Base, TimeStampMixin):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str] = mapped_column(String(64), nullable=False)

    locale: Mapped[str] = mapped_column(String(8), nullable=False, default=settings.defaults.LOCALE)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    
    # Verification fields
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Discord fields
    discord_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)

    # Google fields
    google_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    
    
    def __init__(self, username: str, email: str,
                 locale: Optional[str]=None, avatar_url: Optional[str]=None,
                 discord_id: Optional[str]=None, google_id: Optional[str]=None
                 ):

        self.username = username
        self.email = email
        
        self.locale = locale or self.locale
        self.avatar_url = avatar_url or self.avatar_url
        
        # Discord fields
        self.discord_id = discord_id
        
        # Google fields
        self.google_id = google_id
        
    
    def __repr__(self):
        return f"<User '{self.username}' (id={self.id})>"
    
    
    async def update(self, data: dict[str, Any], session: SessionDep) -> None:
        """
        Update the user with the provided data.
        
        Parameters
        ----------
        data : dict
            The data to update the user with.
        """
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        session.commit()


async def get_user(db_session: AsyncSession, google_id: Optional[str]=None, discord_id: Optional[str]=None) -> Users:
    if google_id is not None:
        user = (await db_session.scalars(select(Users).where(Users.google_id == google_id))).first()
    if discord_id is not None:
        user = (await db_session.scalars(select(Users).where(Users.discord_id == discord_id))).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
