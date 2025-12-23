# Development Setup Guide

Bu belge AKIS Platform için geliştirme ortamı kurulumunu açıklar.

> 📖 **Canonical Reference**: Detaylı local dev adımları için [docs/local-dev/LOCAL_DEV_QUICKSTART.md](docs/local-dev/LOCAL_DEV_QUICKSTART.md) belgesine bakın.

---

## 🔧 Portlar ve Servisler

| Servis     | Port  | Açıklama                          |
|------------|-------|-----------------------------------|
| Frontend   | 5173  | Vite dev server (React SPA)       |
| Backend    | 3000  | Fastify API server                |
| PostgreSQL | 5433  | ⚠️ **5433** (5432 değil!)          |
| MCP Gateway| 4010  | Model Context Protocol gateway    |

---

## 🗄️ Database Bağlantısı

**Standart local dev DATABASE_URL:**

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
```

> ⚠️ **Kritik**: Port **5433** olmalı. `scripts/db-up.sh` scripti DB'yi bu portta başlatır.

---

## 🚀 Hızlı Başlangıç

```bash
# 1. DB'yi başlat
./scripts/db-up.sh

# 2. DATABASE_URL'i export et
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"

# 3. Bağımlılıkları yükle
pnpm install

# 4. Migrationları uygula
pnpm -C backend db:migrate

# 5. Backend'i başlat (terminal 1)
pnpm -C backend dev

# 6. Frontend'i başlat (terminal 2)
pnpm -C frontend dev
```

**Doğrulama:**
- Backend: http://localhost:3000/health
- Frontend: http://localhost:5173

---

## 🧪 API Smoke Test

```bash
./scripts/dev-smoke-jobs.sh
```

Bu script job API'lerini test eder ve port/migration sorunlarını hızlıca tespit etmenizi sağlar.

---

## 🔑 Environment Variables

Detaylı env değişkenleri için: [docs/ENV_SETUP.md](docs/ENV_SETUP.md)

### Temel Değişkenler

| Değişken        | Açıklama                           | Varsayılan                                   |
|-----------------|-----------------------------------|---------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string      | (zorunlu, port 5433!)                       |
| `NODE_ENV`      | Çalışma modu                      | `development`                               |
| `VITE_API_URL`  | Frontend API base URL             | `http://localhost:3000`                     |

---

## ❓ Troubleshooting

**500 hatası / "table not found" / "relation does not exist":**

Bu genellikle DB port uyuşmazlığından kaynaklanır. Çözüm:

```bash
# 1. Aktif DB portunu kontrol et
docker ps | grep postgres

# 2. DATABASE_URL'in 5433 kullandığından emin ol
echo $DATABASE_URL  # localhost:5433 içermeli

# 3. Migrationları doğru DB'ye uygula
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate
```

Daha fazla troubleshooting için: [LOCAL_DEV_QUICKSTART.md](docs/local-dev/LOCAL_DEV_QUICKSTART.md#-troubleshooting-db-port-mismatch)

---

## 📚 Diğer Kaynaklar

- [LOCAL_DEV_QUICKSTART.md](docs/local-dev/LOCAL_DEV_QUICKSTART.md) - Kapsamlı local dev rehberi
- [ENV_SETUP.md](docs/ENV_SETUP.md) - Environment variable dökümantasyonu
- [GITHUB_MCP_SETUP.md](docs/GITHUB_MCP_SETUP.md) - MCP Gateway kurulumu

