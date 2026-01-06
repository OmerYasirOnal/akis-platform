# QA Evidence: Scribe OpenAI + Metrics Demo

**Branch**: `feat/scribe-demo-ready-20260106`
**Date**: 2026-01-06
**Owner**: Demo Operator

---

## Evidence Table

| Requirement | Status (PASS/PARTIAL/FAIL) | Evidence | Notes |
| --- | --- | --- | --- |
| API key status endpoint works |  | Screenshot / network log | GET /api/settings/ai-keys/status |
| Key save + delete works |  | Screenshot / network log | PUT/DELETE /api/settings/ai-keys |
| Wizard run gating when key missing |  | Screenshot | Step 5 buttons disabled + warning |
| Quick Actions gating when key missing |  | Screenshot | Run Test Job / Run Now disabled |
| Run page gating when key missing |  | Screenshot | /dashboard/agents/scribe/run submit disabled |
| Model allowlist enforced |  | Screenshot / API error | 400 MODEL_NOT_ALLOWED |
| Scribe run with key succeeds |  | Job detail screenshot | Job state completed |
| AI metrics captured (tokens/time/cost) |  | Job detail screenshot | Run Summary panel |
| ai_call trace events present |  | Timeline screenshot | AI call entries |
| Redaction verified |  | Raw tab screenshot | No keys/tokens exposed |

---

## Notes
- Attach screenshots under `docs/qa/evidence/scribe-demo/`.
