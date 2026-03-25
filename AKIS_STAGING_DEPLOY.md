# AKIS — STAGING DEPLOY (OCI ARM64)

.env dosyalarına ASLA dokunma. Sunucu bilgilerini Yasir'dan al.

---

## AMAÇ

AKIS'i OCI ARM64 sunucusuna deploy et. `staging.akisflow.com` üzerinden erişilebilir olmalı.

---

## ADIM 0 — MEVCUT DEPLOY YAPISINI ANLA

```bash
# Deploy dosyaları nerede?
find . -name "docker-compose*" -not -path "*/node_modules/*" | head -10
find . -name "Dockerfile*" -not -path "*/node_modules/*" | head -10
find . -name "Caddyfile*" -not -path "*/node_modules/*" | head -10
find . -name "deploy*" -not -path "*/node_modules/*" | head -10
ls deploy/ 2>/dev/null
ls deploy/oci/ 2>/dev/null
ls deploy/oci/staging/ 2>/dev/null

# Mevcut compose dosyasını oku
cat deploy/oci/staging/docker-compose.yml 2>/dev/null || cat docker-compose.prod.yml 2>/dev/null
cat deploy/oci/staging/deploy.sh 2>/dev/null

# Backend Dockerfile
cat backend/Dockerfile

# Caddy config
find . -name "Caddyfile" -not -path "*/node_modules/*" | xargs cat 2>/dev/null
```

---

## ADIM 1 — FRONTEND PROD BUILD

```bash
cd frontend
npm run build
echo "Frontend dist size:"
du -sh dist/
ls dist/ | head -10
```

---

## ADIM 2 — DEPLOY DOSYALARINI KONTROL ET VE GÜNCELLE

### 2.1 docker-compose staging dosyası

Mevcut dosyayı oku. Şunları kontrol et:
- `db` service: PostgreSQL, volume, healthcheck
- `backend` service: Dockerfile build, env vars, depends_on db
- `caddy` service: ports 80/443, Caddyfile mount, frontend dist mount
- Network: hepsi aynı network'te

Eksik veya yanlış olan varsa düzelt.

### 2.2 Caddyfile

```
staging.akisflow.com {
    # Frontend SPA
    root * /var/www/html
    try_files {path} /index.html
    file_server

    # Backend API
    handle /api/* {
        reverse_proxy backend:3000
    }

    # SSE için buffer kapatma
    handle /api/pipelines/*/stream {
        reverse_proxy backend:3000 {
            flush_interval -1
        }
    }

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

### 2.3 Backend Dockerfile kontrol

```bash
cat backend/Dockerfile
# Multi-stage build olmalı
# ARM64 uyumlu base image (node:20-alpine ARM destekler)
# Non-root user
# Healthcheck
```

### 2.4 Deploy script

```bash
cat deploy/oci/staging/deploy.sh 2>/dev/null
```

Deploy script şunları yapmalı:
1. Frontend build (local)
2. Git push
3. SSH ile sunucuya bağlan
4. Git pull
5. Docker compose build + up
6. Health check
7. Sonuç bildir

---

## ADIM 3 — .env.production HAZIRLA

**DİKKAT:** .env dosyalarına DOKUNMA. Ama sunucuda gerekli env vars listesini hazırla.

`docs/ENV_PRODUCTION.md` oluştur:

```markdown
# Production Environment Variables

Sunucuda `backend/.env` dosyasına şunlar yazılmalı:

```
DATABASE_URL=postgresql://postgres:GÜÇLÜ_ŞİFRE@db:5432/akis_v2
ANTHROPIC_API_KEY=sk-ant-api03-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=RASTGELE_UZUN_STRING
NODE_ENV=production
PORT=3000
AUTH_COOKIE_SECURE=true
```

**ÖNEMLİ:** Bu değerleri Yasir sunucuda manuel girecek.
```

---

## ADIM 4 — DEPLOY SCRIPT'İ GÜNCELLE

Mevcut deploy script'i yoksa veya eskiyse, güncel hale getir:

```bash
#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════
# AKIS Staging Deploy
# Usage: ./deploy.sh
# ═══════════════════════════════════════

SSH_USER="${AKIS_SSH_USER:-opc}"
SSH_HOST="${AKIS_SSH_HOST}"
SSH_KEY="${AKIS_SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="/home/$SSH_USER/akis"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[AKIS]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SSH_HOST"

# ── 1. Pre-checks ──
[ -z "${SSH_HOST:-}" ] && err "AKIS_SSH_HOST ayarlanmamış. export AKIS_SSH_HOST=IP_ADRESI"

log "SSH bağlantısı test ediliyor..."
$SSH_CMD "echo 'SSH OK'" || err "SSH bağlantısı başarısız"
ok "SSH bağlantısı kuruldu"

# ── 2. Local: Frontend build ──
log "Frontend build ediliyor..."
cd frontend && npm run build && cd ..
ok "Frontend build tamam ($(du -sh frontend/dist | cut -f1))"

