import os
from functools import lru_cache
from typing import Annotated, Literal

from dotenv import load_dotenv
from pydantic import BaseModel, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict, JsonConfigSettingsSource
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
    NAME: str = "YTP Hackathon Project"
    VERSION: str = "0.1.0"


class ServerSettings(BaseModel):
    HOST: str = "localhost"
    PORT: int = 8080
    DEBUG: bool = False


class DatabaseSettings(BaseModel):
    POSTGRES_DB: str = EnvManager.get("POSTGRES_DB")
    POSTGRES_USER: str = EnvManager.get("POSTGRES_USER")
    POSTGRES_PASSWORD: str = EnvManager.get("POSTGRES_PASSWORD")
    SQLITE_URL: str = "sqlite:///" + os.path.join(BASEDIR, "db.sqlite3")
    MODE: Literal["sqlalchemy", "sqlite"] = "sqlalchemy"
    ECHO: bool = False
    POOL_SIZE: int = 5
    POOL_RECYCLE: int = 3600
    
    @computed_field
    @property
    def URL(self) -> str:
        if self.MODE == "sqlalchemy":
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@db:5432/{self.POSTGRES_DB}"
        if self.MODE == "sqlite":
            return self.SQLITE_URL
        raise Exception("Incorrect URL mode.")


class SecuritySettings(BaseModel):
    SECRET_KEY: str = EnvManager.get("SECRET_KEY")
    CSRF_PROTECTION: bool = True


class LoggingSettings(BaseModel):
    LEVEL: str = "INFO"
    FORMAT: str = "[{asctime}] {levelname} {name}: {message}"
    FILENAME: str = "app.log"
    MAX_BYTES: int = 10 * 1024 * 1024  # 10 MB
    BACKUP_COUNT: int = 5
    

class OAuthSettings(BaseModel):
    REDIRECT_URI: str = EnvManager.get("REDIRECT_URI")
    
    # Discord OAuth configuration
    DISCORD_CLIENT_ID: str = EnvManager.get("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET: str = EnvManager.get("DISCORD_CLIENT_SECRET")
    DISCORD_TOKEN: str = EnvManager.get("DISCORD_TOKEN")
    
    @computed_field
    @property
    def DISCORD_OAUTH_URL(self) -> str:
        redirect_uri = f"{self.REDIRECT_URI.rstrip('/')}/oauth/discord/callback"
        return f"https://discord.com/oauth2/authorize?client_id={self.DISCORD_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=identify+email"
    
    # Google OAuth configuration
    GOOGLE_CLIENT_ID: str = EnvManager.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = EnvManager.get("GOOGLE_CLIENT_SECRET")
    GOOGLE_SCOPES: list[str] = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
    
    @computed_field
    @property
    def GOOGLE_CONFIG(self) -> dict:
        return {
            "web": {
                "client_id": self.GOOGLE_CLIENT_ID,
                "client_secret": self.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [f"{self.REDIRECT_URI.rstrip('/')}/oauth/google/callback"],
                "scopes": self.GOOGLE_SCOPES,
                "project_id": "YTP-Hackathon",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            }
        }


class SMTPSettings(BaseModel):
    USERNAME: str = EnvManager.get("SMTP_USERNAME")
    PASSWORD: str = EnvManager.get("SMTP_PASSWORD")
    SERVER: str = "smtp.example.com"
    PORT: int = 587
    DEFAULT_SENDER: str = "me"


class DefaultSettings(BaseModel):
    SUPPORTED_LANGUAGES: list[str] = ["en", "zh-TW"]
    THEME: Literal["light", "dark"] = "light"
    DATETIME_FORMAT: str = "%Y-%m-%d %H:%M:%S"
    LOCALE: str = "en"
    
    
class APISettings(BaseModel):
    TAVILY_APIKEY: str = EnvManager.get("TAVILY_APIKEY")
    GEMINI_APIKEY: str = EnvManager.get("GEMINI_APIKEY")


class SocialLinks(BaseModel):
    GITHUB: str = "/"
    DISCORD: str = "/"
    TWITTER: str = "/"
    FACEBOOK: str = "/"
    INSTAGRAM: str = "/"


class Settings(BaseSettings):
    BASEDIR: str = BASEDIR
    project: ProjectSettings = ProjectSettings()
    server: ServerSettings = ServerSettings()
    database: DatabaseSettings = DatabaseSettings()
    security: SecuritySettings = SecuritySettings()
    logging: LoggingSettings = LoggingSettings()
    oauth: OAuthSettings = OAuthSettings()
    smtp: SMTPSettings = SMTPSettings()
    defaults: DefaultSettings = DefaultSettings()
    api: APISettings = APISettings()
    social_links: SocialLinks = SocialLinks()
    
    model_config = SettingsConfigDict(
        json_file=os.path.join(BASEDIR, "local_settings.json"),
        json_file_encoding="utf-8",
    )
    
    @classmethod
    def settings_customise_sources(
        cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings
    ):
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            JsonConfigSettingsSource(settings_cls),
            file_secret_settings,
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

SettingsDep = Annotated[Settings, Depends(get_settings)]
