#!/bin/bash
# =============================================================================
# AKIS Platform - Staging Deployment Script
# =============================================================================
#
# Single entrypoint for staging deployment operations
#
# Usage:
#   ./deploy.sh start         Start all services
#   ./deploy.sh start-mcp     Start all services including MCP gateway
#   ./deploy.sh stop          Stop all services
#   ./deploy.sh restart       Restart all services
#   ./deploy.sh logs          View all logs (follow mode)
#   ./deploy.sh logs-backend  View backend logs only
#   ./deploy.sh migrate       Run database migrations
#   ./deploy.sh backup        Create database backup
#   ./deploy.sh status        Check service status
#   ./deploy.sh health        Check health endpoints
#   ./deploy.sh pull          Pull latest images
#   ./deploy.sh update        Pull + migrate + restart
#
# PROMOTION TO PRODUCTION:
# - Use deploy/oci/production/ directory instead
# - Ensure production .env file is configured
# - Run with production-specific compose file
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for .env file
check_env() {
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        log_info "Copy env.example to .env and configure it:"
        log_info "  cp env.example .env"
        log_info "  nano .env"
        exit 1
    fi
}

# Check Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running!"
        exit 1
    fi
}

# Commands
cmd_start() {
    log_info "Starting AKIS staging services..."
    check_env
    check_docker
    docker compose up -d --remove-orphans
    log_info "Services started. Checking health..."
    sleep 5
    cmd_health
}

cmd_start_mcp() {
    log_info "Starting AKIS staging services with MCP gateway..."
    check_env
    check_docker
    docker compose --profile mcp up -d --remove-orphans
    log_info "Services started. Checking health..."
    sleep 5
    cmd_health
}

cmd_stop() {
    log_info "Stopping AKIS staging services..."
    docker compose down
    log_info "Services stopped."
}

cmd_restart() {
    log_info "Restarting AKIS staging services..."
    docker compose restart
    log_info "Services restarted. Checking health..."
    sleep 5
    cmd_health
}

cmd_logs() {
    log_info "Viewing logs (Ctrl+C to exit)..."
    docker compose logs -f --tail=100
}

cmd_logs_backend() {
    log_info "Viewing backend logs (Ctrl+C to exit)..."
    docker compose logs -f --tail=100 backend
}

cmd_migrate() {
    log_info "Running database migrations..."
    check_env
    check_docker
    docker compose run --rm backend pnpm db:migrate
    log_info "Migrations completed."
}

cmd_backup() {
    log_info "Creating database backup..."
    BACKUP_FILE="backups/manual-$(date +%Y%m%d-%H%M%S).sql"
    mkdir -p backups
    docker exec akis-staging-db pg_dump -U akis akis_staging > "$BACKUP_FILE"
    log_info "Backup created: $BACKUP_FILE"
}

cmd_status() {
    log_info "Service status:"
    docker compose ps
}

cmd_health() {
    log_info "Checking health endpoints..."
    
    # Get domain from .env or use localhost
    DOMAIN="${FRONTEND_URL:-http://localhost}"
    
    # Health check
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DOMAIN}/health" 2>/dev/null || echo "000")
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e "  /health: ${GREEN}OK${NC} ($HEALTH_STATUS)"
    else
        echo -e "  /health: ${RED}FAIL${NC} ($HEALTH_STATUS)"
    fi
    
    # Ready check
    READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DOMAIN}/ready" 2>/dev/null || echo "000")
    if [ "$READY_STATUS" = "200" ]; then
        echo -e "  /ready:  ${GREEN}OK${NC} ($READY_STATUS)"
    else
        echo -e "  /ready:  ${RED}FAIL${NC} ($READY_STATUS)"
    fi
    
    # Version check
    VERSION=$(curl -s "${DOMAIN}/version" 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    COMMIT=$(curl -s "${DOMAIN}/version" 2>/dev/null | grep -o '"commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo "  Version: ${VERSION} (${COMMIT})"
}

cmd_pull() {
    log_info "Pulling latest images..."
    check_docker
    docker compose pull
    log_info "Images pulled."
}

cmd_update() {
    log_info "Performing full update..."
    cmd_pull
    cmd_migrate
    log_info "Restarting services with new images..."
    docker compose up -d --remove-orphans
    log_info "Update complete. Checking health..."
    sleep 10
    cmd_health
}

cmd_help() {
    echo "AKIS Platform - Staging Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start         Start all services"
    echo "  start-mcp     Start all services including MCP gateway"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  logs          View all logs (follow mode)"
    echo "  logs-backend  View backend logs only"
    echo "  migrate       Run database migrations"
    echo "  backup        Create database backup"
    echo "  status        Check service status"
    echo "  health        Check health endpoints"
    echo "  pull          Pull latest images"
    echo "  update        Pull + migrate + restart (full update)"
    echo "  help          Show this help message"
}

# Main command dispatcher
case "${1:-help}" in
    start)
        cmd_start
        ;;
    start-mcp)
        cmd_start_mcp
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs
        ;;
    logs-backend)
        cmd_logs_backend
        ;;
    migrate)
        cmd_migrate
        ;;
    backup)
        cmd_backup
        ;;
    status)
        cmd_status
        ;;
    health)
        cmd_health
        ;;
    pull)
        cmd_pull
        ;;
    update)
        cmd_update
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        log_error "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
