# AKIS Platform'a Katki Rehberi

[Turkce](#turkce-katki-rehberi) | [English](#english-contributing-guide)

---

## Turkce Katki Rehberi

AKIS'a katki sagladiginiz icin tesekkurler! Bu belge katki surecini, kod standartlarini ve PR beklentilerini aciklar.

### Katki Sureci

```
1. Fork  →  2. Clone  →  3. Branch  →  4. Kod  →  5. Test  →  6. Commit  →  7. Push  →  8. PR
```

#### 1. Fork ve Clone

```bash
# GitHub'da repo'yu fork'layin, sonra:
git clone https://github.com/<KULLANICI_ADINIZ>/akis-platform.git
cd akis-platform/devagents
```

#### 2. Branch Olusturun

Branch adlandirma kurali:

| Tur | Format | Ornek |
|-----|--------|-------|
| Ozellik | `feat/kisa-aciklama` | `feat/pipeline-retry-ui` |
| Hata duzeltme | `fix/hata-adi` | `fix/scribe-timeout` |
| Refactor | `refactor/alan` | `refactor/auth-middleware` |
| Dokumantasyon | `docs/konu` | `docs/api-reference` |

```bash
git checkout -b feat/kisa-aciklama
```

#### 3. Gelistirme Ortamini Kurun

```bash
# PostgreSQL'i baslat
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env       # API key'lerinizi girin
pnpm install
pnpm db:migrate
pnpm dev                   # http://localhost:3000

# Frontend (yeni terminal)
cd frontend
pnpm install
pnpm dev                   # http://localhost:5173
```

#### 4. Kod Yazin

Kodunuzu yazarken asagidaki mimari kisitlamalara uyun.

#### 5. Kalite Kapisini Gecirin

Her commit oncesi **tum kontrollerin** gecmesi zorunludur:

```bash
# Backend
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test:unit && pnpm -C backend build

# Frontend
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build
```

#### 6. Commit Yazin

[Conventional Commits](https://www.conventionalcommits.org/) standardini kullanin:

```
feat(pipeline): retry icin backoff stratejisi ekle
fix(auth): suresi dolmus OAuth token islemesini duzelt
refactor(db): pipeline sema'yi normalize et
docs(readme): ekran goruntuleri guncelle
chore(deps): drizzle-orm v0.38'e guncelle
test(scribe): fixture dosyalarini guncelle
```

- **Scope zorunludur:** `feat:` degil, `feat(pipeline):` seklinde yazin.
- Commit mesaji Turkce veya Ingilizce olabilir.

#### 7. Push ve PR Acin

```bash
git push origin feat/kisa-aciklama
```

GitHub'da Pull Request acin. PR aciklamasinda:
- **Ne degisti** — kisa ozet
- **Neden degisti** — motivasyon veya issue referansi
- **Nasil test edildi** — hangi komutlar calistirildi, ne dogrulandi
- Varsa ilgili issue'yu baglantilarin: `Closes #123`

### Kod Standartlari

- **TypeScript strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`
- **ESLint** kurallarina uyun — lint kurallarini devre disi birakmayin (gercekten gerekmedikce)
- **Prettier** formatlama — kaydetmeden once formatlayin
- Minimum yorum — sadece acik olmayan mantik icin
- Docstring/JSDoc eklemeye gerek yok (mevcut koda eklenmemisse)

### Mimari Kisitlamalar

Bu projede asagidaki kurallar **kesinlikle** gecerlidir:

| Kural | Aciklama |
|-------|----------|
| **Express/NestJS/Prisma/Next.js YASAK** | Backend: Fastify + Drizzle. Baska framework kullanilmaz. |
| **SSR framework YASAK** | Frontend: React SPA + Vite. Server-side rendering yok. |
| **Agent'lar birbirini cagirmaz** | Tum iletisim `PipelineOrchestrator` uzerinden yapilir. |
| **Agent'lar DB/API client olusturmaz** | Tool'lar orchestrator tarafindan inject edilir. |
| **`temperature=0`** | Tum agent prompt'larinda. |
| **Pipeline ciktilari platform repo'suna push edilmez** | Agent'lar sadece kullanici repo'larina push eder. |

### Issue Acma

#### Bug Raporu

Yeni issue acin ve su bilgileri ekleyin:
- **Baslik:** Kisa ve aciklayici (`[Bug] Scribe timeout after 3 retries`)
- **Adimlar:** Hatanin nasil tekrarlanacagi
- **Beklenen davranis:** Ne olmasi gerekiyordu
- **Gerceklesen davranis:** Ne oldu
- **Ortam:** Browser, OS, Node.js surumu

#### Ozellik Istegi

- **Baslik:** `[Feature] Kisa aciklama`
- **Aciklama:** Ne isteniyor ve neden
- **Olasi cozum:** Varsa onerilen yaklasim

### Yardim

Sorulariniz icin GitHub Issues uzerinden iletisime gecebilirsiniz.

---

<details>
<summary><h2 id="english-contributing-guide">English Contributing Guide</h2></summary>

Thanks for contributing to AKIS! This document explains the contribution workflow, code standards, and PR expectations.

### Contribution Workflow

```
1. Fork  →  2. Clone  →  3. Branch  →  4. Code  →  5. Test  →  6. Commit  →  7. Push  →  8. PR
```

#### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<YOUR_USERNAME>/akis-platform.git
cd akis-platform/devagents
```

#### 2. Create a Branch

Branch naming convention:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/short-description` | `feat/pipeline-retry-ui` |
| Bug fix | `fix/bug-name` | `fix/scribe-timeout` |
| Refactor | `refactor/area` | `refactor/auth-middleware` |
| Documentation | `docs/topic` | `docs/api-reference` |

```bash
git checkout -b feat/short-description
```

#### 3. Set Up Development Environment

```bash
# Start PostgreSQL
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env       # Configure your API keys
pnpm install
pnpm db:migrate
pnpm dev                   # http://localhost:3000

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev                   # http://localhost:5173
```

#### 4. Write Code

Follow the architectural constraints listed below.

#### 5. Pass the Quality Gate

All checks **must** pass before every commit:

```bash
# Backend
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test:unit && pnpm -C backend build

# Frontend
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build
```

#### 6. Write a Commit Message

Use the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
feat(pipeline): add retry backoff strategy
fix(auth): handle expired OAuth tokens
refactor(db): normalize pipeline schema
docs(readme): update screenshots
chore(deps): update drizzle-orm to v0.38
test(scribe): update fixture files
```

- **Scope is required:** Write `feat(pipeline):` not `feat:`.
- Commit messages can be in Turkish or English.

#### 7. Push and Open a PR

```bash
git push origin feat/short-description
```

Open a Pull Request on GitHub. In the PR description include:
- **What changed** — brief summary
- **Why it changed** — motivation or issue reference
- **How it was tested** — which commands were run, what was verified
- Link related issues if applicable: `Closes #123`

### Code Standards

- **TypeScript strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`
- **ESLint** rules — do not disable lint rules (unless truly justified)
- **Prettier** formatting — format before saving
- Minimal comments — only for non-obvious logic
- No need to add docstrings/JSDoc (unless the existing code already has them)

### Architectural Constraints

The following rules are **strictly** enforced in this project:

| Rule | Explanation |
|------|-------------|
| **No Express/NestJS/Prisma/Next.js** | Backend: Fastify + Drizzle only. No other frameworks. |
| **No SSR frameworks** | Frontend: React SPA + Vite. No server-side rendering. |
| **Agents don't call each other** | All communication goes through `PipelineOrchestrator`. |
| **Agents don't create DB/API clients** | Tools are injected by the orchestrator. |
| **`temperature=0`** | For all agent prompts. |
| **Pipeline outputs don't push to platform repo** | Agents only push to user repos. |

### Filing Issues

#### Bug Report

Open a new issue and include:
- **Title:** Short and descriptive (`[Bug] Scribe timeout after 3 retries`)
- **Steps:** How to reproduce the bug
- **Expected behavior:** What should have happened
- **Actual behavior:** What happened
- **Environment:** Browser, OS, Node.js version

#### Feature Request

- **Title:** `[Feature] Short description`
- **Description:** What is requested and why
- **Possible solution:** Suggested approach if any

### Help

For questions, reach out via GitHub Issues.

</details>
