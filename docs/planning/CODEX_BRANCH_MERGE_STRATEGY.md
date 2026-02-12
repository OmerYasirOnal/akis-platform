# Codex Branch & Merge Stratejisi

> **Tarih:** 2026-02-12
> **Amaç:** Paralel çalışan branch'lerin çakışmasını önlemek, merge sırasını netleştirmek.

---

## Aktif Branch'ler

| Branch | Görev | Durum | Not |
|--------|-------|-------|-----|
| `main` | Ana geliştirme | b723c2d (Scribe AGT-8) | Güncel |
| `fix/S0.5.3-AUTH-3-jobs-user-isolation` | Jobs user isolation (data leak fix) | Backend + test + doc | PR açılacak |
| `feat/S0.5.3-UX-15-live-agent-canvas` | Live Agent Canvas UI | main'den türetildi, boş | Codex burada çalışacak |

---

## Merge Sırası (Önerilen)

1. **fix/S0.5.3-AUTH-3** → main (öncelikli, güvenlik)
2. **feat/S0.5.3-UX-15** → main (UX-15 branch'i, merge'den önce main'den rebase almalı)

---

## Codex İçin Adımlar

### M1 QA (Doc-Only) — Branch Gerekmez
- Kod değiştirme yok; sadece doc güncellemeleri.
- Phase 4 doc düzeltmeleri (`/dashboard/*` → `/agents/*`, test sayıları) **tamamlandı** (Cursor tarafından).
- Codex Phases 0–3: Staging testleri, Regression Checklist güncellemesi.
- Codex çalışması local commit edilebilir; hangi branch'e commitleneceği insan kararı.

### UX-15 (Frontend) — `feat/S0.5.3-UX-15-live-agent-canvas`
- Codex çalışmaya başlamadan önce: `git checkout feat/S0.5.3-UX-15-live-agent-canvas`
- Prompt: `docs/planning/CODEX_AGENT_UI_ENHANCEMENT_PROMPT.md`
- Literature: `docs/research/AGENT_UI_UX_LITERATURE_REVIEW.md`

---

## Conflict Riski

| Dosya | AUTH-3 Değişikliği | UX-15 | Çakışma? |
|-------|--------------------|-------|----------|
| `backend/src/api/*` | Evet | Hayır | Hayır |
| `docs/NEXT.md` | Evet (AUTH-3 satırı) | Hayır | Hayır |
| `docs/qa/REGRESSION_CHECKLIST.md` | Evet (8.1, 8.7) | Hayır | Hayır |
| `frontend/*` | Hayır | Evet | Hayır |

**Sonuç:** Çakışma beklenmiyor. AUTH-3 merge edildikten sonra UX-15 rebase alırsa temiz merge.

---

## Hızlı Komutlar

```bash
# AUTH-3 branch'inde çalışırken (Cursor)
git status
git add backend/ docs/ && git commit -m "fix(auth): jobs user isolation S0.5.3-AUTH-3"

# Codex UX-15 için branch'e geç
git checkout feat/S0.5.3-UX-15-live-agent-canvas

# AUTH-3 merge edildikten sonra UX-15 rebase
git fetch origin
git rebase origin/main
```
