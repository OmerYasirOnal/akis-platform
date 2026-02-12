# TÜBİTAK BİGG Başvuru Taslağı

> **Proje Başlığı:** Yasal ve Doğrulanmış Bilgi Kaynaklarından Beslenen Türkçe AI Yazılım Mühendisliği Ajanları
> **Kısa Adı:** AKIS Verified Knowledge + Agent Packs
> **Başvuru Sahibi:** Ömer Yasir Önal
> **Tarih:** 2026-02-12
> **Durum:** Taslak v1.0

---

## 1. Problem Tanımı

### 1.1 Mevcut Durum

Yapay zeka destekli yazılım geliştirme araçları (GitHub Copilot, Cursor, Devin) küresel yazılım endüstrisini dönüştürüyor. Ancak bu araçların üç temel sorunu var:

**Sorun 1 — Halüsinasyon:** LLM tabanlı araçlar, var olmayan API'ler, kullanımdan kaldırılmış kütüphane yöntemleri ve hatalı teknik bilgiler üretebilir. Araştırmalar, LLM'lerin teknik dokümantasyon üretiminde %10-30 oranında doğrulama gerektiren bilgi ürettiğini göstermektedir (Min et al., 2023 — FActScore).

**Sorun 2 — Yasal Risk:** Mevcut araçlar, eğitim verilerinin lisans durumunu takip etmez. Çıktılarda kullanılan bilgilerin kaynağı belirsizdir; CC BY-SA, MIT veya telif hakkıyla korunan içerikler ayırt edilemez. AB DSM Direktifi (2019/790) ve KVKK bu alanda yasal uyum gereklilikleri getirmektedir.

**Sorun 3 — Türkçe Boşluk:** Küresel AI yazılım araçları İngilizce odaklıdır. Türkçe dokümantasyon üretimi, Türkçe test planı yazımı ve Türkçe kullanıcı etkileşimi ikincil önceliktedir. Türkiye'nin 500.000+ yazılım geliştirici topluluğu, Türkçe destekli AI araçlarından yeterince yararlanamamaktadır.

### 1.2 Problemin Boyutu

- Türkiye'de 500.000+ yazılım geliştirici (TÜBİSAD, 2025)
- Dünyada AI code assistant pazarı 2026'da $5.2B (Gartner tahmin)
- Türkiye'de kurum içi AI kullanımında veri mahremiyeti en büyük engel (%67, IDC Türkiye 2025)
- Kamu kurumları ve bankalar "on-prem" çözüm gerekliliği nedeniyle mevcut araçları kullanamıyor

---

## 2. Çözüm

### 2.1 Genel Bakış

AKIS Platform üzerine inşa edilecek üç katmanlı bir çözüm öneriyoruz:

**Katman 1 — Doğrulanmış Bilgi Motoru (Verified Knowledge Engine):**
Yasal kaynaklardan (resmi dokümantasyonlar, açık lisanslı içerikler, akademik kaynaklar) API tabanlı bilgi toplayan, her bilgi parçasını kaynak URL + lisans + zaman damgası ile saklayan ve çoklu kaynak çapraz doğrulaması yapan bir bilgi altyapısı.

**Katman 2 — Uzman Ajan Paketleri (Agent Packs):**
Bilgi motorundan beslenen, alan-spesifik yazılım mühendisliği ajanları. Her ajan paketi: domain knowledge pack + uzmanlaşmış system prompt + özel playbook fazları + zorunlu atıf mekanizması içerir.

**Katman 3 — Türkçe LLM Adaptasyonu:**
Açık kaynak temel modellerin (Mistral-7B, Llama-2-13B) Türkçe yazılım mühendisliği görevleri için LoRA/QLoRA fine-tuning'i. Türkçe dokümantasyon, test planı ve kullanıcı etkileşimi kalitesini artırma.

