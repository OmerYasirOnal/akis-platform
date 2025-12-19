#!/usr/bin/env bash
# AKIS - Stop GitHub MCP Gateway
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== AKIS GitHub MCP Gateway Shutdown ==="
echo ""

cd "$REPO_ROOT"
docker compose -f docker-compose.mcp.yml down

echo "✅ MCP Gateway stopped"

