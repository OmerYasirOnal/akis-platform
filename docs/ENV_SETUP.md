# Environment Variables Setup

Bu belge AKIS Platform için environment variable yapılandırmasını ve yaygın pitfall'ları açıklar.

---

## 🔑 DATABASE_URL Öncelik Sırası

Environment variable'ların yüklenmesi şu sırayla gerçekleşir:

```
1. Shell environment (export DATABASE_URL=...)     ← En yüksek öncelik
2. backend/.env.local                               ← Kişisel override'lar
3. backend/.env                                     ← Proje varsayılanları
```

> ⚠️ **Önemli**: `drizzle.config.ts` dosyası `.env` ve `.env.local` dosyalarını `override: false` ile yükler. Bu, shell'de export edilmiş `DATABASE_URL`'in her zaman öncelikli olacağı anlamına gelir.

### Örnek

```bash
# Shell'de export edilmiş değer HER ZAMAN kullanılır:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate  # → 5433 portunu kullanır

# .env.local'da farklı bir değer olsa bile (örn: 5432),
# shell değeri önceliklidir
```

---

## 🗄️ Database Konfigürasyonu

### Standart Local Dev Değerleri

| Parametre | Değer                |
|-----------|---------------------|
| Host      | `localhost`         |
| Port      | **5433** ⚠️         |
| Database  | `akis_v2`           |
| User      | `postgres`          |
| Password  | `postgres`          |

**Canonical DATABASE_URL:**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
```

> ⚠️ **Kritik**: Port **5433**'tür, **5432 değil**! `scripts/db-up.sh` scripti DB'yi 5433 portunda başlatır.

---

## 📁 .env Dosyaları

### backend/.env

Proje genelinde kullanılan varsayılan değerler. **Git'e commit edilir** (örnek olarak).

```env
# backend/.env.example → backend/.env olarak kopyalanır
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
NODE_ENV=development
```

### backend/.env.local

Kişisel override'lar için. **Git'e commit EDİLMEZ** (`.gitignore`'da).

```env
# Sadece kişisel ayarlar için kullanın
# DATABASE_URL burada override EDİLMEMELİ (port uyuşmazlığı riski!)
```

### frontend/.env

Frontend environment değişkenleri.

```env
VITE_API_URL=http://localhost:3000
VITE_AGENTS_ENABLED=true
```

---

## ⚠️ Yaygın Pitfall'lar

### 1. DB Port Uyuşmazlığı (En Yaygın!)

**Belirti**: 500 hatası, "table not found", "relation does not exist"

**Neden**: 
- `backend/.env.local` dosyasında yanlışlıkla port 5432 yazılı
- Drizzle migrations farklı bir DB'ye uygulanmış
- Runtime farklı bir DB'ye bağlanıyor

**Çözüm**:

```bash
# 1. Aktif DB portunu kontrol et
docker ps | grep postgres
# → 0.0.0.0:5433->5432/tcp görmelisiniz

# 2. Shell'de doğru URL'i export et
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"

# 3. Migrationları yeniden uygula
pnpm -C backend db:migrate

# 4. Backend'i yeniden başlat
pnpm -C backend dev
```

### 2. .env.local Override Sorunu

**Belirti**: "Migrationları uyguladım ama tablolar yok" diyor

**Neden**: `backend/.env.local` dosyasında farklı bir `DATABASE_URL` var

**Çözüm**:

```bash
# .env.local'daki DATABASE_URL'i kontrol et
cat backend/.env.local | grep DATABASE_URL

# Ya düzelt ya da sil
# Önerilen: Shell'de her zaman export kullan
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
```

### 3. Drizzle vs Runtime Divergence

**Belirti**: Migration başarılı görünüyor ama uygulama hata veriyor

**Neden**: `drizzle.config.ts` ve runtime farklı `.env` dosyalarını yüklüyor olabilir

**Çözüm**:

```bash
# Tek kaynak doğruluk (single source of truth) için:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"

# Her iki işlem de aynı DB'yi kullanır:
pnpm -C backend db:migrate  # Migration
pnpm -C backend dev         # Runtime
```

---

## 🔍 Doğrulama Komutları

```bash
# 1. Shell'deki DATABASE_URL'i kontrol et
echo $DATABASE_URL

# 2. Docker'daki DB portunu kontrol et
docker ps | grep postgres

# 3. Backend startup loglarını kontrol et
# "[db] Connected to postgresql://***:***@localhost:5433/akis_v2" görmelisiniz

# 4. Smoke test çalıştır
./scripts/dev-smoke-jobs.sh
```

---

## 🤖 AI Provider Konfigürasyonu

AKIS, LLM tabanlı işlemler için OpenRouter veya OpenAI kullanabilir.

### Provider Seçimi

| Değişken | Değerler | Varsayılan |
|----------|----------|------------|
| `AI_PROVIDER` | `mock`, `openrouter`, `openai` | `mock` |

### Mock Provider (Varsayılan)

Test ve geliştirme için. **Gerçek API çağrısı yapmaz**.

```env
AI_PROVIDER=mock
```

### OpenRouter (Real AI)

Gerçek LLM yanıtları için OpenRouter kullanın:

```env
# backend/.env.local (NO SECRETS IN .env!)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-***
AI_BASE_URL=https://openrouter.ai/api/v1

# Model seçimi (ücretsiz modeller)
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free
AI_MODEL_PLANNER=tngtech/deepseek-r1t-chimera:free
AI_MODEL_VALIDATION=google/gemini-2.0-flash-exp:free

