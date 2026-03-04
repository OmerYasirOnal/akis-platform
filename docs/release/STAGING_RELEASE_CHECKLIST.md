# AKIS Staging Release Checklist

**Versiyon**: 1.3.0
**Son Güncelleme**: 2026-02-16

Bu checklist tekrarlanabilir, güvenilir staging deployment'ları sağlar.

> **İlgili**:
> - [Ops Smoke Checklist](../ops/STAGING_SMOKE_CHECKLIST.md) — Özet A-G post-deploy smoke akışı
> - [Rollback Runbook](../deploy/STAGING_ROLLBACK_RUNBOOK.md) — Ne zaman ve nasıl rollback yapılır
> - [OCI Staging Runbook](../deploy/OCI_STAGING_RUNBOOK.md) — Tam operasyon rehberi

---

## Deploy Öncesi Kontroller

- [ ] `main` branch'ta tüm CI kontrolleri geçiyor
- [ ] GitHub Actions billing blokluysa, eşdeğer manuel CI kapılarını yerelde çalıştırın (backend `typecheck/lint/test:unit`, frontend `typecheck/lint/test/build`, backend `test:integration`, frontend Playwright E2E `--workers=1`) ve release notlarına / issue tracker'a kanıt ekleyin
- [ ] Son commit'lerde bloklayıcı issue yok
- [ ] `AI_KEY_ENCRYPTION_KEY` staging env'de set (OAuth token encrypted write strict-block policy için zorunlu)
- [ ] Aktif doküman referans kontrolü: `node scripts/check_docs_references.mjs`
- [ ] Ground truth doğrulandı:
  ```bash
  git fetch origin && git rev-parse --short origin/main
  gh run list --workflow=oci-staging-deploy.yml -L 1
  curl -sf https://staging.akisflow.com/version | jq -r '.commit'
  ```

---

## M2 Canary İlerlemesi (Observe -> Enforce)

Güvenilirlik rollout için zorunlu canary adımları:

1. `%10 cohort`: `RELIABILITY_CANARY_ENABLED=true`, `AGENT_CONTRACT_CANARY_PERCENT=10`, `VERIFICATION_GATE_CANARY_PERCENT=10`, `VERIFICATION_GATE_ROLLOUT_MODE=warn`, `AGENT_CONTRACT_ENFORCEMENT_MODE=observe`
2. `%50 cohort`: `AGENT_CONTRACT_CANARY_PERCENT=50`, `VERIFICATION_GATE_CANARY_PERCENT=50`, `VERIFICATION_GATE_ROLLOUT_MODE=enforce_scribe`, `AGENT_CONTRACT_ENFORCEMENT_MODE=enforce`
3. `%100 cohort`: `AGENT_CONTRACT_CANARY_PERCENT=100`, `VERIFICATION_GATE_CANARY_PERCENT=100`, `VERIFICATION_GATE_ROLLOUT_MODE=enforce_all`

Her adımda quality gate kontrolü:
- `false_block_rate < 1%`
- `contract_violation_count` trendi stabil
- P0 kullanıcı akışları (Auth + Scribe + Jobs) PASS
- Trace güvenilirlik metrikleri:
  - `trace_reproducibility_rate >= 98%`
  - `critical_flow_coverage >= 95%`
  - `edge_case_category_coverage >= 90%`
  - `flake_rate <= 2%`
  - `mcp_call_success_rate >= 99%`

Threshold ihlalinde: [`../deploy/STAGING_ROLLBACK_RUNBOOK.md`](../deploy/STAGING_ROLLBACK_RUNBOOK.md) içindeki feature-flag rollback uygulanır.

---

## Deploy Nasıl Tetiklenir

### GitHub UI Üzerinden

1. **Actions** → **OCI Staging Deploy**'a gidin
2. **Run workflow**'a tıklayın
3. `confirm_deploy`'u **`deploy`** olarak ayarlayın
4. **Run workflow**'a tıklayın

### CLI Üzerinden

```bash
gh workflow run oci-staging-deploy.yml --field confirm_deploy=deploy
```

---

## Manuel Deploy Yolu (GitHub Actions Olmadan)

### Ne Zaman Kullanılır
- GitHub Actions billing/dakika sorunları
- Workflow hataları veya pipeline bloklu
- Yerel makineden acil deploy gerekli

### Ön Koşullar
- [ ] SSH key dosyası (örn. `~/.ssh/akis-oci`)
- [ ] Hedef commit'te yerel repo
- [ ] Temiz git working tree (`git status` temiz)
- [ ] Opsiyonel: Daha hızlı deploy için GHCR credentials

### Deploy Komutu

```bash
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/akis-oci \
  --ghcr-user omeryasironal \
  --ghcr-token ghp_xxxxxxxxxxxxx \
  --confirm
```

**Notlar**:
- `--confirm` olmadan: dry-run (komutları önizle)
- `--ghcr-*` olmadan: daha yavaş ama çalışır (sunucu tarafı build)
- Apple Silicon (`arm64`) yerel build ile `amd64` staging sunucusuna deploy ediliyorsa image'i `linux/amd64` olarak üretin:
  - `docker buildx build --platform linux/amd64 -t ghcr.io/omeryasironal/akis-platform-devolopment/akis-backend:$(git rev-parse --short HEAD) --load backend`
  - Ardından `docker save | ssh ... 'docker load'` ile sunucuya taşıyın
