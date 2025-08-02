"""
Application configuration and settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database configuration
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "rememo"
    DB_USER: str = "rememo_user"
    DB_PASSWORD: str = "rememo_password"
    
    # LLM Configuration
    LLM_PROVIDER: str = "ollama"  # ollama or openai
    OLLAMA_URL: str = "http://ollama:11434"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    DEFAULT_MODEL: str = "llama3.1"
    
    # App Configuration
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 80
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-this"
    
    # AI Configuration
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    SYSTEM_PROMPT: str = "You are a helpful AI assistant for journaling and self-reflection."
    MAX_FACTS_PER_ENTRY: int = 20
    
    # Feature Flags
    ENABLE_VOICE: bool = True
    MAX_ENTRY_LENGTH: int = 10000
    
    @property
    def database_url(self) -> str:
        """Get the database URL for SQLAlchemy."""
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


# Global settings instance
settings = Settings()
