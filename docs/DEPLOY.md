# AKIS Deploy Notları

Bu belge, AKIS Platform’un prodüksiyon veya staging ortamına alınırken dikkat edilmesi gereken güvenlik, env ve ağ yapı taşlarını özetler.

## 1. Ortam Değerleri (Backend)

`backend/.env` dosyasındaki kritik anahtarlar:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:pass@host:5432/akis

# JWT & oturum
AUTH_JWT_SECRET=<en-az-32-karakter>
AUTH_SESSION_TTL_SECONDS=2592000
AUTH_COOKIE_NAME=akis_session
AUTH_COOKIE_SAMESITE=Strict
AUTH_COOKIE_SECURE=true

# GitHub OAuth (kullanıcı login)
GITHUB_OAUTH_CLIENT_ID=<github-app-client-id>
GITHUB_OAUTH_CLIENT_SECRET=<github-oauth-secret>
GITHUB_OAUTH_CALLBACK_URL=https://api.your-domain.com/api/auth/github/callback

# GitHub App (repo erişimi)
GITHUB_APP_ID=<github-app-id>
GITHUB_APP_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'

# OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_REFERER=https://your-frontend-domain.com
OPENROUTER_APP_TITLE=AKIS Platform
```

> **Not:** `AUTH_COOKIE_SECURE` prod ortamında **true** olmalıdır (HTTPS zorunlu). Cookie alanı; `HttpOnly`, `Secure` ve `SameSite=Strict` politikasına göre konfigüre edilir.

## 2. OpenRouter Header Zorunlulukları

Sunucu tarafında tüm OpenRouter çağrılarında eklenen başlıklar:

- `Authorization: Bearer ${OPENROUTER_API_KEY}`
- `HTTP-Referer: ${OPENROUTER_APP_REFERER}`
- `X-Title: ${OPENROUTER_APP_TITLE}`

Bu değerlerin eksik olması durumunda OpenRouter istekleri reddedilebilir; env check çıktısında uyarı olarak listelenir.

## 3. GitHub OAuth ve App Kurulumları

- GitHub OAuth uygulamasında callback URL olarak **API hostunuza ait `/api/auth/github/callback`** uzantısı eklenmelidir (örn. `https://api.your-domain.com/api/auth/github/callback`).
- GitHub App tarafında “User access tokens” yerine “Installation access tokens” kullanılmaktadır; kullanıcılar uygulamayı kendi reposuna kurduğunda `oauth_accounts` tablosu ile ilişkilendirilir.
- Deployment öncesi GitHub App private key’i PEM formatında `.env` dosyasına yenilenmelidir.

## 4. Frontend (.env)

Vite yalnızca `VITE_` ön eki taşıyan değişkenleri build’e dahil eder. Gerekli anahtarlar:

```bash
VITE_API_URL=https://api.your-domain.com
VITE_BACKEND_URL=https://api.your-domain.com
VITE_API_PREFIX=/api
VITE_DEFAULT_LOCALE=en
VITE_BRAND_NAME=AKIS
VITE_MOTION_ENABLED=true
VITE_CURSOR_GLOW_ENABLED=true
VITE_AGENTS_ENABLED=true
VITE_ENABLE_PREMIUM_MODELS=true
VITE_ENABLE_DEV_LOGIN=false
```

> **Önemli:** `VITE_` ön eki olmayan anahtarlar client bundle’a dahil **edilmez**; bu nedenle tüm exposed değişkenler `VITE_` ile başlamalıdır.

## 5. Reverse Proxy / TLS

- TLS terminasyonu yapan reverse proxy (NGINX, CloudFront vb.) üzerinden gelen isteklerde `X-Forwarded-Proto` ve `X-Forwarded-For` başlıkları Fastify’a iletilmelidir.
- `AUTH_COOKIE_SECURE=true` olduğunda, proxy HTTPS’i sonlandırarak backend’e plain HTTP yönlendirse bile browser tarafı cookie’yi sadece HTTPS üzerinden gönderecektir.

## 6. Sağlık ve Env Kontrolü

- CI pipeline’ında `pnpm --filter backend run env:check` komutu çalışır ve eksik anahtarları checklist olarak loglar.
- Prod ortamında servis ayağa kalktığında Fastify loglarında `[env-check]` önekli hatırlatmalar görüntülenir; bu loglar secrets içermeden hangi feature’ın devre dışı kaldığını bildirir.

## 7. Veritabanı Migrasyonları

Deployment aşamasında backend container’ı yükseltilmeden önce:

```bash
pnpm --filter backend run db:migrate
```

komutu çalıştırılmalıdır. CI içinde `db:migrate:ci` sürümü kullanılmaktadır.


