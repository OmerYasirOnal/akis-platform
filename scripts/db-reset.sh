#!/usr/bin/env bash
#
# db-reset.sh
# ⚠️  DESTRUCTIVE: Stop PostgreSQL and delete all data (drop volume)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "⚠️  WARNING: This will delete all PostgreSQL data!"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  echo "❌ Aborted."
  exit 1
fi

echo "🛑 Stopping PostgreSQL and removing volume..."
docker compose -f docker-compose.dev.yml down -v

echo "✅ PostgreSQL data deleted."
echo ""
echo "To start fresh: ./scripts/db-up.sh"

