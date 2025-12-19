#!/usr/bin/env bash
# AKIS - Stop GitHub MCP Gateway
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use explicit project name to match mcp-up.sh
export COMPOSE_PROJECT_NAME=akis-mcp

echo "=== AKIS GitHub MCP Gateway Shutdown ==="
echo "Project: $COMPOSE_PROJECT_NAME"
echo ""

cd "$REPO_ROOT"
docker compose -f docker-compose.mcp.yml down --remove-orphans

echo "✅ MCP Gateway stopped (containers and orphans removed)"

