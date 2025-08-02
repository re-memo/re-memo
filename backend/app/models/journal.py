"""
Journal entry models and database operations.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import relationship
from app.models.database import Base
from datetime import datetime
from typing import List, Optional
import enum


class EntryStatus(enum.Enum):
    """Status of a journal entry."""
    DRAFT = "draft"
    COMPLETE = "complete"


class JournalEntry(Base):
    """Journal entry model."""
    
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(EntryStatus), default=EntryStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with user facts
    facts = relationship("UserFact", back_populates="entry", cascade="all, delete-orphan", lazy="selectin")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "status": self.status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "facts_count": len(self.facts) if self.facts else 0
        }
    
    @classmethod
    async def get_all(cls, session: AsyncSession, page: int = 1, limit: int = 20) -> List["JournalEntry"]:
        """Get all journal entries with pagination."""
        offset = (page - 1) * limit
        result = await session.execute(
            select(cls)
            .order_by(cls.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
    
    @classmethod
    async def count_all(cls, session: AsyncSession) -> int:
        """Count total number of journal entries."""
        result = await session.execute(select(func.count(cls.id)))
        return result.scalar()
    
    @classmethod
    async def count_search(cls, session: AsyncSession, query: str) -> int:
        """Count search results for pagination."""
        search_term = f"%{query}%"
        result = await session.execute(
            select(func.count(cls.id))
            .where(
                cls.title.ilike(search_term) | 
                cls.content.ilike(search_term)
            )
        )
        return result.scalar()
    
    @classmethod
    async def get_by_id(cls, session: AsyncSession, entry_id: int) -> Optional["JournalEntry"]:
        """Get a journal entry by ID."""
        result = await session.execute(select(cls).where(cls.id == entry_id))
        return result.scalars().first()
    
    @classmethod
    async def create(cls, session: AsyncSession, title: str, content: str) -> "JournalEntry":
        """Create a new journal entry."""
        entry = cls(title=title, content=content)
        session.add(entry)
        await session.flush()  # Flush to get the ID
        await session.refresh(entry)
        return entry
    
    async def update(self, session: AsyncSession, **kwargs) -> None:
        """Update journal entry fields."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
        await session.flush()
    
    async def delete(self, session: AsyncSession) -> None:
        """Delete journal entry."""
        await session.delete(self)
    
    async def mark_complete(self, session: AsyncSession) -> None:
        """Mark entry as complete and trigger AI processing."""
        self.status = EntryStatus.COMPLETE
        self.updated_at = datetime.utcnow()
        await session.flush()
    
    @classmethod
    async def search(cls, session: AsyncSession, query: str, page: int = 1, limit: int = 20) -> List["JournalEntry"]:
        """Search journal entries by content or title with pagination."""
        search_term = f"%{query}%"
        offset = (page - 1) * limit
        result = await session.execute(
            select(cls)
            .where(
                cls.title.ilike(search_term) | 
                cls.content.ilike(search_term)
            )
            .order_by(cls.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
    
    @classmethod
    async def get_recent_completed(cls, session: AsyncSession, limit: int = 10) -> List["JournalEntry"]:
        """Get recently completed entries for AI processing."""
        result = await session.execute(
            select(cls)
            .where(cls.status == EntryStatus.COMPLETE)
            .order_by(cls.updated_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