### 2.2 Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    KULLANICI ARAYÜZÜ                    │
│           (React + Vite SPA, TR/EN i18n)                │
├─────────────────────────────────────────────────────────┤
│                   AJAN ORKESTRASYONU                    │
│     AgentOrchestrator + FSM + Quality Scoring           │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  Scribe  │  Trace   │  Proto   │  React   │  DevOps     │
│  Agent   │  Agent   │  Agent   │  Agent   │  Agent      │
│ (mevcut) │ (mevcut) │ (mevcut) │  (yeni)  │  (yeni)     │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│              DOĞRULANMIŞ BİLGİ MOTORU                   │
│  Knowledge Ingestion → Verification → Context Assembly  │
├─────────────────────────────────────────────────────────┤
│              TEMELCİ MODEL KATMANI                      │
│  OpenAI/Claude (API) ←→ Türkçe LLM (self-hosted vLLM)  │
├─────────────────────────────────────────────────────────┤
│              ALTYAPI (OCI / On-Prem)                    │
│  PostgreSQL + MCP Gateway + Docker Compose              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Yenilik (İnovasyon)

### 3.1 Compliance-by-Design Bilgi Toplama

Mevcut çözümlerden farklı olarak, bilgi toplama sistemi **tasarım aşamasında** yasal uyum için inşa edilmiştir:
- Her bilgi kaynağı bir "Source Registry"de lisans tipi, erişim yöntemi ve ToS bilgileriyle kayıtlıdır
- robots.txt ve TDM opt-out sinyalleri otomatik kontrol edilir
- Her knowledge chunk'a `source_url`, `license_type`, `retrieved_at`, `content_hash` metadata'sı zorunludur
- Denetim izi (audit trail) tam olarak saklanır

### 3.2 Çapraz Doğrulama Motoru

Tek kaynağa güvenme yerine çoklu kaynak doğrulaması:
- Aynı bilgi 2+ bağımsız kaynakta varsa → `verified` statüsü
- Kaynaklar arasında çelişki tespit edilirse → `disputed` işareti + her iki kaynak gösterilir
- Zaman aşımı mekanizması: X günden eski bilgi → `stale` olarak etiketlenir
- Topluluk konsensüsü: Stack Overflow skor > 10, GitHub stars > 100 → güvenilir kaynak

### 3.3 Atıf-Zorunlu Kalite Kapısı

Ajan çıktılarında kaynak atıfı zorunludur:
- Context pack kullanılan çıktılarda sıfır atıf → kalite skoru 15 puan düşer
- Her atıf → bonus puan (max 10 puan)
- Atıf kapsamı (%claims with sources) kalite raporunda gösterilir
- Kullanıcı atıfları tıklayarak doğrulama yapabilir

### 3.4 Türkiye'de İlk

- Türkiye'nin ilk bilimsel temelli, yasal uyumlu AI yazılım mühendisliği ajan platformu
- Türkçe LLM adaptasyonu ile Türkçe dokümantasyon/test üretimi
- On-prem kurulum desteği (kamu, banka, savunma sektörleri)
- Akademik metodoloji ile geliştirilmiş (tez + yayın destekli)

---

## 4. Hedef Pazar

### 4.1 Birincil Pazar

| Segment | Büyüklük | İhtiyaç | Gelir Potansiyeli |
|---|---|---|---|
| **Türk yazılım şirketleri** | ~10.000 firma | Verimlilik artışı, Türkçe araçlar | SaaS abonelik |
| **Kamu kurumları** | e-Devlet, TÜBİTAK, üniversiteler | Veri mahremiyeti, on-prem, Türkçe | Kurumsal lisans |
| **Bankalar & finans** | 50+ banka | KVKK uyumu, denetlenebilirlik | Enterprise lisans |
| **Savunma sanayi** | ASELSAN, TAI, Baykar | Veri yerleşimi, egemenlik | Özel çözüm |

### 4.2 İkincil Pazar

| Segment | Büyüklük | İhtiyaç |
|---|---|---|
| **CS öğrencileri** | 200+ üniversite, 100.000+ öğrenci | Öğrenme aracı, Türkçe destek |
| **Freelance geliştiriciler** | ~50.000 | Hızlı prototipleme, dokümantasyon |
| **Startup ekosistemi** | İstanbul, Ankara, İzmir | MVP hızlandırma |

---

## 5. Gelir Modeli

