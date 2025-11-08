# AKIS Platform

**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)

AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

## Özellikler

- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Teknoloji Stack

- **Backend**: Fastify + TypeScript (Node ≥ 20)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React (Vite SPA, Next.js kullanılmıyor) + Tailwind CSS
- **Integrations**: MCP (Model Context Protocol) adapters

## Güncel Durum

- Phase 8: Frontend SPA ✓
- Phase 9.1: Dark Theme Unification & Auth UI ✓
- Phase 9: Auth & RBAC ▶

## Phase 9.1 – Dark Theme Unification & Auth UI

- Site geneli `#0A1215` full-bleed, header/footer kartları `ak-surface` / `ak-surface-2`.
- Hero logosu 72–112px aralığında `Logo.tsx` ile clamp'lenir; yüksek çözünürlüklü `akis-official-logo@2x.png`.
- Landing CTA'ları `/signup` (primary) ve `/login` (outline) yönlendirmeleriyle güncellendi.
- `/login` ve `/signup` kartları `ak-surface-2`, focus ring `ak-primary`; demo roller (`admin`, `member`) UI üzerinden doğrulanır.
- Docs güncellemeleri: IA, Design System, Auth notları Phase 9.1 temasıyla senkron.

## Roadmap & Milestones

Phase 9.2 ile i18n ve theming temel katmanları hazırlanarak çok dilli deneyim ve tema varyantları için altyapı kuruluyor.
Varsayılan koyu tema korunurken light mode ve marka varlıkları için hazırlıklar tamamlanacak; lint temizlikleri geliştirici deneyimini yükseltiyor.
Güncel kilometre taşları ve kabul notlarının tamamı [docs/ROADMAP.md](docs/ROADMAP.md) belgesinde takip ediliyor.

### Phase 9.2 İzleme

- [Epic] [#24 Phase 9.2 — i18n & Theming Foundations](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/24)
- [Frontend] [#25 Phase 9.2 — i18n (TR/EN) enablement](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/25)
- [Frontend] [#26 Phase 9.2 — Theme toggle (Dark/Light)](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/26)
- [Branding] [#27 Phase 9.2 — High-res logo rollout (@2x/@3x, retina-crisp)](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/27)
- [Frontend] [#28 Phase 9.2 — Subtle cursor/spotlight effects (GPU-friendly)](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/28)
- [Quality] [#29 Phase 9.2 — Lint: exhaustive-deps cleanup](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/29)

### Phase 10 İzleme

- [Epic] [#44 Phase 10 — Next Foundations](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/44)
- [Frontend] [#49 Phase 10 — Settings UX refinement](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/49)
- [Frontend] [#47 Phase 10 — Accessibility pass](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/47)
- [Frontend] [#48 Phase 10 — Performance budgets](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/48)
- [Frontend] [#45 Phase 10 — ROI widget (Pricing)](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/45)
- [Frontend] [#46 Phase 10 — FAQ accordion (Landing)](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/46)

## Geliştirme

### Backend

```bash
cd backend
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values (especially DATABASE_URL)

# Run development server
pnpm dev

# The server will start on http://localhost:3000 (default port)
# Health check: http://localhost:3000/health
# Frontend default port: 5173 (Vite)
```

### Ortak Ortam Değişkenleri

| Anahtar | Açıklama | Varsayılan |
| --- | --- | --- |
| `FRONTEND_URL` | SPA kök URL'si; CORS ve yönlendirmeler için kullanılır | `http://localhost:5173` |
| `BACKEND_URL` / `VITE_API_URL` | REST API taban URL'si; frontend istekleri için önerilen `VITE_API_URL` | `http://localhost:3000` |
| `CORS_ORIGINS` | Virgülle ayrılmış izin verilen origin listesi (credentials=true) | `http://localhost:5173` |
| `NODE_ENV` | Çalışma modu (`development`, `production`, `test`) | `development` |
| `AUTH_COOKIE_NAME` | Oturum çerezi adı | `akis_sid` |
| `AUTH_COOKIE_MAXAGE` | Oturum çerezi max-age (saniye cinsinden) | `604800` (7 gün) |
| `AUTH_COOKIE_SAMESITE` | SameSite politikası (`Lax` önerildi) | `Lax` |
| `AUTH_COOKIE_SECURE` | HTTPS üzerinde secure bayrağı (prod ortamında zorunlu) | `false` (yalnızca lokal) |
| `AUTH_COOKIE_DOMAIN` | Opsiyonel domain sabitlemesi | — |

### Local Dev Hızlı Komutlar

```bash
# Backend
cd backend && pnpm dev

# Frontend
cd frontend && npm run dev
```

### Komutlar

- `pnpm dev` - Development server (watch mode)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

### Frontend

```bash
cd frontend
npm install

# Set up environment
cp .env.example .env

# Run development server
npm run dev

# The frontend will start on http://localhost:5173 (default port)
```

## CI/CD

Proje GitHub Actions ile otomatik test edilir. Her push ve pull request'te CI workflow çalışır.

**Not:** PR açınca split jobs (backend/frontend) çalışır; Postgres 16 service ile testler koşturulur.

### CI Konfigürasyonu

- **Node.js**: 22.12.0
- **Backend Job**:
  - PostgreSQL 16 service (test veritabanı: `akis_v2_test`)
  - pnpm ile bağımlılık yönetimi ve cache optimizasyonu
  - Drizzle migration'ları (`db:generate` ve `db:migrate`)
  - Typecheck, lint ve test adımları
  - `DATABASE_URL` test veritabanına işaret eder
- **Frontend Job**:
  - npm ile bağımlılık yönetimi
  - Typecheck, lint ve test adımları

### Branch Protection

`main` branch için branch protection kuralları aktif edilmelidir:
- "Require status checks to pass before merging" seçeneği aktif olmalı
- `backend` ve `frontend` job'ları required status check olarak eklenmelidir

Bu ayarlar GitHub repository Settings > Branches > Branch protection rules üzerinden yapılır.

## Dokümantasyon

Detaylı dokümantasyon için [docs/](docs/) klasörüne bakın.

## Lisans

MIT License - Bkz. [LICENSE](LICENSE) dosyası.

