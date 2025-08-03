"""
Service manager for singleton instances of all services.
"""

from typing import Optional
import logging
from app.services.ai_processor import AIProcessor
from app.services.vector_search import VectorSearchService
from app.services.embeddings import EmbeddingService
from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class ServiceManager:
    """Singleton manager for all application services."""
    
    _instance: Optional['ServiceManager'] = None
    _initialized: bool = False
    
    def __new__(cls) -> 'ServiceManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._ai_processor: Optional[AIProcessor] = None
            self._vector_search: Optional[VectorSearchService] = None
            self._embedding_service: Optional[EmbeddingService] = None
            self._llm_client: Optional[LLMClient] = None
            ServiceManager._initialized = True
    
    async def initialize(self):
        """Initialize all services. Should be called during app startup."""
        logger.info("Initializing services...")
        
        try:
            # Initialize services in dependency order
            # Start with embedding service as it's the core dependency
            self._embedding_service = EmbeddingService()
            logger.info("Embedding service initialized")
            
            # Initialize LLM client
            self._llm_client = LLMClient()
            logger.info("LLM client initialized")
            
            # Initialize vector search with shared embedding service
            self._vector_search = VectorSearchService(embedding_service=self._embedding_service)
            logger.info("Vector search service initialized")
            
            # Initialize AI processor with shared services
            self._ai_processor = AIProcessor(
                llm_client=self._llm_client,
                embedding_service=self._embedding_service
            )
            logger.info("AI processor initialized")
            
            logger.info("All services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {str(e)}")
            raise
    
    def get_ai_processor(self) -> AIProcessor:
        """Get the singleton AI processor instance."""
        if self._ai_processor is None:
            raise RuntimeError("Services not initialized. Call initialize() first.")
        return self._ai_processor
    
    def get_vector_search(self) -> VectorSearchService:
        """Get the singleton vector search service instance."""
        if self._vector_search is None:
            raise RuntimeError("Services not initialized. Call initialize() first.")
        return self._vector_search
    
    def get_embedding_service(self) -> EmbeddingService:
        """Get the singleton embedding service instance."""
        if self._embedding_service is None:
            raise RuntimeError("Services not initialized. Call initialize() first.")
        return self._embedding_service
    
    def get_llm_client(self) -> LLMClient:
        """Get the singleton LLM client instance."""
        if self._llm_client is None:
            raise RuntimeError("Services not initialized. Call initialize() first.")
        return self._llm_client
    
    async def health_check(self) -> dict:
        """Check health of all services."""
        try:
            health_status = {
                "ai_processor": "healthy" if self._ai_processor else "not_initialized",
                "vector_search": "healthy" if self._vector_search else "not_initialized",
                "embedding_service": "healthy" if self._embedding_service else "not_initialized",
                "llm_client": "healthy" if self._llm_client else "not_initialized"
            }
            
            # Additional health checks if services support them
            if self._ai_processor and hasattr(self._ai_processor.llm_client, 'health_check'):
                llm_health = await self._ai_processor.llm_client.health_check()
                health_status["llm_detailed"] = llm_health
            
            if self._embedding_service and hasattr(self._embedding_service, 'get_embedding_stats'):
                embedding_stats = await self._embedding_service.get_embedding_stats()
                health_status["embedding_detailed"] = embedding_stats
            
            return health_status
            
        except Exception as e:
            logger.error(f"Error during health check: {str(e)}")
            return {"error": str(e)}


# Global service manager instance
service_manager = ServiceManager()