- Acil deploy için `--skip-tests` kullanın
- Pre-deploy veritabanı backup'ını atlamak için `--skip-backup` kullanın

### Doğrulama

Smoke testleri manuel çalıştırın:
```bash
./scripts/staging_smoke.sh --commit $(git rev-parse --short HEAD)
```

Beklenen çıktı:
```
✅ /health: 200
✅ /ready: 200
✅ /version: 200 (commit: abc1234) MATCH
✅ / (frontend): 200
✅ /api/auth/me: 401
All smoke tests passed!
```

### Sorun Giderme

GitHub Actions yolu ile aynı (bkz. OCI_STAGING_RUNBOOK.md Bölüm 9).

---

## Deploy Sonrası Doğrulama

### Post-Deploy Smoke (A-G)

- [ ] [`../ops/STAGING_SMOKE_CHECKLIST.md`](../ops/STAGING_SMOKE_CHECKLIST.md) uçtan uca çalıştırın
- [ ] PASS/FAIL ve timestamp'i release notlarına kaydedin
- [ ] Kritik bir adım başarısız olursa rollback runbook'u hemen uygulayın

### Zorunlu Endpoint'ler

| Endpoint | Beklenen Yanıt |
|----------|----------------|
| `/health` | `200 {"status":"ok"}` |
| `/ready` | `200 {"ready":true,"database":"connected"}` |
| `/version` | `200 {"commit":"<expected_sha>"}` |

### Doğrulama Komutları

```bash
# Tüm endpoint'leri kontrol et
curl -sf https://staging.akisflow.com/health
curl -sf https://staging.akisflow.com/ready
curl -sf https://staging.akisflow.com/version

# Commit eşleşmesini doğrula
EXPECTED=$(git rev-parse --short origin/main)
DEPLOYED=$(curl -sf https://staging.akisflow.com/version | jq -r '.commit')
[ "$EXPECTED" = "$DEPLOYED" ] && echo "✅ MATCH" || echo "❌ MISMATCH"
```

---

## Sorun Giderme

### Versiyon Uyuşmazlığı

**Belirti**: `/version.commit` workflow `headSha` ile eşleşmiyor

**Teşhis**:
```bash
# Sunucuya SSH
ssh ubuntu@141.147.25.123

# Container durumunu kontrol et
cd /opt/akis
docker compose ps
docker inspect akis-staging-backend --format '{{.Config.Image}} {{.Created}}'

# .env versiyonunu kontrol et
grep BACKEND_VERSION .env

# Backend loglarını kontrol et
docker compose logs --tail=50 backend
```

**Çözüm**:
1. OCI Staging Deploy workflow'unu yeniden çalıştırın
2. Hâlâ başarısız oluyorsa SSH ile manuel çalıştırın:
   ```bash
   cd /opt/akis
   export BACKEND_VERSION=<expected_sha>
   docker compose up -d --force-recreate --pull never backend
   ```

### GHCR Pull Reddedildi

**Belirti**: Workflow "GHCR pull failed (no credentials or image not found)" gösteriyor

**Etki**: Deploy sunucu tarafı build ile devam eder (daha yavaş ama çalışır)

**Opsiyonel Düzeltme**: Daha hızlı deploy için GHCR credentials yapılandırın (~5 dakika deploy süresi kısalır):

#### Adım 1: GitHub PAT Oluştur

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)**'a tıklayın
3. Ayarlayın:
   - **Note**: `AKIS GHCR Read Token`
   - **Expiration**: 90 gün (veya özel)
   - **Scopes**: Sadece `read:packages` seçin
4. **Generate token**'a tıklayın
5. Token'ı kopyalayın (bir daha göremezsiniz)

#### Adım 2: Repository Secret'ları Ekleyin

1. Repository → Settings → Secrets and variables → Actions
2. İki secret ekleyin:
   - **`GHCR_USERNAME`**: GitHub kullanıcı adınız
   - **`GHCR_READ_TOKEN`**: Az önce oluşturduğunuz PAT

#### Adım 3: Doğrula

Sonraki deploy'dan sonra workflow loglarında şunları kontrol edin:
```
GHCR credentials provided, attempting login...
GHCR login successful
GHCR pull successful
```

Şunun yerine:
```
No GHCR credentials provided, attempting anonymous pull...
GHCR pull failed (no credentials or image not found)
=== Building image locally (fallback) ===
```

#### Güvenlik Notu

- Credentials environment variable'lar üzerinden geçer, diske asla kaydedilmez
- Pull denemesinden sonra `docker logout ghcr.io` çağrılır
- PAT süresi dolarsa deploy sunucu tarafı build'e düşer (başarısızlık yok)

### Migration Hataları

**Belirti**: Deploy migration hatalarıyla başarısız oluyor

**Zararsız Hatalar** (otomatik halleder):
- `enum label ... already exists`
- `relation ... already exists`
- `column ... already exists`

