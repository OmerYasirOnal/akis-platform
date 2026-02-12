# AKIS Platform — Operational Playbook

> **Knowledge Integrity + National OS/Chip Moonshot**  
> **4 Pillar + Moonshot Track**  
> **Version 1.0 — February 2026**  
> **CLASSIFICATION: INTERNAL / STRATEGIC**  
> **Kaynak:** `akis_operational_playbook.docx` — teyit edilmiş hedef doküman

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pillar 1: Knowledge Integrity Core](#2-pillar-1-knowledge-integrity-core)
3. [Pillar 2: Agent Verification Framework](#3-pillar-2-agent-verification-framework)
4. [Pillar 3: Freshness & Update Pipeline](#4-pillar-3-freshness--update-pipeline)
5. [Pillar 4: UI/UX Integrity Layer](#5-pillar-4-uiux-integrity-layer)
6. [Moonshot: AKIS OS + Yerli Milli Chip](#6-moonshot-akis-os--yerli-milli-chip)
7. [Uygulama Yol Haritası Özeti](#7-uygulama-yol-haritası-özeti)
8. [Ekler](#8-ekler)

---

## 1. Executive Summary

Bu playbook, AKIS (Adaptive Knowledge Integrity System) platformunun 4 temel sac ayağı ve uzun vadeli Moonshot (Yerli OS + Chip) programını kapsayan operasyonel yol haritasını sunar. AKIS, bilgi bütünlüğünü (knowledge integrity) merkeze alan, kanıta dayalı (evidence-based), yapay zeka destekli bir platform olarak tasarlanmaktadır.

Platform, sektörden bağımsız bilimsel yöntem ve kanıtsal mühendislik prensipleri üzerine inşa edilirken, sektöre özgü gereksinimler 'optional compliance packs' olarak modüler bir yaklaşımla entegre edilecektir.

### 1.1. Dört Temel Sacayağı + Moonshot

| Pillar | Kapsam | Öncelik |
|--------|--------|---------|
| P1: Knowledge Integrity Core | Hallucination testi, citation-first mimari, conflict detection, freshness | Kritik |
| P2: Agent Verification Framework | Scribe (P0), Trace (P1), Proto (P2) için risk-tabanlı doğrulama | Kritik |
| P3: Freshness & Update Pipeline | Otomatik sinyal toplama, hybrid (auto + human) güncelleme döngüsü | Yüksek |
| P4: UI/UX Integrity Layer | Citation badge'leri, güven göstergeleri, cite-or-block varsayılan davranışı | Yüksek |
| Moonshot: AKIS OS + Chip | Yerli OS (RISC-V tabanlı) + Milli Chip programı (5-10 yıl) | Stratejik |

---

## 2. Pillar 1: Knowledge Integrity Core

AKIS platformunun kalbi, bilgi bütünlüğünü garanti altına alan bir doğrulama çerçevesidir. Bu çerçeve, her bilgi iddiasını kaynak, güven seviyesi ve güncellik açısından değerlendirir.

### 2.1. Kaynak Önceliği ve Domain Stratejisi

Platform, cross-domain bilimsel yöntem ve kanıtsal mühendislik (evidence-based engineering) literatürünü birincil kaynak olarak kullanır. Tek bir sektöre bağımlılık oluşturmamak temel prensiptir.

### 2.2. Hallucination Testi ve Doğrulama Modeli

Her bilgi iddiası için claim/evidence modeli uygulanır. Sistem, kaynaksız iddiayı 'cite or block' prensibiyle işler: kritik bir iddia kaynaksızsa, yayın engellenir veya uyarı ile işaretlenir.

- **Claim Decomposition:** Her çıktı, atomik iddialara ayrılır.
- **Evidence Mapping:** Her iddia, bir veya daha fazla kaynakla eşleştirilir.
- **Conflict Detection:** Çakışan kaynaklar otomatik olarak işaretlenir.
- **Unknown Obligation:** Yeterli kanıt yoksa, 'bilinmiyor/belirsiz' ifadesi zorunludur.
- **Groundedness Score:** Her çıktıya 0-1 arası güvenilirlik skoru atanır.

---

## 3. Pillar 2: Agent Verification Framework

AKIS platformundaki her agent farklı bir risk profiline sahiptir. Bu nedenle doğrulama iş akışları (verification workflows) agent bazında farklılık gösterir.

### 3.1. Agent Risk Profilleri ve Öncelikler

| Agent | Risk Seviyesi | Doğrulama Önceliği | Açıklama |
|-------|---------------|---------------------|----------|
| Scribe | Yüksek (P0) | Kritik | Dokümantasyon üretir — yanlış bilgi doğrudan kullanıcıya ulaşır |
| Trace | Orta (P1) | Yüksek | Test planı üretir — eksik/yanlış test güvenlik açığı oluşturabilir |
| Proto | Düşük-Orta (P2) | Normal | Prototip kodu üretir — scaffold doğası gereği gözden geçirilir |

### 3.2. Verification Gates (Agent Bazlı)

Her agent için ayrı 'verification gates' ve metrik setleri tanımlanır:

#### 3.2.1. Scribe Verification Gates

| Gate | Metrik | Eşik | Aksiyon |
|------|--------|------|---------|
| Citation Coverage | Kaynakla eşleşen iddia oranı | ≥ 80% | Altında: uyarı + yeniden üretim |
| Hallucination Score | Doğrulanamayan iddia oranı | ≤ 5% | Üstünde: blok + insan inceleme |
| Freshness Check | Kaynak güncellik kontrolü | ≤ 6 ay | Eski kaynak: uyarı badge |
| Conflict Check | Çakışan kaynak tespiti | 0 çakışma | Varsa: conflict badge + iki kaynak gösterilir |

#### 3.2.2. Trace Verification Gates

| Gate | Metrik | Eşik | Aksiyon |
|------|--------|------|---------|
| Coverage Completeness | Hedef modül kapsama oranı | ≥ 90% | Altında: eksik alan raporu |
| Edge Case Detection | Tespit edilen sınır durumu sayısı | ≥ 5/modül | Altında: uyarı |
| Test Validity | Geçerli test case oranı | ≥ 95% | Altında: review flag |

#### 3.2.3. Proto Verification Gates

| Gate | Metrik | Eşik | Aksiyon |
|------|--------|------|---------|
| Build Success | Üretilen kodun derleme başarısı | 100% | Başarısız: otomatik düzeltme denemesi |
| Security Scan | Temel güvenlik taraması (bağımlılık + pattern) | 0 kritik | Kritik varsa: blok |
| Convention Compliance | Proje kurallarına uyum (lint, format) | ≥ 90% | Altında: otomatik düzeltme |

---

## 4. Pillar 3: Freshness & Update Pipeline

Bilginin güncelliği (freshness) AKIS platformunun güvenilirliğinin temel bileşenidir. Hybrid bir yaklaşım benimsenir: otomatik tespit (detection) + insan onayı (approval).

### 4.1. Sinyal Toplama Mekanizması

| Sinyal Kaynağı | Yöntem | Frekans |
|----------------|--------|---------|
| GitHub Releases | MCP adapter ile otomatik izleme | Günlük |
| npm/PyPI Versiyonlar | Registry API polling | Haftalık |
| CVE/Güvenlik Bültenleri | NVD + GitHub Security Advisories | Gerçek zamanlı |
| Framework Deprecation | Changelog + migration guide tarama | Haftalık |
| Topluluk Sinyalleri | Stack Overflow + GitHub Issues trend | Haftalık |

### 4.2. Human Review Döngüsü

- **Haftalık review:** Tüm otomatik tespitler, domain uzmanları tarafından incelenir ve onaylanır.
- **Kritik alanlar** (security, auth, billing, regülasyon) için review döngüsü 24-48 saate indirilir.
- **Onaylanan güncellemeler** 'verified knowledge packs' olarak sisteme yansıtılır.
- **Çakışma durumlarında** (eski bilgi vs. yeni bilgi) conflict warning üretilir ve iki kaynak da gösterilir.
- **Approval-required flag:** Kritik alan değişiklikleri insan onayı olmadan yayınlanmaz.

---

## 5. Pillar 4: UI/UX Integrity Layer

Kullanıcı arayüzünde bilgi bütünlüğü prensipleri varsayılan davranış olarak merkeze alınır.

### 5.1. Zorunlu UI Bileşenleri

| Bileşen | Açıklama | Konum |
|---------|----------|-------|
| Citation Badge | Her bilgi iddiasının yanında kaynak göstergesi | Agent çıktıları |
| Confidence Indicator | 0-100 güven skoru + renk kodlaması | Job sonuç kartları |
| Freshness Label | "Son güncelleme" tarihi + güncellik durumu | Bilgi paketleri |
| Conflict Warning | Çakışan kaynaklar için turuncu uyarı | Inline + sidebar |
| Unknown Marker | "Belirsiz/bilinmiyor" açık işaretleme | Agent yanıtları |

### 5.2. Cite or Block Prensibi

Varsayılan davranış: Kritik bir iddia kaynaksız ise, içerik yayınlanmaz veya açık bir uyarı ile işaretlenir. Bu prensip tüm platform çıktıları (Scribe yanıtı, Trace test planı, Proto kod yorumu) için geçerlidir.

| Durum | Görsel | Davranış |
|-------|--------|----------|
| Kaynaklı iddia | Yeşil citation badge | Normal gösterim |
| Kaynaksız, düşük riskli | Sarı 'unverified' etiketi | İçerik gösterilir |
| Kaynaksız, yüksek riskli | Kırmızı 'blocked' etiketi | İçerik gösterilmez veya bulanık |
| Çakışan kaynaklar | Turuncu 'conflict' badge | Her iki kaynak gösterilir |

---

## 6. Moonshot: AKIS OS + Yerli Milli Chip

Bu bölüm, AKIS platformunun uzun vadeli stratejik hedefi olan yerli işletim sistemi ve chip programını kapsar. Mevcut kısa vadeli deliverable'lardan bağımsız bir stratejik program olarak planlanmıştır.

### 6.1. (A) 5-10 Yıllık Stratejik Yol Haritası

#### 6.1.1. Faz 0: Temeller ve Ekosistem Hazırlık (Yıl 0-1)

| Alan | Aktivite | Stage Gate / Go-No-Go |
|------|----------|----------------------|
| OS | Çekirdek ekip oluşturma; Linux kernel analizi; RISC-V araştırma; mimari tasarım doc | Tasarım dokümanı onaylandı mı? Çekirdek ekip (≥8) tamamlandı mı? |
| Chip | RISC-V ISA değerlendirme; EDA toolchain kurulumu; referans tasarım analizi | FPGA dev board hazır mı? RTL flow kuruldu mu? |
| Ortak | IP stratejisi; hukuki çerçeve; üniversite/TÜBİTAK iş birlikleri kurulması | İş birlikleri imzalandı mı? IP policy onaylandı mı? |

#### 6.1.2. Faz 1: Prototipleme ve Doğrulama (Yıl 1-3)

| Alan | Aktivite | Stage Gate / Go-No-Go |
|------|----------|----------------------|
| OS | AKIS OS Alpha: minimal Linux distro (custom kernel config, hardening, paket yönetimi) | Alpha build boot ediyor mu? Temel paketler çalışıyor mu? |
| OS | Güvenlik modülleri: SELinux/AppArmor profilleri, secure boot zinciri | Penetrasyon testi geçti mi? |
| OS | AI entegrasyonu: on-device model inference; AKIS knowledge verification daemon | AI pipeline çalışıyor mu? ISO 27001 uyumlu mu? |
| Chip | FPGA üzerinde RISC-V SoC prototipi: secure enclave + TPM benzeri blok | FPGA benchmark hedeflerini karşıladı mı? |
| Chip | MPW (Multi-Project Wafer) ile ilk ASIC tape-out (28nm/22nm) | İlk silicon çalışıyor mu? (first silicon boot) |
| Chip | Test/validation altyapısı kurulumu | Test coverage ≥ 90% fonksiyonel mi? |

#### 6.1.3. Faz 2: Pilot ve Sertifikasyon (Yıl 3-5)

| Alan | Aktivite | Stage Gate / Go-No-Go |
|------|----------|----------------------|
| OS | AKIS OS Beta: 3-5 kamu kurumu pilotu (MEB okulları, belediyeler) | Pilot memnuniyet ≥ 80%? Kritik bug < 10? |
| OS | Sertifikasyon hazırlık: Common Criteria EAL4+, ISO 27001 | Sertifikasyon başvurusu yapıldı mı? |
| Chip | 2. tape-out: optimizasyonlar, AI accelerator entegrasyonu | Performans hedeflerini karşıladı mı? |
| Chip | Küçük seri üretim (small batch production) + güvenilirlik testleri | MTBF hedefi karşılandı mı? |
| Ortak | OS + Chip entegrasyon testi: AKIS OS, yerli chip üzerinde boot | End-to-end demo başarılı mı? |

#### 6.1.4. Faz 3: Ölçekleme ve Pazar (Yıl 5-7)

| Alan | Aktivite | Stage Gate / Go-No-Go |
|------|----------|----------------------|
| OS | AKIS OS 1.0 GA sürümü; geniş kamu dağıtımı | 10,000+ kurulum hedefi karşılandı mı? |
| OS | Enterprise management + uzaktan yönetim platformu | Kurumsal müşteri ≥ 5? |
| Chip | Seri üretim (volume production): foundry partnership (GlobalFoundries/TSMC) | Yield ≥ 85%? Birim maliyet hedefi? |
| Chip | Edge AI, güvenli kurumsal cihaz, kamu terminali ürün ailesi | İlk 3 ürün lansmanları tamamlandı mı? |

#### 6.1.5. Faz 4: Olgunluk ve Genişleme (Yıl 7-10)

- **OS:** AKIS OS v2/v3 sürümleri; uluslararası dağıtım; EU/NATO uyumlu versiyonlar.
- **Chip:** İleri süreç düğümleri (14nm/7nm); yüksek performanslı server/AI chiplerine geçiş potansiyeli.
- **Ekosistem:** Bağımsız uygulama geliştirici topluluğu; uluslararası partner ağları.
- **Sinerji:** AKIS platformu verification discipline chip firmware ve OS ayarlarında da varsayılan.

### 6.2. (B) Ekip Rolleri, Zaman Çizelgesi ve Riskler

#### 6.2.1. Tahmini Ekip Yapısı (Faz Bazlı)

| Faz | OS Ekibi | Chip Ekibi | Ortak/Yönetim | Toplam |
|-----|----------|------------|---------------|--------|
| Faz 0 (Yıl 0-1) | 8-12 kişi (kernel, security, AI, UX) | 5-8 kişi (RTL, verification, FPGA) | 3-5 kişi (PM, biz dev, legal) | 16-25 |
| Faz 1 (Yıl 1-3) | 15-25 kişi | 12-20 kişi | 5-8 kişi | 32-53 |
| Faz 2 (Yıl 3-5) | 25-35 kişi | 20-35 kişi | 8-12 kişi | 53-82 |
| Faz 3 (Yıl 5-7) | 35-50 kişi | 30-50 kişi | 12-18 kişi | 77-118 |
| Faz 4 (Yıl 7-10) | 50-80 kişi | 40-70 kişi | 15-25 kişi | 105-175 |

#### 6.2.2. Temel Roller

- **OS Ekibi:** Kernel mühendisleri, güvenlik uzmanları, AI/ML mühendisleri, paket yöneticileri, UX/UI tasarımcıları, QA mühendisleri, DevOps/CI-CD uzmanları.
- **Chip Ekibi:** RTL tasarımcılar, doğrulama (verification) mühendisleri, fiziksel tasarım (PD), analog/mixed-signal, test mühendisleri, firmware geliştiriciler.
- **Ortak:** Program yöneticisi, iş geliştirme, hukuk/IP danışmanı, tedarik zinciri yöneticisi, sertifikasyon uzmanı.

#### 6.2.3. Ana Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma (Mitigation) |
|------|----------|------|----------------------|
| Yetkin mühendis bulma zorluğu (özellikle chip tarafında) | Yüksek | Kritik | Üniversite iş birlikleri, diaspora programları, uzaktan çalışma, rekabetçi ücretler |
| Foundry erişim/kapasite riskleri (jeopolitik) | Orta | Kritik | Birden fazla foundry seçeneği (TSMC, GlobalFoundries, Samsung); uzun vadeli anlaşma |
| Tape-out başarısızlığı (silicon bug) | Orta | Yüksek | Kapsamlı pre-silicon verification; FPGA ile erken doğrulama; iteratif tape-out planlaması |
| OS adoption/benimseme direnci | Orta | Yüksek | Pardus deneyiminden ders çıkar; zorunlu değil teşvik bazlı geçiş; eğitim programları |
| Bütçe aşımı (özellikle chip NRE) | Orta-Yüksek | Yüksek | Faz bazlı bütçeleme; stage-gate go/no-go kararları; MPW ile maliyet optimizasyonu |
| IP/patent ihlali riski | Düşük-Orta | Yüksek | RISC-V açık standart avantajı; IP taraması; hukuk danışmanlığı |

### 6.3. (C) Bütçe Modeli (Geniş Aralıklarla)

Aşağıdaki tahminler 2026 ABD Doları bazındadır. Gerçek maliyetler jeopolitik koşullar, foundry seçimi ve takımın büyüklüğüne göre önemli ölçüde değişebilir.

#### 6.3.1. OS Geliştirme Bütçesi

| Kalem | Düşük (Low) | Orta (Medium) | Yüksek (High) | Varsayımlar |
|-------|-------------|---------------|----------------|-------------|
| Faz 0-1: Çekirdek Geliştirme | $2M | $4M | $7M | 10-20 kişilik çekirdek ekip, 2 yıl |
| Faz 2: Pilot ve Sertifikasyon | $3M | $6M | $10M | Ekip büyümesi, sertifikasyon maliyetleri |
| Faz 3-4: Ölçekleme | $5M | $12M | $25M | Dağıtım, destek, eğitim, partner ağları |
| **TOPLAM OS (10 yıl)** | **$10M** | **$22M** | **$42M** | Kümülatif |

#### 6.3.2. Chip Geliştirme Bütçesi

| Kalem | Düşük (Low) | Orta (Medium) | Yüksek (High) | Varsayımlar |
|-------|-------------|---------------|----------------|-------------|
| FPGA Prototipleme | $0.3M | $0.8M | $1.5M | FPGA board + EDA lisansları + mühendislik |
| 1. Tape-out (28nm MPW) | $1M | $3M | $5M | MPW ile maliyet paylaşılır; NRE dahil |
| 2. Tape-out (optimizasyon) | $3M | $8M | $15M | Tam maske seti; 22nm/14nm potansiyeli |
| Test/Validation Altyapısı | $1M | $3M | $5M | ATE (Automatic Test Equipment), test geliştirme |
| Küçük Seri Üretim | $2M | $5M | $10M | 1000-10000 adet arası ilk üretim |
| Seri Üretim Hazırlığı | $5M | $15M | $30M | Foundry anlaşma, volume production setup |
| EDA Lisansları (Yıllık) | $0.5M/yıl | $1M/yıl | $2M/yıl | Synopsys/Cadence/Mentor; 10 yıl = $5-20M |
| **TOPLAM CHIP (10 yıl)** | **$20M** | **$55M** | **$110M** | Kümülatif; EDA dahil |

> **Not:** 3nm seviyesinde tek bir tape-out maliyeti ~$100M'a ulaşabilir. AKIS chip programı 28nm-14nm aralığında başlamalıdır; bu aralık NRE'yi önemli ölçüde düşürür.

#### 6.3.3. Toplam Program Bütçesi (10 Yıl)

| Bileşen | Düşük | Orta | Yüksek |
|---------|-------|------|--------|
| OS Geliştirme | $10M | $22M | $42M |
| Chip Geliştirme | $20M | $55M | $110M |
| Ortak/Yönetim/Overhead | $5M | $12M | $25M |
| **GENEL TOPLAM** | **$35M** | **$89M** | **$177M** |

### 6.4. (D) Dünyada Benzer Programlar ve Çıkarılan Dersler

#### 6.4.1. Ulusal OS Programları

| Ülke/Program | Durum | Temel Özellikler | Çıkarılan Ders |
|--------------|-------|------------------|----------------|
| Türkiye / Pardus | Aktif (v25.0, Debian-based, Xfce/GNOME) | TÜBİTAK ULAKBİM destekli; kamu ve eğitimde yaygın; 100,000+ kurulum; belediye göçleri $1M tasarruf | Esnek yaklaşım (zorlama değil teşvik) başarının anahtarı; Debian base stabilite sağlar |
| Çin / Ubuntu Kylin + openKylin | Aktif; kamu zorunluluğu artıyor | Kapsamlı Çince destek; kamu kurumlarında zorunlu geçiş; RISC-V entegrasyonu başlıyor | Devlet desteği ve zorunluluk adoption'ı hızlandırır ama direnç yaratabilir |
| Rusya / Astra Linux + ALT Linux | Aktif; savunma sertifikalı | Askeri ve devlet sırları için sertifikalı; RusBITech tarafından geliştiriliyor | Güvenlik odaklı sertifikasyon kurumsal adoption için kritik |
| Hindistan / BOSS Linux | Aktif; CDAC tarafından geliştiriliyor | Yerel dil desteği; kamu kurumları ve okullarda kullanım | Yerelleştirme (localization) kamu benimsemesini kolaylaştırır |
| Almanya / Schleswig-Holstein | Geçiş süreci aktif (2024-) | LibreOffice + Nextcloud + Linux; Microsoft'tan tamamen geçiş | AB dijital egemenlik trendinin öncüsü; en başarılı Avrupa örneği |
| Danimarka | Pilot aşama (2025) | Microsoft'tan açık kaynağa geçiş; sovereign cloud pilot projeleri | AB Cloud Act endişesi temel motivasyon |
| Küba / Nova | Aktif; Ubuntu-based | Hafif (LXDE); eski donanıma uygun | Kaynak kısıtlı ülkelerde Linux ideal çözüm |

#### 6.4.2. Ulusal/Bölgesel Chip Programları

| Program | Odak | Bütçe/Ölçek | Ders |
|---------|------|-------------|------|
| ABD CHIPS Act | Yerel üretim kapasitesi; Intel/TSMC/Samsung tesisleri | $52.7 milyar federal destek | Devlet desteği olmadan chip üretimi mümkün değil |
| AB European Chips Act | 2030'a kadar küresel payın %20'ye çıkarılması | 43 milyar Euro kamu + özel | Ekosistem yaklaşımı: tasarım + üretim + paketleme |
| Çin / RISC-V Yatırımı | RISC-V ile ABD kontrollerini aşmak | $1.1B+ startup yatırımı; $50M+ devlet | Açık standart (RISC-V) bağımlılığı azaltır |
| Hindistan / ISM | Yerel chip tasarım ve üretim | ~$10B program | RISC-V odaklı; ISRO SHAKTI işlemci başarısı |
| AB / RISC-V Girişimleri | Dijital egemenlik; ESA uzay uygulamaları | Çoklu EU projesi + özel sektör | RISC-V Avrupa dijital egemenliğinin anahtarı |

> **Temel Bulgu:** RISC-V pazarı 2025'te ~$2.3 milyar olup 2030'da $8.5 milyar, 2034'te $25.7 milyar olarak projekte edilmektedir (CAGR ~30.7%). Bu büyüme, AKIS chip programı için güçlü bir ekosistem desteği anlamına gelmektedir.

### 6.5. (E) Go-to-Market Stratejisi

#### 6.5.1. İlk Müşteri Segmentleri

| Segment | Öncelik | Kullanım Alanı | Değer Önerisi |
|---------|---------|----------------|---------------|
| Kamu Kurumları | 1 (İlk) | Bakanlıklar, valilikler, belediyeler | Maliyet tasarrufu, dijital egemenlik, audit trail |
| Eğitim (MEB / Üniversiteler) | 2 | Okul bilgisayarları, kampüs sistemleri | Ücretsiz lisans, Türkçe destek, eğitim araçları |
| Savunma/Güvenlik | 3 | Askeri terminaller, güvenli iletişim | Sertifikalı güvenlik, yerli chip, supply chain kontrol |
| Kurumsal (Enterprise) | 4 | Banka şubeleri, sağlık kurumları | Compliance, enterprise management, maliyet |
| Kamu Terminalleri / Kiosk | 5 (Chip odaklı) | E-devlet terminalleri, ATM, POS | Edge AI, güvenli enclave, yerli üretim |

#### 6.5.2. Procurement ve Sertifikasyon

- **Kamu İhale Stratejisi:** Açık kaynak tercih maddesi için mevzuat çalışmaları; TÜBİTAK destekli pilot programlar.
- **Sertifikasyon Yol Haritası:** Common Criteria EAL4+ (OS), ISO 27001 (platform), FIPS 140-2/3 (chip security module).
- **Eğitim Programları:** Pardus eğitim modeli üzerine inşa; TÜBİTAK sertifikalı 'AKIS OS Yönetici' eğitimi.
- **Partner Ekosistemi:** Yerel SI (System Integrator) firmaları ile destek ağları; OEM anlaşmalar.
- **Pilot-to-Production Modeli:** 6 aylık pilot → değerlendirme → kademeli yaygınlaştırma.

### 6.6. (F) Knowledge Integrity Sinerjisi

Moonshot programı, AKIS platformunun knowledge integrity çekirdeği ile aynı doğrulama disiplini ve audit trail felsefesini paylaşmaktadır:

| AKIS Platform Prensibi | OS'teki Karşılığı | Chip'teki Karşılığı |
|-------------------------|---------------------|----------------------|
| Citation-first | Her OS bileşeninin kaynak paket metadata'sı; signed provenance | Chip firmware'inde version + hash; attestation chain |
| Cite or Block | Doğrulanmamış update engellenir; signed update chain | Secure boot: doğrulanmamış firmware yüklenmez |
| Conflict Detection | Paket bağımlılık çakışmaları otomatik tespit | Design rule check (DRC) + verification otomasyonu |
| Freshness / Last Updated | Otomatik paket güncelleme takvimi; CVE takibi | Firmware OTA update; silicon erratum takibi |
| Approval Required | Kritik kernel/security yamaları için human review gate | Tape-out sign-off; safety-critical review board |
| Audit Trail | Tüm sistem değişiklikleri immutable log'a yazılır | Secure enclave logları; supply chain attestation |
| Confidence Score | Paket stabilite metriği (test sonuçları, bug oranları) | Silicon reliability metriği (MTBF, yield data) |

Bu sinerji, AKIS'in 'verified knowledge' felsefesinin sadece bir yazılım platformu değil, donanım-yazılım-bilgi ekosisteminin tümüne uygulanan bütünsel bir yaklaşım olduğunu göstermektedir.

---

## 7. Uygulama Yol Haritası Özeti

| Dönem | 4 Pillar (Kısa-Orta Vade) | Moonshot (Uzun Vade) |
|-------|----------------------------|----------------------|
| Q1-Q2 2026 | P1+P2: Knowledge Integrity Core + Agent Verification Framework MVP | Faz 0 başlangıç: Ekip kurulumu, RISC-V değerlendirme, OS mimari tasarım |
| Q3-Q4 2026 | P3: Freshness Pipeline alpha; P4: UI/UX prototipi | FPGA prototip başlangıcı; üniversite partnerlikleri |
| 2027 | Platform Beta: Tüm 4 pillar entegre; pilot müşteriler | Faz 1: FPGA doğrulama; OS Alpha (sandboxing, hardening) |
| 2028-2029 | Platform GA 1.0; compliance pack'ler; geniş dağıtım | Faz 1-2: İlk tape-out; OS pilot (3-5 kurum) |
| 2030-2031 | Platform v2; uluslararası genişleme | Faz 2-3: Sertifikasyon; küçük seri üretim; OS Beta |
| 2032-2035 | Platform v3+; ekosistem olgunlukları | Faz 3-4: Seri üretim; OS GA; ürün ailesi lansmanlar |

---

## 8. Ekler

### 8.1. Anahtar Referanslar ve Kaynaklar

- NIST Cybersecurity Framework (CSF 2.0) — Güvenlik çerçevesi
- ISO/IEC 27001:2022 — Bilgi güvenliği yönetim sistemi
- OWASP Top 10 (2021+) — Web uygulama güvenlik riskleri
- IEEE/ACM Software Engineering Standards — Yazılım kalite standartları
- ISTQB Test Sertifikasyon Çerçevesi — Test metodolojisi
- DO-178C — Havacılık yazılım güvenliği (reference case)
- RISC-V International (riscv.org) — ISA standartları ve profiller
- Common Criteria (ISO 15408) — Güvenlik değerlendirme çerçevesi
- Pardus Projesi (pardus.org.tr) — Türkiye ulusal Linux deneyimi
- EU European Chips Act — Avrupa yarıiletken stratejisi
- US CHIPS and Science Act — ABD yarıiletken yatırımı
- CSIS: What RISC-V Means for Chip Development (2024) — Stratejik analiz
- GM Insights: RISC-V Market Size Report (2025-2034) — Pazar büyüklüğü

### 8.2. Kısaltmalar

| Kısaltma | Açıklama |
|----------|----------|
| AKIS | Adaptive Knowledge Integrity System |
| ASIC | Application-Specific Integrated Circuit |
| ATE | Automatic Test Equipment |
| CVE | Common Vulnerabilities and Exposures |
| EDA | Electronic Design Automation |
| FPGA | Field-Programmable Gate Array |
| GA | General Availability |
| ISA | Instruction Set Architecture |
| MPW | Multi-Project Wafer |
| MTBF | Mean Time Between Failures |
| NRE | Non-Recurring Engineering |
| OTA | Over-The-Air (update) |
| PoC | Proof of Concept |
| RISC-V | Reduced Instruction Set Computing V (açık standart ISA) |
| RTL | Register Transfer Level |
| SoC | System on Chip |
| TPM | Trusted Platform Module |

---

*— AKIS Operational Playbook Sonu —*
