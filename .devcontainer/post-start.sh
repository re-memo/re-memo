#!/bin/bash

echo "🔄 Waiting for services..."

# Ensure PostgreSQL is running
until pg_isready -h postgres -p 5432; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ Services are ready!"

# Source environment variables if .env exists
if [ -f "/workspace/.env" ]; then
  echo "📋 Loading environment variables from .env..."
  source /workspace/.env
fi

# Display helpful information
echo ""
echo "🎯 Development environment is ready!"
echo "    Run backend: cd /workspace/backend && bash start-dev.sh"
echo "    Run frontend: cd /workspace/frontend && npm run dev -- --host 0.0.0.0"
echo ""
