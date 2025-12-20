#!/usr/bin/env bash
#
# db-up.sh
# Start local PostgreSQL for development (port 5433, matches test expectations)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🚀 Starting local PostgreSQL (port 5433)..."
docker compose -f docker-compose.dev.yml up -d pg

echo "⏳ Waiting for PostgreSQL to be ready..."
docker compose -f docker-compose.dev.yml exec -T pg pg_isready -U postgres -d akis_v2 || {
  echo "⚠️  PostgreSQL not ready yet, waiting..."
  sleep 3
  docker compose -f docker-compose.dev.yml exec -T pg pg_isready -U postgres -d akis_v2
}

echo "✅ PostgreSQL is ready at 127.0.0.1:5433"
echo ""
echo "📊 Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: akis_v2"
echo "  User: postgres"
echo "  Password: postgres"
echo ""
echo "💡 DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2"
echo ""
echo "To stop: ./scripts/db-down.sh"

