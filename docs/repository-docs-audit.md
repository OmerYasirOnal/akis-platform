# Repository Documentation & System Audit Report

**Tarih:** 4 Aralık 2025
**Kapsam:** Tüm `/docs`, `.cursor`, `/backend/docs` ve kök dizin dokümanları.
**Amaç:** Mevcut dokümantasyonun envanterini çıkarmak, kod ile uyumluluğunu denetlemek ve "Repository Cleanup" aşaması için bir yol haritası oluşturmak.

---

## 1. GLOBAL OVERVIEW SECTION (Genel Bakış)

AKIS projesi, mimari açıdan **Modular Monolith** (Fastify + Drizzle + MCP) yapısına başarıyla geçiş yapmıştır. `.cursor/context/CONTEXT_ARCHITECTURE.md` ve `UI_DESIGN_SYSTEM.md` gibi temel belgeler, kod tabanıyla (Backend ve Frontend) yüksek oranda uyumludur. Ancak, dokümantasyon setinde "geçiş döneminden" kalan bazı tortular bulunmaktadır:

*   **Mimari Uyumu:** Backend (`backend/src/server.app.ts`, `drizzle-orm`) ve Frontend (`tokens.ts`, `routes.tsx`), canonical mimari dokümanlarıyla tam uyumludur.
*   **Eski Referanslar:** `CONTEXT_SCOPE.md` gibi stratejik dokümanlarda hala Next.js API ve Prisma gibi eski teknoloji referansları (uyarı notlarıyla birlikte de olsa) durmaktadır. Bu durum LLM (Cursor) bağlamı için risk oluşturabilir.
*   **Parçalanma:** Ajan iş akışları ve bazı mimari detaylar birden fazla yere dağılmış durumdadır (`backend/docs` vs `docs/`).
*   **Cursor Sistemi:** `.cursor/rules` ve `.cursor/prompts` klasörleri genel olarak günceldir, ancak dosya yollarında (örneğin MCP klasörü) bazı küçük sapmalar mevcuttur.

**Genel Sağlık:** "Docs & .cursor are mostly aligned with code" (Dokümanlar ve kod büyük ölçüde hizalı). Temel ihtiyaç, eski referansların temizlenmesi ve dosya yapısının sadeleştirilmesidir.

---

## 2. INVENTORY TABLE (Doküman Envanteri)

| Path | Category | Source Type | Purpose | Canonical Alignment | Code Alignment | Status | Action Target | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `.cursor/context/CONTEXT_SCOPE.md` | Scope & Requirements | .cursor | Proje kapsamı, hedefler ve MVP tanımı. | **Aligned** | **Implemented-as-documented** | keep-as-is | | Teknoloji detayı için Architecture/API/UI & IA dokümanlarına yönlendirme mevcut. |
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | Architecture | .cursor | Mimari ve teknoloji yığını (SSOT). | **Aligned** | **Implemented-as-documented** | keep-as-is | | Fastify + Drizzle + MCP yapısı ve OCI kısıtları `docs/constraints.md` ile ilişkilendirildi. |
| `docs/UI_DESIGN_SYSTEM.md` | UI/UX | docs | Tasarım token'ları ve bileşen kuralları. | **Aligned** | **Implemented-as-documented** | keep-as-is | | `tokens.ts` ve `Button.tsx` uyumlu. |
| `docs/WEB_INFORMATION_ARCHITECTURE.md` | Web IA | docs | Site haritası ve kullanıcı akışları. | **Aligned** | **Implemented-as-documented** | keep-but-update | | Rotalar kodla uyuşuyor, yeni sayfalar varsa eklenmeli. |
| `docs/ROADMAP.md` | Roadmap | docs | Proje fazları ve ilerleme durumu. | **Aligned** | **Partially-implemented** | keep-but-update | | Tamamlanan fazlar işaretlenmeli. |
| `backend/docs/API_SPEC.md` | API Docs | docs | Backend uç noktaları. | **Aligned** | **Implemented-as-documented** | keep-but-update | | Swagger çıktısı ile senkronize edilmeli. |
| `backend/docs/AGENT_WORKFLOWS.md` | Agent Design | docs | Ajan state machine ve iş akışları. | **Aligned** | **Implemented-as-documented** | keep-as-is | | `AgentOrchestrator` yapısıyla uyumlu. |
| `.cursor/rules/rules.mdc` | Cursor Rules | .cursor | AI kuralları (No Prisma, Fastify only). | **Aligned** | **N/A** | keep-as-is | | MCP adapter konumu ve test politikaları net. |
| `.cursor/prompts/03_MCP_LAYER_SCAFFOLD.md` | Cursor Prompt | .cursor | MCP katmanı iskelet talimatı. | **Aligned** | **Implemented-as-documented** | keep-as-is | | Klasör yolu `backend/src/services/mcp/` olarak güncellendi. |
| `README.md` (Root) | General | docs | Proje giriş sayfası. | **Partially-outdated** | **Unknown** | keep-but-update | | Scope ile uyumlu hale getirilmeli. |
| `backend/docs/PROJECT_DEEP_AUDIT_REPORT.md`| Audit | docs | Eski denetim raporu. | **Outdated** | **N/A** | archive-as-legacy | `docs/archive/` | Tarihsel veri. |
| `docs/constraints.md` | Architecture | docs | OCI Free Tier ve platform çalışma kısıtları. | **Aligned** | **Implemented-as-documented** | keep-as-is | | README ve Architecture dokümanlarından referans verildi. |

