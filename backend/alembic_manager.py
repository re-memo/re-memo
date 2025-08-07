#!/usr/bin/env python3
"""
Simple Alembic migration manager for re:memo.
This script provides easy commands for common migration tasks.
"""

import subprocess
import sys
import os
from pathlib import Path

# Change to the backend directory where alembic.ini is located
BACKEND_DIR = Path(__file__).parent.absolute()
os.chdir(BACKEND_DIR)

def run_command(cmd):
    """Run a command and handle errors."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        sys.exit(1)
    
    print(result.stdout)
    return result.stdout

def create_migration(message):
    """Create a new migration with autogenerate."""
    if not message:
        print("❌ Please provide a migration message")
        print("Usage: python alembic_manager.py create 'your migration message'")
        sys.exit(1)
    
    print(f"🔄 Creating migration: {message}")
    run_command(["alembic", "revision", "--autogenerate", "-m", message])
    print("✅ Migration created successfully!")

def upgrade_database():
    """Upgrade database to latest migration."""
    print("🔄 Upgrading database to latest version...")
    run_command(["alembic", "upgrade", "head"])
    print("✅ Database upgraded successfully!")

def downgrade_database(revision=""):
    """Downgrade database to specific revision or previous version."""
    target = revision if revision else "-1"
    print(f"🔄 Downgrading database to: {target}")
    run_command(["alembic", "downgrade", target])
    print("✅ Database downgraded successfully!")

def show_current():
    """Show current database revision."""
    print("📊 Current database revision:")
    run_command(["alembic", "current"])

def show_history():
    """Show migration history."""
    print("📚 Migration history:")
    run_command(["alembic", "history", "--verbose"])

def stamp_database(revision="head"):
    """Stamp database with specific revision (useful for existing databases)."""
    print(f"🏷️  Stamping database with revision: {revision}")
    run_command(["alembic", "stamp", revision])
    print("✅ Database stamped successfully!")

def main():
    if len(sys.argv) < 2:
        print("""
🗃️  Alembic Migration Manager for re:memo

Usage:
  python alembic_manager.py <command> [arguments]

Commands:
  create <message>     - Create a new migration with autogenerate
  upgrade              - Upgrade database to latest version
  downgrade [revision] - Downgrade database (defaults to previous version)
  current              - Show current database revision
  history              - Show migration history
  stamp [revision]     - Stamp database with revision (defaults to 'head')

Examples:
  python alembic_manager.py create "add user table"
  python alembic_manager.py upgrade
  python alembic_manager.py downgrade
  python alembic_manager.py current
  python alembic_manager.py history
  python alembic_manager.py stamp head
        """)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else ""
        create_migration(message)
    elif command == "upgrade":
        upgrade_database()
    elif command == "downgrade":
        revision = sys.argv[2] if len(sys.argv) > 2 else ""
        downgrade_database(revision)
    elif command == "current":
        show_current()
    elif command == "history":
        show_history()
    elif command == "stamp":
        revision = sys.argv[2] if len(sys.argv) > 2 else "head"
        stamp_database(revision)
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
