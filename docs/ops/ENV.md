# AKIS Environment Variables

Bu belge, AKIS platformunun çalışması için gerekli environment variable'ları açıklar.

## Ortam Türleri

| Ortam | Dosya | Açıklama |
|-------|-------|----------|
| Local Dev | `.env.local` | Geliştirme ortamı |
| Staging | `/opt/akis/.env` | OCI staging sunucusu |
| Production | `/opt/akis/.env` | Production sunucusu |

---

## Zorunlu Variables (Staging/Production)

### Database

| Variable | Açıklama | Örnek |
|----------|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Authentication

| Variable | Açıklama | Nasıl Oluşturulur |
|----------|----------|-------------------|
| `AUTH_JWT_SECRET` | JWT signing secret (min 32 char) | `openssl rand -base64 32` |

### AI Key Encryption

AI Provider Keys'in şifrelenmesi için zorunludur.

| Variable | Açıklama | Nasıl Oluşturulur |
|----------|----------|-------------------|
| `AI_KEY_ENCRYPTION_KEY` | AES-256-GCM encryption key | `openssl rand -base64 32` |
| `AI_KEY_ENCRYPTION_KEY_VERSION` | Key version identifier | `v1` |

**Eğer bu variable'lar eksikse:**
- AI Keys endpoint'i 503 `ENCRYPTION_NOT_CONFIGURED` döner
- Kullanıcılar API key kaydedemez

---

## Opsiyonel Variables

### GitHub OAuth

OAuth ile giriş için gerekli.

| Variable | Açıklama | Nereden Alınır |
|----------|----------|----------------|
| `GITHUB_OAUTH_CLIENT_ID` | OAuth App Client ID | GitHub Settings > Developer settings > OAuth Apps |
| `GITHUB_OAUTH_CLIENT_SECRET` | OAuth App Client Secret | Aynı yer |

**Callback URL'leri:**

| Ortam | Callback URL |
|-------|--------------|
| Local | `http://localhost:5173/auth/oauth/github/callback` |
| Staging | `https://staging.akisflow.com/auth/oauth/github/callback` |
| Production | `https://akisflow.com/auth/oauth/github/callback` |

### Slack Integration

Smart Automations için Slack bildirimleri.

| Variable | Açıklama | Format |
|----------|----------|--------|
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token | `xoxb-...` |
| `SLACK_DEFAULT_CHANNEL` | Default channel ID | `C0123456789` |

---

## Staging Server Kurulumu

### 1. SSH ile bağlan

```bash
ssh <USER>@<STAGING_HOST>
cd /opt/akis
```

### 2. .env dosyasını yedekle

```bash
cp .env .env.bak.$(date +%Y%m%d_%H%M%S)
```

### 3. Zorunlu key'leri oluştur

```bash
# AI Key Encryption (zorunlu)
if ! grep -q "AI_KEY_ENCRYPTION_KEY=" .env; then
  export NEW_KEY="$(openssl rand -base64 32)"
  echo "AI_KEY_ENCRYPTION_KEY=$NEW_KEY" >> .env
  echo "AI_KEY_ENCRYPTION_KEY_VERSION=v1" >> .env
  echo "✅ AI_KEY_ENCRYPTION_KEY eklendi"
fi
```

### 4. OAuth key'leri ekle (opsiyonel)

```bash
# GitHub OAuth (manuel olarak yapıştırın)
echo "GITHUB_OAUTH_CLIENT_ID=<CLIENT_ID>" >> .env
echo "GITHUB_OAUTH_CLIENT_SECRET=<SECRET>" >> .env
```

### 5. Backend'i yeniden başlat

```bash
docker compose restart backend
```

### 6. Doğrula

```bash
# Health check
curl -sf http://localhost:3000/health

# OAuth endpoint (302 veya 503 beklenir)
curl -sI https://staging.akisflow.com/auth/oauth/github | head -5
```

---

## Troubleshooting

### "ENCRYPTION_NOT_CONFIGURED" (503)

**Sebep:** `AI_KEY_ENCRYPTION_KEY` eksik veya geçersiz.

**Çözüm:**
```bash
openssl rand -base64 32  # Yeni key oluştur
echo "AI_KEY_ENCRYPTION_KEY=<key>" >> /opt/akis/.env
docker compose restart backend
```

### "OAUTH_NOT_CONFIGURED" (503)

**Sebep:** GitHub OAuth credentials eksik.

**Çözüm:**
1. https://github.com/settings/developers adresinden OAuth App oluştur
2. Callback URL'i doğru ayarla
3. Client ID ve Secret'ı `.env`'e ekle
4. `docker compose restart backend`

### Database bağlantı hatası

**Sebep:** `DATABASE_URL` yanlış veya PostgreSQL çalışmıyor.

**Çözüm:**
```bash
# PostgreSQL durumunu kontrol et
docker compose ps db

# Bağlantıyı test et
docker compose exec db psql -U akis -d akis_staging -c "SELECT 1"
```
