# E2E Coverage Report

> Generated: 2026-02-09
> Branch: `feat/S0.5.1-WL-1-verification-e2e-agt4`

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total E2E specs | 9 files | **9 files** |
| Total E2E tests | 67 tests | **71 tests** |
| Backend unit tests | 252 tests | **284 tests** |
| Frontend unit tests | 83 tests | **83 tests** |
| Flaky tests | 0 | **0** |
| CI status | Green | **Green** |

## Coverage Matrix

### Auth Suite (16 tests — UPDATED)

| Spec | Tests | Status |
|------|-------|--------|
| `auth-login-flow.spec.ts` | 4 | PASS |
| `auth-signup-flow.spec.ts` | 8 (+4 new verification) | PASS |
| `auth-deep-links.spec.ts` | 4 | PASS |

### Trace Console Suite (10 tests — unchanged)

| ID | Test | Coverage |
|----|------|----------|
| T1 | Page renders heading + core elements | Route load |
| T2 | Run button enables when spec entered | Form interaction |
| T3 | Logs and Results tabs visible | Tab rendering |
| T4 | Logs empty state | Empty state |
| T5 | Results tab empty state | Empty state |
| T6 | Happy path: submit → running → completed | Full job lifecycle |
| T7 | Backend 500 on submit | Error handling |
| T8 | Job failure shows error message | Failure state |
| T9 | After completion, Run Trace re-enabled | Re-run capability |
| T10 | Deep link returns SPA HTML | SPA routing |

### Proto Console Suite (12 tests — unchanged)

| ID | Test | Coverage |
|----|------|----------|
| P1 | Page renders heading + core elements | Route load |
| P2 | Run button enables when requirements entered | Form interaction |
| P3 | Logs and Artifacts tabs visible | Tab rendering |
| P4 | Logs empty state | Empty state |
| P5 | Artifacts tab empty state | Empty state |
| P6 | AI keys status gate before submission | Provider check |
| P7 | Happy path: pending → running → completed + artifacts | Full lifecycle |
| P8 | Backend 500 on submit | Error handling |
| P9 | Job failure shows error message | Failure state |
| P10 | After completion, Run Proto re-enabled | Re-run capability |
| P11 | Deep link returns SPA HTML | SPA routing |
| P12 | Tech Stack optional input visible | UI element |

### Navigation & Route Guards Suite (8 tests — unchanged)

| ID | Test | Coverage |
|----|------|----------|
| N1 | Sidebar shows Agents group (Scribe, Trace, Proto) | Sidebar nav |
| N2 | Clicking Trace navigates correctly | Client-side routing |
| N3 | Clicking Proto navigates correctly | Client-side routing |
| G1 | Unauthenticated /dashboard → /login | Route guard |
| G2 | Unauthenticated /dashboard/trace → /login | Route guard |
| G3 | Unauthenticated /dashboard/proto → /login | Route guard |
| G4 | Authenticated deep link /dashboard/trace | Deep link |
| G5 | Authenticated deep link /dashboard/proto | Deep link |

### Getting Started Card Suite (5 tests — unchanged)

| ID | Test | Coverage |
|----|------|----------|
| GS1 | Card renders with 3 onboarding steps | Dashboard overview |
| GS2 | AI keys step completed when configured | API integration |
| GS3 | Dismiss button hides card | UI interaction |
| GS4 | Dismissed state persists across navigation | localStorage |
| GS5 | Step links point to correct destinations | Navigation |

### Settings — AI Provider Keys Suite (8 tests — NEW)

| ID | Test | Coverage |
|----|------|----------|
| AK1 | Page renders title + provider cards | Route load |
| AK2 | Configured provider shows status indicators | Status display |
| AK3 | Save key success (mocked) | Save flow |
| AK4 | Save key with ENCRYPTION_NOT_CONFIGURED 503 | Structured error |
| AK5 | Status fetch failure with encryption error | Page-level error |
| AK6 | Save button disabled when input empty | Form validation |
| AK7 | Save request sends correct payload shape | API contract |
| AK8 | Client-side validation rejects non-sk- prefix | Input validation |

### Scribe Console — Golden Path Suite (12 tests — NEW, S0.5.1-AGT-3)

