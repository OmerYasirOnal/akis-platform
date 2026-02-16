# Operational Playbook → Uygulama Haritası

> **Kaynak:** [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](AKIS_OPERATIONAL_PLAYBOOK.md) (teyit edilmiş hedef doküman)  
> **Son Güncelleme:** 2026-02-15  
> **Durum:** Mevcut altyapı × playbook gap analizi tamamlandı

> **2026-02-15 M2 Reliability Wave-1 Notu:** Contract enforcement, deterministic plan forcing, rollout policy, freshness scheduler bootstrap, MCP boundary hardening ve deterministic canary cohort gating kodlandı. Takip: production telemetry + staged enablement.

---

## Amaç

Bu doküman, AKIS Operational Playbook'taki 4 sütunu mevcut codebase ile eşleştirir. Her pillar için:
1. **Mevcut altyapı** — zaten var olan dosyalar ve yetenekler
2. **Boşluklar (gaps)** — playbook'un hedeflediği ama henüz olmayan özellikler
3. **Aksiyon planı** — M2/M3 fazlarına dağıtılmış görevler

---

## Pillar Olgunluk Özeti

| Pillar | Mevcut Olgunluk | Hedef (Playbook) | Gap Şiddeti |
|--------|-----------------|-------------------|-------------|
| P1: Knowledge Integrity Core | **%35** — Provenance, grounding prompts, citation schema, keyword retrieval | Claim/evidence model, groundedness score, cite-or-block enforcement, conflict detection | **Yüksek** |
| P2: Agent Verification Framework | **%50** — Quality scoring (0-100), trust bars (4 metrik), contracts, trace recording | Agent-specific gates, formal thresholds, block-on-fail, risk profilleri | **Orta** |
| P3: Freshness & Update Pipeline | **%20** — DB schema (staleAt, nextFetchAt, verificationStatus), provenance model | Signal collection, scheduler, CVE/deprecation, human review döngüsü | **Yüksek** |
| P4: UI/UX Integrity Layer | **%40** — Quality badge, breakdown, trust bars, color coding | Citation badge, confidence indicator, freshness label, conflict/unknown markers | **Orta** |

---

## P1: Knowledge Integrity Core

### Mevcut Altyapı ✅

| Bileşen | Dosya(lar) | Açıklama |
|---------|-----------|----------|
| Provenance modeli | `backend/src/services/knowledge/retrieval/types.ts` | `RetrievalResult` → `provenance: { title, sourcePath, commitSha, docType }` |
| Context assembly | `backend/src/services/knowledge/ContextAssemblyService.ts` | Platform policy + agent identity + retrieved knowledge katmanları |
| Context packs | `backend/src/services/knowledge/contextPacks.ts` | `packId`, `packVersion`, `profile` metadata |
| Context pack contract | `backend/src/core/contracts/ContextPackContract.ts` | Zod şema doğrulaması |
| Keyword retrieval | `backend/src/services/knowledge/retrieval/KnowledgeRetrievalService.ts` | ILIKE tabanlı arama |
| Scribe grounding | `backend/src/agents/scribe/DocContract.ts` | "Every claim backed by evidence" prompt |
| Citation schema | `backend/src/core/contracts/ScribeSkillContracts.ts` | `citations: z.array(z.string())` output alanı |
| Quality citation gate | `backend/src/services/quality/QualityScoring.ts` | `citationCount`, `verifiedCitationCount` → skor etkisi |
| Docs ingestion | `backend/src/services/knowledge/ingestion/RepoDocsIngester.ts` | Chunk, approve/deprecate flow |

### Boşluklar (Gaps) ❌

