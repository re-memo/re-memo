"""
Vector search service using pgvector for similarity operations.
"""

from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging
from app.models.facts import UserFact
from app.services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)


class VectorSearchService:
    """Service for vector-based similarity search using pgvector."""
    
    def __init__(self, embedding_service=None):
        # Use injected service or create new one (for backward compatibility)
        self.embedding_service = embedding_service or EmbeddingService()
    
    async def search_similar_facts(
        self,
        session: AsyncSession,
        query_text: str,
        limit: int = 10,
        similarity_threshold: float = 0.8,
        user_id: Optional[int] = None
    ) -> List[Tuple[UserFact, float]]:
        """
        Search for facts similar to the query text using vector similarity.
        
        Args:
            session: Database session
            query_text: Text to search for
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score
            user_id: Optional user ID to filter results
        """
        try:
            # For now, use the embedding service's mock implementation
            similar_facts = await self.embedding_service.find_similar_facts(
                query_text, session, limit * 2, user_id=user_id  # Get more to filter
            )
            
            # Filter by similarity threshold
            filtered_facts = [
                (fact, distance) for fact, distance in similar_facts 
                if distance <= similarity_threshold
            ]

            # Sort by distance (lower is more similar) and limit
            return filtered_facts[:limit]
            
        except Exception as e:
            logger.error(f"Error searching similar facts: {str(e)}")
            return []
    
    async def search_by_topic_and_similarity(
        self,
        session: AsyncSession,
        query_text: str,
        topic: str,
        limit: int = 10,
        user_id: Optional[int] = None
    ) -> List[Tuple[UserFact, float]]:
        """
        Search for facts that match both topic and semantic similarity.
        """
        try:
            # First get facts by topic (user-scoped if user_id provided)
            if user_id:
                topic_facts = await UserFact.get_by_topic(session, user_id, topic, limit * 2)
            else:
                # Fallback for backward compatibility
                from sqlalchemy.future import select
                result = await session.execute(
                    select(UserFact)
                    .where(UserFact.topic.ilike(f"%{topic}%"))
                    .order_by(UserFact.timestamp.desc())
                    .limit(limit * 2)
                )
                topic_facts = result.scalars().all()
            
            if not topic_facts:
                return []
            
            # Generate embedding for query
            query_embedding = await self.embedding_service.generate_embedding(query_text)
            
            # Calculate similarity for each fact
            facts_with_similarity = []
            for fact in topic_facts:
                if fact.embedding_vector:
                    similarity = self.embedding_service.cosine_similarity(
                        query_embedding, fact.embedding_vector
                    )
                    facts_with_similarity.append((fact, similarity))
            
            # Sort by similarity and return top results
            facts_with_similarity.sort(key=lambda x: x[1], reverse=True)
            return facts_with_similarity[:limit]
            
        except Exception as e:
            logger.error(f"Error searching by topic and similarity: {str(e)}")
            return []
    
    async def find_related_facts_for_entry(
        self,
        session: AsyncSession,
        entry_content: str,
        entry_id: int = None,
        limit: int = 5,
        user_id: Optional[int] = None
    ) -> List[UserFact]:
        """
        Find facts related to a journal entry content.
        """
        try:
            # Search for similar facts (user-scoped if user_id provided)
            similar_facts = await self.search_similar_facts(
                session, entry_content, limit * 2, user_id=user_id
            )
            
            # Filter out facts from the same entry if entry_id is provided
            related_facts = []
            for fact, similarity in similar_facts:
                if entry_id is None or fact.entry_id != entry_id:
                    related_facts.append(fact)
                    if len(related_facts) >= limit:
                        break
            
            return related_facts
            
        except Exception as e:
            logger.error(f"Error finding related facts for entry: {str(e)}")
            return []
    
    async def get_fact_clusters(
        self,
        session: AsyncSession,
        topic: str = None,
        n_clusters: int = 5,
        user_id: Optional[int] = None
    ) -> Dict[int, List[UserFact]]:
        """
        Cluster facts by semantic similarity.
        """
        try:
            # Get facts to cluster
            if topic and user_id:
                facts = await UserFact.get_by_topic(session, user_id, topic, 100)
            elif topic:
                # Fallback without user_id
                from sqlalchemy.future import select
                result = await session.execute(
                    select(UserFact)
                    .where(UserFact.topic.ilike(f"%{topic}%"))
                    .order_by(UserFact.timestamp.desc())
                    .limit(100)
                )
                facts = result.scalars().all()
            else:
                # Get recent facts
                from sqlalchemy.future import select
                query = select(UserFact).where(UserFact.embedding_vector.isnot(None))
                if user_id:
                    query = query.where(UserFact.user_id == user_id)
                query = query.order_by(UserFact.timestamp.desc()).limit(100)
                result = await session.execute(query)
                facts = result.scalars().all()
            
            if not facts:
                return {}
            
            # Extract embeddings
            embeddings = [fact.embedding_vector for fact in facts if fact.embedding_vector]
            
            if not embeddings:
                return {}
            
            # Cluster embeddings
            cluster_labels = await self.embedding_service.cluster_embeddings(
                embeddings, n_clusters
            )
            
            # Group facts by cluster
            clusters = {}
            for fact, cluster_id in zip(facts, cluster_labels):
                if cluster_id not in clusters:
                    clusters[cluster_id] = []
                clusters[cluster_id].append(fact)
            
            return clusters
            
        except Exception as e:
            logger.error(f"Error getting fact clusters: {str(e)}")
            return {}
    
    async def recommend_topics_for_exploration(
        self,
        session: AsyncSession,
        user_facts: List[UserFact],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recommend topics for exploration based on user's fact patterns.
        """
        try:
            if not user_facts:
                return []
            
            # Analyze topic patterns
            topic_embeddings = {}
            topic_counts = {}
            
            for fact in user_facts:
                topic = fact.topic
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
                
                if fact.embedding_vector:
                    if topic not in topic_embeddings:
                        topic_embeddings[topic] = []
                    topic_embeddings[topic].append(fact.embedding_vector)
            
            # Calculate average embeddings for each topic
            topic_avg_embeddings = {}
            for topic, embeddings in topic_embeddings.items():
                if embeddings:
                    avg_embedding = np.mean(embeddings, axis=0).tolist()
                    topic_avg_embeddings[topic] = avg_embedding
            
            # Find underexplored but related topics
            recommendations = []
            explored_topics = set(topic_counts.keys())
            
            # Mock some topic recommendations for now
            potential_topics = [
                "personal growth", "creativity", "mindfulness", "future planning",
                "skill development", "relationships", "health", "career",
                "learning", "hobbies", "travel", "self-care"
            ]
            
            for topic in potential_topics:
                if topic not in explored_topics:
                    # Calculate relevance based on existing topics
                    relevance_score = 0.5  # Mock score
                    
                    recommendations.append({
                        "topic": topic,
                        "relevance_score": relevance_score,
                        "reason": f"Related to your interests in {', '.join(list(explored_topics)[:3])}"
                    })
            
            # Sort by relevance and return top recommendations
            recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending topics: {str(e)}")
            return []
    
    async def get_search_stats(self, session: AsyncSession, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Get statistics about vector search usage."""
        try:
            # Count facts with embeddings
            from sqlalchemy.future import select
            from sqlalchemy import func
            
            # Build query with optional user filter
            total_query = select(func.count(UserFact.id))
            embedded_query = select(func.count(UserFact.id)).where(UserFact.embedding_vector.isnot(None))
            
            if user_id:
                total_query = total_query.where(UserFact.user_id == user_id)
                embedded_query = embedded_query.where(UserFact.user_id == user_id)
            
            total_facts = await session.execute(total_query)
            total_count = total_facts.scalar()
            
            facts_with_embeddings = await session.execute(embedded_query)
            embedded_count = facts_with_embeddings.scalar()
            
            return {
                "total_facts": total_count,
                "facts_with_embeddings": embedded_count,
                "embedding_coverage": embedded_count / total_count if total_count > 0 else 0,
                "search_enabled": embedded_count > 0
            }
            
        except Exception as e:
            logger.error(f"Error getting search stats: {str(e)}")
            return {
                "total_facts": 0,
                "facts_with_embeddings": 0,
                "embedding_coverage": 0,
                "search_enabled": False
            }
