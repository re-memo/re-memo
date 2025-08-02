"""
LLM client abstraction for different providers (Ollama, OpenAI, etc.).
"""

import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified interface for different LLM providers."""
    
    def __init__(self):
        self.settings = settings
        self.provider = self.settings.LLM_PROVIDER.lower()
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Get chat completion from configured LLM provider.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model name (uses default if not specified)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated response text
        """
        if not model:
            model = self.settings.DEFAULT_MODEL
        
        try:
            if self.provider == "ollama":
                return await self._ollama_chat_completion(messages, model, temperature)
            elif self.provider == "openai":
                return await self._openai_chat_completion(messages, model, temperature, max_tokens)
            else:
                logger.error(f"Unsupported LLM provider: {self.provider}")
                raise ValueError(f"Unsupported LLM provider: {self.provider}")
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            raise
    
    async def _ollama_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float
    ) -> str:
        """Handle Ollama API requests."""
        try:
            url = f"{self.settings.OLLAMA_URL}/api/chat"
            
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature
                }
            }
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result.get("message", {}).get("content", "")
            
        except httpx.RequestError as e:
            logger.error(f"Ollama request error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Ollama API error: {str(e)}")
            raise
    
    async def _openai_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        max_tokens: Optional[int]
    ) -> str:
        """Handle OpenAI API requests."""
        try:
            if not self.settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key not configured")
            
            url = "https://api.openai.com/v1/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {self.settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature
            }
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
            
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except httpx.RequestError as e:
            logger.error(f"OpenAI request error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    async def _mock_chat_completion(self, messages: List[Dict[str, str]]) -> str:
        """Mock chat completion for development/testing."""
        logger.info("Using mock chat completion")
        
        last_message = messages[-1]["content"].lower() if messages else ""
        
        # Simple rule-based responses for development
        if "facts" in last_message or "extract" in last_message:
            return '''[
    {
        "content": "Had a productive day at work completing the quarterly report",
        "topic": "work",
        "fact_type": "event",
        "original_snippet": "completed the quarterly report"
    },
    {
        "content": "Feeling accomplished and motivated",
        "topic": "emotions",
        "fact_type": "emotion",
        "original_snippet": "feeling accomplished"
    }
]'''
        
        elif "topic" in last_message or "prompt" in last_message:
            topics = ["work", "health", "relationships", "goals", "creativity"]
            topic = next((t for t in topics if t in last_message), "reflection")
            return f"Reflect on your recent experiences with {topic}. What patterns do you notice? What would you like to explore further?"
        
        elif "review" in last_message:
            return "Thank you for sharing your thoughts. I notice you're focusing on growth and positive changes. Keep up the great work with your journaling practice!"
        
        elif "suggest" in last_message:
            return "personal growth\ncreativity\nmindfulness\nfuture planning\nrelationships"
        
        else:
            return "I understand you're reflecting on your experiences. That's wonderful! Journaling is a powerful tool for self-discovery and growth. What would you like to explore further?"
    
    async def get_available_models(self) -> List[str]:
        """Get list of available models from the provider."""
        try:
            if self.provider == "ollama":
                url = f"{self.settings.OLLAMA_URL}/api/tags"
                response = await self.client.get(url)
                response.raise_for_status()
                
                result = response.json()
                return [model["name"] for model in result.get("models", [])]
                
            elif self.provider == "openai":
                # Common OpenAI models
                return ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
            
            else:
                return [self.settings.DEFAULT_MODEL]
                
        except Exception as e:
            logger.error(f"Error getting available models: {str(e)}")
            return [self.settings.DEFAULT_MODEL]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if the LLM provider is available."""
        try:
            if self.provider == "ollama":
                url = f"{self.settings.OLLAMA_URL}/api/tags"
                response = await self.client.get(url)
                response.raise_for_status()
                
                return {
                    "provider": "ollama",
                    "status": "healthy",
                    "url": self.settings.OLLAMA_URL
                }
                
            elif self.provider == "openai":
                if not self.settings.OPENAI_API_KEY:
                    return {
                        "provider": "openai",
                        "status": "error",
                        "message": "API key not configured"
                    }
                
                # Simple test request
                url = "https://api.openai.com/v1/models"
                headers = {"Authorization": f"Bearer {self.settings.OPENAI_API_KEY}"}
                response = await self.client.get(url, headers=headers)
                response.raise_for_status()
                
                return {
                    "provider": "openai",
                    "status": "healthy"
                }
            
            else:
                return {
                    "provider": self.provider,
                    "status": "mock",
                    "message": "Using mock responses"
                }
                
        except Exception as e:
            return {
                "provider": self.provider,
                "status": "error",
                "message": str(e)
            }
    
    async def close(self):
        """Clean up resources."""
        await self.client.aclose()
