"""
Embedding cache and vector operations.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, LargeBinary
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pgvector.sqlalchemy import Vector
from app.models.database import Base
from app.config.settings import Settings
from datetime import datetime, timedelta
from typing import List, Optional
import pickle
import hashlib

# Get settings instance
settings = Settings()


class EmbeddingCache(Base):
    """Cache for embedding computations to avoid redundant API calls."""
    
    __tablename__ = "embedding_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    text_hash = Column(String(64), unique=True, index=True, nullable=False)
    text_preview = Column(String(200), nullable=False)  # First 200 chars for debugging
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    model_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    accessed_at = Column(DateTime, default=datetime.utcnow)
    access_count = Column(Integer, default=1)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "text_hash": self.text_hash,
            "text_preview": self.text_preview,
            "model_name": self.model_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "accessed_at": self.accessed_at.isoformat() if self.accessed_at else None,
            "access_count": self.access_count,
            "embedding_size": len(self.embedding) if self.embedding else 0
        }
    
    @staticmethod
    def _hash_text(text: str) -> str:
        """Generate a hash for the input text."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    @classmethod
    async def get_embedding(
        cls, 
        session: AsyncSession, 
        text: str, 
        model_name: str
    ) -> Optional[List[float]]:
        """Get cached embedding for text and model."""
        text_hash = cls._hash_text(text)
        
        result = await session.execute(
            select(cls).where(
                cls.text_hash == text_hash,
                cls.model_name == model_name
            )
        )
        cache_entry = result.scalars().first()
        
        if cache_entry:
            # Update access statistics
            cache_entry.accessed_at = datetime.utcnow()
            cache_entry.access_count += 1
            await session.flush()
            return cache_entry.embedding
        
        return None
    
    @classmethod
    async def store_embedding(
        cls,
        session: AsyncSession,
        text: str,
        embedding: List[float],
        model_name: str
    ) -> "EmbeddingCache":
        """Store embedding in cache."""
        text_hash = cls._hash_text(text)
        text_preview = text[:200] if len(text) > 200 else text
        
        # Check if already exists
        existing = await cls.get_embedding(session, text, model_name)
        if existing:
            return None  # Already cached
        
        cache_entry = cls(
            text_hash=text_hash,
            text_preview=text_preview,
            embedding=embedding,
            model_name=model_name
        )
        
        session.add(cache_entry)
        await session.flush()
        return cache_entry
    
    @classmethod
    async def cleanup_old_entries(
        cls, 
        session: AsyncSession, 
        days_old: int = 30,
        min_access_count: int = 2
    ) -> int:
        """Clean up old, rarely accessed cache entries."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Delete entries older than cutoff with low access count
        result = await session.execute(
            select(cls).where(
                cls.created_at < cutoff_date,
                cls.access_count < min_access_count
            )
        )
        old_entries = result.scalars().all()
        
        count = 0
        for entry in old_entries:
            await session.delete(entry)
            count += 1
        
        return count
    
    @classmethod
    async def get_cache_stats(cls, session: AsyncSession) -> dict:
        """Get cache statistics."""
        result = await session.execute(select(cls))
        all_entries = result.scalars().all()
        
        if not all_entries:
            return {
                "total_entries": 0,
                "total_access_count": 0,
                "unique_models": 0,
                "oldest_entry": None,
                "newest_entry": None
            }
        
        total_access = sum(entry.access_count for entry in all_entries)
        unique_models = len(set(entry.model_name for entry in all_entries))
        oldest = min(entry.created_at for entry in all_entries)
        newest = max(entry.created_at for entry in all_entries)
        
        return {
            "total_entries": len(all_entries),
            "total_access_count": total_access,
            "unique_models": unique_models,
            "oldest_entry": oldest.isoformat(),
            "newest_entry": newest.isoformat()
        }
    
    @classmethod
    async def search_by_text_preview(
        cls, 
        session: AsyncSession, 
        search_term: str, 
        limit: int = 20
    ) -> List["EmbeddingCache"]:
        """Search cache entries by text preview."""
        result = await session.execute(
            select(cls)
            .where(cls.text_preview.ilike(f"%{search_term}%"))
            .order_by(cls.accessed_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
