# AKIS Platform OCI Deployment Runbook

Bu belge, AKIS Platform'un Oracle Cloud Infrastructure (OCI) Free Tier üzerinde staging ve production ortamlarına deployment işlemlerini adım adım açıklar.

---

## 📋 İçindekiler

1. [İlk Kurulum (First-Time Provisioning)](#ilk-kurulum)
2. [Rutin Deployment Checklist](#rutin-deployment-checklist)
3. [Environment Variables](#environment-variables)
4. [Database Migrations](#database-migrations)
5. [Smoke Tests](#smoke-tests)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Rollback Prosedürü](#rollback-prosedürü)
8. [Troubleshooting](#troubleshooting)

---

## 🆕 İlk Kurulum

### OCI VM Provisioning Checklist

- [ ] **1. OCI Account Setup**
  - OCI Free Tier hesabı oluştur
  - Compartment oluştur: `akis-platform`
  - VCN (Virtual Cloud Network) oluştur

- [ ] **2. Compute Instance Oluştur**
  - Shape: `VM.Standard.A1.Flex` (ARM64)
  - OCPUs: 4
  - Memory: 24 GB
  - Image: Oracle Linux 8 veya Ubuntu 22.04
  - Boot Volume: 100 GB

- [ ] **3. Network Security Rules**
  - Ingress: TCP 80 (HTTP)
  - Ingress: TCP 443 (HTTPS)
  - Ingress: TCP 22 (SSH - sadece belirli IP'lerden)
  - Egress: Tüm trafiğe izin ver

- [ ] **4. SSH Key Pair**
  ```bash
  # Local'de key oluştur
  ssh-keygen -t ed25519 -f ~/.ssh/akis-oci -C "akis-deploy"
  
  # Public key'i OCI'a ekle (instance oluştururken)
  cat ~/.ssh/akis-oci.pub
  ```

- [ ] **5. VM'e Bağlan ve Temel Kurulum**
  ```bash
  ssh -i ~/.ssh/akis-oci opc@<VM_PUBLIC_IP>
  
  # Update system
  sudo dnf update -y
  
  # Install Docker
  sudo dnf install -y docker
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER
  
  # Install Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
  # Logout and login for docker group
  exit
  ```

- [ ] **6. Deployment Dizin Yapısı**
  ```bash
  sudo mkdir -p /opt/akis/{frontend,backups,logs}
  sudo chown -R $USER:$USER /opt/akis
  chmod 755 /opt/akis
  ```

- [ ] **7. GitHub Container Registry Auth**
  ```bash
  # GitHub PAT ile login (read:packages scope)
  echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
  ```

- [ ] **8. Environment File Oluştur**
  ```bash
  # Staging
  cat > /opt/akis/.env << 'EOF'
  # Core
  NODE_ENV=production
  
  # Database
  POSTGRES_USER=akis
  POSTGRES_PASSWORD=<GENERATE_SECURE_PASSWORD>
  POSTGRES_DB=akis_staging
  DATABASE_URL=postgresql://akis:<PASSWORD>@db:5432/akis_staging
  
  # Auth
  AUTH_JWT_SECRET=<GENERATE_256_BIT_SECRET>
  AUTH_COOKIE_SECURE=false
  
  # URLs
  BACKEND_URL=https://staging.akis.dev/api
  FRONTEND_URL=https://staging.akis.dev
  CORS_ORIGINS=https://staging.akis.dev
  
  # AI (optional)
  AI_PROVIDER=mock
  EOF
  
  chmod 600 /opt/akis/.env
  ```

- [ ] **9. DNS Ayarları**
  - `staging.akis.dev` → VM Public IP
  - `akis.dev` → VM Public IP (production için)

- [ ] **10. İlk Deployment**
  ```bash
  cd /opt/akis
  docker compose up -d
  
  # Health check
  curl -f http://localhost/health
  ```

### GitHub Secrets Yapılandırması

Repository Settings → Secrets and Variables → Actions:

**Staging Secrets:**
| Secret Name | Açıklama |
|-------------|----------|
| `STAGING_HOST` | Staging VM public IP |
| `STAGING_USER` | SSH kullanıcı adı (örn: opc) |
| `STAGING_SSH_KEY` | Private SSH key içeriği |
| `STAGING_DATABASE_URL` | PostgreSQL connection string |
| `STAGING_JWT_SECRET` | JWT signing secret |

**Production Secrets:**
| Secret Name | Açıklama |
|-------------|----------|
| `PROD_HOST` | Production VM public IP |
| `PROD_USER` | SSH kullanıcı adı |
| `PROD_SSH_KEY` | Private SSH key içeriği |
| `PROD_DATABASE_URL` | PostgreSQL connection string |
| `PROD_JWT_SECRET` | JWT signing secret |
| `PROD_AI_API_KEY` | OpenRouter/OpenAI API key |

### GitHub Environments Yapılandırması

Repository Settings → Environments:

**staging:**
- Protection rules: None (auto-deploy on main)
- Deployment branches: `main` only

**production:**
- Protection rules: Required reviewers (1 approval)
- Deployment branches: Tags matching `v*.*.*`
- Wait timer: 5 minutes (optional)

---

## ✅ Rutin Deployment Checklist

### Staging Deploy (Otomatik)

Staging deployment, `main` branch'e merge yapıldığında otomatik olarak tetiklenir.

**Pre-merge Checklist:**
- [ ] CI pipeline geçti (typecheck, lint, test)
- [ ] PR review onaylandı
- [ ] Breaking change varsa migration yazıldı

**Post-deploy Verification:**
- [ ] `https://staging.akis.dev/health` → `{"status":"ok"}`
- [ ] `https://staging.akis.dev/ready` → `{"ready":true}`
- [ ] `https://staging.akis.dev/version` → Correct version
- [ ] Login flow çalışıyor
- [ ] Scribe agent test job çalıştır

### Production Deploy (Manuel)

**Pre-deploy Checklist:**
- [ ] Staging'de en az 24 saat test edildi
- [ ] Smoke testler geçti
- [ ] Release notes hazırlandı
- [ ] Database backup alındı (otomatik)

**Deploy Steps:**
1. GitHub'da yeni release oluştur (tag: `v1.2.3`)
2. Release description'a değişiklikleri yaz
3. "Publish release" tıkla
4. GitHub Actions workflow'u onay bekler
5. Environment protection approval ver
6. Deploy tamamlanana kadar bekle
7. Post-deploy verification

**Post-deploy Verification:**
- [ ] `https://akis.dev/health` → `{"status":"ok"}`
- [ ] `https://akis.dev/ready` → `{"ready":true}`
- [ ] `https://akis.dev/version` → Released version
- [ ] Login/signup flow çalışıyor
- [ ] Dashboard yükleniyor
- [ ] Scribe agent test job çalıştır

---

## 🔐 Environment Variables

### Production Zorunlu Değişkenler

```bash
# Core
NODE_ENV=production

# Database
DATABASE_URL=postgresql://akis:<password>@db:5432/akis_prod
POSTGRES_USER=akis
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=akis_prod

# Auth - CRITICAL
AUTH_JWT_SECRET=<256-bit-secret>
AUTH_COOKIE_SECURE=true  # MUST be true in production
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_NAME=akis_sid

# URLs
BACKEND_URL=https://akis.dev/api
FRONTEND_URL=https://akis.dev
CORS_ORIGINS=https://akis.dev

# AI
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-...
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free
```

### Staging Önerilen Değişkenler

```bash
# Core
NODE_ENV=production
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://akis:<password>@db:5432/akis_staging

# Auth
AUTH_JWT_SECRET=<different-from-prod>
AUTH_COOKIE_SECURE=false  # Can be false for staging

# URLs
BACKEND_URL=https://staging.akis.dev/api
FRONTEND_URL=https://staging.akis.dev
CORS_ORIGINS=https://staging.akis.dev

# AI (mock for cost savings)
AI_PROVIDER=mock

# Rate limiting (relaxed)
RATE_LIMIT_MAX=200
```

### Secret Oluşturma

```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# Database Password
openssl rand -base64 24 | tr -d '/+='
```

---

## 🗄️ Database Migrations

### Migration Policy

- **Forward-only**: Rollback migration yazılmaz
- **Atomic**: Her migration tek transaction
- **Tested**: CI'da doğrulanır

### Migration Çalıştırma

```bash
# SSH ile VM'e bağlan
ssh -i ~/.ssh/akis-oci opc@<VM_IP>

# Container içinde migration çalıştır
cd /opt/akis
docker compose run --rm backend pnpm db:migrate
```

### Emergency Migration Rollback

> ⚠️ Dikkat: Schema rollback yapmak yerine yeni migration ekleyin.

Kritik durumlarda backup'tan restore:

```bash
# Son backup'ı bul
ls -la /opt/akis/backups/

# Restore (tüm verileri kaybedersiniz!)
docker exec -i akis-prod-db psql -U akis akis_prod < /opt/akis/backups/<backup-file>.sql
```

---

## 🧪 Smoke Tests

### Minimal Smoke Test (Her Deploy Sonrası)

```bash
# Health check
curl -sf https://akis.dev/health
# Expected: {"status":"ok","timestamp":"..."}

# Readiness check
curl -sf https://akis.dev/ready
# Expected: {"ready":true,"database":"connected","timestamp":"..."}

# Version check
curl -sf https://akis.dev/version
# Expected: {"version":"1.2.3","commit":"abc1234",...}

# Frontend yükleniyor mu?
curl -sf https://akis.dev/ | head -20
# Expected: HTML with <title>AKIS Platform</title>
```

### Auth Flow Smoke Test

```bash
# 1. Signup başlat
curl -X POST https://akis.dev/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
# Expected: 200 or 409 (email in use)

# 2. Login başlat
curl -X POST https://akis.dev/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Expected: 200 or 404 (user not found)
```

### Agent Job Smoke Test

```bash
# Not: Auth gerektirir, manual test için dashboard kullanın

# 1. Dashboard'a login ol
# 2. Scribe Console'a git
# 3. Test repository seç
# 4. "Dry Run" modu aktif olduğundan emin ol
# 5. "Run Scribe" tıkla
# 6. Job durumunu izle (completed veya failed)
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints

| Endpoint | Amaç | Başarı Kriteri |
|----------|------|----------------|
| `/health` | Liveness | HTTP 200 |
| `/ready` | Readiness (DB) | HTTP 200, `ready: true` |
| `/version` | Build info | Correct version |

### Log İnceleme

```bash
# Backend logs
docker compose logs backend --tail=100 -f

# Database logs
docker compose logs db --tail=50

# Caddy (proxy) logs
docker compose logs caddy --tail=50

# Tüm servisler
docker compose logs --tail=100 -f
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
df -h /opt/akis

# Memory usage
free -h

# Process list
htop
```

### Uptime Monitoring (External)

Önerilen servisler:
- UptimeRobot (ücretsiz)
- Pingdom
- Better Uptime

Check endpoints:
- `https://akis.dev/health` (1 dakika interval)
- `https://akis.dev/ready` (5 dakika interval)

---

## ⏪ Rollback Prosedürü

### Otomatik Rollback (CI/CD)

GitHub Actions workflow, health check başarısız olursa otomatik rollback yapar:

1. Deploy tamamlanır
2. 30 saniye beklenir
3. `/health` ve `/ready` kontrol edilir
4. Başarısız ise önceki image'a rollback

### Manuel Rollback

```bash
# SSH ile VM'e bağlan
ssh -i ~/.ssh/akis-oci opc@<VM_IP>

cd /opt/akis

# Mevcut versiyonu kontrol et
docker compose ps
docker inspect akis-prod-backend --format '{{.Config.Image}}'

# Önceki versiyona rollback
export BACKEND_VERSION=v1.1.0  # Hedef versiyon
docker compose pull backend
docker compose up -d backend

# Verify
curl -sf https://akis.dev/version
```

### Database Rollback (Son Çare)

> ⚠️ Dikkat: Bu işlem veri kaybına neden olabilir!

```bash
# 1. Servisleri durdur
docker compose stop backend

# 2. Backup listesi
ls -la /opt/akis/backups/

# 3. Uygun backup'ı seç ve restore et
docker exec -i akis-prod-db psql -U akis akis_prod < /opt/akis/backups/prod-pre-deploy-v1.2.0-20240109-120000.dump

# 4. Backend'i başlat
docker compose up -d backend

# 5. Verify
curl -sf https://akis.dev/ready
```

---

## 🔧 Troubleshooting

### Yaygın Sorunlar

#### 1. Health Check Failing

**Belirti:** `/health` veya `/ready` 503 dönüyor

**Çözüm:**
```bash
# Logs kontrol
docker compose logs backend --tail=50

# Container durumu
docker compose ps

# Restart
docker compose restart backend
```

#### 2. Database Connection Error

**Belirti:** `ready: false, database: disconnected`

**Çözüm:**
```bash
# DB container durumu
docker compose ps db

# DB logs
docker compose logs db --tail=30

# DB bağlantı testi
docker exec akis-prod-db pg_isready -U akis

# Restart DB
docker compose restart db
```

#### 3. SSL/HTTPS Sorunu

**Belirti:** Browser'da sertifika hatası

**Çözüm:**
```bash
# Caddy logs
docker compose logs caddy

# SSL sertifikası yenile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

#### 4. Out of Memory

**Belirti:** Container'lar crash oluyor

**Çözüm:**
```bash
# Memory kullanımı
docker stats --no-stream

# Swap ekle (gerekirse)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Container limitleri kontrol
docker compose config | grep memory
```

#### 5. Disk Full

**Belirti:** Write error, container başlamıyor

**Çözüm:**
```bash
# Disk kullanımı
df -h

# Docker cleanup
docker system prune -af --volumes

# Eski backupları sil
find /opt/akis/backups -name "*.dump" -mtime +7 -delete
```

### Acil İletişim

| Durum | Aksiyon |
|-------|---------|
| Site tamamen çöktü | Rollback + alert |
| DB erişilemiyor | DB container restart |
| SSL hatası | Caddy reload |
| Memory/CPU spike | Resource monitoring + scale |

---

## 📚 İlgili Belgeler

- [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md) - Deployment mimarisi
- [ENV_SETUP.md](../ENV_SETUP.md) - Environment variables
- [constraints.md](../constraints.md) - OCI Free Tier kısıtları
- [CONTEXT_ARCHITECTURE.md](../../.cursor/context/CONTEXT_ARCHITECTURE.md) - Mimari kararlar

---

## 📝 Değişiklik Geçmişi

| Tarih | Versiyon | Açıklama |
|-------|----------|----------|
| 2026-01-09 | 1.0.0 | İlk versiyon |
