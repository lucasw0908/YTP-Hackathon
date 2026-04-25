import contextlib
from typing import Annotated, AsyncIterator 

from fastapi import Depends
from sqlalchemy import MetaData, String, Integer, Boolean, Float
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection, AsyncSession, async_sessionmaker

from ..config import get_settings


settings = get_settings()

metadata = MetaData()

class Base(DeclarativeBase):
    __mapper_args__ = {"eager_defaults": True}
    metadata = metadata
    type_annotation_map = {
        str: String(255),
        int: Integer,
        bool: Boolean,
        float: Float
    }

class DatabaseSessionManager:
    """
    Source: https://medium.com/@tclaitken/setting-up-a-fastapi-app-with-async-sqlalchemy-2-0-pydantic-v2-e6c540be4308
    """
    def __init__(self):
        self._engine = create_async_engine(
            url=settings.database.SQLITE_URL if settings.server.DEBUG else settings.database.URL,
            echo=settings.database.ECHO,
            pool_size=settings.database.POOL_SIZE,
            pool_recycle=settings.database.POOL_RECYCLE,
            pool_pre_ping=True
        )
        self._sessionmaker = async_sessionmaker(autocommit=False, bind=self._engine, expire_on_commit=False)

    async def close(self):
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")
        await self._engine.dispose()

        self._engine = None
        self._sessionmaker = None

    @contextlib.asynccontextmanager
    async def connect(self) -> AsyncIterator[AsyncConnection]:
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")

        async with self._engine.begin() as connection:
            try:
                yield connection
            except Exception:
                await connection.rollback()
                raise

    @contextlib.asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        if self._sessionmaker is None:
            raise Exception("DatabaseSessionManager is not initialized")

        session = self._sessionmaker()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


sessionmanager = DatabaseSessionManager()

async def get_db_session():
    async with sessionmanager.session() as session:
        yield session
        
SessionDep = Annotated[AsyncSession, Depends(get_db_session)]

from .users import Users
from .plans import TravelPlan
from .missions import Mission
