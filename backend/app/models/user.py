"""
User model for authentication.
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.database import Base
from datetime import datetime
from typing import Optional
import bcrypt


class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization (without password)."""
        return {
            "id": self.id,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    @classmethod
    async def create(cls, session: AsyncSession, username: str, password: str) -> "User":
        """Create a new user."""
        user = cls(
            username=username,
            password_hash=cls.hash_password(password)
        )
        session.add(user)
        await session.flush()
        await session.refresh(user)
        return user
    
    @classmethod
    async def get_by_id(cls, session: AsyncSession, user_id: int) -> Optional["User"]:
        """Get a user by ID."""
        result = await session.execute(select(cls).where(cls.id == user_id))
        return result.scalars().first()
    
    @classmethod
    async def get_by_username(cls, session: AsyncSession, username: str) -> Optional["User"]:
        """Get a user by username."""
        result = await session.execute(select(cls).where(cls.username == username))
        return result.scalars().first()
    
    @classmethod
    async def authenticate(cls, session: AsyncSession, username: str, password: str) -> Optional["User"]:
        """Authenticate a user with username and password."""
        user = await cls.get_by_username(session, username)
        if user and user.verify_password(password):
            return user
        return None
