---
description: "Workspace Bootstrap & Sanity"
---

# TASK
1) Repo kökünde **tek pnpm lock** olduğundan emin ol; alt lockfile’lar varsa kaldır.
2) `.gitignore` → `dist/` ve `.pnpm-store/` eklensin.
3) `pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test` lokalde çalışsın.
4) Backend testleri yoksa `backend test` adımı “no tests – skipping” mesajı basmalı.

# ACCEPTANCE
- Temiz çalışma: tüm komutlar yeşil.
- Alt lockfile yok; `dist/` ve `.pnpm-store/` track edilmiyor.

# COMMIT
chore(bootstrap): lockfile hygiene, gitignore harden, test skip message