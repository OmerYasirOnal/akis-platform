# Staging Rollback Runbook

**Versiyon**: 1.1.0
**Son Güncelleme**: 2026-02-16
**Kapsam**: Staging Ortamı (`staging.akisflow.com`)

> [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) Bölüm 10'dan çıkarıldı, ek detaylarla.

---

## Ne Zaman Rollback Yapılır

| Tetikleyici | Önem | Aksiyon |
|---------|----------|--------|
| Smoke test versiyon uyuşmazlığı | KRİTİK | Anında rollback |
| Deploy sonrası health endpoint 503 | YÜKSEK | 5 dakika içinde rollback |
| Frontend boş sayfa | YÜKSEK | Önce Caddy kontrol et, sonra rollback |
| Deploy sonrası auth akışı bozuk | ORTA | İncele, 15 dk'da düzeltilemezse rollback |
| Trace tekrarlanabilirlik <%98 | YÜKSEK | Feature-flag rollback + drift incelemesi |
| Trace flake oranı >%2 (15dk pencere) | YÜKSEK | Feature-flag rollback + karantina incelemesi |
| Trace edge-case kapsamı <%90 | YÜKSEK | Enforce rollout'u durdur, observe'a geri dön |
| Kritik olmayan UI bug | DÜŞÜK | İleri düzelt, rollback gerekmez |

---

## M2 Güvenilirlik Acil Rollback

M2 güvenilirlik dalgası için en hızlı rollback yolu deploy rollback değil, feature-flag rollback'tir.

| Alan | Env Flag | Güvenli Rollback Değeri |
|--------|----------|---------------------|
| Contract enforcement | `AGENT_CONTRACT_ENFORCEMENT_MODE` | `observe` |
| Verification gates rollout | `VERIFICATION_GATE_ROLLOUT_MODE` | `observe` |
| Canary gating | `RELIABILITY_CANARY_ENABLED` | `false` |
| Contract canary oranı | `AGENT_CONTRACT_CANARY_PERCENT` | `0` |
| Gate canary oranı | `VERIFICATION_GATE_CANARY_PERCENT` | `0` |
| Deterministic planning force | `AI_FORCE_DETERMINISTIC_PLAN` | `false` (opsiyonel, sadece ihtiyaç halinde) |
| Freshness scheduler | `FRESHNESS_SCHEDULER_ENABLED` | `false` |

**Prosedür (kod rollback yok):**
1. Yukarıdaki staging `.env` flag'lerini güncelle.
2. Backend container'ı yeniden başlat.
3. `GET /health`, `GET /ready`, `GET /api/knowledge/freshness/status` çalıştır.
4. Smoke + regresyon alt kümesini yeniden çalıştır.

> Not: OAuth token encryption write policy (`AI_KEY_ENCRYPTION_KEY`) feature-flag ile kapatılamaz.
> Key eksikse callback write akışları block olur; rollback yerine key provisioning fix uygulanmalıdır.

## Trace Rollout Audit Alanları (Zorunlu)

Rollback veya enforce-mode değişikliği yapıldığında aşağıdaki alanlar incident notuna yazılır:

1. `who` (değişikliği yapan kişi)
2. `when` (UTC timestamp)
3. `metric` (ihlali tetikleyen metrik ve değer)
4. `rollback_toggle` (değiştirilen env flag listesi)
5. `cohort` (`10`, `50`, `100`)

---

## 1. Otomatik Rollback (CI/CD)

`oci-staging-deploy.yml` workflow'u otomatik rollback içerir:

1. Deploy sonrası health check çalıştırır (30 deneme x 5s)
2. Health check başarısız olursa **önceki** Docker image versiyonunu çeker
3. Backend'i önceki image ile yeniden başlatır
4. Health check'i yeniden çalıştırır

**Manuel müdahale gerekmez** — workflow bunu halleder.

Otomatik rollback tetiklenip tetiklenmediğini kontrol etmek için:
```bash
gh run view <RUN_ID> --log | grep -i rollback
```

---

## 2. Versiyon ile Manuel Rollback

### Adım 1: Önceki Çalışan Versiyonu Belirle

```bash
# Seçenek A: Son GitHub Actions deploy run'larını kontrol et
gh run list --workflow=oci-staging-deploy.yml -L 5

# Seçenek B: GHCR tag'lerini kontrol et
docker image ls ghcr.io/omeryasironal/akis-backend --format '{{.Tag}}'

# Seçenek C: Sunucudaki deploy loglarını kontrol et
ssh <USER>@<STAGING_HOST> "cat /opt/akis/deploy.log | tail -20"
```

