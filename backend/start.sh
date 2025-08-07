#!/bin/bash
set -e

echo "🚀 Starting re:memo backend... (production mode)"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until python -c "
import asyncio
import asyncpg
import sys
import os
try:
    async def check_db():
        conn = await asyncpg.connect(
            host=os.environ.get('DB_HOST', 'postgres'),
            port=int(os.environ.get('DB_PORT', '5432')),
            user=os.environ.get('DB_USER', 'rememo_user'),
            password=os.environ.get('DB_PASSWORD', 'rememo_password'),
            database=os.environ.get('DB_NAME', 'rememo')
        )
        await conn.close()
        print('Database is ready!')
    asyncio.run(check_db())
except Exception as e:
    print(f'Database not ready: {e}')
    sys.exit(1)
"; do
  echo "⏳ PostgreSQL is unavailable - sleeping..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Download embedding model if not present
echo "🤗 Checking for embedding model..."
python -c "
# set logging to debug
import logging
logging.basicConfig(level=logging.INFO)

import os
import sys
from sentence_transformers import SentenceTransformer

model_name = os.environ.get('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
model_path = f'/app/embedding_models/{model_name}'

# Create models directory if it doesn't exist
os.makedirs('/app/embedding_models', exist_ok=True)

# Check if model already exists locally
if os.path.exists(model_path) and os.listdir(model_path):
    print(f'✅ Model {model_name} already exists at {model_path}')
else:
    print(f'📥 Downloading model {model_name} to {model_path}...')
    try:
        # Download model to the models directory
        model = SentenceTransformer('all-MiniLM-L6-v2')
        # Save to the expected path structure
        model.save(model_path)
        print(f'✅ Model {model_name} downloaded successfully!')
    except Exception as e:
        print(f'❌ Failed to download model {model_name}: {e}')
        sys.exit(1)
"

# Verify model can be loaded
echo "🔍 Verifying model can be loaded..."
python -c "
import os
import sys
from sentence_transformers import SentenceTransformer

model_name = os.environ.get('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
model_path = f'/app/embedding_models/{model_name}'

try:
    model = SentenceTransformer(model_path, local_files_only=True)
    print(f'✅ Model verification successful!')
except Exception as e:
    print(f'❌ Model verification failed: {e}')
    sys.exit(1)
"

# Run database migrations
echo "📊 Running database migrations..."
python migrate.py

# Start the application
echo "🎯 Starting Quart application..."
exec python -m uvicorn app.main:create_app --factory --host 0.0.0.0 --port 80
