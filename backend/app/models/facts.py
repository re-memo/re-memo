"""
User facts and events models.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.models.database import Base
from app.config.settings import Settings
from datetime import datetime
from typing import List, Optional, Tuple
import enum

# Get settings instance
settings = Settings()


class FactType(enum.Enum):
    """Type of fact extracted from journal entries."""
    EVENT = "event"
    FACT = "fact"
    REFLECTION = "reflection"
    GOAL = "goal"
    EMOTION = "emotion"


class UserFact(Base):
    """User facts and events extracted from journal entries."""
    
    __tablename__ = "user_facts"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    topic = Column(String(200), nullable=False, index=True)
    fact_type = Column(Enum(FactType), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    original_snippet = Column(Text, nullable=True)
    
    # Foreign key to journal entry
    entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    
    # Vector embedding for similarity search (pgvector type)
    embedding_vector = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=True)
    
    # Relationships
    entry = relationship("JournalEntry", back_populates="facts", lazy="selectin")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "content": self.content,
            "topic": self.topic,
            "fact_type": self.fact_type.value,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "original_snippet": self.original_snippet,
            "entry_id": self.entry_id
        }
    
    @classmethod
    async def create_bulk(cls, session: AsyncSession, facts_data: List[dict], entry_id: int) -> List["UserFact"]:
        """Create multiple facts for an entry."""
        facts = []
        for fact_data in facts_data:
            fact = cls(
                content=fact_data["content"],
                topic=fact_data["topic"],
                fact_type=FactType(fact_data["fact_type"]),
                original_snippet=fact_data.get("original_snippet"),
                entry_id=entry_id,
                embedding_vector=fact_data.get("embedding_vector")
            )
            facts.append(fact)
            session.add(fact)
        
        await session.flush()
        return facts
    
    @classmethod
    async def get_by_topic(cls, session: AsyncSession, topic: str, limit: int = 20) -> List["UserFact"]:
        """Get facts by topic."""
        result = await session.execute(
            select(cls)
            .where(cls.topic.ilike(f"%{topic}%"))
            .order_by(cls.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    @classmethod
    async def get_recent_topics(cls, session: AsyncSession, limit: int = 10) -> List[dict]:
        """Get recent topics with fact counts."""
        # Get most recent timestamp for each topic, then order by that timestamp
        from sqlalchemy import func
        
        subquery = (
            select(
                cls.topic,
                func.max(cls.timestamp).label('latest_timestamp')
            )
            .group_by(cls.topic)
            .subquery()
        )
        
        result = await session.execute(
            select(subquery.c.topic, subquery.c.latest_timestamp)
            .order_by(subquery.c.latest_timestamp.desc())
            .limit(limit)
        )

        return [
            {"topic": topic, "timestamp": timestamp.isoformat() if timestamp else None}
            for topic, timestamp in result.all()
        ]
    
    @classmethod
    async def search_similar(
        cls, 
        session: AsyncSession, 
        query_embedding: List[float], 
        limit: int = 10
    ) -> List[Tuple["UserFact", float]]:
        """
        Find similar facts using vector similarity.
        Uses pgvector cosine distance for similarity search.
        """
        # Use pgvector's cosine distance operator
        result = await session.execute(
            select(cls, (cls.embedding_vector.cosine_distance(query_embedding)).label('distance'))
            .where(cls.embedding_vector.is_not(None))
            .order_by(cls.embedding_vector.cosine_distance(query_embedding))
            .limit(limit)
        )
        
        return [(fact, distance) for fact, distance in result.all()]
    
    @classmethod
    async def get_by_entry_id(cls, session: AsyncSession, entry_id: int) -> List["UserFact"]:
        """Get all facts for a specific journal entry."""
        result = await session.execute(
            select(cls)
            .where(cls.entry_id == entry_id)
            .order_by(cls.timestamp.desc())
        )
        return result.scalars().all()
    
    @classmethod
    async def get_by_fact_type(cls, session: AsyncSession, fact_type: FactType, limit: int = 20) -> List["UserFact"]:
        """Get facts by type."""
        result = await session.execute(
            select(cls)
            .where(cls.fact_type == fact_type)
            .order_by(cls.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def update_embedding(self, session: AsyncSession, embedding: List[float]) -> None:
        """Update the embedding vector for this fact."""
        self.embedding_vector = embedding
        await session.flush()
    
    @classmethod
    async def get_recent(cls, session: AsyncSession, limit: int = 20) -> List["UserFact"]:
        """Get recent facts across all entries."""
        result = await session.execute(
            select(cls)
            .order_by(cls.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()
