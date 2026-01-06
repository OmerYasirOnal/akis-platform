# Semester 1 Scribe Demo Operator Guide

**Goal:** Run a 90–180s live demo of AKIS Scribe with real OpenAI calls, model selection, and AI usage metrics.

---

## 1) Environment Prerequisites

### Required services
- PostgreSQL running and reachable by `DATABASE_URL`.
- Backend at `http://localhost:3000`.
- Frontend at `http://localhost:5173`.

### Required environment variables (backend/.env.local)
- `DATABASE_URL=postgresql://...`
- `AUTH_JWT_SECRET=...` (min 32 chars)
- `AI_KEY_ENCRYPTION_KEY=base64:<32-byte-base64>` (required; encrypts user keys)
- `AI_KEY_ENCRYPTION_KEY_VERSION=v1`
- `AI_SCRIBE_MODEL_ALLOWLIST=gpt-4o-mini,gpt-4o,gpt-4.1-mini`
- `BACKEND_URL=http://localhost:3000`
- `FRONTEND_URL=http://localhost:5173`
- `CORS_ORIGINS=http://localhost:5173`

### GitHub connection options
- **Preferred (OAuth):**
  - `GITHUB_OAUTH_CLIENT_ID=...`
  - `GITHUB_OAUTH_CLIENT_SECRET=...`
- **Fallback (Dev bootstrap for dry-run only):**
  - `SCRIBE_DEV_GITHUB_BOOTSTRAP=true`
  - `SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN=ghp_...` (or `GITHUB_TOKEN=...`)

### Optional
- `OPENAI_BASE_URL=https://api.openai.com/v1` (override only if needed)
- `LOG_LEVEL=info`

---

## 2) Setup Steps (Clean Demo Environment)

1. **Create backend/.env.local**
   - Copy `backend/.env.example` and fill the required vars.
2. **Run migrations**
   - `pnpm -C backend db:migrate`
3. **Start backend**
   - `pnpm -C backend dev`
4. **Start frontend**
   - `pnpm -C frontend dev`
5. **Create user + login**
   - Open `http://localhost:5173` and complete signup/login.
6. **Connect GitHub**
   - Go to `/dashboard/agents/scribe` → Step 1 → “Connect GitHub”.
7. **Add OpenAI key**
   - Go to `/dashboard/settings/api-keys` and paste your `sk-...` key.

---

## 3) Live Demo Script (90–180s)

**0:00–0:20 — API Key Setup**
1. Open `http://localhost:5173/dashboard/settings/api-keys`.
2. Paste: `sk-...` (your OpenAI key).
3. Click **Save Key**.
4. Expected: “Configured” badge + masked last4.

**0:20–1:00 — Configure Scribe**  
1. Open `http://localhost:5173/dashboard/agents/scribe`.  
2. Step 1: Confirm GitHub is connected (green).  
3. Step 2: Select Repository Owner → Repository Name → Base Branch.  
   - Example: Owner = `your-org`, Repo = `your-repo`, Branch = `main`  
4. Step 3: Choose **GitHub repository docs** (default path `docs/`).  
5. Step 4: Select model from allowlist (e.g., `gpt-4o-mini`).  
6. Step 5: Review summary (model listed).  

**1:00–1:40 — Run Test Job (dry-run)**  
1. Click **Run Test Job**.  
2. Expected: Job created and navigates to job detail page.  

**1:40–2:30 — Show Run Summary + Metrics**  
1. On Job Detail, point out the **Run Summary** panel:  
   - Model, total duration, token totals, estimated cost.  
2. Scroll to **Timeline** or **Overview** tabs.  
3. Mention AI call breakdown items and trace events.  
4. Expected: `ai_call` entries in Timeline and per-call rows in Run Summary.  

---

## 4) Plan B (Video Storyboard)

1. Screen 1: API Keys page, key saved, shows “Configured”.
2. Screen 2: Scribe wizard Step 2 with repo selection.
3. Screen 3: Step 4 model selection + Step 5 review summary.
4. Screen 4: Job Detail → Run Summary panel + Timeline tab.

---

## 5) Troubleshooting (Fast Recovery)

- **GitHub not connected:**
  - Go to `/dashboard/agents/scribe` → “Connect GitHub” → retry.
- **412 AI_KEY_MISSING:**
  - Add key at `/dashboard/settings/api-keys`.
- **MODEL_NOT_ALLOWED:**
  - Pick a model from allowlist shown in Step 4.
- **DB errors / missing tables:**
  - Re-run `pnpm -C backend db:migrate`.
- **No metrics in Run Summary:**
  - Ensure job ran with OpenAI key and not in test mode; re-run.