**Zararsız Olmayan Hatalar** (deployment başarısız):
- Diğer tüm veritabanı hataları

**Çözüm**:
1. Migration dosyalarında idempotency kontrol edin
2. Enum eklemeleri için `DO $$ IF NOT EXISTS ... END $$;` pattern kullanın
3. Doğrulamak için temiz bir DB'ye karşı yerelde `pnpm db:migrate` çalıştırın

### Health Check Başarısız

**Belirti**: `/health` veya `/ready` yanıt vermiyor

**Teşhis**:
```bash
ssh ubuntu@141.147.25.123
cd /opt/akis
docker compose ps
docker compose logs --tail=100 backend
```

**Çözüm**:
1. Backend'i yeniden başlatın: `docker compose restart backend`
2. Veritabanını kontrol edin: `docker compose exec db pg_isready -U akis`
3. Caddy'yi kontrol edin: `docker compose logs --tail=50 caddy`

---

## Rollback Prosedürü

### Hızlı Rollback

1. Önceki başarılı deploy run'ını bulun:
   ```bash
   gh run list --workflow=oci-staging-deploy.yml -L 5
   ```

2. Önceki headSha'yı alın ve manuel yeniden deploy edin:
   ```bash
   ssh ubuntu@141.147.25.123
   cd /opt/akis
   export BACKEND_VERSION=<previous_sha>
   docker compose up -d --force-recreate --pull never backend
   ```

### Veritabanı Rollback (Sadece Acil Durum)

```bash
ssh ubuntu@141.147.25.123
cd /opt/akis

# Backend'i durdur
docker compose stop backend

# Backup'tan geri yükle (varsa)
docker exec -i akis-staging-db psql -U akis akis_staging < backups/<backup-file>.sql

# Backend'i yeniden başlat
docker compose up -d backend
```

---

## GitHub Actions Billing

### "Problem Billing Your Account" E-postası

GitHub'tan billing sorunları hakkında e-posta alırsanız:

#### Etki

- **Actions**: Workflow'lar duraklatılabilir veya başarısız olabilir
- **Packages**: GHCR pull'ları reddedilebilir
- **Artifacts**: Depolama limitleri uygulanabilir

#### Çözüm Checklist'i

1. **Ödeme Yöntemini Kontrol Et**
   - GitHub → Settings → Billing and plans → Payment information
   - Kartın geçerli ve süresi dolmamış olduğunu doğrulayın
   - Gerekirse güncelleyin

2. **Harcama Limitlerini Kontrol Et**
   - GitHub → Settings → Billing and plans → Spending limits
   - **Actions** harcama limitinin $0 OLMADIĞINDAN emin olun (tüm kullanımı durdurur)
   - Makul bir limit ayarlayın (örn. güvenlik için aylık $10)

3. **Kullanımı İncele**
   - GitHub → Settings → Billing and plans → Plans and usage
   - Bu billing döngüsünde kullanılan Actions dakikalarını kontrol edin
   - Kullanılan Packages depolamasını kontrol edin

4. **Blok Olmadığını Doğrula**
   - GitHub → Settings → Billing and plans → Payment information
   - Kırmızı uyarı veya "action required" bildirimi arayın

#### Düzeltmeden Sonra

1. Başarısız workflow'ları yeniden çalıştırın
2. GHCR erişimini doğrulayın: `docker pull ghcr.io/<owner>/<repo>/<image>:tag`
3. Tekrarlayan sorunlar için sonraki billing döngüsünü izleyin

---

## Migration Idempotency Rehberi

### Idempotent Migration Yazma

Bu repodaki tüm migration'lar idempotent olmalıdır (birden fazla kez çalıştırılabilir).

#### Pattern: Enum Değeri Ekleme

```sql
-- ❌ KÖTÜ: Değer varsa başarısız olur
ALTER TYPE my_enum ADD VALUE 'new_value';

-- ✅ İYİ: Idempotent pattern
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'new_value' AND enumtypid = 'my_enum'::regtype) THEN
        ALTER TYPE my_enum ADD VALUE 'new_value';
    END IF;
END $$;
```

#### Pattern: Kolon Ekleme

```sql
-- ❌ KÖTÜ: Kolon varsa başarısız olur
ALTER TABLE users ADD COLUMN status VARCHAR(50);

-- ✅ İYİ: Idempotent pattern
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50);
```

#### Pattern: İndeks Oluşturma

```sql
-- ❌ KÖTÜ: İndeks varsa başarısız olur
CREATE INDEX idx_users_email ON users(email);

-- ✅ İYİ: Idempotent pattern
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### Idempotency Doğrulama

Gece smoke workflow'u migration'ları aynı DB'ye karşı iki kez çalıştırır. Migration'ınız idempotent değilse staging'e ulaşmadan orada başarısız olur.

---

## Referans

- Tam runbook: [OCI_STAGING_RUNBOOK.md](../deploy/OCI_STAGING_RUNBOOK.md)
- Workflow: `.github/workflows/oci-staging-deploy.yml`
- Deploy script: `deploy/oci/staging/deploy.sh`
