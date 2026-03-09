# NEXT — S0.5 Yürütme Panosu

Son güncelleme: 2026-03-06

## Güncel Hedef

- Pilot kapsamını staging ortamında kararlı tutmak.
- Repo dokümantasyonunu minimal ve canonical tutmak.
- Pipeline migrasyonunu tamamlamak (Scribe → Proto → Trace).

## S0.5 Operasyon Durumu

| ID | Görev | Durum | Notlar |
|---|---|---|---|
| S0.5.3-OPS-3 | Hard scope cleanup | Tamamlandı | Kapsam dışı modüller repodan kaldırıldı. |
| S0.5.3-OPS-4 | Tag retention + env snapshot guardrails | Tamamlandı | Kalıcı rollback tag korundu; staging snapshot süreci dokümante edildi. |
| S0.5.3-OPS-5 | Docs vault prune (canonical olmayan dokümanları repodan taşı) | Tamamlandı | Zorunlu olmayan dokümanlar yerel vault'a taşındı, yapı korundu. |
| S0.5.4-DOC-1 | Dokümantasyon Türkçe-first politika | Tamamlandı | Canonical set Türkçe-primary; dil politikası README ve NEXT'te belirtildi. |
| PIPELINE-0 | Pipeline dizin yapısı ve altyapı | Tamamlandı | `pipeline/` dizin yapısı, BRAND.md, dev mode config oluşturuldu. |
| PIPELINE-1 | Pipeline type kontratları ve playbook'lar | Tamamlandı | PipelineTypes, PipelineSchemas, PipelineErrors, prompt şablonları. |
| PIPELINE-2 | Scribe Agent (conversational spec writer) | Tamamlandı | Clarification loop, spec üretimi, max 5 tur, 0.7+ confidence. |
| PIPELINE-3 | Proto Agent (MVP scaffold builder) | Tamamlandı | GitHub repo oluşturma, branch, push, PR. DI pattern. |
| PIPELINE-4 | Trace Agent (Playwright test writer) | Tamamlandı | Codebase okuma, test üretimi, coverage matrix, PR. |
| PIPELINE-5 | Pipeline Orchestration | Tamamlandı | Orchestrator, DB şeması, API routes, real-time events. |
| PIPELINE-6 | Frontend Pipeline UI | Tamamlandı | 10 component: chat, progress, spec approval, file explorer, completion. |
| PIPELINE-7 | Entegrasyon ve Dokümanlar | Tamamlandı | Fastify mount, React route, tsconfig/vite config güncellemeleri. |

## Canonical Dokümantasyon Seti

- `README.md`
- `docs/NEXT.md`
- `docs/ROADMAP.md`
- `docs/ENV_SETUP.md`
- `docs/TESTING.md`
- `docs/API_SPEC.md`
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/USE_CASES.md`
- `docs/deploy/OCI_STAGING_RUNBOOK.md`
- `docs/deploy/OCI_STAGING_DEPLOY.md`
- `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
- `docs/release/STAGING_RELEASE_CHECKLIST.md`
- `docs/ops/STAGING_SMOKE_CHECKLIST.md`
- `docs/ops/STAGING_ENV_SNAPSHOT.md`
- `backend/docs/API_SPEC.md`
- `backend/docs/Auth.md`
- `pipeline/docs/BRAND.md`
- `PIPELINE_PLAN.md`

### Akademik Belgeler (Bitirme Projesi)

- `docs/academic/bitirme1/Proje_Kapsami_ve_Gereksinimler_2221221562_ÖmerYasir_Önal.pdf`
- `docs/academic/bitirme1/Çözüm_Tasarımı_ve_Teknik_Analiz_Dokümanı_2221221562_ÖmerYasir_Önal.pdf`
- `docs/academic/bitirme1/AKIS_Solution_Design_and_Technical_Analysis_EN.pdf`

## Dokümantasyon Kuralları

- Yasir açıkça istemedikçe yeni dokümantasyon dosyası oluşturma.
- Sadece mevcut canonical dosyaları güncelle.
- Planlama, denetim, prompt ve rapor materyallerini reponun dışında tut.

## Dil Politikası

- **Açıklama ve takip metinleri:** Türkçe.
- **Teknik terimler, endpoint/path, komutlar:** İngilizce (JWT, MCP, SSE, FSM vb.).
- **Agent prompt ve Cursor task blokları:** İngilizce.
