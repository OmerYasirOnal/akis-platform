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

