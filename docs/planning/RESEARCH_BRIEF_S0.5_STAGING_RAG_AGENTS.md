# Research Brief — S0.5 Staging, RAG & Agent Reliability

> **Version:** 1.0.0  
> **Date:** 2026-02-07  
> **Status:** Active  
> **Plan Referans:** [`DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## Amac

Bu dokuman, S0.5 plani uygulamaya baslamadan once arastirilmasi ve kilitlenmesi gereken teknik konulari listeler. Her konu icin mevcut durum, arastirilacak kaynaklar ve onerilen yaklasim belirtilmistir.

---

## 1. Vite Env / Build-Time Configuration

### Mevcut Durum

- Vite `import.meta.env.VITE_*` degiskenleri **build-time'da** statik olarak yerine konuyor
- CI workflow'da (`oci-staging-deploy.yml` satir 240): `VITE_API_URL=/api` set ediliyor
- `VITE_BACKEND_URL` CI'da set edilmiyor — bu durumda `HttpClient` constructor'daki default (`'http://localhost:3000'`) bundle'a hardcode oluyor
- `getApiBaseUrl()` fonksiyonu (`frontend/src/services/api/config.ts`) dogru calisir: relative path (`/api`) gorurse `window.location.origin`'e fallback yapar

### Arastirilacak Kaynaklar

- Vite resmi docs: [Env Variables and Modes](https://vitejs.dev/guide/env-and-mode)
- Ozellikle: `.env.production` vs `.env` oncelik sirasi
- `import.meta.env` vs runtime config pattern'leri

### Onerilen Yaklasim

Staging build sirasinda `VITE_BACKEND_URL` set **etMEmek**. `getApiBaseUrl()` fonksiyonu zaten runtime'da `window.location.origin` kullanarak dogru URL'i donduruyor. Sorun sadece `getApiBaseUrl()` cagirilmayan yerlerde (orn. `client.ts`).

**Fix:** `client.ts` ve `HttpClient.ts`'de `getApiBaseUrl()` kullanarak runtime resolution'a gecmek. Build-time env'e bagimlilik kaldirilir.

### Alternatif (Kabul Edilmemis)

`VITE_BACKEND_URL=https://staging.akisflow.com` CI'da set etmek — calisiyor ama her ortam icin farkli build gerektirir, runtime resolution tercih edilir.

---

## 2. Fastify Trust Proxy Arkasinda Cookie Davranisi

### Mevcut Durum

- Caddy reverse proxy otomatik olarak `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host` header'lari ekler
- `backend/src/server.app.ts`'de Fastify instance `trustProxy` olmadan olusturuluyor
- `backend/.env.example`'da `TRUST_PROXY=false` var ama `backend/src/config/env.ts` sema'sinda tanimlanmamis
- `AUTH_COOKIE_SECURE=true` staging'de gerekli (HTTPS)

### Arastirilacak Kaynaklar

- Fastify docs: [Server Options - trustProxy](https://fastify.dev/docs/latest/Reference/Server/#trustproxy)
- `trustProxy: true` — tum proxy'lere guven (tek Caddy instance icin yeterli)
- `trustProxy: 1` — sadece ilk proxy'ye guven
- Cookie `Secure` flag davranisi: Tarayici, `Secure` cookie'yi sadece HTTPS uzerinden gonderir; Fastify'in protocol'u dogru okumasi gerekir

### Onerilen Yaklasim

```typescript
// backend/src/config/env.ts
TRUST_PROXY: z.enum(['true', 'false']).default('false'),

// backend/src/server.app.ts
const app = Fastify({
  trustProxy: env.TRUST_PROXY === 'true',
  // ... mevcut ayarlar
});
```

Staging `.env`'de `TRUST_PROXY=true` set edilecek.

### Dogrulama

Staging'de deploy sonrasi:
```bash
# Cookie Set-Cookie header'inda Secure flag olmali
curl -v https://staging.akisflow.com/auth/me 2>&1 | grep -i 'set-cookie'
```

---

## 3. OAuth Redirect URI Correctness

### Mevcut Durum

- `backend/src/api/auth.oauth.ts` satir 302:
  ```typescript
  const redirectUri = `${config.BACKEND_URL}/auth/oauth/${provider}/callback`;
  ```
- `BACKEND_URL` staging `.env`'de `https://staging.akisflow.com` olarak set edilmis
- OAuth provider (GitHub, Google) dashboard'larinda callback URL'in staging domain'e isaret ettiginden emin olunmali

### Arastirilacak Kaynaklar

- GitHub Developer Settings: OAuth App callback URL yapılandırması
- Google Cloud Console: Authorized redirect URIs
- RFC 6749 Section 3.1.2: Redirection Endpoint (redirect_uri exact match requirement)

### Onerilen Yaklasim

1. GitHub OAuth App settings'de callback URL ekle/guncelle:
   - `https://staging.akisflow.com/auth/oauth/github/callback`
   - `http://localhost:3000/auth/oauth/github/callback` (dev icin korunabilir)

2. Google OAuth settings'de redirect URI ekle:
   - `https://staging.akisflow.com/auth/oauth/google/callback`

3. Backend kodda degisiklik gerekmez — `BACKEND_URL` env var uzerinden calisir

### Dogrulama

Staging'de OAuth login akisini test et:
```
1. staging.akisflow.com'a git
2. "Continue with GitHub" tikla
3. GitHub yetkilendirme sayfasina yonlendirildigini dogrula
4. Yetkilendirme sonrasi staging.akisflow.com'a geri yonlendirildigini dogrula
5. Cookie set edildigini ve kullanicinin login oldugununu dogrula
```

---

## 4. Drizzle Migrations + Postgres Container Reliability

### Mevcut Durum

- Docker Compose'da PostgreSQL 16 Alpine, named volume (`akis-staging-pgdata`)
- Health check: `pg_isready -U akis -d akis_staging` (10s interval, 5 retry)
- Backend `depends_on: db: condition: service_healthy`
- `DATABASE_URL=postgresql://akis:PASSWORD@db:5432/akis_staging`
- Drizzle config `backend/drizzle.config.ts` `.env` ve `.env.local`'dan okur
- Migration'lar `backend/src/scripts/migrate.ts` ile calistirilir

### Arastirilacak Kaynaklar

- Drizzle docs: [Migration API](https://orm.drizzle.team/docs/migrations)
- Docker Compose health checks ve dependency ordering
- PostgreSQL named volumes ve data persistence

### Onerilen Yaklasim

1. `deploy/oci/staging/deploy.sh` icinde migration step'inin calistigindan emin ol:
   ```bash
   docker compose exec backend node dist/scripts/migrate.js
   ```

2. Staging'de `/ready` endpoint'i DB health kontrolu yapmali:
   - DB baglantisi calisiyor mu
   - Migration'lar uygulanmis mi

3. Deploy oncesi backup:
   ```bash
   docker compose exec db pg_dump -U akis akis_staging > backup_$(date +%Y%m%d).sql
   ```

### Dogrulama

```bash
# SSH ile staging VM'ye baglan
ssh staging-vm

# DB health check
docker compose exec db pg_isready -U akis -d akis_staging

# Backend migration log
docker compose logs backend --tail=50 | grep -i 'migrat'

# Ready endpoint
curl -s https://staging.akisflow.com/ready | jq .
```

---

## 5. Postgres pg_trgm Search (Mart Icin)

### Mevcut Durum

- Subat icin context packs mekanizmasi yeterli (ScribeAgent mevcut dosyalari okuyor)
- Mart'ta lightweight retrieval gerekebilir
- OCI Free Tier'da PostgreSQL 16 mevcut

### Arastirilacak Kaynaklar

- PostgreSQL docs: [pg_trgm extension](https://www.postgresql.org/docs/16/pgtrgm.html)
- Full-text search: [tsvector ve tsquery](https://www.postgresql.org/docs/16/textsearch.html)
- GIN index performance characteristics

### Onerilen Yaklasim (Mart Icin)

```sql
-- Extension aktif et
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Knowledge chunks tablosu
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,        -- 'scribe', 'trace', 'proto'
  source_type TEXT NOT NULL,       -- 'file', 'doc', 'playbook'
  source_path TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigram GIN index
CREATE INDEX idx_chunks_content_trgm
  ON knowledge_chunks USING gin (content gin_trgm_ops);

-- Full-text search index (opsiyonel ek)
CREATE INDEX idx_chunks_content_fts
  ON knowledge_chunks USING gin (to_tsvector('english', content));
```

Basit retrieval query:
```sql
-- Trigram similarity arama
SELECT id, source_path, content,
       similarity(content, $1) AS score
FROM knowledge_chunks
WHERE content % $1
  AND agent_type = $2
ORDER BY score DESC
LIMIT 5;
```

### Performans Beklentisi

- 1,000-10,000 chunk icin: <100ms (OCI Free Tier'da kabul edilebilir)
- GIN index olusturma: bir kerelik, saniyeler icinde
- Ek dependency yok (pg_trgm PostgreSQL ile birlikte gelir)

### Yapilmayacak

- Harici vector DB (Pinecone, Weaviate, Chroma, Qdrant)
- Heavy embedding modelleri (sentence-transformers, OpenAI embeddings)
- Karmasik chunking stratejileri (semantic chunking, recursive splitting)
- RAG evaluation framework (RAGAS, vb.)

---

## 6. Agent Contract ve Playbook Standardizasyonu

### Mevcut Durum

- Her ajan (`ScribeAgent`, `TraceAgent`, `ProtoAgent`) kendi playbook'unu kullanir
- Playbook'lar `backend/src/core/agents/playbooks/` altinda
- Orchestrator `AgentOrchestrator.ts` icerisinde job lifecycle yonetimi var
- Zod validation mevcut ama standardize edilmemis

### Arastirilacak Kaynaklar

- Mevcut playbook dosyalari: icerik ve format tutarliligi
- `backend/src/api/agents.ts`: input validation sema'lari
- `backend/src/agents/*/`: output type'lar
- LLM determinism best practices: temperature, seed, system prompt pinning

### Onerilen Yaklasim

Her ajan icin standard contract:
```typescript
interface AgentContract {
  input: {
    schema: ZodSchema;        // Zod validation
    required: string[];       // Zorunlu alanlar
    optional: string[];       // Opsiyonel alanlar
  };
  output: {
    format: 'markdown' | 'json' | 'files';
    schema: ZodSchema;        // Output validation
  };
  errors: {
    code: string;             // Orn: 'AGENT_NO_AI_KEY'
    httpStatus: number;       // Orn: 400
    userMessage: string;      // Orn: 'AI anahtarinizi ayarlayin'
  }[];
  determinism: {
    temperature: number;      // 0 icin deterministik
    seed?: number;            // Opsiyonel seed
    systemPromptPinned: boolean;
  };
}
```

---

## Kilitlenecek Kararlar (Decisions to Lock)

Implementation baslamadan once asagidaki 7 karar kilitlenmis olmali:

| # | Karar | Onerilen | Status |
|---|-------|----------|--------|
| 1 | **Frontend build env** | Staging build'de `VITE_BACKEND_URL` set edilMEyecek; `getApiBaseUrl()` runtime'da `window.location.origin` kullanacak | PROPOSED |
| 2 | **Trust proxy** | `TRUST_PROXY=true` staging `.env`'ye eklenecek; backend kodda `Fastify({ trustProxy: env.TRUST_PROXY === 'true' })` implement edilecek | PROPOSED |
| 3 | **Cookie domain** | `AUTH_COOKIE_DOMAIN` bos birakilacak (tek domain, subdomain sharing gereksiz) | PROPOSED |
| 4 | **OAuth callbacks** | GitHub OAuth App'de callback URL `https://staging.akisflow.com/auth/oauth/github/callback` olarak guncellenecek | PROPOSED |
| 5 | **RAG Subat** | Context packs (degisiklik yok); Mart'ta pg_trgm degerlendirilecek | PROPOSED |
| 6 | **Pilot access** | Email davet + acik signup (invite code eklenmeyecek) | PROPOSED |
| 7 | **Scope freeze** | 21 Subat'tan sonra yeni feature eklenmez | PROPOSED |

**Not:** "PROPOSED" durumundaki kararlar takim tarafindan onaylandiktan sonra "LOCKED" olarak guncellenecektir.

---

## Sonraki Adimlar

1. Bu brief'i takim ile paylasip 7 karari kilitleyin
2. Kararlar kilitlendikten sonra Phase A (WS-OPS) implementasyonuna baslayin
3. Mart'ta pg_trgm icin ayri bir spike task planlayin

---

*Bu dokuman `docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md` ile birlikte okunmalidir.*
