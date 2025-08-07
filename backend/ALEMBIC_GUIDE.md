# Alembic Database Migrations Guide for re:memo

## Overview
Alembic is now set up for your re:memo project to handle database schema versioning and migrations. This guide explains how to use it for future schema changes.

## Files Added/Modified
- `alembic.ini` - Alembic configuration
- `alembic/env.py` - Environment configuration
- `alembic/script.py.mako` - Migration template
- `alembic/versions/001_initial.py` - Initial migration with your current schema
- `alembic_manager.py` - Simple script to manage migrations
- `migrate.py` - Updated to use Alembic
- `requirements.txt` - Added alembic dependency

## Simple Workflow for Schema Changes

### 1. When You Change a Model (e.g., adding a column)

If you modify a SQLAlchemy model in `app/models/`, follow these steps:

**Example**: Adding an `author` field to `JournalEntry`

1. **Edit your model** (`app/models/journal.py`):
   ```python
   class JournalEntry(Base):
       # ...existing fields...
       author = Column(String(100), nullable=True)  # Add this line
   ```

2. **Create a migration**:
   ```bash
   cd backend
   python alembic_manager.py create "add author field to journal entries"
   ```

3. **Review the generated migration** in `alembic/versions/` (Alembic will auto-detect the change)

4. **Apply the migration**:
   ```bash
   python alembic_manager.py upgrade
   ```

### 2. For New Tables

If you create a new model file:

1. **Create your new model** (e.g., `app/models/tags.py`)
2. **Import it** in `app/models/__init__.py` so Alembic can detect it
3. **Generate migration**:
   ```bash
   python alembic_manager.py create "add tags table"
   ```
4. **Apply migration**:
   ```bash
   python alembic_manager.py upgrade
   ```

## Available Commands

### Using the Simple Manager Script:
```bash
# Create a new migration (auto-detects changes)
python alembic_manager.py create "description of changes"

# Apply all pending migrations
python alembic_manager.py upgrade

# Rollback to previous version
python alembic_manager.py downgrade

# Show current database version
python alembic_manager.py current

# Show migration history
python alembic_manager.py history

# Mark database as up-to-date (for existing databases)
python alembic_manager.py stamp head
```

### Using Alembic Directly:
```bash
# Generate migration with auto-detection
alembic revision --autogenerate -m "your message"

# Apply migrations
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# Show current revision
alembic current

# Show history
alembic history
```

## Important Notes

### What Alembic Auto-Detects:
✅ New tables and columns  
✅ Removed tables and columns  
✅ Changed column types  
✅ New indexes  
✅ Foreign key changes  

### What You Need to Handle Manually:
❌ Data migrations (moving/transforming data)  
❌ Some complex constraint changes  
❌ Renaming tables/columns (appears as drop + add)  

### Best Practices:

1. **Always review generated migrations** before applying them
2. **Test migrations on a copy** of production data first
3. **Keep migration messages descriptive**
4. **Never edit applied migrations** - create new ones instead
5. **Backup your database** before major migrations

## Common Scenarios

### Adding a Non-Nullable Column:
```python
# In your model:
new_field = Column(String(50), nullable=False, default="default_value")

# Alembic will generate:
op.add_column('table_name', sa.Column('new_field', sa.String(50), nullable=False, server_default='default_value'))
```

### Renaming a Column:
```python
# Manual migration needed:
def upgrade():
    op.alter_column('table_name', 'old_name', new_column_name='new_name')
```

### Data Migration Example:
```python
def upgrade():
    # First, add the new column
    op.add_column('journal_entries', sa.Column('word_count', sa.Integer()))
    
    # Then migrate data
    connection = op.get_bind()
    connection.execute(
        "UPDATE journal_entries SET word_count = array_length(string_to_array(content, ' '), 1)"
    )
```

## Production Deployment

For production deployments, your `migrate.py` script will now:
1. Run `alembic upgrade head` to apply any pending migrations
2. This ensures your database schema is always up-to-date

## Troubleshooting

### If you get "No such revision" errors:
```bash
# Mark your database as being at the current schema version
python alembic_manager.py stamp head
```

### If autogenerate isn't detecting changes:
- Make sure your models are imported in `app/models/__init__.py`
- Check that your model inherits from `Base`
- Verify your database connection in settings

### To see what changes would be generated:
```bash
alembic revision --autogenerate -m "test" --sql
```

This will show you the SQL that would be generated without creating the migration file.

## Summary

**For future schema changes, you only need to remember:**
1. Modify your SQLAlchemy models
2. Run: `python alembic_manager.py create "description"`
3. Run: `python alembic_manager.py upgrade`

That's it! Alembic handles the rest automatically. 🚀
