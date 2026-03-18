# Production Environment Variables

Sunucuda `/opt/akis/.env` dosyasına aşağıdaki değerler yazılmalıdır.

## Zorunlu Değişkenler

```env
# Database
DATABASE_URL=postgresql://akis:GÜÇLÜ_ŞİFRE@db:5432/akis_staging
POSTGRES_USER=akis
POSTGRES_PASSWORD=GÜÇLÜ_ŞİFRE
POSTGRES_DB=akis_staging

# Authentication
AUTH_JWT_SECRET=RASTGELE_64_KARAKTER_STRING
AUTH_COOKIE_SECURE=true

# AI Service (en az biri gerekli)
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-api03-...

# GitHub Integration
GITHUB_TOKEN=ghp_...  # PAT with repo + read:org scopes

# URLs
BACKEND_URL=https://staging.akisflow.com
FRONTEND_URL=https://staging.akisflow.com
CORS_ORIGINS=https://staging.akisflow.com
```

## Opsiyonel Değişkenler

```env
# Email (varsayılan: mock — prod'da Resend veya SMTP)
EMAIL_PROVIDER=mock
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@akisflow.com

# GitHub OAuth (opsiyonel — PAT zaten yeterli)
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...

# Logging
LOG_LEVEL=info

# ACME email for Let's Encrypt
ACME_EMAIL=admin@akisflow.com
```

## Deploy Komutu

```bash
export AKIS_SSH_HOST=SUNUCU_IP
cd deploy/oci/staging
./deploy.sh COMMIT_SHA
```

## ÖNEMLİ

- Bu dosyadaki değerleri Yasir sunucuda **manuel** girecek
- `.env` dosyası **asla** git'e commit edilmemeli
- `GÜÇLÜ_ŞİFRE` ve `RASTGELE_64_KARAKTER_STRING` yerine gerçek değerler yazılmalı
- `openssl rand -hex 32` komutuyla güçlü secret üretilebilir
