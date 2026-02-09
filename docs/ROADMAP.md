# AKIS Platform — Yol Haritası ve Kilometre Taşları

> **Kanonik Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **Anlık Eylemler:** [`docs/NEXT.md`](NEXT.md)  
> **Son Güncelleme:** 2026-02-09

---

## Güncel Durum

| Öğe | Değer |
|-----|-------|
| **Aktif Faz** | S0.5 — Staging Düzeltme + Pilot Demo |
| **Sonraki Kilometre Taşı** | M1: Pilot Demo (28 Şubat 2026) |
| **Kapsam** | Scribe / Trace / Proto agent'ları |
| **Ortam** | Staging (staging.akisflow.com) — OCI Free Tier |
| **Durum Sözlüğü** | Tamamlandı / Devam Ediyor / Başlanmadı / Engellendi |

---

## Kilometre Taşları

| Kilometre Taşı | Hedef Tarih | Odak | Durum |
|-----------------|-------------|------|-------|
| **M1: Pilot Demo** | 28 Şubat 2026 | Staging düzeltme + Scribe/Trace/Proto golden path + pilot katılım | **Devam Ediyor** |
| **M2: Stabilizasyon** | 31 Mart 2026 | Hata düzeltme, pilot geri bildirim, pg_trgm prototip, tez taslağı | Başlanmadı |
| **M3: Mezuniyet** | Mayıs 2026 | Final rapor, sunum, demo video, teslim paketi | Başlanmadı |

---

## Faz Genel Bakış

### Tamamlanmış Fazlar

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| 0.1 | Temel Kurulum | 1-7 Kasım 2025 | Tamamlandı |
| 0.2 | Mimari Tanımlama | 8-17 Kasım 2025 | Tamamlandı |
| 0.3 | Çekirdek Motor İskelesi | 18-27 Kasım 2025 | Tamamlandı |
| 0.4 | Web Shell + Temel Motor | 28 Kasım - 4 Aralık 2025 | Tamamlandı |
| 1 | Scribe/Trace/Proto Erken Erişim | 13-25 Aralık 2025 | Tamamlandı |
| 1.5 | Loglama + Gözlemlenebilirlik Katmanı | 26 Aralık 2025 - 9 Ocak 2026 | Tamamlandı |
| 2 | Cursor-Esinli UI + Scribe Konsolu | 10 Ocak - 6 Şubat 2026 | Tamamlandı |

### Aktif Faz

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| **S0.5** | **Staging Düzeltme + Pilot Demo** | **7-28 Şubat 2026** | **Devam Ediyor** |

**S0.5 Sprint'leri:**

| Sprint | Tarihler | Odak | İş Akışları | İlerleme |
|--------|----------|------|-------------|----------|
| S0.5.0 | 7-9 Şub | Staging base URL düzeltme + trust-proxy + deploy | WS-OPS | ✅ 8/8 görev tamamlandı |
| S0.5.1 | 10-21 Şub | Pilot erişim + agent güvenilirliği | WS-WAITLIST, WS-AGENTS | ✅ 10/10 görev tamamlandı |
| S0.5.2 | 10-23 Şub | Demo UX + RAG araştırma | WS-UX, WS-RAG | ✅ 6/6 görev tamamlandı |
| S0.5.3 | 24-28 Şub | KG kanıt + demo senaryosu + M1 | WS-QA | 🔄 1/4 görev tamamlandı |

### Gelecek Fazlar

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| M2 | Stabilizasyon + Akademik Hazırlık | 1-31 Mart 2026 | Başlanmadı |
| M3 | Mezuniyet Teslimi | Nisan-Mayıs 2026 | Başlanmadı |

---

## M1: Pilot Demo — Tamamlanma Kriterleri (28 Şubat 2026)

- [x] Staging'de localhost referansı sıfır (bundle grep kontrolü)
- [x] Health/ready/version endpoint'leri 200 dönüyor
- [x] Agent yönlendirme: `/agents/*` kanonik, eski rotalar yönlendiriliyor
- [x] Hata durumlarında kullanıcıya anlaşılır mesaj
- [x] Logo tüm yüzeylerde güncel
- [ ] E-posta/şifre kayıt + giriş çalışıyor (staging)
- [ ] OAuth yönlendirmeleri staging alanında çalışıyor
- [ ] Scribe golden path çalışıyor (kuru çalışma)
- [ ] Trace golden path çalışıyor
- [ ] Proto golden path çalışıyor
- [x] Pilot katılım akışı çalışıyor (2026-02-09)
- [ ] Demo senaryosu yazılmış ve prova edilmiş
- [ ] KG kanıt dokümanı mevcut

---

## M2: Stabilizasyon — Tamamlanma Kriterleri (31 Mart 2026)

- [ ] Pilot geri bildirimleri toplanmış ve sınıflandırılmış
- [ ] P0/P1 hatalar sıfır
- [ ] Golden path başarı oranı %90+
- [ ] pg_trgm retrieval prototip (opsiyonel)
- [ ] Tez taslağı: giriş + literatür + yöntem
- [ ] Demo videosu kaydedilmiş (5-10 dk)

---

## M3: Mezuniyet — Tamamlanma Kriterleri (Mayıs 2026)

- [ ] Final rapor tamamlanmış ve onaylanmış
- [ ] Sunum slaytları (15-20 slayt)
- [ ] Demo videosu final versiyonu
- [ ] Canlı demo en az 2 kez prova edilmiş
- [ ] Teslim paketi: kod + dokümanlar + video + sunum

---

## Kapsam Kuralları

### Kapsam İçi (S0.5)
- Scribe, Trace, Proto agent'ları
- Staging güvenilirliği + base URL doğruluğu
- Pilot katılım UX (minimal)
- Geri bildirim yakalama
- Hafif RAG (bağlam paketleri; pg_trgm Mart)

### Kapsam Dışı
- Developer / Coder agent
- Yeni entegrasyonlar (Slack, Teams)
- RBAC / yönetici paneli
- Fiyatlandırma/faturalandırma uygulaması
- Auth yeniden tasarımı
- Ağır vector DB / harici RAG servisleri
- Üretim ortamı (staging yeterli)
- Mobil uygulama

---

## Mimari Kısıtlamalar (Pazarlık Edilemez)

| Bileşen | Teknoloji | Kural |
|---------|-----------|-------|
| Backend | Fastify + TypeScript + Drizzle | Express/Nest/Prisma yasak |
| Frontend | React + Vite + Tailwind | SSR/Next.js yok |
| Veritabanı | PostgreSQL 16 | OCI Free Tier |
| Entegrasyonlar | Sadece MCP adaptörleri | Doğrudan vendor SDK yok |
| Kimlik Doğrulama | Mevcut JWT + e-posta/şifre + OAuth | Yeniden tasarlanmayacak |
| Dağıtım | OCI VM + Caddy + Docker Compose | Tek VM staging |

---

## Referans Dokümanlar

| Doküman | Amaç |
|---------|------|
| [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) | Kanonik plan (tek doğru kaynak) |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS + CSV |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Araştırma notu |
| [`docs/NEXT.md`](NEXT.md) | Anlık eylem öğeleri |
| [`docs/PROJECT_TRACKING_BASELINE.md`](PROJECT_TRACKING_BASELINE.md) | Geçmiş takvim çapası |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](deploy/OCI_STAGING_RUNBOOK.md) | Staging operasyonları |

---

*Yol haritası, kanonik plan ile senkronize tutulur. Detay ve görev takibi için NEXT.md ve WBS tablosuna başvurun.*