# ── 3. Local: Git push ──
log "Git push ediliyor..."
git add -A
git commit -m "deploy: staging $(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
git push origin main 2>/dev/null || log "Git push atlandı (zaten güncel)"

# ── 4. Remote: Pull & Deploy ──
log "Sunucuya deploy ediliyor..."

$SSH_CMD << 'REMOTE_SCRIPT'
set -euo pipefail

cd ~/akis 2>/dev/null || { mkdir -p ~/akis; cd ~/akis; }

# Git pull
if [ -d .git ]; then
  git pull origin main
else
  git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git .
fi

# Docker compose komutu
DC="docker compose"
command -v docker-compose >/dev/null 2>&1 && DC="docker-compose"

# Frontend dist kopyala (local'de build edildi, git'ten geldi)
echo "[AKIS] Frontend dist kontrol..."
[ -d frontend/dist ] && echo "  ✓ frontend/dist mevcut" || { echo "  ! frontend/dist yok, sunucuda build ediliyor..."; cd frontend && npm ci && npm run build && cd ..; }

# Backend build
echo "[AKIS] Backend Docker image build ediliyor..."
$DC -f deploy/oci/staging/docker-compose.yml build backend 2>&1 | tail -5

# Deploy
echo "[AKIS] Servisler başlatılıyor..."
$DC -f deploy/oci/staging/docker-compose.yml down --remove-orphans 2>/dev/null || true
$DC -f deploy/oci/staging/docker-compose.yml up -d

# Health check
echo "[AKIS] Health check bekleniyor..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "[✓] Backend sağlıklı"
    break
  fi
  [ "$i" -eq 20 ] && { echo "[✗] Health check başarısız"; $DC -f deploy/oci/staging/docker-compose.yml logs backend --tail 30; exit 1; }
  sleep 3
done

$DC -f deploy/oci/staging/docker-compose.yml ps
echo ""
echo "[✓] Deploy tamamlandı!"
echo "    https://staging.akisflow.com"
REMOTE_SCRIPT

ok "Deploy tamamlandı!"
echo ""
echo "  🌐 https://staging.akisflow.com"
echo ""
```

`chmod +x deploy.sh`

---

## ADIM 5 — DEPLOY ÖNCESİ CHECKLIST

```bash
echo "=== DEPLOY ÖNCESİ CHECKLIST ==="

# 1. Frontend build var mı?
[ -d frontend/dist ] && echo "✓ frontend/dist mevcut" || echo "✗ frontend/dist YOK"

# 2. Backend typecheck
cd backend && npx tsc --noEmit && echo "✓ Backend typecheck" || echo "✗ Backend typecheck"

# 3. Docker compose valid mi?
COMPOSE=$(find . -path "*/staging/docker-compose.yml" -o -name "docker-compose.prod.yml" | head -1)
docker compose -f "$COMPOSE" config > /dev/null 2>&1 && echo "✓ Compose valid ($COMPOSE)" || echo "✗ Compose invalid"

# 4. Dockerfile build test
cd backend && docker build -t akis-backend:test . 2>&1 | tail -3 && echo "✓ Docker build" || echo "✗ Docker build"

# 5. Git clean
cd .. && [ -z "$(git status --porcelain)" ] && echo "✓ Git clean" || echo "⚠ Uncommitted changes: $(git status --porcelain | wc -l) files"

# 6. Caddyfile var mı?
CADDY=$(find . -name "Caddyfile" -not -path "*/node_modules/*" | head -1)
[ -n "$CADDY" ] && echo "✓ Caddyfile ($CADDY)" || echo "✗ Caddyfile YOK"

echo ""
echo "Checklist tamamlandı. Sorun varsa düzelt, yoksa deploy'a hazır."
```

---

## ADIM 6 — RAPOR

```
## Staging Deploy Hazırlık Raporu

### Dosyalar
- docker-compose.yml: ✓/✗ (path: ___)
- Dockerfile: ✓/✗
- Caddyfile: ✓/✗
- deploy.sh: ✓/✗
- docs/ENV_PRODUCTION.md: ✓/✗

### Build
- Frontend dist: ✓/✗ (boyut: ___)
- Backend typecheck: ✓/✗
- Docker build test: ✓/✗
- Compose config valid: ✓/✗

### Git
- Tüm değişiklikler committed: ✓/✗
- Push: ✓/✗

### Deploy Komutu
Yasir'ın çalıştırması gereken:
```
export AKIS_SSH_HOST=SUNUCU_IP
export AKIS_SSH_USER=opc
./deploy.sh
```

### Sunucuda Yasir'ın yapması gereken:
1. `backend/.env` dosyasını oluştur (docs/ENV_PRODUCTION.md'deki değerlerle)
2. `./deploy.sh` çalıştır
3. `https://staging.akisflow.com` kontrol et
```
