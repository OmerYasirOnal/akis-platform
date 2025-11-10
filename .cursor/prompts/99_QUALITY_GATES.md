---
description: "Quality Gates — CI & Local"
---

# TASK
- Çalıştır: `pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test`.
- Backend test dosyası yoksa test adımı “no tests – skipping” yazsın.
- CI workflow’da tek install; cache pnpm.

# COMMIT
chore(ci): stabilize pnpm install & enforce typecheck/lint/build/test