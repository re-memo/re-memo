"""add user authentication

Revision ID: add_user_auth
Revises: 96c425541b16
Create Date: 2025-11-27 02:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import secrets
import bcrypt


# revision identifiers, used by Alembic.
revision: str = 'add_user_auth'
down_revision: Union[str, Sequence[str]] = '96c425541b16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add users table and user_id columns to existing tables."""
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Generate a secure random password for migration purposes
    # This admin user (ID 0) is only created if there is existing data to migrate
    random_password = secrets.token_urlsafe(16)
    password_hash = bcrypt.hashpw(random_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create admin user (ID 0) for existing data (migration purposes only)
    # Print the password to logs so the admin can use it to migrate, then should change it
    print(f"[MIGRATION] Creating admin user (ID 0) with temporary password: {random_password}")
    print("[MIGRATION] Please change this password after migration!")
    
    op.execute(f"""
        INSERT INTO users (id, username, password_hash, created_at, updated_at)
        VALUES (0, 'admin', '{password_hash}', NOW(), NOW())
        ON CONFLICT DO NOTHING;
    """)

    # Add user_id column to journal_entries
    op.add_column('journal_entries', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Set default user_id for existing entries to admin (ID 0)
    op.execute("UPDATE journal_entries SET user_id = 0 WHERE user_id IS NULL")
    
    # Now make user_id NOT NULL and add foreign key
    op.alter_column('journal_entries', 'user_id', nullable=False)
    op.create_index(op.f('ix_journal_entries_user_id'), 'journal_entries', ['user_id'], unique=False)
    op.create_foreign_key('fk_journal_entries_user_id', 'journal_entries', 'users', ['user_id'], ['id'])

    # Add user_id column to user_facts
    op.add_column('user_facts', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Set default user_id for existing facts to admin (ID 0)
    op.execute("UPDATE user_facts SET user_id = 0 WHERE user_id IS NULL")
    
    # Now make user_id NOT NULL and add foreign key
    op.alter_column('user_facts', 'user_id', nullable=False)
    op.create_index(op.f('ix_user_facts_user_id'), 'user_facts', ['user_id'], unique=False)
    op.create_foreign_key('fk_user_facts_user_id', 'user_facts', 'users', ['user_id'], ['id'])

    # Add user_id column to chat_sessions
    op.add_column('chat_sessions', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Set default user_id for existing sessions to admin (ID 0)
    op.execute("UPDATE chat_sessions SET user_id = 0 WHERE user_id IS NULL")
    
    # Now make user_id NOT NULL and add foreign key
    op.alter_column('chat_sessions', 'user_id', nullable=False)
    op.create_index(op.f('ix_chat_sessions_user_id'), 'chat_sessions', ['user_id'], unique=False)
    op.create_foreign_key('fk_chat_sessions_user_id', 'chat_sessions', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    """Remove user authentication."""
    # Drop foreign keys and indexes
    op.drop_constraint('fk_chat_sessions_user_id', 'chat_sessions', type_='foreignkey')
    op.drop_index(op.f('ix_chat_sessions_user_id'), table_name='chat_sessions')
    op.drop_column('chat_sessions', 'user_id')

    op.drop_constraint('fk_user_facts_user_id', 'user_facts', type_='foreignkey')
    op.drop_index(op.f('ix_user_facts_user_id'), table_name='user_facts')
    op.drop_column('user_facts', 'user_id')

    op.drop_constraint('fk_journal_entries_user_id', 'journal_entries', type_='foreignkey')
    op.drop_index(op.f('ix_journal_entries_user_id'), table_name='journal_entries')
    op.drop_column('journal_entries', 'user_id')

    # Drop users table
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
