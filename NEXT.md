---
# NEXT (2025-11-06)

## Phase 9 — Auth & RBAC (MVP)

- [ ] Backend: `/api/auth/login` (mock: admin@example.com / admin123), `/api/auth/logout`, `/api/auth/session`

- [ ] Cookie: httpOnly, sameSite=lax, secure=prod; in-memory session store

- [ ] RBAC guard: requiredRoles ⊆ user.roles değilse 403

- [ ] Frontend: `/login` sayfası, session state hook, ProtectedRoute, header'da kullanıcı e-postası + logout

- [ ] Tests: backend (happy/negative), frontend (guard + rendering)

- [ ] Docs: `docs/Auth.md` akış diyagramı + curl örnekleri

- [ ] README quickstart güncelle

## Bloklayıcılar

- [ ] CI yeşil ✅

- [ ] Env: `FRONTEND_URL`, `BACKEND_URL` açıklamaları güncel

## Başlangıç planı

1. feature/phase-9-auth dalı

2. 9.A Backend auth + tests → 9.B Frontend → 9.C Tests → 9.D Docs

3. Küçük commitler, PR

---

