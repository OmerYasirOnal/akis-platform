# AKIS Platform Deployment Strategy

Bu belge AKIS Platform'un OCI (Oracle Cloud Infrastructure) Free Tier üzerindeki deployment mimarisini, ortam ayrımını, release stratejisini ve operasyonel garantileri tanımlar.

---

## 📋 İçindekiler

1. [Mimari Genel Bakış](#mimari-genel-bakış)
2. [Ortam Ayrımı](#ortam-ayrımı)
3. [Environment Variables](#environment-variables)
4. [Release Stratejisi](#release-stratejisi)
5. [Health Checks & Monitoring](#health-checks--monitoring)
6. [Database Migrations](#database-migrations)
7. [Rollback Stratejisi](#rollback-stratejisi)
8. [Security Considerations](#security-considerations)

---

## 🏗️ Mimari Genel Bakış

AKIS Platform, **modüler monolith** mimarisi ile tasarlanmıştır:

```
┌─────────────────────────────────────────────────────────────┐
│                     OCI Free Tier VM                        │
│                    (ARM64, 4 OCPU, 24GB RAM)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Caddy     │────▶│   Backend   │────▶│ PostgreSQL  │   │
│  │   (Proxy)   │     │  (Fastify)  │     │   (5433)    │   │
│  │   :80/443   │     │   :3000     │     │             │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │  Frontend   │                                           │
│  │   (SPA)     │                                           │
│  │  /static/   │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bileşenler

| Bileşen | Teknoloji | Port | Açıklama |
|---------|-----------|------|----------|
| **Reverse Proxy** | Caddy | 80/443 | HTTPS termination, static serving, API routing |
| **Backend** | Fastify + TypeScript | 3000 | REST API, Agent orchestration |
| **Frontend** | React + Vite (SPA) | - | Static dosyalar Caddy tarafından sunulur |
| **Database** | PostgreSQL 16 | 5433 | Persistent data storage |
| **MCP Gateway** | Node.js | 4010 | GitHub/Jira/Confluence entegrasyonları |

### OCI Free Tier Kısıtları

- **Compute**: 4 OCPU, 24GB RAM (ARM64 Ampere A1)
- **Storage**: 200GB boot volume
- **Network**: 10TB outbound/month
- **Always Free**: Object Storage, Load Balancer (10Mbps)

> ⚠️ **Önemli**: Tüm servisler tek VM üzerinde çalışır. Kubernetes **kullanılmaz**.

---

## 🌍 Ortam Ayrımı

### Ortamlar

| Ortam | Domain | Amaç | Deploy Trigger |
|-------|--------|------|----------------|
| **Development** | `localhost` | Local geliştirme | Manuel |
| **Staging** | `staging.akis.dev` | Pre-production test | `main` branch merge |
| **Production** | `akis.dev` | Canlı sistem | Semver tag/release |

### Staging vs Production Farkları

| Özellik | Staging | Production |
|---------|---------|------------|
| Database | Ayrı Postgres instance | Ayrı Postgres instance |
| Domain | `staging.akis.dev` | `akis.dev` |
| SSL | Let's Encrypt (staging) | Let's Encrypt (prod) |
| Auth Cookie Secure | `false` (optional) | `true` (zorunlu) |
| Rate Limiting | Gevşek | Sıkı |
| Log Level | `debug` | `info` |
| AI Provider | Mock veya OpenRouter | OpenRouter |

### Network Isolation

```
┌─────────────────────────────────────────┐
│              Staging                     │
│  ┌──────────┐  ┌──────────┐             │
│  │ staging- │  │ staging- │             │
│  │ backend  │──│    db    │             │
│  └──────────┘  └──────────┘             │
│       │                                  │
│  staging-network (172.20.0.0/16)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              Production                  │
│  ┌──────────┐  ┌──────────┐             │
│  │   prod-  │  │   prod-  │             │
│  │  backend │──│    db    │             │
│  └──────────┘  └──────────┘             │
│       │                                  │
│  prod-network (172.21.0.0/16)           │
└─────────────────────────────────────────┘
```

> ⚠️ **Kritik**: Staging ve Production **asla** aynı database volume'unu paylaşmaz.

---

## 🔐 Environment Variables

### Environment Parity Prensibi

Ortamlar arası fark **sadece environment variables** ile sağlanır. Kod değişikliği gerekmez.

### Zorunlu Değişkenler

| Değişken | Açıklama | Staging | Production |
|----------|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Staging DB | Prod DB |
| `AUTH_JWT_SECRET` | JWT signing key (256-bit+) | Unique | Unique |
| `AUTH_COOKIE_SECURE` | HTTPS-only cookie | `false` | `true` |
| `BACKEND_URL` | Backend API URL | `https://staging.akis.dev/api` | `https://akis.dev/api` |
| `FRONTEND_URL` | Frontend SPA URL | `https://staging.akis.dev` | `https://akis.dev` |
| `CORS_ORIGINS` | İzin verilen origins | `https://staging.akis.dev` | `https://akis.dev` |

### İsteğe Bağlı Değişkenler

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `NODE_ENV` | `production` | Çalışma modu |
| `PORT` | `3000` | Backend port |
| `LOG_LEVEL` | `info` | Pino log seviyesi |
| `RATE_LIMIT_MAX` | `100` | Dakika başına maksimum istek |
| `AI_PROVIDER` | `mock` | AI provider (mock/openrouter/openai) |
| `AI_API_KEY` | - | AI API key |
| `GITHUB_MCP_BASE_URL` | - | MCP Gateway URL |

### Secret Yönetimi

```bash
# ❌ YANLIŞ - Secrets'ı commit etme
echo "AUTH_JWT_SECRET=supersecret" >> .env

# ✅ DOĞRU - GitHub Secrets kullan
# Repository Settings → Secrets → Actions
# - STAGING_DATABASE_URL
# - STAGING_JWT_SECRET
# - PROD_DATABASE_URL
# - PROD_JWT_SECRET
```

### .env Dosya Hiyerarşisi

```
1. Shell environment (export VAR=value)     ← En yüksek öncelik
2. /app/.env.local                          ← Container-specific overrides
3. /app/.env                                ← Default values
```

---

## 🚀 Release Stratejisi

### Branch Model

```
main (protected)
  │
  ├── feat/feature-name
  │     └── PR → main (CI pass required)
  │
  └── tags: v1.0.0, v1.1.0, etc.
```

### Deploy Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. feature branch → PR → CI (typecheck, lint, test, build) │
│                          ↓                                   │
│  2. PR merge → main → AUTO-DEPLOY → Staging                 │
│                          ↓                                   │
│  3. QA on staging → Create release (v1.2.3)                 │
│                          ↓                                   │
│  4. Tag push → MANUAL APPROVAL → Production                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Staging Deploy (Otomatik)

- **Trigger**: `main` branch'e merge
- **Adımlar**:
  1. CI pipeline (typecheck, lint, test, build)
  2. Docker image build
  3. SSH ile OCI VM'e deploy
  4. Database migration (forward-only)
  5. Health check verification
  6. Rollback on failure

### Production Deploy (Manuel Onay)

- **Trigger**: Semver tag (v1.2.3) veya GitHub Release
- **Adımlar**:
  1. Environment protection approval
  2. Database backup
  3. Docker image build (production optimizations)
  4. SSH ile OCI VM'e deploy
  5. Database migration
  6. Health check verification
  7. Rollback on failure
  8. Deploy artifact storage (QA evidence)

### Semantic Versioning

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes
MINOR: New features (backwards compatible)
PATCH: Bug fixes
```

---

## 💓 Health Checks & Monitoring

### Endpoint'ler

| Endpoint | Amaç | Auth | Response |
|----------|------|------|----------|
| `GET /health` | Liveness check | ❌ | `{ "status": "ok" }` |
| `GET /ready` | Readiness (DB check) | ❌ | `{ "ready": true, "database": "connected" }` |
| `GET /version` | Build info | ❌ | `{ "version": "1.2.3", "commit": "abc123", "buildTime": "..." }` |

### CI/CD Health Verification

```bash
# Deploy sonrası health check
curl -f https://staging.akis.dev/health || exit 1
curl -f https://staging.akis.dev/ready || exit 1

# Version doğrulama
DEPLOYED_VERSION=$(curl -s https://staging.akis.dev/version | jq -r '.version')
EXPECTED_VERSION="1.2.3"
[ "$DEPLOYED_VERSION" = "$EXPECTED_VERSION" ] || exit 1
```

### Monitoring Signals

| Signal | Check Method | Alert Threshold |
|--------|--------------|-----------------|
| Liveness | `GET /health` | 3 consecutive failures |
| Readiness | `GET /ready` | 1 failure |
| Response Time | Caddy logs | p95 > 2s |
| Error Rate | Application logs | > 1% 5xx responses |

---

## 🗄️ Database Migrations

### Migration Policy

| Kural | Açıklama |
|-------|----------|
| **Forward-Only** | Rollback migration'ları yazılmaz; gerekirse yeni migration eklenir |
| **Pre-Deploy Backup** | Production deploy öncesi otomatik backup |
| **Atomic** | Her migration tek transaction içinde çalışır |
| **Tested** | Migration'lar CI'da test DB üzerinde doğrulanır |

### Migration Workflow

```bash
# 1. Local'de migration oluştur
pnpm -C backend db:generate

# 2. Migration'ı commit et
git add backend/migrations/
git commit -m "chore(db): add users table"

# 3. CI'da test edilir
# 4. Staging'e deploy edilir (auto-migrate)
# 5. Production'a deploy edilir (auto-migrate with backup)
```

### Backup Strategy

```bash
# Production backup (deploy öncesi)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup retention: 7 gün
# Storage: OCI Object Storage (Always Free)
```

---

## ⏪ Rollback Stratejisi

### Image-Based Rollback

```bash
# Önceki image'a rollback
docker compose -f docker-compose.prod.yml pull backend:v1.1.0
docker compose -f docker-compose.prod.yml up -d backend
```

### Automatic Rollback (CI/CD)

```yaml
# deploy-staging.yml örneği
- name: Health Check
  run: |
    for i in {1..30}; do
      curl -f $HEALTH_URL && exit 0
      sleep 2
    done
    exit 1
    
- name: Rollback on Failure
  if: failure()
  run: |
    ssh $HOST "cd /app && docker compose pull backend:$PREVIOUS_VERSION && docker compose up -d"
```

### Database Rollback

> ⚠️ **Forward-only migrations**: Database schema rollback yapılmaz.

Veri kaybı durumunda:
1. Backup'tan restore
2. Yeni migration ile düzeltme
3. Hotfix deploy

```bash
# Backup'tan restore (son çare)
psql $DATABASE_URL < backup-20240109-120000.sql
```

### Rollback Checklist

1. [ ] Health check failing?
2. [ ] Error logs kontrol edildi mi?
3. [ ] Previous version belirle
4. [ ] Rollback komutu çalıştır
5. [ ] Health check doğrula
6. [ ] Incident report oluştur

---

## 🔒 Security Considerations

### Production Security Checklist

| Öğe | Durum | Açıklama |
|-----|-------|----------|
| `AUTH_COOKIE_SECURE=true` | Zorunlu | HTTPS-only cookies |
| `CORS_ORIGINS` | Spesifik | Wildcard kullanma |
| Rate Limiting | Aktif | 100 req/min default |
| Helmet Headers | Aktif | CSP, X-Frame-Options, etc. |
| SSL/TLS | Let's Encrypt | Caddy otomatik yönetir |
| Secrets | GitHub Secrets | .env commit edilmez |

### Network Security

```
Internet
    │
    ▼
┌─────────┐
│ Firewall│ ← Only 80/443 open
└────┬────┘
     │
     ▼
┌─────────┐
│  Caddy  │ ← SSL termination
└────┬────┘
     │ (internal network)
     ▼
┌─────────┐
│ Backend │ ← Port 3000 (internal only)
└────┬────┘
     │
     ▼
┌─────────┐
│   DB    │ ← Port 5433 (internal only)
└─────────┘
```

### Secret Rotation

| Secret | Rotation Period | Method |
|--------|-----------------|--------|
| JWT Secret | 90 gün | GitHub Secret update + deploy |
| Database Password | 90 gün | ALTER USER + env update |
| AI API Key | İhtiyaç halinde | GitHub Secret update |

---

## 📚 İlgili Belgeler

- [RUNBOOK_OCI.md](./RUNBOOK_OCI.md) - Adım adım deployment rehberi
- [ENV_SETUP.md](../ENV_SETUP.md) - Environment variables detayları
- [constraints.md](../constraints.md) - OCI Free Tier kısıtları
- [CONTEXT_ARCHITECTURE.md](../../.cursor/context/CONTEXT_ARCHITECTURE.md) - Mimari kararlar

---

## 📝 Değişiklik Geçmişi

| Tarih | Versiyon | Açıklama |
|-------|----------|----------|
| 2026-01-09 | 1.0.0 | İlk versiyon |