---

## 3. KEY DOCUMENTS DEEP-DIVE (Kritik Doküman Analizi)

### 3.1. `.cursor/context/CONTEXT_SCOPE.md`
*   **Rolü:** Projenin "Neden" ve "Ne" sorularını yanıtlar.
*   **Analiz:** Bölüm 1-2.4 güncel; 2.5 bloğu teknoloji tablosu yerine Architecture/API/UI/IA kaynaklarına yönlendiriyor.
*   **Kod Uyumu:** Ajan tanımları (Scribe, Trace, Proto) kodla (`backend/src/agents/`) uyumlu.
*   **Öneri:** Mevcut referanslar korunmalı, yeni teknolojik kararlar yalnızca `CONTEXT_ARCHITECTURE.md` altında tutulmalı.

### 3.2. `.cursor/context/CONTEXT_ARCHITECTURE.md`
*   **Rolü:** Mimari ve teknoloji kararlarının tek kaynağı (SSOT).
*   **Analiz:** OCI Free Tier kısıtlamalarına dayalı Modular Monolith kararı net açıklanmış.
*   **Kod Uyumu:**
    *   `backend/package.json`: `fastify`, `drizzle-orm`, `pg` mevcut; `prisma` yok.
    *   `backend/src/server.app.ts`: Fastify instance ve plugin yapısı uyumlu.
*   **Öneri:** Aynen korunmalı.

### 3.3. `docs/UI_DESIGN_SYSTEM.md`
*   **Rolü:** Frontend görsel dili.
*   **Analiz:** Token isimleri (`ak-primary`, `ak-bg`) ve renk paleti detaylı.
*   **Kod Uyumu:** `frontend/src/theme/tokens.ts` dosyasındaki değerler bu dokümanla birebir eşleşiyor. `Button` bileşeni varyantları (`primary`, `outline`) dokümandaki tanımlara uyuyor.
*   **Öneri:** Aynen korunmalı.

### 3.4. `docs/WEB_INFORMATION_ARCHITECTURE.md`
*   **Rolü:** Site haritası.
*   **Analiz:** `/agents/scribe`, `/dashboard`, `/login` gibi sayfaları tanımlıyor.
*   **Kod Uyumu:** `frontend/src/app/routes.tsx` ve `frontend/src/pages/` yapısı bu haritayla uyumlu.
*   **Öneri:** Küçük güncellemelerle korunmalı.

---

## 4. DUPLICATION & CONFLICT MAP (Çakışma Haritası)