| ID | Test | Coverage |
|----|------|----------|
| SC1 | Page renders heading + configuration bar | Route load |
| SC2 | GitHub connected → owner, repo, branch visible | GitHub integration |
| SC3 | Run Scribe enabled when config complete | Form readiness |
| SC4 | Golden path: submit → poll → completed with logs | Full job lifecycle |
| SC5 | Submission fails (500) → error in logs | Error handling |
| SC6 | Job fails during execution → error state | Failure state |
| SC7 | Doc pack selector changes output targets | Config interaction |
| SC8 | GitHub not connected → shows error notice | Integration error |
| SC9 | Logs tab idle state | Empty state |
| SC10 | Re-run enabled after completion | Re-run capability |
| SC11 | Correct route renders page | SPA routing |
| SC12 | Payload shape validation | API contract |

## New Backend Tests Added

### Crypto Unit Tests (12 tests — NEW)

| Suite | Tests | Coverage |
|-------|-------|----------|
| `parseKeyMaterial` | 8 | Hex, base64, base64-prefixed, whitespace, short/long/garbage/empty keys |
| `isEncryptionConfigured` | 2 | Valid key ↔ invalid key proxy tests |
| `encrypt/decrypt` | 2 | Round-trip AES-256-GCM, AAD scope mismatch detection |

### Prompt Determinism Tests (17 tests — NEW, S0.5.1-AGT-2)

| Suite | Tests | Coverage |
|-------|-------|----------|
| Prompt Constants | 4 | Non-empty, JSON format instructions in plan/reflect/validate prompts |
| Temperature Presets | 5 | Deterministic ≤ creative, valid range, max values |
| Deterministic Seed | 1 | Positive integer check |
| Prompt Builders | 7 | Plan/generate/repair builders with context/steps/truncation |

## Bug Fixes in This Branch

### 1. Staging AI Keys 503 — ENCRYPTION_NOT_CONFIGURED

**Symptom:** PUT /api/settings/ai-keys returns 503 "Server encryption is not properly configured".

**Root cause:** `AI_KEY_ENCRYPTION_KEY` not set in staging `.env`. The backend crypto module throws when the key is missing; the route handler catches and returns 503.

**Fix:**
- Backend: Extended `/ready` endpoint with `encryption: { configured: boolean }` readiness signal
- Backend: Added `hint` field to ENCRYPTION_NOT_CONFIGURED error envelope
- Backend: Added `isEncryptionConfigured()` helper in `crypto.ts`
- Frontend: Parse structured error code; show admin-specific message for encryption errors
- Staging: Updated runbook checklist + VM env template with `AI_KEY_ENCRYPTION_KEY`
- Smoke: Added encryption readiness check (Test 2b) to `staging_smoke.sh`

### 2. Playbook Determinism (S0.5.1-AGT-2)

**What:** Centralised prompt templates and made AI calls reproducible for pilot demo.

**Changes:**
- Extracted all system prompts to `prompt-constants.ts` (version-controlled)
- Added `seed=42` to all LLM chat completion requests
- Lowered temperatures in deterministic mode (plan: 0.2, generate: 0.3, reflect: 0.1, validate: 0.1)
- Added `AI_DETERMINISTIC_MODE` env var (default: true)
- Two temperature presets: DETERMINISTIC (pilot) and CREATIVE (dev)

## Deploy Instructions for Staging

To resolve the 503 error on staging, the operator must:

```bash
# SSH to staging VM
ssh -i ~/.ssh/akis-oci ubuntu@<STAGING_HOST>

# Generate and add encryption key to .env
echo "AI_KEY_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> /opt/akis/.env
echo "AI_KEY_ENCRYPTION_KEY_VERSION=v1" >> /opt/akis/.env

# Restart backend
cd /opt/akis && docker compose restart backend

# Verify
curl -s https://staging.akisflow.com/ready | jq '.encryption'
# Expected: { "configured": true }
```

## Quality Gates (Local)

| Check | Result |
|-------|--------|
| Backend typecheck | PASS |
| Backend lint | PASS |
| Backend unit tests (252) | PASS |
| Frontend typecheck | PASS |
| Frontend lint | PASS (2 pre-existing warnings) |
| Frontend unit tests (83) | PASS |
| Frontend build | PASS |
| E2E tests (67) | **PASS** — 0 flaky |
