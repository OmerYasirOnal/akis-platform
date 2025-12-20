#!/usr/bin/env bash
#
# db-down.sh
# Stop local PostgreSQL (data persists in named volume)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🛑 Stopping PostgreSQL..."
docker compose -f docker-compose.dev.yml down

echo "✅ PostgreSQL stopped (data persists in volume 'devagents_pgdata')"
echo ""
echo "To restart: ./scripts/db-up.sh"
echo "To reset (⚠️  destroys all data): ./scripts/db-reset.sh"