| # | Gap | Playbook Hedef | Öncelik | Hedef Faz |
|---|-----|----------------|---------|-----------|
| P1-G1 | Claim Decomposition | Her çıktı atomik iddialara ayrılmalı | P1 | M2 |
| P1-G2 | Evidence Mapping | Her iddia ≥1 kaynakla yapısal olarak eşleşmeli | P1 | M2 |
| P1-G3 | Groundedness Score | Her çıktıya 0-1 güvenilirlik skoru | P0 | M2 |
| P1-G4 | Conflict Detection | Çakışan kaynaklar otomatik tespit ve işaretleme | P1 | M2 |
| P1-G5 | Cite-or-Block Enforcement | Kaynaksız kritik iddia → hard gate (blok veya uyarı) | P0 | M2 |
| P1-G6 | Unknown Obligation | "Bilinmiyor/belirsiz" yapısal işaretleme | P2 | M2-M3 |
| P1-G7 | Citation Verification | Kaynak referanslarının gerçek doğrulaması | P1 | M2 |
| P1-G8 | Semantic/Vector RAG | FAISS + sentence-transformers; Piri v3 submodule hazır (2026-02-13) | P0 | M2 (Piri temel altyapı tamam) |

### Aksiyon Planı

| Görev ID | Görev | Dosyalar | Faz |
|----------|-------|----------|-----|
| M2-KI-1 | `GroundednessScorer` service: claim extraction + evidence matching + 0-1 score | `backend/src/services/knowledge/GroundednessScorer.ts` (yeni) | M2 Sprint 1 |
| M2-KI-2 | `ClaimDecomposer` utility: AI-powered atomic claim extraction | `backend/src/services/knowledge/ClaimDecomposer.ts` (yeni) | M2 Sprint 1 |
| M2-KI-3 | `ConflictDetector` service: kaynak çakışma tespiti | `backend/src/services/knowledge/ConflictDetector.ts` (yeni) | M2 Sprint 2 |
| M2-KI-4 | Cite-or-block gate: `AgentOrchestrator.completeJob` içinde enforcement | `backend/src/core/orchestrator/AgentOrchestrator.ts` (güncelleme) | M2 Sprint 2 |
| M2-KI-5 | RAG microservice entegrasyonu (M2-RAG-1/2 ile paralel) | `piri/` submodule v3 hazır (2026-02-13); HTTP bağlantısı M2-RAG-5 | M2 Sprint 1-2 |

---

## P2: Agent Verification Framework

### Mevcut Altyapı ✅

| Bileşen | Dosya(lar) | Açıklama |
|---------|-----------|----------|
| Quality scoring | `backend/src/services/quality/QualityScoring.ts` | 0-100 skor (target coverage 30, files 20, docs 20, depth 15, multi-pass 15, citations ±15) |
| Trust scoring | `backend/src/services/trust/TrustScoringService.ts` | 4 bar: reliability, hallucination risk, task success, tool health |
| Agent contracts | `backend/src/core/contracts/AgentContract.ts` | Abstract Zod input/output schemas |
| Scribe skill contracts | `backend/src/core/contracts/ScribeSkillContracts.ts` | Typed constraints + failure modes |
| Agent playbooks | `backend/src/core/agents/playbooks/*.ts` | Step-by-step execution plans |
| Trace recorder | `backend/src/core/tracing/TraceRecorder.ts` | Job traces, artifacts, AI calls, explainability |
| Plan generator | `backend/src/core/planning/PlanGenerator.ts` | Evidence checklist in plan structure |
| FSM | `backend/src/core/state/` | `pending → running → completed | failed | awaiting_approval` |
| Orchestrator | `backend/src/core/orchestrator/AgentOrchestrator.ts` | Full lifecycle management |

### Boşluklar (Gaps) ❌

| # | Gap | Playbook Hedef | Öncelik | Hedef Faz |
|---|-----|----------------|---------|-----------|
| P2-G1 | Scribe Verification Gates | Citation ≥80%, Hallucination ≤5%, Freshness ≤6mo, Conflict=0 | P0 | M2 |
| P2-G2 | Trace Verification Gates | Coverage ≥90%, Edge Cases ≥5/mod, Test Validity ≥95% | P1 | M2 |
| P2-G3 | Proto Verification Gates | Build Success 100%, Security Scan 0 kritik, Convention ≥90% | P2 | M2-M3 |
| P2-G4 | Formal threshold engine | Pass/fail kararları → block veya warning | P0 | M2 |
| P2-G5 | Agent risk profiles | P0/P1/P2 risk → farklı verification depth | P1 | M2 |
| P2-G6 | Contract violation tracking | Sistematik violation → TrustScoring girdi | P1 | M2 |

