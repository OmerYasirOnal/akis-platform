# Semester 1 Scribe Demo Checklist

**Goal:** Demo-ready, 90–180s end-to-end flow.

---

## Environment
- [ ] Postgres running and reachable by `DATABASE_URL`.
- [ ] `AI_KEY_ENCRYPTION_KEY` set (32-byte base64 or hex).
- [ ] `AUTH_JWT_SECRET` set (min 32 chars).
- [ ] Backend running at `http://localhost:3000`.
- [ ] Frontend running at `http://localhost:5173`.

## Integrations
- [ ] GitHub OAuth configured OR dev bootstrap enabled.
- [ ] GitHub account connected in dashboard.

## Scribe Demo Readiness
- [ ] OpenAI key saved in `/dashboard/settings/api-keys` (shows Configured).
- [ ] Scribe wizard Step 2 repo/branch selection works.
- [ ] Model allowlist loads and selection saved.
- [ ] Run Test Job (dry-run) creates job and opens job detail.
- [ ] Job Detail shows Run Summary (model/time/tokens/cost).
- [ ] Timeline shows `ai_call` events.

## Safety & Redaction
- [ ] No plaintext keys in UI or raw trace view.
- [ ] API responses return status-only key info.

## Fallback Plan
- [ ] Plan B video storyboard ready.
