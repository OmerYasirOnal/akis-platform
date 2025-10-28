#!/bin/bash
# Migration Script
# Part of Phase 1: Data Layer & Sessions (Scaffold)
#
# Usage:
#   npm run db:migrate:dev     # Create and apply migration (development)
#   npm run db:migrate:deploy  # Apply migrations (production)
#   npm run db:migrate:reset   # Reset database (development only)
#   npm run db:studio          # Open Prisma Studio

set -e

COMMAND=${1:-dev}

echo "🗄️  Running Prisma migration: $COMMAND"

case $COMMAND in
  dev)
    echo "📝 Creating and applying migration in development mode..."
    npx prisma migrate dev --name "${2:-auto_migration}"
    ;;
  
  deploy)
    echo "🚀 Applying migrations in production mode..."
    npx prisma migrate deploy
    ;;
  
  reset)
    if [ "$NODE_ENV" = "production" ]; then
      echo "❌ Cannot reset database in production!"
      exit 1
    fi
    echo "🔄 Resetting database (development only)..."
    npx prisma migrate reset --force
    ;;
  
  studio)
    echo "🎨 Opening Prisma Studio..."
    npx prisma studio
    ;;
  
  generate)
    echo "🔧 Generating Prisma Client..."
    npx prisma generate
    ;;
  
  *)
    echo "❌ Unknown command: $COMMAND"
    echo "Usage: npm run db:migrate:dev | db:migrate:deploy | db:migrate:reset | db:studio"
    exit 1
    ;;
esac

echo "✅ Migration complete!"

