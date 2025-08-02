#!/bin/bash
set -e

echo "🚀 Starting re:memo backend..."

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

# Run database migrations
echo "📊 Running database migrations..."
python migrate.py

# Start the application
echo "🎯 Starting Quart application..."
exec python -m uvicorn app.main:create_app --factory --host 0.0.0.0 --port 80 --reload