### Aksiyon Planı

| Görev ID | Görev | Dosyalar | Faz |
|----------|-------|----------|-----|
| M2-VF-1 | `VerificationGateEngine` service: configurable thresholds + pass/fail/warn | `backend/src/services/knowledge/verification/VerificationGateEngine.ts` | M2 Sprint 1 |
| M2-VF-2 | Scribe gates: 4 metrik + eşik + aksiyon tanımları | `backend/src/config/agentRiskProfiles.ts` + `backend/src/services/knowledge/verification/AgentVerificationService.ts` | M2 Sprint 1 |
| M2-VF-3 | Trace gates: 3 metrik + eşik tanımları | `backend/src/config/agentRiskProfiles.ts` + `backend/src/services/knowledge/verification/AgentVerificationService.ts` | M2 Sprint 2 |
| M2-VF-4 | Proto gates: 3 metrik + eşik tanımları | `backend/src/config/agentRiskProfiles.ts` + `backend/src/services/knowledge/verification/AgentVerificationService.ts` | M2 Sprint 2 |
| M2-VF-5 | Orchestrator integration: gate check before `completeJob` | `backend/src/core/orchestrator/AgentOrchestrator.ts` (güncelleme) | M2 Sprint 2 |
| M2-VF-6 | Agent risk profile config: P0/P1/P2 → gate strictness | `backend/src/config/agentRiskProfiles.ts` (yeni) | M2 Sprint 1 |

---

## P3: Freshness & Update Pipeline

### Mevcut Altyapı ✅

| Bileşen | Dosya(lar) | Açıklama |
|---------|-----------|----------|
| DB schema | `backend/src/db/schema.ts` | `knowledgeSources`: `refreshIntervalHours`, `lastFetchedAt`, `nextFetchAt`, `staleAt`, `verificationStatus` |
| Verification enum | `backend/migrations/0031_add_knowledge_provenance.sql` | `unverified`, `single_source`, `cross_verified`, `stale`, `conflicted` |
| Provenance | `backend/src/db/schema.ts` | `knowledgeProvenance` → source-document link |
| Knowledge API | `backend/src/api/knowledge.ts` | CRUD + verificationStatus filter |
| Stale job watchdog | `backend/src/core/watchdog/StaleJobWatchdog.ts` | Hung job detection (15min timeout) |

### Boşluklar (Gaps) ❌

| # | Gap | Playbook Hedef | Öncelik | Hedef Faz |
|---|-----|----------------|---------|-----------|
| P3-G1 | GitHub Releases sinyal toplama | MCP adapter ile otomatik izleme (günlük) | P1 | M2 |
| P3-G2 | npm/PyPI version polling | Registry API polling (haftalık) | P2 | M3 |
| P3-G3 | CVE/güvenlik bültenleri | NVD + GitHub Security Advisories (gerçek zamanlı) | P1 | M2 |
| P3-G4 | Framework deprecation tarama | Changelog + migration guide | P2 | M3 |
| P3-G5 | Freshness scheduler | Cron/interval: nextFetchAt → trigger scan | P0 | M2 |
| P3-G6 | Human review döngüsü | Haftalık tüm tespitler → domain uzman onayı | P1 | M2-M3 |
| P3-G7 | Verified knowledge packs | Onay → 'verified' status → sisteme yansıtma | P1 | M2 |
| P3-G8 | Approval-required flag | Kritik alan değişiklikleri → insan onayı zorunlu | P1 | M2 |

### Aksiyon Planı

