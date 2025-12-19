#!/usr/bin/env bash
# AKIS - Start GitHub MCP Gateway
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use explicit project name to avoid conflicts with other compose stacks
export COMPOSE_PROJECT_NAME=akis-mcp

echo "=== AKIS GitHub MCP Gateway Startup ==="
echo "Project: $COMPOSE_PROJECT_NAME"
echo ""

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ ERROR: GITHUB_TOKEN environment variable is not set"
  echo ""
  echo "To fix:"
  echo "  export GITHUB_TOKEN=ghp_your_token_here"
  echo ""
  echo "Or add it to .env:"
  echo "  echo 'GITHUB_TOKEN=ghp_your_token_here' >> backend/.env"
  echo ""
  exit 1
fi

echo "✅ GITHUB_TOKEN is set"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ ERROR: Docker is not installed or not in PATH"
  exit 1
fi

echo "✅ Docker found"
echo ""

# Start MCP Gateway
cd "$REPO_ROOT"
echo "Starting MCP Gateway (Docker Compose)..."
docker compose -f docker-compose.mcp.yml up -d

echo ""
echo "⏳ Waiting for gateway to be healthy..."
sleep 3

# Health check
if curl -f -s http://localhost:4010/health > /dev/null 2>&1; then
  echo "✅ MCP Gateway is running!"
  echo ""
  echo "Gateway URL: http://localhost:4010/mcp"
  echo "Health check: http://localhost:4010/health"
  echo ""
  echo "Add to backend/.env:"
  echo "  GITHUB_MCP_BASE_URL=http://localhost:4010/mcp"
  echo "  GITHUB_TOKEN=$GITHUB_TOKEN"
  echo ""
  echo "Optional: Run smoke test:"
  echo "  ./scripts/mcp-smoke-test.sh"
  echo ""
  echo "To view logs:"
  echo "  docker compose -f docker-compose.mcp.yml logs -f"
  echo ""
  echo "To stop:"
  echo "  ./scripts/mcp-down.sh"
else
  echo "⚠️  Gateway started but health check failed"
  echo ""
  echo "Checking logs..."
  docker compose -f docker-compose.mcp.yml logs --tail=50
  echo ""
  echo "Common issues:"
  echo "  - Invalid GITHUB_TOKEN (check scopes: repo, read:org)"
  echo "  - Port 4010 already in use"
  echo "  - Docker not running"
  exit 1
fi

