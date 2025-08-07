#!/usr/bin/env python3
"""
Database migration and startup script for re:memo backend.
Now uses Alembic for proper database versioning.
"""

import asyncio
import logging
import subprocess
import sys
from pathlib import Path
from app.config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_alembic_command(cmd):
    """Run an Alembic command and handle errors."""
    try:
        logger.info(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode != 0:
            logger.error(f"❌ Alembic command failed: {result.stderr}")
            raise Exception(f"Alembic command failed: {result.stderr}")
        
        logger.info(result.stdout)
        return result.stdout
    except Exception as e:
        logger.error(f"❌ Error running Alembic command: {e}")
        raise


async def run_migrations():
    """Run database migrations using Alembic."""
    try:
        logger.info("🔄 Running database migrations with Alembic...")
        
        # Check current revision
        run_alembic_command(["alembic", "current"])
        
        # Run migrations
        run_alembic_command(["alembic", "upgrade", "head"])
        
        logger.info("✅ Database migrations completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Error running migrations: {e}")
        raise


async def main():
    """Main migration function."""
    logger.info("🚀 Starting database migration with Alembic...")
    logger.info(f"📊 Database URL: {settings.database_url}")
    
    await run_migrations()
    
    logger.info("✅ Database migration completed successfully!")
    logger.info("💡 Use 'python alembic_manager.py' for future schema changes")


if __name__ == "__main__":
    asyncio.run(main())
