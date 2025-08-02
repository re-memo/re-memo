"""
Chat session and message models.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import relationship
from app.models.database import Base
from datetime import datetime
from typing import List, Optional, Dict
import uuid


class ChatSession(Base):
    """Chat session model."""
    
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with messages
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }
    
    @classmethod
    async def create(cls, session: AsyncSession, title: str = None) -> "ChatSession":
        """Create a new chat session."""
        chat_session = cls(title=title)
        session.add(chat_session)
        await session.flush()
        await session.refresh(chat_session)
        return chat_session
    
    @classmethod
    async def get_by_id(cls, session: AsyncSession, session_id: str) -> Optional["ChatSession"]:
        """Get a chat session by ID."""
        result = await session.execute(select(cls).where(cls.id == session_id))
        return result.scalars().first()
    
    @classmethod
    async def get_all(cls, session: AsyncSession, limit: int = 20) -> List["ChatSession"]:
        """Get all chat sessions."""
        result = await session.execute(
            select(cls)
            .order_by(cls.updated_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def delete(self, session: AsyncSession) -> None:
        """Delete chat session and all messages."""
        await session.delete(self)


class ChatMessage(Base):
    """Chat message model."""
    
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Optional metadata
    model_used = Column(String(50), nullable=True)
    context_facts_count = Column(Integer, default=0)
    
    # Relationship with session
    session = relationship("ChatSession", back_populates="messages")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "model_used": self.model_used,
            "context_facts_count": self.context_facts_count
        }
    
    @classmethod
    async def create(
        cls, 
        session: AsyncSession, 
        session_id: str, 
        role: str, 
        content: str,
        model_used: str = None,
        context_facts_count: int = 0
    ) -> "ChatMessage":
        """Create a new chat message."""
        message = cls(
            session_id=session_id,
            role=role,
            content=content,
            model_used=model_used,
            context_facts_count=context_facts_count
        )
        session.add(message)
        await session.flush()
        await session.refresh(message)
        return message
    
    @classmethod
    async def get_session_messages(
        cls, 
        session: AsyncSession, 
        session_id: str, 
        limit: int = 50
    ) -> List["ChatMessage"]:
        """Get messages for a specific chat session."""
        result = await session.execute(
            select(cls)
            .where(cls.session_id == session_id)
            .order_by(cls.created_at.asc())
            .limit(limit)
        )
        return result.scalars().all()
    
    @classmethod
    async def get_recent_messages(
        cls, 
        session: AsyncSession, 
        session_id: str, 
        limit: int = 10
    ) -> List["ChatMessage"]:
        """Get recent messages for context."""
        result = await session.execute(
            select(cls)
            .where(cls.session_id == session_id)
            .order_by(cls.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return list(reversed(messages))  # Return in chronological order
