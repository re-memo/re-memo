# re:memo Setup Guide

This guide will walk you through setting up re:memo on your system. Choose the deployment option that best fits your privacy preferences and technical requirements.

## Prerequisites

- Docker & Docker Compose
- (Optional) NVIDIA GPU for local LLM support

> [!TIP]
> New to Docker? Check out the [Docker installation guide](https://docs.docker.com/get-docker/) for your operating system. Docker Desktop includes both Docker and Docker Compose.
---
## Security Considerations

### Authentication

> [!WARNING]
> re:memo does not include built-in authentication. For production deployments, implement proper authentication and authorization.

Recommended approaches:
- **NGINX reverse proxy** with client certificates
- **OAuth2 proxy** with your identity provider
- **VPN-only access** for personal deployments
- **Cloudflare Access** for cloud deployments

### Data Protection

- **Encryption at rest**: Use encrypted storage for your Docker volumes
- **Network security**: Run behind a firewall, use HTTPS in production
- **Backup strategy**: Implement regular backups of your database
- **Access logs**: Monitor who accesses your re:memo instance

### Privacy Best Practices

- **Local-first**: Use Option A for maximum privacy
- **API key management**: Store API keys securely, rotate regularly
- **Data retention**: Consider implementing automatic data purging policies
- **Export capabilities**: Ensure you can export your data if needed

---


## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/your-username/re-memo.git
cd re-memo
cp .env.example .env
```

> [!NOTE]
> The `.env.example` file contains all available configuration options with comments explaining each setting.

Edit the `.env` file with your preferences (see [Configuration](#configuration) section below).

### 2. Choose Your Deployment

Pick one of the three deployment options based on your needs:

- **Option A**: Maximum privacy (everything runs locally)
- **Option B**: Hybrid setup (local database, external AI)
- **Option C**: Backend service only (external database and AI)

See [Deployment Options](#deployment-options) for detailed instructions.

### 3. Verify Installation

1. Check that services are running:
   ```bash
   docker-compose ps
   ```

2. View logs if needed:
   ```bash
   docker-compose logs -f
   ```

3. Navigate to `http://localhost:8080` and start journaling!

## Configuration

### Environment Variables

Key settings in your `.env` file:

```bash
# LLM Configuration
LLM_PROVIDER=openai          # ollama (local) or openai compatible (external)
OPENAI_API_KEY=sk-...        # Required for external OpenAI API
OPENAI_BASE_URL=https://...  # Custom API endpoint (optional)
DEFAULT_MODEL=gpt-4o-mini    # Model name

# AI Behavior
SYSTEM_PROMPT="Custom prompt..."     # Customize AI personality
                                     # More customization options coming soon!

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8080/api # Backend API endpoint
```

> [!TIP]
> For quick testing, use OpenAI's API with `LLM_PROVIDER=openai` and your API key. For maximum privacy, use `LLM_PROVIDER=ollama` with local models.

### Model Compatibility

> [!TIP]
> We've tested the default prompt flows with **Mistral 3.2 Instruct** and **GPT-4o-mini**. We're building a reference of compatible LLM models and model-specific prompts that work well with re:memo.

Compatible models include:
- **OpenAI**: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
- **Local (Ollama)**: mistral, llama2, codellama
- **Other APIs**: Any OpenAI-compatible endpoint

## Deployment Options

> [!INFO]
> Prebuilt images coming soon to simplify deployment!

### Frontend Deployment

> [!NOTE]
> The frontend is a static React application that can be served by any web server.

Build the production frontend:

```bash
# Option 1: Use the devcontainer
# Option 2: Attach to the frontend service in docker-compose.dev.yml
npm install
npm run build
```

Deploy the `dist/` folder to your preferred web server (nginx, Cloudflare Pages, Vercel, etc.).

> [!TIP]
> Don't forget to configure `VITE_API_BASE_URL` in your `.env` file to point to your backend before building!

### Backend Deployment Options

> [!CAUTION]
> re:memo does not include an authentication mechanism out-of-the-box. You will need to implement this yourself, especially if you plan to make it internet-accessible!
>
> Consider using an NGINX reverse proxy with client certificate authentication or similar security measures.

#### Option A: Full Privacy (Local AI + Local Database)

**Best for**: Maximum privacy, complete data control
**Requirements**: GPU recommended for good performance

```bash
docker-compose --profile llm-selfhost --profile db-selfhost up -d
```

This setup includes:
- Local PostgreSQL database with pgvector
- Ollama for local LLM inference
- All data stays on your machine

> [!NOTE]
> First startup may take longer as it downloads LLM models. Monitor with `docker-compose logs -f ollama`.

#### Option B: Hybrid (Local Database + External AI)

**Best for**: Privacy-conscious users who want reliable AI performance
**Requirements**: API key for external LLM service

```bash
docker-compose --profile db-selfhost up -d
```

Configure your `.env` file:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1  # or your private endpoint
```

> [!NOTE]
> This option can still be private if you use a self-hosted LLM API endpoint! Just point `OPENAI_BASE_URL` to your private service.

#### Option C: Backend Service Only

**Best for**: Development, testing, or when you have existing infrastructure
**Requirements**: External PostgreSQL and LLM services

```bash
docker-compose up -d
```

Configure your .env file with external database connection details:
```bash
# Database (external Postgres)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=rememo
DB_USER=your-username
DB_PASSWORD=your-password

# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=your-llm-endpoint
```

> [!WARNING]
> This assumes you already have PostgreSQL (with pgvector) and LLM services running elsewhere. Make sure to update your `.env` file accordingly.

## Advanced Setup

### GPU Support for Local LLMs

If you have an NVIDIA GPU and want to use it for local LLM inference:

1. Install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

2. Use the GPU-enabled profile:
   ```bash
   docker-compose --profile llm-selfhost --profile db-selfhost --profile gpu up -d
   ```

### Custom System Prompts

You can customize how the AI processes your journal entries by modifying the `SYSTEM_PROMPT` environment variable:

```bash
SYSTEM_PROMPT="You are a thoughtful journaling assistant focused on helping users discover patterns in their emotional well-being and personal growth..."
```

### Database Customization

For production deployments, consider:
- Using a managed PostgreSQL service
- Setting up regular backups
- Configuring connection pooling
- Tuning pgvector performance

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose logs -f [service-name]

# Check if ports are in use
netstat -tulpn | grep :8080
```

**Frontend can't connect to backend:**
- Verify `VITE_API_BASE_URL` in your `.env` file
- Check if backend is running: `curl http://localhost:8080/health`
- Look for CORS issues in browser developer tools

**Ollama model download fails:**
```bash
# Manual model pull
docker-compose exec ollama ollama pull mistral
```

**Database connection issues:**
- Ensure PostgreSQL service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs -f postgres`
- Verify DATABASE_URL format

### Performance Optimization

**For local LLMs:**
- Ensure you have sufficient RAM (8GB+ recommended)
- Use GPU acceleration when available
- Consider smaller models for better performance

**For database:**
- Adjust PostgreSQL memory settings for your system
- Consider using SSD storage for better vector search performance

### Getting Help

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Search existing [GitHub Issues](https://github.com/your-username/re-memo/issues)
3. Create a new issue with:
   - Your OS and Docker version
   - Complete error logs
   - Your deployment configuration (without sensitive data)

> [!TIP]
> When reporting issues, include the output of `docker-compose ps` and relevant log snippets from `docker-compose logs`.

---

**Next Steps**: Once your installation is complete, start journaling and explore the AI-powered features that make re:memo unique!