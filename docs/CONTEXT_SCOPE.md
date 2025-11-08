# AKIS Platform — Scope Context

Bu belge, `.cursor/context/CONTEXT_SCOPE.md` içeriğinin yayınlanabilir sürümüdür ve proje kapsamını, varsayımlarını ve hedeflerini resmi dokümantasyon altında özetler. Tüm açıklamalar, modüler monolit mimari (Fastify + TypeScript backend, React/Vite frontend, Drizzle + PostgreSQL veri katmanı, MCP adaptörleri) guardrail'lerini koruyacak şekilde hazırlanmıştır.

## 1. Problemin Tanımı ve Motivasyon

Yazılım ekipleri tekrarlayan dokümantasyon güncellemeleri, manuel test planlama ve yavaş MVP üretimi nedeniyle zaman kaybı yaşar. AKIS Platform bu üç ağrı noktasını, LLM destekli otonom ajanlar aracılığıyla otomatikleştirerek çözmeyi hedefler. Amaç, geliştirici ekiplerin stratejik görevlere odaklanmasını sağlamak ve ücretsiz OCI kaynakları üzerinde çalışabilen, hafif ama güvenilir bir iş akışı motoru sunmaktır.

## 2. Hedefler (H1–H6)

- **H1:** Web tabanlı yönetim arayüzü ile otonom ajan görev akışlarını koordine eden modüler bir çekirdek inşa etmek.
- **H2:** GitHub, Jira ve Confluence entegrasyonlarını mevcut iş akışlarına müdahale etmeden, MCP adaptörleri üzerinden güvenli biçimde sağlamak.
- **H3:** AKIS Scribe, AKIS Trace ve AKIS Proto ajanlarını gündelik yazılım pratiklerini otomatikleştirecek şekilde hayata geçirmek.
- **H4:** “Kazanılan zaman” North Star metriğini izleyebilmek için ölçümleme ve gözlemlenebilirlik (observability) altyapısı kurmak.
- **H5:** Guardrail'ler, Definition of Done kontrol listeleri ve kalite güvence prensiplerini süreçlere yerleştirmek.
- **H6:** Akademik ve endüstriyel paydaşlara sunulmak üzere çalışan prototip, kapsamlı dokümantasyon ve demo içeriği sağlamak.

## 3. Kapsam

Çalışma; kullanıcı yönetimi, ajan görev izleme paneli, ajansal konfigürasyon ekranları, GitHub/Jira/Confluence entegrasyonları ve akademik dokümantasyon çıktılarından oluşur. Slack, gelişmiş RBAC, on-prem dağıtım veya ücretli LLM optimizasyonları kapsam dışıdır. Oracle OCI Free Tier kaynak sınırları performans optimizasyonu gerektirir.

## Roadmap & Milestones

Phase planlaması H1–H6 hedefleriyle birebir hizalanır. Güncel odak olan **Phase 9.2 — i18n & Theming Foundations (Epic #24)**, Vite tabanlı frontend için i18n kancaları ve tema geçiş altyapısını kurarak **H1** (modüler arayüz) ve **H3** (ajan deneyimi) hedeflerine hizmet eder. Tema toggles ve marka varlıklarının güncellenmesi **H2** (entegrasyonlarda UI tutarlılığı) ile **H5** (guardrail & kalite) hedeflerini desteklerken, lint/format düzenlemeleri ve yüksek çözünürlüklü logolar **H4** ve **H6** kapsamında teslim edilecek demoların güvenilirliğini artırır. Tüm kilometre taşları, kabul kriterleri ve bağlantılı işler [`docs/ROADMAP.md`](./ROADMAP.md) belgesinde takip edilir.

