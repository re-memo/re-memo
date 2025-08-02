# Rememo Development Setup

This is a simplified development setup for Rememo that uses external LLM services (like OpenAI) instead of running a local Ollama instance.

## What's included

- **Frontend**: React + Vite development server with hot reload
- **Backend**: Python/Quart development server with hot reload  
- **Database**: PostgreSQL with pgvector extension

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.dev .env
   # Edit .env and add your OpenAI API key
   ```

2. **Start the development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432

## Environment Variables

The key environment variables you need to set:

- `OPENAI_API_KEY`: Your OpenAI API key
- `LLM_PROVIDER`: Set to `openai` (default)
- `DEFAULT_MODEL`: LLM model to use (default: `gpt-4o-mini`)
- `EMBEDDING_MODEL`: Embedding model (default: `text-embedding-3-small`)

## Development Features

- **Hot Reload**: Both frontend and backend automatically reload when you make changes
- **Volume Mounts**: Source code is mounted so changes are reflected immediately
- **Debug Mode**: Backend runs in debug mode with detailed error messages
- **External LLM**: No need to run heavy local AI models

## File Watching

- Frontend: Vite watches `/frontend` directory
- Backend: Uvicorn watches `/backend/app` directory for Python changes
- Database: PostgreSQL data persists in `postgres_dev_data` volume

## Stopping

```bash
docker-compose -f docker-compose.dev.yml down
```

To also remove the database volume:
```bash
docker-compose -f docker-compose.dev.yml down -v
```
