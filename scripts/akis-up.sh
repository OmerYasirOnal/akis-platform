#!/bin/bash

# AKIS Platform - Master Start Script (With MCP)
# ---------------------------------------------

# Scriptin bulunduğu dizini al
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AKIS Platform başlatılıyor...${NC}"

# 1. Docker Servislerini Başlat (DB + Adminer + MCP)
echo -e "${BLUE}📦 Docker konteynırları başlatılıyor (PostgreSQL + MCP Gateway)...${NC}"
cd "$PROJECT_ROOT"
docker compose -f docker-compose.dev.yml -f docker-compose.mcp.yml up -d

# 2. Veritabanının hazır olmasını bekle
echo -e "${BLUE}⏳ Veritabanının hazır olması bekleniyor...${NC}"
until docker exec devagents-pg-1 pg_isready -U postgres > /dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo -e "\n${GREEN}✅ Veritabanı hazır!${NC}"

# 3. Migrationları uygula
echo -e "${BLUE}🔄 Veritabanı migrationları uygulanıyor...${NC}"
cd "$PROJECT_ROOT/backend" && pnpm db:migrate

# 4. Backend'i başlat
echo -e "${BLUE}⚙️ Backend başlatılıyor (Port 3000)...${NC}"
cd "$PROJECT_ROOT"
nohup pnpm -C backend dev > backend.log 2>&1 &
echo $! > .backend.pid
echo -e "${GREEN}✅ Backend arka planda başlatıldı (Log: backend.log)${NC}"

# 5. Frontend'i başlat
echo -e "${BLUE}💻 Frontend başlatılıyor (Port 5173)...${NC}"
nohup npm --prefix frontend run dev > frontend.log 2>&1 &
echo $! > .frontend.pid
echo -e "${GREEN}✅ Frontend arka planda başlatıldı (Log: frontend.log)${NC}"

echo -e "\n${GREEN}READY! AKIS Platform şu an çalışıyor:${NC}"
echo -e "🔗 Frontend:    http://localhost:5173"
echo -e "🔗 Backend:     http://localhost:3000/health"
echo -e "🔗 MCP Gateway: http://localhost:4010/health"
echo -e "🔗 Adminer:     http://localhost:8080"
echo -e "\n${BLUE}Durdurmak için: ./scripts/akis-down.sh${NC}"
