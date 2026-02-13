# AKIS Freelancer Marketplace — Araştırma Paketi

Bu klasör, AKIS Freelancer Marketplace ürün kararlarını **bilimsel literatüre dayalı** güçlendirmek için hazırlanmış doküman paketidir. Her doküman, ürün kararlarına doğrudan bağlanan "tasarım sonuçları" içerir ve yüksek kaliteli kaynaklara dayanır.

---

## Dokümanlar PRD Kararlarına Nasıl Bağlanır?

| PRD alanı | Kaynak doküman | Literatür kökeni |
|-----------|----------------|------------------|
| **matching_mode** (`score_only` \| `stable_matching` \| `hybrid`) | `01_MATCHING_MECHANISMS.md` | Gale-Shapley |
| **explanation_json** şeması | `03_FAIRNESS_TRANSPARENCY_EXPLAINABILITY.md` | Zhang et al. Explainable Rec |
| **fairness_budget**, **exposure_score** | `01_MATCHING_MECHANISMS.md`, `03_...` | Sühr et al. two-sided fairness |
| **audit_log**, itiraz mekanizması | `04_PLATFORM_WORK_GOVERNANCE_AND_MEASUREMENT.md` | ILO algorithmic management |
| **Metrikler** (`time_to_first_gig`, `match_accept_rate`, vb.) | `04_PLATFORM_WORK_GOVERNANCE_AND_MEASUREMENT.md` | OECD/ILO/EU el kitabı |

---

## Okuma sırası

1. `00_RESEARCH_MAP.md` — Genel harita ve karar soruları
2. `01_MATCHING_MECHANISMS.md` — Eşleştirme teorisi
3. `02_JOB_RECSYS_AND_SKILLS_MATCHING.md` — Teknik mimari
4. `03_FAIRNESS_TRANSPARENCY_EXPLAINABILITY.md` — Adalet ve açıklama
5. `04_PLATFORM_WORK_GOVERNANCE_AND_MEASUREMENT.md` — Yönetişim ve ölçüm
6. `05_ANNOTATED_BIBLIOGRAPHY.md` — Tam referans listesi
7. `06_PRD_SCHEMA_TEMPLATES.md` — **Uygulamaya hazır şablonlar** (TypeScript, SQL, API)

---

## Kullanım

- **PRD yazarken:** Her tasarım kararı için ilgili dokümanı referans ver
- **Geliştirme aşamasında:** `06_PRD_SCHEMA_TEMPLATES.md` → doğrudan TypeScript/SQL/API şemaları
- **Litereatür taramasında:** `05_ANNOTATED_BIBLIOGRAPHY.md` çekirdek okuma olarak
- **Pilot demo / thesis:** Bu paket "bilimsel dayanak" bölümünde kaynak gösterilebilir

---

## 06_PRD_SCHEMA_TEMPLATES.md İçeriği

**Uygulamaya hazır şablonlar:**
- ✅ `MatchingConfig` (TypeScript) — `matching_mode`, fairness_config, score_weights
- ✅ `MatchExplanation` JSON schema — top_factors, missing_skills, portfolio_evidence, confidence
- ✅ `AuditEvent` types — zorunlu log noktaları, event enum
- ✅ `MarketplaceMetrics` — OECD/ILO metrik seti (time_to_first_gig, exposure_gini, vb.)
- ✅ API endpoint'leri — `/matching/generate`, `/matching/explanation`, `/matching/appeal`
- ✅ Database schema — `matches`, `audit_events`, `exposure_tracking` tabloları (PostgreSQL)
- ✅ Implementation checklist — backend, frontend, compliance, testing