| Kanal | Açıklama | Fiyatlandırma |
|---|---|---|
| **Freemium SaaS** | Temel erişim ücretsiz, profesyonel özellikler ücretli | $0 / $29 / $99 aylık |
| **Enterprise On-Prem** | Kendi sunucusunda kurulum + destek | $5.000-50.000/yıl |
| **Agent Pack Marketplace** | Domain-spesifik ajan paketleri | $9-49/paket/ay |
| **Fine-tuning Hizmetleri** | Kurumsal özel model adaptasyonu | Proje bazlı |
| **Akademik Lisans** | Üniversiteler için ücretsiz/indirimli | Ücretsiz (sponsorlu) |
| **TÜBİTAK Teşvikleri** | BİGG, 1512, TEYDEB | Hibe + AR-GE desteği |

**İlk Yıl Hedefi:** 100 aktif kullanıcı, 5 kurumsal müşteri, $50K ARR
**Üçüncü Yıl Hedefi:** 5.000 aktif kullanıcı, 20 kurumsal müşteri, $500K ARR

---

## 6. Rekabet Analizi

| Özellik | AKIS | Cursor | Devin | GitHub Copilot |
|---|---|---|---|---|
| **Türkçe destek** | Doğal (i18n + Türk LLM) | Yok | Yok | Sınırlı |
| **On-prem kurulum** | Evet (OCI/Docker) | Hayır | Hayır | Enterprise (sınırlı) |
| **Kaynak doğrulama** | Evet (compliance-by-design) | Hayır | Hayır | Hayır |
| **Atıf üretimi** | Zorunlu (kalite kapısı) | Hayır | Hayır | Hayır |
| **Uzman ajanlar** | Evet (Agent Packs) | Genel amaçlı | Genel amaçlı | Tamamlama odaklı |
| **Açık kaynak** | Evet (core) | Hayır | Hayır | Hayır |
| **Fiyat** | Freemium | $20-40/ay | $500/ay | $19-39/ay |
| **Veri mahremiyeti** | Tam kontrol | Bulut bağımlı | Bulut bağımlı | Bulut bağımlı |

**Farklılaşma:** Türkçe + Doğrulanmış + On-prem + Açık kaynak + Akademik

---

## 7. Proje Yol Haritası (12-18 Ay)

### M0: Tasarım Dondurma (2-3 Hafta)
- Kaynak kategorileri + lisans politikası (allowlist)
- Provenance şeması (metadata zorunlu alanlar)
- AKIS context pack formatı ve kalite skoru kriterleri
- **Çıktı:** Tasarım dokümanı + teknik spesifikasyon

### M1: Knowledge Ingestion v1 (4-6 Hafta)
- GitHub docs / resmi doküman repoları / açık veri kaynakları ingestion
- Source registry + zamanlama + rate limit
- Ham veri → chunk → metadata pipeline
- **Çıktı:** 10.000+ doğrulanmış knowledge chunk
- **Bütçe:** API erişim maliyetleri (~$200/ay)

### M2: Verification & Dedup v1 (4-6 Hafta)
- SHA-256 hash + MinHash near-duplicate detection
- Freshness / stale etiketleme mekanizması
- Cross-check kural setleri (2+ kaynak → verified)
- **Çıktı:** Doğrulama motoru + %90+ duplicate tespit oranı

### M3: AKIS Entegrasyonu (3-5 Hafta)
- ContextAssembly katmanına domain pack seçimi
- Scribe & Trace için atıf zorunluluğu (quality scoring)
- Golden path: "React doc üret" / "Test plan üret" (kanıtlı çıktı)
- **Çıktı:** 3 golden path demo (kanıtlı çıktı ile)

### M4: Agent Packs v1 (4-8 Hafta)
- React Frontend Agent Pack
- QA/Test Engineer Agent Pack
- DevOps/Cloud Agent Pack
- Her biri: bilgi seti + playbook + ölçüm senaryoları
- **Çıktı:** 3 ajan paketi + benchmark raporu

