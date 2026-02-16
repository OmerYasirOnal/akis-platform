# UI M2 Closure Allowlist

## Scope
Bu dosya `AKIS UI M2+ Stabilizasyon ve Güzelleştirme` çalışması için izinli değişiklik yüzeyini kilitler.

## In-Scope (Frontend)
- `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx`
- `frontend/src/pages/dashboard/agents/hub/*`
- `frontend/src/pages/dashboard/agents/trace/index.tsx`
- `frontend/src/pages/dashboard/agents/trace/__tests__/DashboardAgentTracePage.test.tsx`
- `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx`
- `frontend/src/pages/dashboard/agents/__tests__/DashboardAgentScribePage.test.tsx`
- `frontend/src/pages/dashboard/agents/proto/index.tsx`
- `frontend/src/pages/dashboard/agents/proto/components/*`
- `frontend/src/pages/dashboard/agents/proto/__tests__/index.test.tsx`
- `frontend/src/pages/JobDetailPage.tsx`
- `frontend/src/pages/__tests__/JobDetailPage.test.tsx`
- `frontend/src/components/agents/hub/*`
- `frontend/src/components/agents/verification/*`
- `frontend/src/components/agents/StepTimeline.tsx`
- `frontend/src/components/agents/ExplainableTimeline.tsx`
- `frontend/src/components/agents/LiveAgentCanvas.tsx`
- `frontend/src/services/api/types.ts`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/tr.json`
- `frontend/tests/e2e/agents-hub-ui.spec.ts`
- `frontend/tests/e2e/scribe-console.spec.ts`
- `frontend/tests/e2e/trace-console.spec.ts`
- `frontend/tests/e2e/proto-console.spec.ts`

## In-Scope (Docs & Evidence)
- `docs/qa/UI_M2_BASELINE_EVIDENCE_2026-02-16.md`
- `docs/qa/UI_MANUAL_SMOKE_CHECKLIST.md`
- `docs/qa/UI_MANUAL_SMOKE_EVIDENCE_2026-02-16.md`
- `docs/qa/REGRESSION_CHECKLIST.md`
- `docs/release/STAGING_RELEASE_CHECKLIST.md`
- `docs/NEXT.md`
- `docs/ROADMAP.md`
- `output/ui-smoke/*`

## Out-of-Scope
- Backend API contract değişiklikleri
- DB schema/migration
- MCP adapter davranışı
- `carreer_assistant` kapsamı
- CI workflow mimarisi refactor

## Guardrails
- Mevcut route kontratları korunur: `/agents/*`, `/dashboard/jobs/:id`
- Public API envelope korunur
- i18n parity zorunlu: en + tr
- Küçük, reviewable değişim dilimleri uygulanır