1.  **Kurallar (Rules):**
    *   `.cursor/rules/rules.mdc` tek doğruluk kaynağıdır; ek kopya tutulmaz.

2.  **MCP Klasör Yolu:**
    *   `.cursor/prompts/03_MCP_LAYER_SCAFFOLD.md` artık `backend/src/services/mcp/` yolunu kullanır; ek aksiyon gerekmez.

3.  **Eski Raporlar:**
    *   `backend/docs/PROJECT_DEEP_AUDIT_REPORT.md` ve `docs/PROJECT_DEEP_AUDIT_REPORT.md` (isim benzerliği veya eski kopyalar).
    *   **Çözüm:** Eski raporlar `docs/archive/` altına taşınmalı.

---

## 5. .CURSOR SYSTEM FILES OVERVIEW

### `.cursor/context/`
Projenin beyni. `CONTEXT_SCOPE` iş hedeflerini, `CONTEXT_ARCHITECTURE` teknik çözümü anlatıyor. Bu ayrım sağlıklı, ancak `SCOPE` içindeki teknik detaylar temizlenmeli.

### `.cursor/checklists/`
`DoD.md`, `Performance.md`, `Security.md`.
*   **Durum:** Aktif ve kodla uyumlu. CI pipeline (`pnpm typecheck`, `lint`) DoD maddelerini karşılıyor.

### `.cursor/prompts/`
*   **`00` - `03`:** Güncel ve kullanılabilir; MCP scaffold `backend/src/services/mcp/` klasörünü hedefliyor.

### `.cursor/rules/`
*   **`rules.mdc`:** Globs ve alwaysApply ile modern Cursor kural formatında. Korunmalı.

---

## 6. CODE ALIGNMENT SUMMARY (Kod Uyumu Özeti)

*   **Backend:** Mimari dokümanına sadık kalınmış. Fastify + Drizzle + MCP yapısı, gereksiz abstraction olmadan (Lightweight) uygulanmış.
*   **Frontend:** Design System dokümanına sadık kalınmış. Tailwind token'ları merkezi yönetiliyor.
*   **Agents:** Scribe agent, `GitHubMCPService` kullanarak dokümanda tarif edilen "Tool-use" modelini uyguluyor.

---

## 7. PROPOSED RESTRUCTURING PLAN (Önerilen Yapılandırma)

### PHASE A – Canonicalization (Tamamlandı)
1.  `CONTEXT_SCOPE.md` dosyasındaki "2.5 Kullanılacak Teknolojiler" tablosu kaldırıldı ve `CONTEXT_ARCHITECTURE.md`'ye yönlendirme eklendi.

### PHASE B – .cursor Cleanup (Tamamlandı)
1.  `.cursor/rules/constraints.md` kaldırıldı, kural seti `rules.mdc` altında konsolide edildi.
2.  `.cursor/prompts/03_MCP_LAYER_SCAFFOLD.md` dosyası `backend/src/services/mcp/` yolunu kullanacak şekilde güncellendi.
3.  `.cursor/prompts/02_CORE_AGENTS_SCAFFOLD.md` mevcut route yapısıyla uyumlu.

### PHASE C – Docs Archive (Tamamlandı)
1.  `docs/archive/` klasörü mevcut.
2.  `backend/docs/PROJECT_DEEP_AUDIT_REPORT.md` arşiv altına taşındı.
3.  Kök dizindeki eski raporlar arşiv notlarıyla tutuluyor.

### PHASE D – Public-Facing Docs (Tamamlandı)
1.  `README.md`: Quickstart + Canonical Docs listesi güncel.
2.  `docs/ROADMAP.md`: Tamamlanan fazlar işaretlendi, S0.4.3-FE-4 kaydı eklendi.

### PHASE E – Open Questions
*   `backend/docs/AGENT_WORKFLOWS.md` dosyasının `docs/` altına taşınıp taşınmayacağı (Teknik detay mı, genel doküman mı?). *Öneri: Backend'e özel olduğu için yerinde kalabilir.*