### M5 (Opsiyonel): Türkçe LLM Adaptasyonu (6-10 Hafta)
- Mistral-7B üzerine QLoRA fine-tuning (Türkçe SE dataset)
- Quantize (GGUF Q4) + vLLM deployment
- AKIS entegrasyonu (model routing + fallback chain)
- **Çıktı:** Türkçe LLM + karşılaştırmalı benchmark
- **Bütçe:** GPU compute (~$500-2.000 toplam)

---

## 8. Bütçe

| Kalem | Miktar | Açıklama |
|---|---|---|
| **GPU Compute** | $2.000-5.000 | A100 kiralama (RunPod/Lambda) — fine-tuning + inference |
| **API Erişimi** | $1.200/yıl | OpenAI, OpenRouter, Semantic Scholar |
| **Altyapı** | $600/yıl | OCI, domain, e-posta servisi |
| **Araştırmacı Bursu** | TÜBİTAK BİGG | Kurucu + 1-2 araştırmacı |
| **Konferans/Yayın** | $1.000 | ACL/EMNLP/ICSE submission fees |
| **Toplam (12 ay)** | **~$8.000-12.000** | TÜBİTAK hibe ile karşılanabilir |

---

## 9. Risk Analizi

| Risk | Olasılık | Etki | Azaltma Stratejisi |
|---|---|---|---|
| **Model kalitesi yetersiz** | Orta | Yüksek | Fallback chain (Türk LLM → OpenAI → Claude) |
| **Veri yetersizliği** | Düşük | Orta | API-first + topluluk katkısı |
| **Yasal risk** | Düşük | Yüksek | Compliance-by-design + hukuk danışmanlığı |
| **Pazar benimseme** | Orta | Orta | Freemium + üniversite ortaklıkları |
| **Rakip hız** | Yüksek | Orta | Türkçe + on-prem + akademik niş |
| **Teknik borç** | Düşük | Düşük | Mevcut AKIS altyapısı sağlam (1.391 test) |

---

## 10. Ekip ve Yetkinlikler

| Rol | Kişi | Yetkinlik |
|---|---|---|
| **Kurucu / Baş Geliştirici** | Ömer Yasir Önal | Full-stack (TypeScript, React, Fastify), AI agent mimarisi, AKIS Platform kurucusu |
| **Akademik Danışman** | [Tez danışmanı] | Bilgisayar mühendisliği, NLP |
| **ML Mühendisi** | [Aranıyor] | LoRA/QLoRA fine-tuning, vLLM deployment |

---

## 11. Akademik Çıktılar

| Çıktı | Hedef Tarih | Açıklama |
|---|---|---|
| **Lisans Tezi** | Mayıs 2026 | AKIS Platform: Mimari + Uygulama + Değerlendirme |
| **Konferans Makalesi** | Eylül 2026 | "Verified Knowledge for Domain-Specific SE Agents" (ICSE/ASE/SANER) |
| **Açık Kaynak Yayın** | Haziran 2026 | AKIS core + Agent Pack framework (GitHub/HuggingFace) |
| **Türkçe SE Dataset** | Ağustos 2026 | Turkish instruction-response pairs for SE tasks (HuggingFace) |

---

## 12. Özet

**Problem:** AI yazılım araçları halüsinasyon üretiyor, yasal risk taşıyor ve Türkçe desteği yetersiz.

**Çözüm:** AKIS Platform üzerine inşa edilmiş, yasal kaynaklardan beslenen, atıf üreten, Türkçe destekli uzman yazılım mühendisliği ajanları.

**Yenilik:** Compliance-by-design bilgi toplama + çapraz doğrulama + atıf-zorunlu kalite kapısı + Türkçe LLM adaptasyonu.

**Pazar:** Türkiye'nin 500.000+ yazılım geliştirici topluluğu, kamu kurumları, bankalar, savunma sanayi.

**Hedef:** 12-18 ayda 3 uzman ajan paketi + doğrulanmış bilgi motoru + Türkçe LLM prototip.

---

*Bu doküman TÜBİTAK BİGG başvurusu için taslak niteliğindedir. Final başvuru, uygulayıcı kuruluş rehberliğinde detaylandırılacaktır.*
