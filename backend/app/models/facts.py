"""
User facts and events models.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from app.models.database import Base
from datetime import datetime
from typing import List, Optional, Tuple
import enum


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
    # Note: This would be a vector type in production with pgvector
    embedding_vector = Column(ARRAY(Float), nullable=True)
    
    # Relationships
    entry = relationship("JournalEntry", back_populates="facts")
    
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
        # Note: This is a simplified version. In production, you'd use GROUP BY
        result = await session.execute(
            select(cls.topic, cls.timestamp)
            .order_by(cls.timestamp.desc())
            .limit(limit * 3)  # Get more to filter unique topics
        )
        
        topics_seen = set()
        topics = []
        
        for topic, timestamp in result:
            if topic not in topics_seen and len(topics) < limit:
                topics_seen.add(topic)
                # Count facts for this topic
                count_result = await session.execute(
                    select(cls).where(cls.topic == topic)
                )
                fact_count = len(count_result.scalars().all())
                
                topics.append({
                    "topic": topic,
                    "latest_timestamp": timestamp.isoformat(),
                    "fact_count": fact_count
                })
        
        return topics
    
    @classmethod
    async def search_similar(
        cls, 
        session: AsyncSession, 
        query_embedding: List[float], 
        limit: int = 10
    ) -> List[Tuple["UserFact", float]]:
        """
        Find similar facts using vector similarity.
        
        TODO: Implement proper pgvector similarity search:
        SELECT *, (embedding_vector <-> %s) as distance 
        FROM user_facts 
        ORDER BY distance 
        LIMIT %s
        """
        # Placeholder implementation - in production use pgvector
        result = await session.execute(
            select(cls)
            .order_by(cls.timestamp.desc())
            .limit(limit)
        )
        facts = result.scalars().all()
        
        # Mock similarity scores for now
        return [(fact, 0.1 + (i * 0.1)) for i, fact in enumerate(facts)]
    
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