| Görev ID | Görev | Dosyalar | Faz |
|----------|-------|----------|-----|
| M2-FP-1 | `FreshnessScheduler`: cron job → stale knowledge detection | `backend/src/services/knowledge/FreshnessScheduler.ts` (yeni) | M2 Sprint 2 |
| M2-FP-2 | GitHub Releases sinyal: MCP adapter genişletme | `backend/src/services/mcp/adapters/GitHubMCPService.ts` (güncelleme) | M2 Sprint 2 |
| M2-FP-3 | CVE/Security Advisory sinyal entegrasyonu | `backend/src/services/knowledge/signals/SecuritySignalCollector.ts` (yeni) | M2 Sprint 3 |
| M3-FP-4 | npm/PyPI version tracker | `backend/src/services/knowledge/signals/RegistrySignalCollector.ts` (yeni) | M3 |
| M2-FP-5 | Knowledge approval workflow (API + UI) | `backend/src/api/knowledge.ts` + frontend | M2 Sprint 3 |

---

## P4: UI/UX Integrity Layer

### Mevcut Altyapı ✅

| Bileşen | Dosya(lar) | Açıklama |
|---------|-----------|----------|
| Quality badge | `frontend/src/components/agents/PhaseProgressBanner.tsx` | Score → green (70+) / amber (40-69) / red (<40) |
| Quality breakdown | `frontend/src/pages/JobDetailPage.tsx` | `QualitySection` with score, breakdown, suggestions |
| Trust bars | `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx` | 4 bar: reliability, hallucination, task success, tool health |
| Live canvas | `frontend/src/components/agents/LiveAgentCanvas.tsx` | Stream/timeline/quality views |
| Color coding | `frontend/src/theme/theme.tokens.css` | GitHub-style light/dark theme tokens |
| i18n | `frontend/src/i18n/locales/en.json`, `tr.json` | Quality/trust key'leri mevcut |

### Boşluklar (Gaps) ❌

