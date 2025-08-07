-- Initialize database for re:memo application
-- This script sets up the necessary extensions and initial data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Tables will be created by SQLAlchemy migrations
-- This file just ensures extensions are available

-- Performance indexes (will be created by migrations too, but listed here for reference)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector ON embeddings USING hnsw (vector vector_cosine_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
