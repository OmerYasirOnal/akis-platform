---
description: "Security Checklist"
---

- [ ] `@fastify/helmet` + `@fastify/cors` + `@fastify/rate-limit` kayıtlı.
- [ ] CORS prod’da **allowlist**; `*` yok.
- [ ] Secrets repo’ya girmedi; **.env.example** var.
- [ ] Girdi doğrulama (zod/valibot) kritik uçlarda.
- [ ] Loglarda PII/token yok; error stack kullanıcıya sızmıyor.
- [ ] DB migration’ları sürümlü; script `backend/scripts/migrate.ts`.