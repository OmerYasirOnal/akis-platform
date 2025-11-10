---
description: "Performance Checklist"
---

## Frontend
- [ ] Route-level **lazy** import (React.lazy).
- [ ] i18n dosyaları **lazy**.
- [ ] Görsel boyutları, `<img>` width/height, modern format (webp/avif).
- [ ] Bundle bütçesi (main chunk ≤ ~350KB gzip).

## Backend
- [ ] Pino log (asenkron), `requestId` bağlı.
- [ ] N+1 sorgu yok; index’ler mevcut.
- [ ] Rate-limit prod’da aktif; 429 geri dönüşleri ölçümlenebilir.
- [ ] Health/ready/version ucuz çalışır.

## CI/Build
- [ ] Tek `pnpm install` (workspace).
- [ ] `dist/` commit edilmez.