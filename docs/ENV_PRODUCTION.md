# Staging / Production Environment Variables

Sunucuda `/opt/akis/.env` dosyasına aşağıdaki değerler yazılmalıdır.

## Tam .env Şablonu

```env
# ============================================================
# AKIS Platform — Staging Environment
# ============================================================

# --- Database ---
DATABASE_URL=postgresql://akis:GÜÇLÜ_ŞİFRE@db:5432/akis_staging
POSTGRES_USER=akis
POSTGRES_PASSWORD=GÜÇLÜ_ŞİFRE
POSTGRES_DB=akis_staging

# --- Authentication ---
AUTH_JWT_SECRET=RASTGELE_64_KARAKTER    # openssl rand -hex 32
AUTH_COOKIE_NAME=akis_sid
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_MAXAGE=604800

# --- URLs (KRİTİK — OAuth redirect_uri bundan üretilir) ---
BACKEND_URL=https://staging.akisflow.com
FRONTEND_URL=https://staging.akisflow.com
CORS_ORIGINS=https://staging.akisflow.com
TRUST_PROXY=true

# --- AI Service ---
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-api03-...
AI_MODEL_DEFAULT=claude-sonnet-4-6
AI_DETERMINISTIC_MODE=true
AI_KEY_ENCRYPTION_KEY=RASTGELE_64_HEX   # openssl rand -hex 32
AI_KEY_ENCRYPTION_KEY_VERSION=v1

# --- GitHub Integration (Pipeline Proto agent) ---
GITHUB_TOKEN=ghp_...                     # PAT: repo + read:org scopes

# --- OAuth: GitHub ---
GITHUB_OAUTH_CLIENT_ID=Ov23lit...
GITHUB_OAUTH_CLIENT_SECRET=557986ca...

# --- OAuth: Google ---
GOOGLE_OAUTH_CLIENT_ID=747899836869-...apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...

# --- Email ---
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@akisflow.com
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=15

# --- SMTP (Fallback) ---
SMTP_HOST=ms8.guzel.net.tr
SMTP_PORT=587
SMTP_USER=noreply@akisflow.com
SMTP_PASS=...
SMTP_SECURE=false
SMTP_FROM_NAME=AKIS Platform
SMTP_FROM_EMAIL=noreply@akisflow.com

# --- MCP Gateway ---
GITHUB_MCP_BASE_URL=http://mcp-gateway:4010/mcp

# --- Rate Limiting ---
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW=60000

# --- Caddy ---
ACME_EMAIL=admin@akisflow.com

# --- Misc ---
LOG_LEVEL=info
PUBLIC_LOGO_URL=https://staging.akisflow.com/assets/akis-logo-transparent.png
```

## OAuth Kurulumu (KRİTİK)

OAuth'un çalışması için **hem** sunucudaki .env **hem de** provider dashboard'ları doğru yapılandırılmalıdır.

### GitHub OAuth App Ayarları

1. https://github.com/settings/developers adresine git
2. OAuth App'i bul (veya yeni oluştur)
3. Şu değerleri ayarla:
   - **Homepage URL:** `https://staging.akisflow.com`
   - **Authorization callback URL:** `https://staging.akisflow.com/auth/oauth/github/callback`
4. Client ID ve Secret'ı .env'e yaz

### Google OAuth Ayarları

1. https://console.cloud.google.com/apis/credentials adresine git
2. OAuth 2.0 Client ID'yi bul
3. **Authorized redirect URIs** listesine ekle:
   - `https://staging.akisflow.com/auth/oauth/google/callback`
4. **Authorized JavaScript origins** listesine ekle:
   - `https://staging.akisflow.com`
5. Client ID ve Secret'ı .env'e yaz

### OAuth Nasıl Çalışır

Backend'deki `auth.oauth.ts` redirect_uri'yi şöyle üretir:
```
${FRONTEND_URL}/auth/oauth/${provider}/callback
```

Bu yüzden `FRONTEND_URL` **mutlaka** `https://staging.akisflow.com` olmalıdır.
Caddy bu GET isteğini backend'e yönlendirir (`handle /auth/oauth/*`).

## Deploy Komutu

```bash
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/id_ed25519 \
  --skip-tests --skip-backup \
  --confirm
```

## ÖNEMLİ

- `.env` dosyası **asla** git'e commit edilmemeli
- `GÜÇLÜ_ŞİFRE` ve `RASTGELE_64_KARAKTER` yerine gerçek değerler yazılmalı
- `openssl rand -hex 32` komutuyla güçlü secret üretilebilir
- `DEV_MODE` staging'de **OLMAMALI** (production mode)
- `NODE_ENV` docker-compose.yml içinde `production` olarak ayarlı
