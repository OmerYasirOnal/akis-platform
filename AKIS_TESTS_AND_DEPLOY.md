# AKIS — BACKEND TEST FIX + STAGING DEPLOY HAZIRLIK

.env dosyalarına ASLA dokunma. API çağrısı YAPMA.

---

## İKİ İŞ

1. 5 kırık backend test'inin import path'lerini düzelt (zaten tespit edildi)
2. Staging deploy dosyalarını hazırla (Dockerfile, docker-compose.prod.yml, Caddy config)

---

## ADIM 0 — MEVCUT DURUMU KONTROL ET

```bash
# Kırık testleri bul
cd backend && npx vitest run 2>&1 | grep -E "FAIL|fail|error" | head -20

# Hangi test dosyaları kırık?
find backend/test -name "pipeline-*.test.ts" | while read f; do
  echo "=== $f ==="
  head -10 "$f" | grep "import"
done
```

---

## ADIM 1 — BACKEND TEST IMPORT FIX

5 test dosyası eski path'lere import ediyor. Düzelt:

```bash
# Eski path'leri bul
grep -rn "pipeline/backend\|../../../pipeline" backend/test/ | head -20
```

Her dosyada:
- `../../../pipeline/backend/core/contracts/` → `../../src/pipeline/core/contracts/`
- `../../../pipeline/backend/core/orchestrator/` → `../../src/pipeline/core/orchestrator/`
- `../../../pipeline/backend/agents/proto/` → `../../src/pipeline/agents/proto/`
- `../../../pipeline/backend/agents/scribe/` → `../../src/pipeline/agents/scribe/`
- `../../../pipeline/backend/agents/trace/` → `../../src/pipeline/agents/trace/`

**Her dosyayı aç, import'ları düzelt, kaydet.**

### Doğrula

```bash
cd backend && npx vitest run 2>&1 | tail -20
# Hedef: 1329/1329 → 1329/1329 (veya daha fazla, kırık testler artık geçecek)
```

---

## ADIM 2 — STAGING DEPLOY DOSYALARI

### 2.1 Backend Dockerfile

```bash
cat backend/Dockerfile 2>/dev/null || echo "YOK"
```

Yoksa veya eskiyse oluştur:

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**DİKKAT:** Backend'in build output'unu kontrol et — `dist/` mi `build/` mi?

```bash
grep "outDir\|compilerOptions" backend/tsconfig.json | head -5
```

### 2.2 docker-compose.prod.yml

Proje root'unda:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: akis_v2
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-postgres}@db:5432/akis_v2
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    # .env dosyası host'ta olmalı, container'a mount edilmeli
    env_file:
      - ./backend/.env

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./frontend/dist:/var/www/html
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

### 2.3 Caddyfile

```
# Caddyfile
staging.akisflow.com {
  # Frontend SPA
  root * /var/www/html
  try_files {path} /index.html
  file_server

  # Backend API proxy
  handle /api/* {
    reverse_proxy backend:3000
  }

  # SSE için timeout kaldır
  handle /api/pipelines/*/stream {
    reverse_proxy backend:3000 {
      flush_interval -1
    }
  }
}
```

### 2.4 Frontend build

```bash
cd frontend && npm run build
ls -la frontend/dist/ | head -10
# dist/ klasörü oluşmalı
```

### 2.5 Deploy script

```bash
# deploy.sh
#!/bin/bash
set -euo pipefail

echo "[AKIS] Building frontend..."
cd frontend && npm run build && cd ..

echo "[AKIS] Starting production stack..."
docker compose -f docker-compose.prod.yml up -d --build

echo "[AKIS] Waiting for health check..."
sleep 10
curl -sf http://localhost:3000/health && echo "✓ Backend OK" || echo "✗ Backend FAIL"

echo "[AKIS] Deploy complete!"
echo "  → https://staging.akisflow.com"
```

### Doğrula

```bash
# Docker compose syntax check
docker compose -f docker-compose.prod.yml config > /dev/null 2>&1 && echo "✓ Compose valid" || echo "✗ Compose invalid"

# Dockerfile syntax — build test (image oluşturma, push etmeden)
cd backend && docker build -t akis-backend:test . 2>&1 | tail -5
```

---

## ADIM 3 — BUILD KONTROL

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FE" || echo "✗ FE"
cd ../backend && npx tsc --noEmit && echo "✓ BE typecheck" || echo "✗ BE"
cd backend && npx vitest run 2>&1 | tail -5
```

```
## Backend Test + Deploy Hazırlık Raporu

### Test Fix
- Düzeltilen test dosyası: ___
- Backend test sonucu: ___/___

### Deploy Dosyaları
- Dockerfile: ✓/✗
- docker-compose.prod.yml: ✓/✗
- Caddyfile: ✓/✗
- deploy.sh: ✓/✗
- Frontend dist build: ✓/✗
- Compose config valid: ✓/✗

### Build
- Frontend: ✓/✗
- Backend: ✓/✗
```
