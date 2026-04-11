# AKIS Platform — Session Report (2026-04-11)

## Oturum Ozeti

Branch `fix/trace-stability-and-ui` → PR #357 → squash merge to `main` → deploy to `akisflow.com`

### Yapilan Isler (5 commit, squash merged)

| Faz | Gorev | Durum |
|-----|-------|-------|
| **Pipeline** | Trace AI call 3dk timeout | Done |
| **Pipeline** | Codebase context 200K char limit | Done |
| **Pipeline** | Granular progress emission (dosya + AI) | Done |
| **Pipeline** | MCP adapter: depth limit, visited set, exclusion fix | Done |
| **UI** | ChatHeader: repo clickable GitHub link | Done |
| **UI** | repoFullName: artik gercek repo adi (branch degil) | Done |
| **Security** | Auth per-endpoint rate limiting (5-10/dk) | Done |
| **Security** | Verification brute-force: 5 hata → 30dk lockout | Done |
| **Security** | /ready: prod'da hassas bilgi gizleme | Done |
| **Security** | OAuth state: HMAC-signed stateless tokens | Done |
| **Security** | CORS: wildcard + credentials = reject | Done |
| **Security** | @fastify/compress: gzip/brotli | Done |
| **Security** | OAuth startup log: pino structured logging | Done |
| **CI** | PR gate'e npm audit (backend + frontend) | Done |
| **Scripts** | perf-baseline.sh | Done |
| **Scripts** | security-audit.sh | Done |

---

## Quality Gate Sonuclari

| Kontrol | Backend | Frontend |
|---------|---------|----------|
| Typecheck | Pass | Pass |
| Lint | Pass | Pass |
| Unit Tests | 1409 pass / 0 fail | 233 pass / 0 fail |
| Build | Pass | Pass |
| CI (pr-gate) | Pass | Pass |

---

## Performance Baseline (Pre-deploy)

| Endpoint | Path | Status | Avg Response |
|----------|------|--------|-------------|
| Health | /health | 200 | 174ms |
| Ready | /ready | 200 | 327ms |
| Version | /version | 200 | 150ms |
| Landing | / | 200 | 147ms |
| Docs | /docs | 200 | 144ms |
| Pipelines | /api/pipelines | 401 | 147ms |

---

## Security Audit (Pre-deploy)

| Kontrol | Sonuc | Not |
|---------|-------|-----|
| HTTPS redirect | PASS | HTTP → HTTPS (301) |
| HSTS header | PASS | Present |
| X-Content-Type-Options | PASS | Present |
| X-Frame-Options | PASS | Present |
| Ready info leakage | **FAIL** | SMTP/MCP/OAuth detaylari acik |
| Auth rate limiting | WARN | Henuz deploy edilmedi |

## Security Audit (Post-deploy — commit `0686fe7`)

| Kontrol | Sonuc | Not |
|---------|-------|-----|
| HTTPS redirect | PASS | HTTP → HTTPS (301) |
| HSTS header | PASS | Present |
| X-Content-Type-Options | PASS | Present |
| X-Frame-Options | PASS | Present |
| Ready info leakage | **PASS** | SMTP/MCP/OAuth detaylari gizlendi |
| Auth rate limiting | WARN | Per-endpoint limit aktif (5/dk), script 12 req yeterli degil |
| CORS origin restriction | PASS | Arbitrary origin reddedildi |

## Deploy Detaylari

- **Commit:** `0686fe7` (main)
- **Image:** `ghcr.io/omeryasironal/akis-platform/akis-backend:latest`
- **Container:** `akis-staging-backend` → Up (healthy)
- **Frontend:** Static files `/opt/akis/frontend/` guncellendi
- **Caddy:** Timeout eklendi (read/write 120s), reload basarili
- **CI fix:** Docker tag lowercase (`github.repository` → `repo_lower`)

---

## Bilinen Sorunlar

| Sorun | Seviye | Durum |
|-------|--------|-------|
| /auth/profile 500 (unauth) | Low | Pre-existing, scope disi |
| CSRF protection eksik | Medium | Faz 4 (thesis sonrasi) |
| Sentry entegrasyonu yok | Medium | Faz 3 (sonraki oturum) |
| E2E PR gate'te degil | Low | Faz 3 (sonraki oturum) |

---

## Gelistirme Dongusu (Kuruldu)

```
Inner Loop → PR/CI Loop → Release Loop → Improvement Loop → Incident Loop
     ↑                                                              |
     └──────────────────────────────────────────────────────────────┘
```

### Scriptler
- `scripts/perf-baseline.sh` — endpoint response time + bundle size
- `scripts/security-audit.sh` — HTTPS, HSTS, CORS, rate limit, info leak

### Planlanan Sonraki Calismalar
- Faz 3: Sentry, E2E subset PR gate, performance baseline tracking
- Faz 4: OpenTelemetry, k6 load test, CSRF, Grafana

---

## Commit Gecmisi

```
c747bae fix(pipeline+security): trace stability, UI visibility, auth hardening (#357)
```

Squash merge icerir:
1. `fix(pipeline): trace AI timeout + repo/branch visibility in chat UI`
2. `security(auth): rate limiting, brute-force protection, info leak prevention`
3. `security(auth): stateless OAuth state, CORS hardening, response compression`
4. `chore(scripts): add performance baseline and security audit scripts`
