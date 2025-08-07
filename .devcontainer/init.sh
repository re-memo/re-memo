#!/usr/bin/env bash
set -e
cp .env .devcontainer/.env || (echo "❌ .env file not found! Configure re:memo first." && exit 1)
