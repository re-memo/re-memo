"""
Database setup and connection management.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from app.config.settings import settings
import logging

# Base class for all models
Base = declarative_base()

# Global engine and session maker
engine = None
async_session_maker = None

logger = logging.getLogger(__name__)


def init_db(app):
    """Initialize database connection."""
    global engine, async_session_maker
    
    database_url = settings.database_url
    
    engine = create_async_engine(
        database_url,
        echo=app.config.get('DEBUG', False),
        pool_size=10,
        max_overflow=20
    )
    
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    logger.info("Database initialized successfully")


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
