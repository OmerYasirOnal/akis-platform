#!/bin/bash

# AKIS Platform - Master Stop Script (With MCP)
# --------------------------------------------

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 AKIS Platform kapatılıyor...${NC}"

# 1. Frontend ve Backend süreçlerini PID dosyalarından bulup kapat
cd "$PROJECT_ROOT"
if [ -f .backend.pid ]; then
  PID=$(cat .backend.pid)
  echo -e "${BLUE}⏹️ Backend (PID: $PID) kapatılıyor...${NC}"
  pkill -P $PID 2>/dev/null || kill $PID 2>/dev/null
  rm .backend.pid
fi

if [ -f .frontend.pid ]; then
  PID=$(cat .frontend.pid)
  echo -e "${BLUE}⏹️ Frontend (PID: $PID) kapatılıyor...${NC}"
  pkill -P $PID 2>/dev/null || kill $PID 2>/dev/null
  rm .frontend.pid
fi

# 2. Docker Servislerini Durdur (DB + MCP)
echo -e "${BLUE}📦 Docker konteynırları durduruluyor (DB + MCP Gateway)...${NC}"
docker compose -f docker-compose.dev.yml -f docker-compose.mcp.yml stop

echo -e "${GREEN}✅ Her şey güvenli bir şekilde kapatıldı.${NC}"
