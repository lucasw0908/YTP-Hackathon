import os
from functools import lru_cache
from dotenv import load_dotenv
from typing import Annotated, Literal

from pydantic import BaseModel, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from fastapi import Depends


__all__ = [
    "Settings",
    "get_settings",
    "SettingsDep",
]

BASEDIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASEDIR, ".env"))

class EnvManager:
    registry = []

    @classmethod
    def get(cls, key: str, default=...):
        cls.registry.append(key)
        v = os.getenv(key)

        if v is None:
            if default is ...:
                raise RuntimeError(f"Missing env: {key}")
            return default

        return v

    @classmethod
    def generate_env_example(cls) -> str:
        template = "\n".join(f"{key}=" for key in cls.registry)
        return template


class ProjectSettings(BaseModel):
    name: str = "YTP Hackathon Project"
    version: str = "0.1.0"


class ServerSettings(BaseModel):
    host: str = "localhost"
    port: int = 8080
    debug: bool = False


class DatabaseSettings(BaseModel):
    sqlalchemy_url: str = EnvManager.get("SQLALCHEMY_URL")
    sqlite_url: str = "sqlite:///" + os.path.join(BASEDIR, "db.sqlite3")
    mode: Literal["sqlalchemy", "sqlite"] = "sqlalchemy"
    echo: bool = False
    pool_size: int = 5
    pool_recycle: int = 3600
    
    @computed_field
    @property
    def url(self) -> str:
        return self.sqlalchemy_url if self.mode == "sqlalchemy" else self.sqlite_url


class SecuritySettings(BaseModel):
    secret_key: str = EnvManager.get("SECRET_KEY")
    csrf_protection: bool = True


class LoggingSettings(BaseModel):
    level: str = "INFO"
    format: str = "[{asctime}] {levelname} {name}: {message}"
    filename: str = "app.log"
    max_bytes: int = 10 * 1024 * 1024  # 10 MB
    backup_count: int = 5
    

class OAuthSettings(BaseModel):
    redirect_uri: str = EnvManager.get("REDIRECT_URI")
    
    # Discord OAuth configuration
    discord_client_id: str = EnvManager.get("DISCORD_CLIENT_ID")
    discord_client_secret: str = EnvManager.get("DISCORD_CLIENT_SECRET")
    discord_token: str = EnvManager.get("DISCORD_TOKEN")
    
    @computed_field
    @property
    def discord_oauth_url(self) -> str:
        return f"https://discord.com/oauth2/authorize?client_id={self.discord_client_id}&redirect_uri={self.redirect_uri}&response_type=code&scope=identify+email"
    
    # Google OAuth configuration
    google_client_id: str = EnvManager.get("GOOGLE_CLIENT_ID")
    google_client_secret: str = EnvManager.get("GOOGLE_CLIENT_SECRET")
    google_scopes: list[str] = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
    
    @computed_field
    @property
    def google_config(self) -> dict:
        return {
            "web": {
                "client_id": self.google_client_id,
                "client_secret": self.google_client_secret,
                "redirect_uris": [self.redirect_uri],
                "scopes": self.google_scopes,
                "project_id": "Vocabulary Website Project",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            }
        }


class SMTPSettings(BaseModel):
    username: str = EnvManager.get("SMTP_USERNAME")
    password: str = EnvManager.get("SMTP_PASSWORD")
    server: str = "smtp.example.com"
    port: int = 587
    default_sender: str = "me"


class DefaultSettings(BaseModel):
    supported_languages: list[str] = ["en", "zh-TW"]
    theme: Literal["light", "dark"] = "light"
    datetime_format: str = "%Y-%m-%d %H:%M:%S"
    locale: str = "en"


class SocialLinks(BaseModel):
    github: str = "/"
    discord: str = "/"
    twitter: str = "/"
    facebook: str = "/"
    instagram: str = "/"


class Settings(BaseSettings):
    basedir: str = BASEDIR
    project: ProjectSettings = ProjectSettings()
    server: ServerSettings = ServerSettings()
    database: DatabaseSettings = DatabaseSettings()
    security: SecuritySettings = SecuritySettings()
    logging: LoggingSettings = LoggingSettings()
    smtp: SMTPSettings = SMTPSettings()
    defaults: DefaultSettings = DefaultSettings()
    social_links: SocialLinks = SocialLinks()
    
    # TODO: fix this.
    model_config = SettingsConfigDict(
        json_file=os.path.join(BASEDIR, "local_settings.json"),
        json_file_encoding="utf-8",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

SettingsDep = Annotated[Settings, Depends(get_settings)]
