# Trace Eval Protocol (M2+)

## Amaç
Trace Agent için determinism ve reliability regresyonlarını release öncesi yakalamak.

## Fixture Kaynağı
- `/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/backend/test/fixtures/trace-evals/basic-login.json`

## Ölçüm Boyutları
1. `relevance`: Spec’ten anlamlı scenario üretimi (minimum: `0.70`)
2. `coverage`: `flowCoverage.coverageRate` (minimum: `0.70`)
3. `freshness`: Trace çıktısının güncel payload/spec üzerinden üretilmesi (minimum: `0.50`)
4. `provenance`: Üretilen test artifact referansı (`generatedTestPath`) (minimum: `0.90`)
5. `stability`: Aynı fixture’ın tekrar çalıştırılmasında scenario set overlap oranı (minimum: `0.95`)

## Çalıştırma
```bash
cd /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/backend
NODE_ENV=test SKIP_MCP_TESTS=true SKIP_DB_TESTS=true node --test --import dotenv/config --import tsx test/unit/trace-eval-harness.test.ts
```

## Gate Kuralı
- Her metrik fixture threshold’unu geçmeli.
- Eşik altı herhangi bir metrik release checklist’te fail kabul edilir.
- Failure durumunda önce `trace-agent-determinism`, sonra `trace-coverage-model` testleri incelenir.

## İnsan Kalibrasyonu
- Her sprint sonunda en az 3 fixture manuel olarak gözden geçirilir.
- Manual review çıktısı `docs/research/TRACE_AGENT_EVIDENCE_MATRIX.md` içinde ilgili karara bağlanır.

