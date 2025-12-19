#!/usr/bin/env bash
# AKIS - Start GitHub MCP Gateway
# 
# This script starts the MCP Gateway using Docker Compose.
# The gateway loads GITHUB_TOKEN from .env.mcp.local (gitignored).
#
# Usage:
#   ./scripts/mcp-up.sh                    # Default: uses .env.mcp.local
#   ./scripts/mcp-up.sh --mcp-env-file path/to/custom.env  # Custom env file
#
# Note: --mcp-env-file is NOT the same as docker compose --env-file flag.
# This flag sets which file is loaded by the compose env_file directive.
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use explicit project name to avoid conflicts with other compose stacks
export COMPOSE_PROJECT_NAME=akis-mcp

# Parse arguments
MCP_ENV_FILE="$REPO_ROOT/.env.mcp.local"
while [[ $# -gt 0 ]]; do
  case $1 in
    --mcp-env-file)
      MCP_ENV_FILE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--mcp-env-file path/to/env]"
      echo ""
      echo "Options:"
      echo "  --mcp-env-file    Path to MCP Gateway env file (default: .env.mcp.local)"
      echo "                     This file is loaded by docker-compose.mcp.yml env_file directive"
      echo "                     Note: Different from docker compose --env-file flag"
      echo "  --help, -h         Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                                    # Use default .env.mcp.local"
      echo "  $0 --mcp-env-file .env.mcp.dev       # Use custom env file"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage"
      exit 1
      ;;
  esac
done

echo "=== AKIS GitHub MCP Gateway Startup ==="
echo "Project: $COMPOSE_PROJECT_NAME"
echo ""

# Resolve absolute path for env file
if [[ "$MCP_ENV_FILE" != /* ]]; then
  # Relative path - resolve relative to repo root
  MCP_ENV_FILE="$REPO_ROOT/$MCP_ENV_FILE"
fi

# Validate environment file exists and contains GITHUB_TOKEN
# SECURITY: We check presence without sourcing/echoing the file contents
if [ ! -f "$MCP_ENV_FILE" ]; then
  echo "⚠️  Environment file not found: $MCP_ENV_FILE"
  echo ""
  
  # Auto-create from template if available
  TEMPLATE_FILE="$REPO_ROOT/env.mcp.local.example"
  if [ -f "$TEMPLATE_FILE" ]; then
    echo "📝 Creating $MCP_ENV_FILE from template..."
    cp "$TEMPLATE_FILE" "$MCP_ENV_FILE"
    echo "✅ Created $MCP_ENV_FILE"
    echo ""
    echo "⚠️  IMPORTANT: You must add your GitHub token to this file!"
    echo ""
    echo "Edit $MCP_ENV_FILE and replace 'your_github_token_here' with your actual token:"
    echo "  GITHUB_TOKEN=ghp_your_actual_token_here"
    echo ""
    echo "Get a token from: https://github.com/settings/tokens"
    echo "Required scopes: repo, read:org"
    echo ""
    echo "Then run this script again."
    exit 1
  else
    echo "❌ ERROR: Template file not found: $TEMPLATE_FILE"
    echo ""
    echo "The MCP Gateway requires a GitHub token to function."
    echo ""
    echo "To fix:"
    echo "  1. Copy the template:"
    echo "     cp env.mcp.local.example .env.mcp.local"
    echo ""
    echo "  2. Edit .env.mcp.local and add your GitHub token:"
    echo "     GITHUB_TOKEN=ghp_your_token_here"
    echo ""
    echo "  3. Get a token from: https://github.com/settings/tokens"
    echo "     Required scopes: repo, read:org"
    echo ""
    exit 1
  fi
fi

echo "✅ Found environment file: $MCP_ENV_FILE"

# Validate GITHUB_TOKEN is present (not empty) without leaking the value
# Uses grep to check for non-empty GITHUB_TOKEN= line
if ! grep -qE '^GITHUB_TOKEN=.+' "$MCP_ENV_FILE"; then
  echo "❌ ERROR: GITHUB_TOKEN is missing or empty in $MCP_ENV_FILE"
  echo ""
  echo "Please edit $(basename "$MCP_ENV_FILE") and add your GitHub token:"
  echo "  GITHUB_TOKEN=ghp_your_token_here"
  echo ""
  echo "Get a token from: https://github.com/settings/tokens"
  echo "Required scopes: repo, read:org"
  echo ""
  exit 1
fi

echo "✅ GITHUB_TOKEN is configured"
echo ""

# Check Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ ERROR: Docker is not installed or not in PATH"
  exit 1
fi

echo "✅ Docker found"
echo ""

# Start MCP Gateway with Docker Compose
# Pass the env file path via COMPOSE_ENV_FILE environment variable
# This is used by docker-compose.mcp.yml in the env_file directive
cd "$REPO_ROOT"

# If using non-default env file, set COMPOSE_ENV_FILE
# The compose file uses ${COMPOSE_ENV_FILE:-.env.mcp.local} to select the file
if [ "$MCP_ENV_FILE" != "$REPO_ROOT/.env.mcp.local" ]; then
  # Convert absolute path to relative path from repo root for compose
  COMPOSE_ENV_FILE_REL=$(realpath --relative-to="$REPO_ROOT" "$MCP_ENV_FILE")
  export COMPOSE_ENV_FILE="$COMPOSE_ENV_FILE_REL"
  echo "Using custom env file: $COMPOSE_ENV_FILE_REL"
else
  # Unset to use default
  unset COMPOSE_ENV_FILE
fi

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
  echo "Next steps:"
  echo "  1. Add to backend/.env:"
  echo "     GITHUB_MCP_BASE_URL=http://localhost:4010/mcp"
  echo ""
  echo "  2. Run smoke test (recommended):"
  echo "     ./scripts/mcp-smoke-test.sh"
  echo ""
  echo "Useful commands:"
  echo "  View logs:  docker compose -f docker-compose.mcp.yml logs -f"
  echo "  Stop:       ./scripts/mcp-down.sh"
  echo "  Restart:    ./scripts/mcp-down.sh && ./scripts/mcp-up.sh"
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