| # | Gap | Playbook Hedef | Öncelik | Hedef Faz |
|---|-----|----------------|---------|-----------|
| P4-G1 | Citation Badge | Her bilgi iddiasının yanında kaynak göstergesi (yeşil badge) | P0 | M2 |
| P4-G2 | Confidence Indicator | 0-100 güven skoru (groundedness'tan ayrı) | P1 | M2 |
| P4-G3 | Freshness Label | "Son güncelleme" + güncellik durumu | P1 | M2 |
| P4-G4 | Conflict Warning | Turuncu "conflict" badge + iki kaynak gösterimi | P1 | M2 |
| P4-G5 | Unknown Marker | "Belirsiz/bilinmiyor" açık işaretleme | P2 | M2-M3 |
| P4-G6 | Cite-or-Block visual states | Yeşil verified / Sarı unverified / Kırmızı blocked / Turuncu conflict | P0 | M2 |
| P4-G7 | Inline provenance | Agent çıktılarında satır içi kaynak referansı | P1 | M2 |

### Aksiyon Planı

| Görev ID | Görev | Dosyalar | Faz |
|----------|-------|----------|-----|
| M2-UI-1 | `CitationBadge` component: verified/unverified/blocked/conflict states | `frontend/src/components/agents/verification/CitationBadge.tsx` | M2 Sprint 2 |
| M2-UI-2 | `ConfidenceIndicator` component: 0-100 + renk | `frontend/src/components/agents/verification/ConfidenceIndicator.tsx` | M2 Sprint 2 |
| M2-UI-3 | `FreshnessLabel` component: tarih + stale/fresh/unknown | `frontend/src/components/agents/verification/FreshnessLabel.tsx` | M2 Sprint 2 |
| M2-UI-4 | `ConflictWarning` component: turuncu uyarı + kaynak listesi | `frontend/src/components/agents/verification/ConflictWarning.tsx` | M2 Sprint 2 |
| M2-UI-5 | ArtifactPreview entegrasyonu: inline citation + provenance | `frontend/src/components/jobs/ArtifactPreview.tsx` (güncelleme) | M2 Sprint 3 |
| M2-UI-6 | i18n: TR/EN citation/confidence/freshness key'leri | `frontend/src/i18n/locales/*.json` (güncelleme) | M2 Sprint 2 |

---

## Toplam Görev Matrisi

| Faz | P1 (Knowledge) | P2 (Verification) | P3 (Freshness) | P4 (UI/UX) | Toplam |
|-----|-----------------|--------------------|-----------------|------------|--------|
| M2 Sprint 1 | 2 (KI-1, KI-2) | 3 (VF-1, VF-2, VF-6) | — | — | **5** |
| M2 Sprint 2 | 2 (KI-3, KI-4) | 2 (VF-3, VF-4) | 2 (FP-1, FP-2) | 5 (UI-1~4, UI-6) | **11** |
| M2 Sprint 3 | 1 (KI-5) | 1 (VF-5) | 2 (FP-3, FP-5) | 1 (UI-5) | **5** |
| M3 | — | — | 1 (FP-4) | — | **1** |
| **Toplam** | **5** | **6** | **5** | **6** | **22** |

---

## Bağımlılık Zinciri

```
M2-KI-1 (GroundednessScorer) ─┐
M2-KI-2 (ClaimDecomposer) ────┤
                               ├─→ M2-VF-1 (VerificationGateEngine) ─→ M2-VF-5 (Orchestrator integration)
M2-VF-6 (Risk profiles) ──────┘                                    │
                                                                    ├─→ M2-UI-1 (CitationBadge)
M2-KI-3 (ConflictDetector) ──────────────────────────────────────────┤
                                                                    ├─→ M2-UI-4 (ConflictWarning)
M2-FP-1 (FreshnessScheduler) ────────────────────────────────────────┤
                                                                    └─→ M2-UI-3 (FreshnessLabel)

M2-RAG-1 (Python RAG service) ──→ M2-KI-5 (RAG integration) ──→ M2-UI-5 (Inline provenance)
```

---

## Playbook ↔ Mevcut Codebase Sinerji Tablosu

| Playbook Prensibi | Mevcut Karşılık | Durum | Boşluk |
|--------------------|------------------|-------|--------|
| Citation-first | `ScribeSkillContracts.citations` + `QualityScoring.citationCount` | Kısmi | UI badge + enforcement yok |
| Cite or Block | Prompt-level grounding ("DO NOT hallucinate") | Kısmi | Hard gate + visual states yok |
| Conflict Detection | `verificationStatus: 'conflicted'` (DB enum) | Schema var | Otomatik tespit + UI yok |
| Freshness / Last Updated | `knowledgeSources.staleAt` + `lastFetchedAt` | Schema var | Scheduler + sinyal toplama yok |
| Approval Required | `awaiting_approval` FSM state | Mevcut | Knowledge-level approval yok |
| Audit Trail | `TraceRecorder` + `JobEventBus` + SSE | Güçlü | Knowledge-level audit yok |
| Confidence Score | `QualityScoring` (0-100) + `TrustScoringService` (4 bar) | İyi | Groundedness skoru (0-1) yok |
| Agent Risk Profiles | Agent contracts tanımlı ama risk seviyesi wired değil | Kısmi | P0/P1/P2 → gate strictness yok |

---

## Sonuç

AKIS platformu, Operational Playbook'un 4 sütunu için **sağlam bir altyapı temel** oluşturmuş durumda. Özellikle:
- **DB schema** freshness ve provenance için hazır
- **Quality/Trust scoring** mevcut ve çalışır
- **Agent contracts ve trace recording** güçlü
- **FSM + Orchestrator** enforcement noktaları var

Ana boşluklar **uygulama katmanında**: otomatik claim decomposition, verification gate engine, sinyal toplama pipeline'ı ve UI integrity bileşenleri. Bu boşluklar M2 (Mart 2026) içinde 3 sprint'e dağıtılarak kapatılabilir.

---

*Bu doküman, `docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md` ile senkronize tutulur.*
