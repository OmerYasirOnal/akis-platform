# AKIS Workstream MVP - How To Run

## 1. Prerequisites
- Node.js 20+
- pnpm
- Docker + Docker Compose

## 2. Install and Start Dependencies
```bash
pnpm install
./scripts/db-up.sh
```

## 3. Database
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate
```

## 4. Start Services
Terminal 1:
```bash
pnpm -C backend dev
```

Terminal 2:
```bash
pnpm -C frontend dev
```

## 5. Optional Feature Flag
Template-based proposal generation is default.

To allow LLM hook execution path:
```bash
export MARKETPLACE_PROPOSAL_LLM_ENABLED=true
```

## 6. Manual MVP Flow Validation
1. Open `http://localhost:5173/marketplace`
2. Sign in and navigate to `/app/onboarding`
3. Save profile (headline, bio, skills)
4. Go to `/app/jobs` and click "Ingest sample job"
5. Go to `/app/matches` and click "Run match"
6. Confirm score + explanation JSON is visible
7. Go to `/app/proposals` and click "Generate proposal"
8. Confirm draft appears in generated list

## 7. API Smoke (optional)
- `GET /api/jobs`
- `POST /api/jobs/ingest`
- `POST /api/match/run`
- `GET /api/match`
- `POST /api/proposals/generate`

All protected endpoints require AKIS auth cookie session.

## 8. Quality Gates
```bash
pnpm -C backend lint
pnpm -C backend typecheck
pnpm -C backend test
pnpm -C frontend lint
pnpm -C frontend typecheck
pnpm -C frontend test
pnpm -C frontend build
```
