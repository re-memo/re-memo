#!/bin/bash

# Install frontend dependencies
if [ -d "/workspace/frontend" ]; then
  echo "📦 Installing Node.js dependencies..."
  cd /workspace/frontend
  npm install
fi

# Set up git safe directory
git config --global --add safe.directory /workspace