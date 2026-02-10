# Public Portfolio Deposu — Kapsam ve Gerekçe

> Public `akis-platform-portfolio` deposuna ne giriyor ve neden.

## Strateji

**İzin listesi (allowlist) tabanlı export** — yalnızca açıkça onaylanan yollar kopyalanır.
Export sonrasında gizli bilgi sızıntısını yakalamak için bir yasak listesi (denylist) taraması çalışır.

## Dahil Edilen (İzin Listesi)

### Dokümantasyon
| Yol | Neden |
|-----|-------|
| `README.md` | Türkçe README — `docs/PUBLIC_PORTFOLIO.md` şablonundan üretilir |
| `README.en.md` | İngilizce README — `docs/PUBLIC_PORTFOLIO_EN.md` şablonundan üretilir |
| `LICENSE` | MIT lisansı |
| `SECURITY.md` | Güvenlik açığı bildirimi |
| `docs/agents/AGENT_CONTRACTS_S0.5.md` | Ajan I/O tasarımını gösterir |
| `docs/agents/CONTEXT_PACKS.md` | RAG mimari kararını gösterir |
| `docs/UI_DESIGN_SYSTEM.md` | Frontend tasarım sistemi |
| `docs/WEB_INFORMATION_ARCHITECTURE.md` | UX düşüncesi |
| `backend/docs/API_SPEC.md` | API tasarımı |
| `backend/docs/Auth.md` | Kimlik doğrulama akış tasarımı |
| `backend/docs/AGENT_WORKFLOWS.md` | Ajan iş akışı hattı |

### Kaynak Kod (Vitrin)
| Yol | Neden |
|-----|-------|
| `backend/src/core/orchestrator/` | Merkezi orkestrasyon motoru |
| `backend/src/core/state/` | FSM durum makinesi |
| `backend/src/core/events/` | Olay veriyolu + SSE |
| `backend/src/core/tracing/` | İz kaydı |
| `backend/src/core/contracts/` | Ajan sözleşme tipleri |
| `backend/src/core/planning/` | Plan üretimi |
| `backend/src/services/quality/` | Kalite puanlaması |
| `backend/src/core/watchdog/` | Askıda kalan iş tespiti |
| `backend/src/agents/scribe/` | Scribe ajan implementasyonu |
| `backend/src/agents/trace/` | Trace ajan implementasyonu |
| `backend/src/agents/proto/` | Proto ajan implementasyonu |
| `backend/src/services/mcp/adapters/` | MCP protokol adaptörleri |
| `frontend/src/pages/dashboard/` | Dashboard sayfaları |
| `frontend/src/pages/dashboard/agents/` | Ajan konsol sayfaları |
| `frontend/src/components/agents/` | Ajan UI bileşenleri |
| `frontend/src/components/jobs/` | İş yönetimi UI |
| `frontend/src/components/dashboard/` | Dashboard widget'ları |

### Görseller
| Yol | Neden |
|-----|-------|
| `docs/public/assets/` | Ekran görüntüleri, demo GIF'leri |

## Hariç Tutulan (Yasak Listesi)

### Her zaman hariç — güvenlik riski
- `.env*`, `*.env`, `.env.example` (örnekler bile altyapı ipucu verebilir)
- `*key*`, `*secret*`, `*.pem`, `*.p12`, `*.pfx`
- `deploy/` (staging/prod altyapı detayları)
- `.github/workflows/` (CI gizli referansları)
- `scripts/` (dahili hostname içeren operasyonel script'ler)
- `docs/deploy/` (VM/SSH detaylı runbook'lar)
- `docs/planning/` (dahili sprint planlaması)
- `docs/qa/` (dahili KG kontrol listeleri)
- `mcp-gateway/` (tam servis kaynağı — dahili tut)

### Hariç — portföy için faydasız
- `node_modules/`, `dist/`, `*.lock`, `pnpm-lock.yaml`
- `.cursor/`, `.agent/`, `.codex/`
- Test dosyaları (`*.test.*`, `__tests__/`)
- `backend/test/` (tam test paketi — dahili tut)
- `backend/src/db/` (şema dahili yapıyı açıklar)
- `backend/src/config/` (env ayrıştırma)
- `backend/src/api/` (route handler'lar — sıradan boilerplate)
- `backend/migrations/` (SQL migration dosyaları)
- `frontend/src/i18n/` (çeviri dosyaları)
- `frontend/src/services/api/` (HTTP istemci iç yapısı)

## Yasak Listesi Tarama Kalıpları

Export script'i, dışa aktarılan tüm dosyaları şu kalıplara karşı tarar:

```
# Token / API anahtarları
sk-[a-zA-Z0-9]{20,}
ghp_[a-zA-Z0-9]{36}
gho_[a-zA-Z0-9]{36}
GOCSPX-[a-zA-Z0-9_-]+
whsec_[a-zA-Z0-9]+
xoxb-[a-zA-Z0-9-]+

# Özel IP / hostname'ler
\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b
/opt/akis
opc@

# Asla görünmemesi gereken dahili dosya adları
\.env\.staging
STAGING_SSH_KEY
STAGING_HOST
```

## Doğrulama

Export sonrasında:
1. `scripts/public-repo/export.sh` çalıştır (`dist/public-repo/` oluşturur)
2. Script otomatik olarak yasak listesi taramasını çalıştırır
3. Manuel inceleme: `ls -la dist/public-repo/` ile dosyaları kontrol et
4. Çıktı dizininden public depoyu oluştur
