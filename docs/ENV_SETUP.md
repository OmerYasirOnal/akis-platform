# Ortam Kurulumu (Canonical)

## Yerel Geliştirme

### Backend

1. `backend/.env.example` dosyasını `backend/.env` olarak kopyalayın.
2. Gerekli değerleri ayarlayın (`DATABASE_URL`, auth ve app ayarları).
3. Backend'i başlatın:

```bash
pnpm -C backend dev
```

### Frontend

1. Gerekirse `frontend/.env.example` dosyasını `frontend/.env` olarak kopyalayın.
2. Frontend'i başlatın:

```bash
pnpm -C frontend dev
```

## Staging Ortamı

- Runtime kaynak: `/opt/akis/.env`
- Snapshot süreci: `docs/ops/STAGING_ENV_SNAPSHOT.md`
- Deployment ve operasyonlar: `docs/deploy/OCI_STAGING_RUNBOOK.md`

## OAuth ve Entegrasyon Temelleri

### GitHub MCP (staging'de agent GitHub işlemleri için gerekli)

- Staging `/opt/akis/.env` içinde `GITHUB_TOKEN` ayarlayın.
- `GITHUB_MCP_BASE_URL`'in erişilebilir gateway URL'ine işaret ettiğinden emin olun.

### Atlassian OAuth (etkinse)

- `ATLASSIAN_OAUTH_CLIENT_ID` ayarlayın
- `ATLASSIAN_OAUTH_CLIENT_SECRET` ayarlayın
- `ATLASSIAN_OAUTH_CALLBACK_URL` ayarlayın

## Güvenlik Kuralları

- Gerçek secret'ları asla commit etmeyin.
- Kişisel override'ları ignore edilen dosyalarda tutun (`backend/.env.local`, `frontend/.env.local`).
- Staging secret'larını takip edilen şablon dosyalarına kopyalamayın.
