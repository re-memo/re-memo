#!/usr/bin/env python3
"""
Database migration and startup script for re:memo backend.
"""

import asyncio
import logging
from app.config.settings import settings
from app.models.database import Base, init_db
from app.models import journal, chat, facts, embeddings
from sqlalchemy.ext.asyncio import create_async_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_tables():
    """Create all database tables."""
    try:
        # Create async engine
        engine = create_async_engine(settings.database_url)
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("✅ Database tables created successfully")
        
        # Close the engine
        await engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        raise


async def main():
    """Main migration function."""
    logger.info("🚀 Starting database migration...")
    logger.info(f"📊 Database URL: {settings.database_url}")
    
    await create_tables()
    
    logger.info("✅ Database migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