# Opsiyonel OpenRouter header'ları
OPENROUTER_SITE_URL=https://your-site.com
OPENROUTER_APP_NAME=Your App Name
```

### API Key Öncelik Sırası

```
1. AI_API_KEY                  ← Öncelikli
2. OPENROUTER_API_KEY          ← Legacy fallback
3. OPENAI_API_KEY              ← OpenAI provider için
```

### Yaygın Hatalar

| Hata | Neden | Çözüm |
|------|-------|-------|
| 401 Unauthorized | API key geçersiz/eksik | `.env.local`'da `AI_API_KEY` kontrol et |
| 429 Rate Limited | Çok fazla istek | Bekle veya farklı model dene |
| "Mock generated content..." | `AI_PROVIDER=mock` | `AI_PROVIDER=openrouter` olarak değiştir |

### Test Ortamı

> ⚠️ **Önemli**: Test ortamında (`NODE_ENV=test`) AI her zaman **mock** kullanır. Bu, CI/CD'de external API çağrılarını önler.

---

## 🎮 Demo Mode: Env OpenRouter + MCP Gateway

Demo amaçlı, AKIS Scribe agent'ı kullanıcı yapılandırması gerektirmeden server tarafı AI konfigürasyonuyla çalıştırılabilir.

### Gerekli Environment Variables

**Backend** (`backend/.env.local`):

```bash
# AI Provider (Demo: OpenRouter)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY_HERE
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free

# MCP Gateway
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
GITHUB_TOKEN=ghp_YOUR_GITHUB_PAT_HERE

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
```

### MCP Gateway Kurulumu

```bash
# Repo root'undan
export GITHUB_TOKEN=ghp_your_token_here
docker compose -f docker-compose.mcp.yml up -d

# Doğrula
curl http://localhost:4010/health
# Beklenen: {"status":"ok","service":"akis-github-mcp-gateway"}
```

### Backend Başlatma

```bash
cd backend
pnpm install
pnpm dev
```

### Demo Davranışı

| Özellik | Demo Mode Davranışı |
|---------|---------------------|
| **Scribe AI** | Server'ın OpenRouter key'ini kullanır (kullanıcı key yapılandırması gereksiz) |
| **AI Providers sayfası** | UI'dan kaldırıldı (demo için gerekmez) |
| **API Keys sayfası** | Korundu (gelecek kullanıcı key'leri için) |
| **MCP Gateway** | Scribe GitHub operasyonları için gerekli |
| **Branch isimlendirme** | Otomatik: `scribe/docs-{YYYYMMDD-HHMMSS}` |

### Demo Akışı

1. **Dashboard**: Görsel tutarlılık kontrolü
2. **Integrations** (`/dashboard/integrations`): GitHub OAuth ile bağlan
3. **Scribe Console** (`/dashboard/scribe`):
   - Owner: GitHub kullanıcı adı (read-only)
   - Repository ve Base Branch seç
   - Branch preview: `scribe/docs-{timestamp}`
   - **Run Scribe** butonuna tıkla
4. **Gözlemle**:
   - Adım adım log mesajları
   - Preview tab: Üretilen dokümantasyon
   - Diff tab: Dosya seviyesi değişiklikler

### MCP Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| "MCP Gateway is not available" | `docker compose -f docker-compose.mcp.yml up -d` |
| 401 hatası | `GITHUB_TOKEN` geçerliliğini kontrol et |
| Timeout | MCP Gateway loglarını kontrol et: `docker compose -f docker-compose.mcp.yml logs` |

> ⚠️ **Önemli**: MCP Gateway çalışmıyorsa Scribe GitHub operasyonlarını gerçekleştiremez. Demo öncesi `curl http://localhost:4010/health` ile doğrulayın.

---

## 📊 Environment Variable Referansı

### Backend

| Değişken                  | Zorunlu | Varsayılan           | Açıklama                         |
|---------------------------|---------|---------------------|----------------------------------|
| `DATABASE_URL`            | ✅      | -                   | PostgreSQL connection string     |
| `NODE_ENV`                | ❌      | `development`       | Çalışma modu                     |
| `PORT`                    | ❌      | `3000`              | Backend server portu             |
| `LOG_LEVEL`               | ❌      | `info`              | Pino log seviyesi                |
| `CORS_ORIGINS`            | ❌      | `http://localhost:5173` | İzin verilen CORS originleri |
| `GITHUB_MCP_BASE_URL`     | ❌      | -                   | MCP Gateway URL'i                |
| `AI_PROVIDER`             | ❌      | `mock`              | AI provider: mock/openrouter/openai |
| `AI_API_KEY`              | ❌      | -                   | AI API key (OpenRouter/OpenAI)   |
| `AI_MODEL_DEFAULT`        | ❌      | Provider-specific   | Varsayılan LLM modeli            |
| `AI_MODEL_PLANNER`        | ❌      | Provider-specific   | Planlama LLM modeli              |
| `AI_MODEL_VALIDATION`     | ❌      | Provider-specific   | Doğrulama LLM modeli             |

### Frontend

| Değişken                  | Zorunlu | Varsayılan           | Açıklama                         |
|---------------------------|---------|---------------------|----------------------------------|
| `VITE_API_URL`            | ❌      | `/api`              | Backend API base URL             |
| `VITE_AGENTS_ENABLED`     | ❌      | `false`             | Agent özellikleri aktif mi       |
| `VITE_DEFAULT_LOCALE`     | ❌      | `en`                | Varsayılan dil                   |

---

## 📚 İlgili Belgeler

- [LOCAL_DEV_QUICKSTART.md](local-dev/LOCAL_DEV_QUICKSTART.md) - Kapsamlı local dev rehberi
- [DEV_SETUP.md](../DEV_SETUP.md) - Hızlı kurulum rehberi
- [GITHUB_MCP_SETUP.md](GITHUB_MCP_SETUP.md) - MCP Gateway kurulumu

