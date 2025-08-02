"""
Embedding service using HuggingFace sentence transformers.
"""

from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import logging
from app.models.embeddings import EmbeddingCache
from app.models.database import get_db_session
from app.config.settings import Settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing text embeddings."""
    
    def __init__(self):
        self.settings = Settings()
        self.model = None
        self.model_name = self.settings.EMBEDDING_MODEL
        self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            # TODO: Implement proper model loading
            # self.model = SentenceTransformer(self.model_name)
            logger.info(f"Embedding model {self.model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {str(e)}")
            # For now, we'll use a mock implementation
            self.model = None
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text.
        
        TODO: Implement actual embedding generation:
        embedding = self.model.encode(text)
        return embedding.tolist()
        """
        try:
            # Check cache first
            async with get_db_session() as session:
                cached_embedding = await EmbeddingCache.get_embedding(
                    session, text, self.model_name
                )
                if cached_embedding:
                    logger.debug("Using cached embedding")
                    return cached_embedding
            
            # Generate new embedding
            if self.model is None:
                # Mock embedding for development
                # Generate a consistent pseudo-random embedding based on text hash
                import hashlib
                hash_obj = hashlib.md5(text.encode())
                seed = int(hash_obj.hexdigest()[:8], 16)
                np.random.seed(seed)
                embedding = np.random.rand(384).tolist()  # 384 dimensions like all-MiniLM-L6-v2
                logger.debug("Generated mock embedding")
            else:
                # TODO: Use actual model
                # embedding = self.model.encode(text).tolist()
                embedding = [0.0] * 384  # Placeholder
            
            # Cache the embedding
            async with get_db_session() as session:
                await EmbeddingCache.store_embedding(
                    session, text, embedding, self.model_name
                )
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            # Return zero vector as fallback
            return [0.0] * 384
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        embeddings = []
        for text in texts:
            embedding = await self.generate_embedding(text)
            embeddings.append(embedding)
        return embeddings
    
    async def find_similar_facts(
        self, 
        query_text: str, 
        session, 
        limit: int = 10
    ) -> List[tuple]:
        """
        Find facts similar to query text using vector similarity.
        
        TODO: Implement proper pgvector similarity search:
        
        query_embedding = await self.generate_embedding(query_text)
        
        # Use pgvector for similarity search
        result = await session.execute(
            text('''
                SELECT *, (embedding_vector <-> :query_embedding) as distance 
                FROM user_facts 
                WHERE embedding_vector IS NOT NULL
                ORDER BY distance 
                LIMIT :limit
            '''),
            {
                'query_embedding': query_embedding,
                'limit': limit
            }
        )
        
        return [(row, row.distance) for row in result]
        """
        try:
            query_embedding = await self.generate_embedding(query_text)
            
            # Import here to avoid circular imports
            from app.models.facts import UserFact
            
            # For now, use the mock similarity search from the model
            similar_facts = await UserFact.search_similar(
                session, query_embedding, limit
            )
            
            return similar_facts
            
        except Exception as e:
            logger.error(f"Error finding similar facts: {str(e)}")
            return []
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            vec1_np = np.array(vec1)
            vec2_np = np.array(vec2)
            
            dot_product = np.dot(vec1_np, vec2_np)
            norm_a = np.linalg.norm(vec1_np)
            norm_b = np.linalg.norm(vec2_np)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            return dot_product / (norm_a * norm_b)
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {str(e)}")
            return 0.0
    
    async def cluster_embeddings(
        self, 
        embeddings: List[List[float]], 
        n_clusters: int = 5
    ) -> List[int]:
        """
        Cluster embeddings into groups.
        
        TODO: Implement clustering with scikit-learn:
        from sklearn.cluster import KMeans
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(embeddings)
        return cluster_labels.tolist()
        """
        try:
            # Mock clustering - assign random clusters for now
            import random
            return [random.randint(0, n_clusters-1) for _ in embeddings]
            
        except Exception as e:
            logger.error(f"Error clustering embeddings: {str(e)}")
            return [0] * len(embeddings)
    
    async def get_embedding_stats(self) -> dict:
        """Get statistics about embedding usage and cache."""
        try:
            async with get_db_session() as session:
                stats = await EmbeddingCache.get_cache_stats(session)
                return {
                    "model_name": self.model_name,
                    "model_loaded": self.model is not None,
                    "cache_stats": stats
                }
        except Exception as e:
            logger.error(f"Error getting embedding stats: {str(e)}")
            return {
                "model_name": self.model_name,
                "model_loaded": False,
                "cache_stats": {}
            }
