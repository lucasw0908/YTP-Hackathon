import logging
from datetime import datetime
from typing import Optional

from pwdlib import PasswordHash
from sqlalchemy import String, Boolean, DateTime, PickleType
from sqlalchemy.orm import Mapped, mapped_column

from . import Base, session
from ..config import get_settings


log = logging.getLogger(__name__)
settings = get_settings()
password_hasher = PasswordHash.recommended()


class Users(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(String(32), nullable=False)
    password: Mapped[str] = mapped_column(String(64), nullable=True)
    email: Mapped[str] = mapped_column(String(64), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    bio: Mapped[Optional[str]] = mapped_column(String(75), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, onupdate=datetime.now, default=datetime.now, nullable=False)

    locale: Mapped[str] = mapped_column(String(8), nullable=False, default=settings.defaults.locale)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    logins: Mapped[list] = mapped_column(PickleType, nullable=False, default=list)
    
    # Verification fields
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Discord fields
    discord_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)

    # Google fields
    google_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    
    
    def __init__(self, username: str, password: Optional[str], email: str, is_admin: bool=False,
                 unlimited_access: bool=False, locale: Optional[str]=None, avatar_url: Optional[str]=None,
                 discord_id: Optional[str]=None, google_id: Optional[str]=None
                 ):

        self.username = username
        self.password = password_hasher.hash(password) if password else None
        self.email = email
        self.is_admin = is_admin
        self.unlimited_access = unlimited_access
        
        self.locale = locale or self.locale
        self.avatar_url = avatar_url or self.avatar_url
        
        # Discord fields
        self.discord_id = discord_id
        
        # Google fields
        self.google_id = google_id
        
    
    def __repr__(self):
        return f"<{'Admin' if self.is_admin else 'User'} {self.username} (id={self.id})>"
    
    
    def set_password(self, password: str) -> None:
        """
        Set a new password for the user.
        
        Parameters
        ----------
        password : str
            The new password to set.
        """
        self.password = password_hasher.hash(password)
        session.commit()
    
    
    def check_password(self, hashed_password: str) -> bool:
        """
        Check if the provided password matches the stored password.
        
        Parameters
        ----------
        hashed_password : str
            The password to check.
        
        Returns
        -------
        bool
            True if the password matches, False otherwise.
        """
        return password_hasher.verify(self.password, hashed_password)
    
    
    # def update_login_info(self) -> None:

    #     if not self.logins:
    #         self.logins = []
            
    #     self.logins.append({
    #         "ip": request.remote_addr,
    #         "time": datetime.now().strftime(DATETIME_FORMAT),
    #     })
    
    
    def update(self, data: dict) -> None:
        """
        Update the user with the provided data.
        
        Parameters
        ----------
        data : dict
            The data to update the user with.
        """
        for key, value in data.items():
            if hasattr(self, key):
                if key == "password":
                    setattr(self, key, password_hasher.hash(value))
                else:
                    setattr(self, key, value)
        
        session.commit()
