# NEXT — S0.5 Yürütme Panosu

Son güncelleme: 2026-03-04

## Güncel Hedef

- Pilot kapsamını staging ortamında kararlı tutmak.
- Repo dokümantasyonunu minimal ve canonical tutmak.

## S0.5 Operasyon Durumu

| ID | Görev | Durum | Notlar |
|---|---|---|---|
| S0.5.3-OPS-3 | Hard scope cleanup | Tamamlandı | Kapsam dışı modüller repodan kaldırıldı. |
| S0.5.3-OPS-4 | Tag retention + env snapshot guardrails | Tamamlandı | Kalıcı rollback tag korundu; staging snapshot süreci dokümante edildi. |
| S0.5.3-OPS-5 | Docs vault prune (canonical olmayan dokümanları repodan taşı) | Tamamlandı | Zorunlu olmayan dokümanlar yerel vault'a taşındı, yapı korundu. |
| S0.5.4-DOC-1 | Dokümantasyon Türkçe-first politika | Tamamlandı | Canonical set Türkçe-primary; dil politikası README ve NEXT'te belirtildi. |

## Canonical Dokümantasyon Seti

- `README.md`
- `docs/NEXT.md`
- `docs/ROADMAP.md`
- `docs/ENV_SETUP.md`
- `docs/TESTING.md`
- `docs/API_SPEC.md`
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/WEB_INFORMATION_ARCHITECTURE.md`
- `docs/deploy/OCI_STAGING_RUNBOOK.md`
- `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
- `docs/release/STAGING_RELEASE_CHECKLIST.md`
- `docs/ops/STAGING_SMOKE_CHECKLIST.md`
- `docs/ops/STAGING_ENV_SNAPSHOT.md`
- `docs/agents/AGENT_CONTRACTS_S0.5.md`
- `backend/docs/AGENT_WORKFLOWS.md`
- `backend/docs/API_SPEC.md`
- `backend/docs/Auth.md`

## Dokümantasyon Kuralları

- Yasir açıkça istemedikçe yeni dokümantasyon dosyası oluşturma.
- Sadece mevcut canonical dosyaları güncelle.
- Planlama, denetim, prompt ve rapor materyallerini reponun dışında tut.

## Dil Politikası

- **Açıklama ve takip metinleri:** Türkçe.
- **Teknik terimler, endpoint/path, komutlar:** İngilizce (JWT, MCP, SSE, FSM vb.).
- **Agent prompt ve Cursor task blokları:** İngilizce.
