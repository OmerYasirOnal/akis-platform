# AKIS Marketplace: Literatür → Ürün Haritası (Özet)

**Tarih:** 13 Şubat 2026  
**Amaç:** AKIS Freelancer Marketplace'in bilimsel araştırmalarla nasıl desteklendiğini tek sayfada göstermek

---

## Araştırma → Ürün Kararı Haritası

| Bilimsel Kaynak | PRD Kararı | Dosya |
|-----------------|-----------|-------|
| **Gale-Shapley (1962)** | `matching_mode: stable_matching` | 01, 06 |
| **Sühr et al. (2019)** Two-sided fairness | `fairness_budget`, `exposure_score` | 01, 03, 06 |
| **Zhao et al. (2021)** CareerBuilder | Retrieval→Rerank mimarisi | 02, 06 |
| **Giabelli et al. (2021)** Skills2Job | Skill graph, skill-gap önerileri | 02 |
| **Zhang et al.** Explainable Rec | `explanation_json` schema | 03, 06 |
| **ILO** Algorithmic management | `audit_log`, itiraz mekanizması | 04, 06 |
| **OECD** Platform work | Metrik seti (time_to_first_gig, income_uplift) | 04, 06 |

---

## 7 Dosya, 3 Kullanım Amacı

### Teori ve literatür (Dosya 00-05)
- `00_RESEARCH_MAP.md` — Navigasyon
- `01-04` — 4 araştırma alanı (matching, recsys, fairness, governance)
- `05_ANNOTATED_BIBLIOGRAPHY.md` — 9 çekirdek kaynak

### Uygulamaya hazır şablonlar (Dosya 06)
- `06_PRD_SCHEMA_TEMPLATES.md`
  - TypeScript interface'leri
  - PostgreSQL tablo şemaları
  - REST API endpoint'leri
  - Implementation checklist

### Hızlı referans (Bu dosya)
- Literatür → ürün kararı tek sayfa haritası

---

## Zorunlu Alanlar (PRD Gate)

### Backend
```typescript
MatchingConfig {
  mode: 'score_only' | 'stable_matching' | 'hybrid'
  fairness_config: { fairness_budget, exposure_balance }
}

MatchExplanation {
  top_factors, missing_skills, portfolio_evidence,
  confidence, fairness_adjustment_applied
}

AuditEvent {
  MATCH_GENERATED, FAIRNESS_ADJUSTMENT_APPLIED, 
  MANUAL_OVERRIDE, APPEAL_SUBMITTED
}
```

### Metrikler (Dashboard Zorunlu)
- `time_to_first_gig` (OECD)
- `match_accept_rate`
- `income_uplift_proxy` (OECD)
- `skill_progression` (Skills2Job)
- `exposure_gini_coefficient` (Sühr et al.)

### Compliance
- ✅ Audit log retention: min 1 yıl
- ✅ İtiraz mekanizması: max 48 saat SLA
- ✅ Açıklama: her match için zorunlu
- ✅ İnsan denetimi: kritik kararlar için

---

## Hızlı Başlangıç

### 1. Planlama aşamasında
→ `00_RESEARCH_MAP.md` oku, karar sorularını cevapla

### 2. PRD yazarken
→ Her tasarım kararı için ilgili dokümanı (01-04) referans göster

### 3. Geliştirme başlarken
→ `06_PRD_SCHEMA_TEMPLATES.md` aç, TypeScript/SQL şemalarını kopyala

### 4. Thesis/demo hazırlarken
→ `05_ANNOTATED_BIBLIOGRAPHY.md` kullan, 9 kaynak referans ver

---

## Literatür Kalite Notu

| Kaynak Tipi | Sayı | Notlar |
|-------------|------|--------|
| Peer-reviewed (KDD, arXiv) | 4 | Gale-Shapley, Sühr, Zhao, Zhang |
| Endüstri case study | 2 | CareerBuilder, Skills2Job |
| Uluslararası kuruluş (ILO, OECD) | 3 | Policy çerçevesi, ölçüm standardı |

**Toplam:** 9 yüksek kaliteli kaynak  
**Kapsam:** Teori (stabilite), uygulama (recsys), politika (yönetişim)

---

## Son Kontrol Listesi (Ürün Lansmanı Öncesi)

- [ ] Tüm match'ler `explanation_json` ile saklanıyor
- [ ] `FAIRNESS_ADJUSTMENT_APPLIED` eventi loglanıyor
- [ ] İtiraz formu ve review akışı çalışıyor
- [ ] Dashboard'da 5 zorunlu metrik görünüyor (time_to_first_gig, match_accept_rate, income_uplift, skill_progression, exposure_gini)
- [ ] Audit log retention policy aktif (min 1 yıl)
- [ ] Algoritma değişiklikleri `ALGORITHM_CONFIG_CHANGED` ile loglanıyor
- [ ] Manuel override'lar `MANUAL_OVERRIDE` ile loglanıyor
- [ ] Yeni freelancer'lara exploration uygulanıyor (epsilon_greedy/thompson_sampling)

---

**Önceki versiyon (freestyle automation):** `research_freelance_automation_2026.md`  
**Bu paket (marketplace-research):** Bilimsel literatürle desteklenmiş PRD temel

**Sonraki adım:** Bu araştırmaları PRD ve backlog item'larına dönüştürme (Jira/Linear entegrasyonu için)