### Adım 2: VM'e SSH ile Bağlan

```bash
ssh -i ~/.ssh/akis-oci <USER>@<STAGING_HOST>
cd /opt/akis
```

### Adım 3: Önceki Versiyonu Çek ve Deploy Et

```bash
# Hedef versiyonu ayarla (commit SHA veya tag kullan)
export BACKEND_VERSION=<previous_commit_sha>

# Belirli versiyonu çek
docker compose pull backend

# Önceki versiyonla yeniden başlat
docker compose up -d --force-recreate backend
```

### Adım 4: Rollback'i Doğrula

```bash
# Health check
curl -sf https://staging.akisflow.com/health | jq .

# Versiyon kontrolü (eski commit göstermeli)
curl -sf https://staging.akisflow.com/version | jq .

# Ready kontrolü (DB bağlantısı)
curl -sf https://staging.akisflow.com/ready | jq .
```

### Adım 5: Tam Smoke Test Çalıştır

```bash
# Dev makinesinden
./scripts/staging_smoke.sh --commit <previous_commit_sha>
```

---

## 3. Veritabanı Hususları

### Migration Politikası: Sadece İleri

AKIS **sadece ileri migration** kullanır. Otomatik `down` migration yoktur.

| Senaryo | Aksiyon |
|----------|--------|
| Yeni kod + yeni migration | Kodu rollback et, migration kalır (geriye uyumlu olmalı) |
| Migration veriyi bozdu | **Compensating migration** yaz (sorunu düzelten yeni ileri migration) |
| Tam veri bozulması | Backup'tan geri yükle (aşağıya bakın) |

### Neden Sadece İleri?

- Drizzle ORM sadece ileri SQL üretir
- Down migration'lar hataya açık ve genelde test edilmemiş
- Compensating migration'lar daha güvenli ve denetlenebilir

### Veritabanı Backup Geri Yükleme (Son Çare)

> **Uyarı**: Backup noktasına geri yükler. Backup'tan sonra oluşturulan tüm veri kaybolur.

```bash
ssh <USER>@<STAGING_HOST>
cd /opt/akis

# 1. Backend'i durdur
docker compose stop backend

# 2. Mevcut backup'ları listele
ls -la backups/

# 3. Backup'tan geri yükle
docker exec -i akis-staging-db psql -U akis akis_staging < backups/<backup-file>.sql

# 4. Backup ile eşleşen kod versiyonuyla backend'i yeniden başlat
export BACKEND_VERSION=<version_matching_backup>
docker compose up -d backend

# 5. Doğrula
curl -sf https://staging.akisflow.com/health | jq .
```

---

## 4. Rollback Karar Matrisi

```
Deploy başarısız mı?
  ├── Health check başarısız → Otomatik rollback (CI halleder)
  ├── Health OK ama versiyon yanlış → Manuel rollback (Adım 2)
  ├── Health OK, versiyon OK, ama özellik bozuk
  │   ├── Auth bozuk → Manuel rollback (Adım 2)
  │   ├── UI glitch → İleri düzelt (yeni PR)
  │   └── Veri sorunu → Compensating migration
  └── DB migration başarısız → Migration loglarını kontrol et, düzelt ve yeniden çalıştır
```

---

## 5. İletişim Protokolü

| Ne Zaman | Kim | Ne |
|------|-----|-----|
| Rollback başlatıldı | Deployer | Proje kanalında: "Staging <version>'a rollback ediliyor, sebep: <reason>" |
| Rollback tamamlandı | Deployer | "Rollback tamamlandı, smoke testler geçiyor" |
| Kök neden belirlendi | Deployer/Dev | "Kök neden: <açıklama>, fix PR: #<numara>" |

---

## 6. Rollback Sonrası Checklist

- [ ] Smoke testler rollback edilen versiyonda geçiyor
- [ ] Kök neden belirlendi
- [ ] Fix PR oluşturuldu (conventional commit: `fix(scope): description`)
- [ ] Fix PR CI'dan geçiyor
- [ ] Fix ile yeniden deploy

---

## İlgili Dokümanlar

- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Tam staging operasyonları
- [../ops/STAGING_SMOKE_CHECKLIST.md](../ops/STAGING_SMOKE_CHECKLIST.md) — Smoke test detayları
- [../release/STAGING_RELEASE_CHECKLIST.md](../release/STAGING_RELEASE_CHECKLIST.md) — Release checklist
- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Deployment mimarisi
