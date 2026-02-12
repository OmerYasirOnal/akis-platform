# T.C. FATİH SULTAN MEHMET VAKIF ÜNİVERSİTESİ

## Mühendislik Fakültesi — Bilgisayar Mühendisliği Bölümü

### Lisans Bitirme Projesi — Final Raporu

---

# LLM AJANLARI İLE YAPAY ZEKÂ TABANLI ETKİLEŞİMLİ YAZILIM GELİŞTİRME PLATFORMU

**AKIS Platform**

---

| Alan | Bilgi |
|------|-------|
| **Öğrenci** | Ömer Yasir ÖNAL — 2221221562 |
| **Öğrenci** | Ayşe Serra GÜMÜŞTAKIM — 2121251008 |
| **Danışman** | Dr. Öğr. Üyesi Nazlı DOĞAN |
| **Tarih** | İstanbul, Şubat 2026 |

---

| Jüri Üyeleri | İmza |
|---------------|------|
| ………………………… | …………………… |
| ………………………… | …………………… |
| ………………………… | …………………… |

---

## İÇİNDEKİLER

- [ÖN SÖZ](#ön-söz)
- [ÖZET](#özet)
- [SUMMARY](#summary)
- [ŞEKİL LİSTESİ](#şekil-listesi)
- [TABLO LİSTESİ](#tablo-listesi)
- [1. GİRİŞ](#1-giriş)
  - [1.1 Problem Tanımı ve Motivasyon](#11-problem-tanımı-ve-motivasyon)
  - [1.2 Projenin Amacı ve Hedefleri](#12-projenin-amacı-ve-hedefleri)
  - [1.3 Projenin Kapsamı](#13-projenin-kapsamı)
  - [1.4 Terimler ve Kısaltmalar](#14-terimler-ve-kısaltmalar)
- [2. İLGİLİ ÇALIŞMALAR / LİTERATÜR ARAŞTIRMASI](#2-i̇lgili-çalışmalar--literatür-araştırması)
  - [2.1 Araştırma Metodolojisi](#21-araştırma-metodolojisi)
  - [2.2 Otonom ve Çoklu LLM Ajan Sistemleri](#22-otonom-ve-çoklu-llm-ajan-sistemleri)
  - [2.3 LLM Tabanlı Otomatik Dokümantasyon Üretimi](#23-llm-tabanlı-otomatik-dokümantasyon-üretimi)
  - [2.4 LLM Tabanlı Test Üretimi ve Hata Giderme](#24-llm-tabanlı-test-üretimi-ve-hata-giderme)
  - [2.5 LLM Tabanlı Akıl Yürütme Stratejileri](#25-llm-tabanlı-akıl-yürütme-stratejileri)
  - [2.6 Temel Modeller ve Yazılım Mühendisliği Altyapısı](#26-temel-modeller-ve-yazılım-mühendisliği-altyapısı)
  - [2.7 Ajan UI/UX: Şeffaflık, Güven Kalibrasyonu ve Gerçek Zamanlı Arayüzler](#27-ajan-uiux-şeffaflık-güven-kalibrasyonu-ve-gerçek-zamanlı-arayüzler)
  - [2.8 Bilgi Edinimi, Doğrulama ve Atıf Farkındalığı](#28-bilgi-edinimi-doğrulama-ve-atıf-farkındalığı)
  - [2.9 Karşılaştırmalı Analiz ve AKIS'in Katkısı](#29-karşılaştırmalı-analiz-ve-akisin-katkısı)
  - [2.10 Literatürdeki Boşluk](#210-literatürdeki-boşluk)
- [3. ÇÖZÜM YÖNTEMLERİ](#3-çözüm-yöntemleri)
  - [3.1 Genel Mimari Bakış](#31-genel-mimari-bakış)
  - [3.2 Yapay Zekâ Ajanı İş Akışı Motoru](#32-yapay-zekâ-ajanı-iş-akışı-motoru)
  - [3.3 Ajan Sözleşmeleri ve İş Şablonları](#33-ajan-sözleşmeleri-ve-iş-şablonları)
  - [3.4 MCP Entegrasyon Stratejisi](#34-mcp-entegrasyon-stratejisi)
  - [3.5 Veri Modeli Tasarımı](#35-veri-modeli-tasarımı)
  - [3.6 Kimlik Doğrulama ve Onboarding Akışları](#36-kimlik-doğrulama-ve-onboarding-akışları)
  - [3.7 Frontend Tasarımı](#37-frontend-tasarımı)
  - [3.8 Test Planı ve Kalite Stratejisi](#38-test-planı-ve-kalite-stratejisi)
  - [3.9 Dağıtım ve İşletim](#39-dağıtım-ve-işletim)
  - [3.10 Geliştirme Metodolojisi](#310-geliştirme-metodolojisi)
- [4. BULGULAR VE TARTIŞMA](#4-bulgular-ve-tartışma)
  - [4.1 Tamamlanan Görevler ve Ara Çıktılar](#41-tamamlanan-görevler-ve-ara-çıktılar)
  - [4.2 Güncel Durum Tablosu](#42-güncel-durum-tablosu)
  - [4.3 Test Sonuçları ve Metrikler](#43-test-sonuçları-ve-metrikleri)
  - [4.4 Staging Ortamı ve Demo Sonuçları](#44-staging-ortamı-ve-demo-sonuçları)
  - [4.5 Ajan Performans Değerlendirmesi](#45-ajan-performans-değerlendirmesi)
  - [4.6 Tartışma](#46-tartışma)
- [5. SONUÇ VE GELECEK ÇALIŞMALAR](#5-sonuç-ve-gelecek-çalışmalar)
  - [5.1 Sonuçlar](#51-sonuçlar)
  - [5.2 Hedefler ile Elde Edilen Sonuçların Karşılaştırılması](#52-hedefler-ile-elde-edilen-sonuçların-karşılaştırılması)
  - [5.3 Yaygın Etki](#53-yaygın-etki)
  - [5.4 Gelecek Çalışmalar](#54-gelecek-çalışmalar)
- [KAYNAKLAR](#kaynaklar)
- [EKLER](#ekler)

---

## ÖN SÖZ

Bu rapor, Fatih Sultan Mehmet Vakıf Üniversitesi Bilgisayar Mühendisliği Bölümü Lisans Bitirme Projesi kapsamında geliştirilen **AKIS Platformu**'nun final raporunu sunmaktadır.

Çalışmanın temel amacı; yazılım geliştirme yaşam döngüsünde (SDLC) dokümantasyon üretimi, iz kayıtları üzerinden inceleme, test otomasyonu, iş akışı görünürlük/izlenebilirlik ihtiyacı ve dış sistem entegrasyonları gibi operasyonel yükü yüksek süreçlerde, LLM tabanlı ajan yaklaşımı ile verimlilik ve denetlenebilirlik sağlayan bir platform prototip ortaya koymaktır.

Bu kapsamda AKIS; merkezi bir orkestrasyon katmanı altında çalışan üç otonom ajan (Scribe, Trace, Proto), güvenli entegrasyon adaptörleri (MCP), kalıcı iz/artefakt yönetimi ve gerçek zamanlı ajan yürütme görselleştirmesi ile uçtan uca bir iş yürütme çerçevesi sunmayı hedeflemiştir.

Birinci dönemde (BLM401) platform çekirdeği, veri modeli, kimlik doğrulama akışları, orkestrasyon motoru ve Scribe ajanının temel akışı kurgulanmıştır. İkinci dönemde (BLM402) ise; üç ajanın golden path akışları tamamlanmış, staging ortamı (`staging.akisflow.com`) canlıya alınmış, 1.391 test senaryosu yazılmış, gerçek zamanlı ajan yürütme arayüzü (Live Agent Canvas) geliştirilmiş, güven puanlama ve bağlam paketleri mekanizmaları eklenmiş ve 15 dakikalık pilot demo senaryosu hazırlanmıştır.

Bu süreçte sağladığı değerli yönlendirmeler ve katkıları için proje danışmanımız Dr. Öğr. Üyesi Nazlı DOĞAN'a teşekkür ederiz.

Saygılarımızla,

Ömer Yasir Önal — Şubat 2026

---

## ÖZET

**AKIS PLATFORMU: LLM TABANLI AJANLAR İLE ETKİLEŞİMLİ YAZILIM GELİŞTİRME VE YÖNETİŞİM SİSTEMİ**

Bu rapor, AKIS Platformu'nun çözüm tasarımını, uygulama detaylarını ve değerlendirme sonuçlarını sunmaktadır. AKIS; yazılım geliştirme yaşam döngüsünde (SDLC) tekrarlayan ve düşük katma değerli işleri azaltmayı hedefleyen, LLM tabanlı ajanlar üzerinden etkileşimli çalışan bir yazılım platformu prototipidir.

Platform; modüler monolit bir backend (Fastify + TypeScript) ve bağımsız bir SPA frontend (React + Vite) yaklaşımıyla tasarlanmış, job yürütme sonuçlarını, iz kayıtlarını ve üretilen artefaktları PostgreSQL üzerinde Drizzle ile kalıcılaştırmıştır. Sistem; dokümantasyon güncelleme (AKIS Scribe), test otomasyonu üretimi (AKIS Trace) ve gereksinimlerden çalışan prototip çıkarma (AKIS Proto) fonksiyonlarını tek bir orkestrasyon çekirdeği altında birleştirir.

Proje süresince; AgentOrchestrator çekirdeği ve job yaşam döngüsü durum makinesi oluşturulmuş; çok adımlı kayıt/giriş ve e-posta doğrulama akışları ile GitHub/Google OAuth entegrasyonları tamamlanmış; üç ajanın golden path akışları staging ortamında doğrulanmış; 1.391 test senaryosu (842 backend + 549 frontend) yazılmış; gerçek zamanlı ajan yürütme görselleştirmesi (Live Agent Canvas), güven puanlama (TrustScoringService), bağlam paketleri (Context Packs) ve sesli komut (Push-to-Talk) özellikleri eklenmiştir. Platform, Oracle Cloud Infrastructure (OCI) Ücretsiz Sürüm üzerinde `staging.akisflow.com` adresinde canlı olarak çalışmaktadır.

Tasarım; doğrulanabilirlik (iz ve artefakt kaydı), güvenlik kontrolleri (oran sınırlama, güvenli oturum çerezi), düşük bağımlılık ve sınırlı kaynaklı bulut ortamlarında çalışabilirlik hedefleri etrafında şekillendirilmiştir.

**Anahtar Kelimeler:** LLM, otonom ajanlar, yazılım mühendisliği, orkestrasyon, MCP, dokümantasyon otomasyonu, test üretimi, prototipleme

---

## SUMMARY

**AKIS PLATFORM: INTERACTIVE SOFTWARE DEVELOPMENT AND GOVERNANCE SYSTEM WITH LLM-BASED AGENTS**

This report presents the solution design, implementation details, and evaluation results of the AKIS Platform — an interactive LLM-agent–based software delivery assistant. The platform aims to reduce repetitive SDLC activities such as documentation generation, test automation, trace/log inspection, and standardized integrations with external developer tools.

AKIS is designed as a modular monolith backend (Fastify + TypeScript) with a decoupled SPA frontend (React + Vite), and persists jobs, traces, and artifacts in PostgreSQL via Drizzle. The platform unifies documentation updates (AKIS Scribe), test automation generation (AKIS Trace), and requirements-driven prototyping (AKIS Proto) under a single orchestration core.

During the project lifecycle, the orchestration kernel (AgentOrchestrator) and job lifecycle state machine were established; multi-step authentication flows with GitHub/Google OAuth were completed; golden paths for all three agents were validated on staging; 1,391 test scenarios (842 backend + 549 frontend) were written; real-time agent execution visualization (Live Agent Canvas), trust scoring (TrustScoringService), context packs, and push-to-talk voice input features were implemented. The platform is deployed live on Oracle Cloud Infrastructure (OCI) Free Tier at `staging.akisflow.com`.

The architecture prioritizes auditability, security controls (rate limiting, secure session cookies), low dependencies, and resource efficiency for constrained cloud environments.

**Keywords:** LLM, autonomous agents, software engineering, orchestration, MCP, documentation automation, test generation, prototyping

---

## ŞEKİL LİSTESİ

| No | Açıklama |
|----|----------|
| Şekil 3.1 | AKIS Platformu genel mimari bileşenleri (backend–frontend–veritabanı–MCP entegrasyonları) |
| Şekil 3.2 | Job yaşam döngüsü durum makinesi (FSM) |
| Şekil 3.3 | Planla-Yürüt-Değerlendir (PER) pipeline akışı |
| Şekil 3.4 | MCP Gateway ve adaptör mimarisi |
| Şekil 3.5 | Varlık-ilişki (ER) diyagramı — temel tablolar |
| Şekil 3.6 | Frontend bilgi mimarisi ve ekran akışları |
| Şekil 3.7 | OCI dağıtım topolojisi (Caddy + Docker Compose) |
| Şekil 4.1 | Proje fazları zaman çizelgesi (Kasım 2025 – Şubat 2026) |
| Şekil 4.2 | Test dağılımı (backend vs. frontend, birim vs. entegrasyon vs. E2E) |
| Şekil 4.3 | Live Agent Canvas ekran görüntüsü |

---

## TABLO LİSTESİ

| No | Açıklama |
|----|----------|
| Tablo 1.1 | Terimler ve kısaltmalar |
| Tablo 2.1 | Araştırma anahtar kelimeleri ve veri tabanları |
| Tablo 2.2 | Karşılaştırmalı analiz — AKIS vs. mevcut yaklaşımlar |
| Tablo 3.1 | Fonksiyonel gereksinimler (FR) özeti |
| Tablo 3.2 | Fonksiyonel olmayan gereksinimler (NFR) özeti |
| Tablo 3.3 | Veritabanı tabloları ve amaçları |
| Tablo 3.4 | API uç noktaları özeti |
| Tablo 3.5 | Teknoloji yığını ve seçim gerekçeleri |
| Tablo 4.1 | Proje fazları ve tamamlanma durumu |
| Tablo 4.2 | Test metrikleri özeti |
| Tablo 4.3 | M1 tamamlanma kriterleri ve durumları |
| Tablo 5.1 | Hedefler (H1–H6) ile elde edilen sonuçlar |

---

## 1. GİRİŞ

### 1.1 Problem Tanımı ve Motivasyon

Günümüz yazılım geliştirme süreçleri (Software Development Life Cycle — SDLC), artan kod tabanı karmaşıklığı, sık değişen gereksinimler ve hızlanan teslim beklentileri nedeniyle ekipler için ciddi operasyonel yükler doğurmaktadır. Bu projede, yazılım ekiplerinin verimliliğini düşüren ve maliyetlerini artıran üç ana problem alanı hedeflenmiştir:

**Eskimiş Dokümantasyon:** Yazılım projelerinde kod tabanı dinamik olarak değişirken, bu değişikliklerin teknik dokümantasyona (örneğin Confluence) yansıtılması manuel bir süreçtir ve sıklıkla gecikmektedir. Bu durum, dokümanların hızla güncelliğini yitirmesine, bilgi güvenilirliğinin azalmasına ve özellikle ekip içinde yeni katılan geliştiricilerin adaptasyon (onboarding) sürecinin uzamasına yol açmaktadır.

**Yüksek Test Otomasyon Maliyeti:** Kalite güvencesi (QA) süreçlerinde, manuel olarak hazırlanan test senaryolarının otomasyon kodlarına (örneğin Cucumber) dönüştürülmesi yoğun zaman ve efor gerektirir. Bu yüksek maliyet, test kapsamının daralmasına, test süresinin uzamasına ve yazılımın güvenilirliğinin azalmasına neden olmaktadır.

**Yavaş MVP Prototipleme:** Yeni iş fikirleri veya özelliklerin, en temel çalışan prototipe (Minimum Viable Product — MVP) dönüştürülmesi analiz, tasarım, kodlama ve test süreçlerinin manuel yürütülmesi nedeniyle günler hatta haftalar sürebilmektedir. Bu yavaşlık, kurumların pazara yenilikleri hızlı sunma ve geri bildirim alma yeteneğini azaltmakta; sonuç olarak rekabet gücü düşmektedir.

AKIS Platformu; tekrarlayan ve düşük katma değerli SDLC görevlerini LLM tabanlı ajanlar üzerinden otomatikleştirerek, ekiplerin yüksek katma değerli mühendislik kararlarına ve ürün geliştirme faaliyetlerine odaklanmasını amaçlar. Platform; dokümantasyon güncelleme (AKIS Scribe), test otomasyonu üretimi (AKIS Trace) ve gereksinimlerden çalışan prototip çıkarma (AKIS Proto) fonksiyonlarını tek bir orkestrasyon çekirdeği altında birleştirir.

### 1.2 Projenin Amacı ve Hedefleri

Bu projenin amacı, yazılım geliştirme ekiplerine tekrarlayan görevlerden kurtulma imkânı sağlayarak "zamanı geri kazandırmak" ve ekiplerin yüksek katma değerli işlere odaklanmasına imkân tanımaktır. Bu doğrultuda belirlenen somut hedefler:

- **H1.** Otonom ajanların görev akışlarını koordine eden ve kullanıcıya web tabanlı bir yönetim arayüzü sunan modüler sistem altyapısını geliştirmek.
- **H2.** Yazılım geliştirme sürecindeki mevcut araçları (GitHub, Jira, Confluence) değiştirmeden entegre şekilde çalışabilen güvenli API bağlantılarını sağlamak.
- **H3.** Teknik dokümantasyonları güncelleyebilen (AKIS Scribe), otomasyon test kodları üretebilen (AKIS Trace) ve verilen gereksinimlerden çalışan prototipler çıkarabilen (AKIS Proto) üç otonom ajanı tasarlayıp hayata geçirmek.
- **H4.** Platformun çıktı kalitesini ölçmek için izleme altyapısını (iz kaydı, kalite puanlama, güven metrikleri) oluşturmak.
- **H5.** Platformun yüksek güvenlik, kalite güvencesi ve yönetişim standartlarına uygunluğunu sağlamak amacıyla DoD kontrol listesi, guard-rails ve hata yönetimi süreçlerini uygulamak.
- **H6.** Akademik ve endüstriyel paydaşlara sunulmak üzere, çalışan prototip, kullanıcı dokümantasyonu, demo videosu ve akademik raporu teslim etmek.

### 1.3 Projenin Kapsamı

AKIS Platformu, tek repo içinde modüler monolit bir backend ve bağımsız bir SPA frontend yaklaşımıyla tasarlanmıştır. Sistem; ajan yürütme yaşam döngüsünü yöneten merkezi bir düzenleyici (AgentOrchestrator), ajan implementasyonları ve harici sistemlere bağlanan MCP adaptör katmanından oluşur. Dağıtım hedefi, Oracle Cloud Infrastructure (OCI) Ücretsiz Sürüm kaynakları üzerinde düşük bağımlılıkla çalışabilen bir prototiptir.

**Kapsama dahil olan ana bileşenler:**

- **Platform çekirdeği:** Job oluşturma ve izleme, durum yönetimi, log ve iz kaydı, çıktı (artefakt) saklama, gerçek zamanlı olay akışı (SSE).
- **Ajanlar:** AKIS Scribe (dokümantasyon), AKIS Trace (test planı ve otomasyon), AKIS Proto (MVP prototipleme) için işlevsellik ve yapılandırma parametreleri.
- **Entegrasyonlar:** GitHub/Jira/Confluence gibi sistemlere Model Context Protocol (MCP) adaptörleri üzerinden erişim.
- **Kimlik doğrulama ve onboarding:** E-posta tabanlı çok adımlı kayıt/giriş akışları, GitHub/Google OAuth, stateless JWT oturumu.
- **Ajan UI/UX:** Live Agent Canvas (gerçek zamanlı yürütme görselleştirmesi), güven puanlama, sesli komut, ajan ayarları.
- **Akademik çıktılar:** Mimari açıklamalar, literatür araştırması ve proje rapor seti.

**Kapsam dışı tutulan unsurlar:**

- Kodsuz/düşük kodlu ajan geliştirme sihirbazları
- Kurumsal ölçekte gelişmiş RBAC ve on-premise dağıtım
- Kubernetes tabanlı dağıtım ve kapsamlı kurumsal CI/CD
- Ödeme/faturalandırma modülleri
- Ek ajan türleri (code review, refactoring ajanları)
- Derin çift yönlü entegrasyonlar (Slack, Teams, VS Code eklentileri)

### 1.4 Terimler ve Kısaltmalar

**Tablo 1.1:** Terimler ve kısaltmalar

| Terim | Açıklama |
|-------|----------|
| AKIS | LLM tabanlı ajanlar ile etkileşimli yazılım geliştirme platformu |
| LLM | Large Language Model (Büyük Dil Modeli) |
| MCP | Model Context Protocol; harici sistemlere standartlaştırılmış bağlanma katmanı |
| OCI | Oracle Cloud Infrastructure |
| JWT | JSON Web Token; HTTP-only cookie üzerinden stateless oturum |
| SDLC | Software Development Life Cycle (Yazılım Geliştirme Yaşam Döngüsü) |
| FSM | Finite State Machine (Sonlu Durum Makinesi) |
| SSE | Server-Sent Events; gerçek zamanlı tek yönlü olay akışı |
| PER | Plan-Execute-Reflect; ajan yürütme pipeline'ı |
| CoT | Chain-of-Thought; adım adım akıl yürütme stratejisi |
| ReAct | Reasoning + Acting; düşünme ve eylem birleştirme çerçevesi |
| SPA | Single Page Application; tek sayfa uygulama |
| DoD | Definition of Done; "Bitti" tanımı kontrol listesi |
| WSJF | Weighted Shortest Job First; iş önceliklendirme yöntemi |

---

## 2. İLGİLİ ÇALIŞMALAR / LİTERATÜR ARAŞTIRMASI

### 2.1 Araştırma Metodolojisi

Bu çalışmada, yazılım mühendisliği süreçlerinde büyük dil modelleri (LLM), otonom ajanlar, çoklu ajan sistemleri, test otomasyonu, dokümantasyon üretimi, ajan UI/UX tasarımı ve bilgi edinimi/doğrulama gibi alanlarda yayımlanmış güncel araştırmalar sistematik olarak incelenmiştir.

Tarama; IEEE Xplore, ACM Digital Library, ScienceDirect, SpringerLink ve Google Scholar veri tabanlarında, 2020–2026 aralığındaki hakemli çalışmalarla sınırlandırılmıştır. Özellikle bilgisayar mühendisliği ve yapay zekâ alanında A/A* sınıfı olarak kabul edilen ICSE, ASE, MSR, FSE, TSE, NeurIPS, ICLR, ACL, CHI, UIST, EMNLP ve CSCW gibi prestijli organizasyonlarda yayımlanmış çalışmalar tercih edilmiştir.

**Tablo 2.1:** Araştırma anahtar kelimeleri

| Anahtar Kelime | Kapsam |
|----------------|--------|
| Autonomous Agents in Software Engineering | Otonom ajanların görev planlama ve araç etkileşimi |
| LLM-powered Software Development | Kod üretimi, hata giderme, test ve dokümantasyon |
| Automated Documentation Generation | Koddan veya gereksinimlerden otomatik dokümantasyon |
| AI-assisted Test Generation and Bug Fixing | Yapay zekâ ile test senaryosu üretimi ve hata düzeltme |
| Multi-Agent LLM Systems | Çoklu ajan işbirliği, iletişim protokolleri, görev dağılımı |
| Reasoning Frameworks for LLM Agents | ReAct, CoT, ToT gibi akıl yürütme stratejileri |
| Real-Time Agent UI/UX | Ajan yürütme görselleştirmesi, şeffaflık, güven kalibrasyonu |
| Knowledge Acquisition and Verification | Bilgi edinimi, doğrulama, atıf farkındalığı |

Bulgular; otonom ajan mimarileri, dokümantasyon üretimi, test üretimi, akıl yürütme stratejileri, temel model altyapısı, ajan arayüzleri ve bilgi edinimi başlıkları altında sınıflandırılarak sentezlenmiştir.

### 2.2 Otonom ve Çoklu LLM Ajan Sistemleri

Son yıllarda LLM tabanlı ajan mimarileri, yazılım geliştirme süreçlerini otomatikleştirmek amacıyla yoğun şekilde araştırılmıştır.

Suri vd. (2023) *"Software Engineering Using Autonomous Agents: Are We There Yet?"* çalışması, otonom yazılım ajanlarının mevcut yeteneklerini değerlendirmekte ve yazılım geliştirme görevlerini bağımsız şekilde yerine getirebilme potansiyelini incelemektedir [1]. Çalışmada, LLM destekli ajanların kod yazma, hata tespiti ve planlama gibi görevlerde insan girdisi olmadan hareket edebildiği gösterilmiştir. Bu sonuçlar, AKIS Proto ajanının gereksinim–tasarım–kod–test akışını otomatikleştirme yaklaşımıyla uyumludur.

Bouzenia vd. (2025) *RepairAgent* çalışması, otonom bir LLM ajanının hata giderme sürecini planlama, araç çağırma, kod analizi ve çözüm üretme adımlarını içeren bir durum makinesi üzerinden gerçekleştirebildiğini ortaya koymuştur [2]. ICSE düzeyindeki bu çalışma, Proto ajanının araç etkileşimi (tool-use) ve planlama bileşenleri için güçlü bir teorik dayanak sunmaktadır.

He vd. (2025) tarafından yayımlanan *"LLM-Based Multi-Agent Systems for Software Engineering"* çalışması, çoklu ajanların yazılım geliştirme döngüsündeki rolünü sistematik olarak incelemiş ve görev paylaşımı, işbirliği, koordinasyon ve karar verme süreçlerinin LLM'ler ile nasıl modellenebileceğini açıklamıştır [3]. Bu çalışma, AKIS platformunun çoklu ajan yaklaşımıyla doğrudan örtüşmektedir.

Yang vd. (2024) *SWE-Agent* çalışması, NeurIPS 2024'te sunulmuş ve bir LLM ajanının gerçek GitHub depoları üzerinde dosya düzenleme, test çalıştırma, hata tespiti ve düzeltme gibi görevleri otonom olarak gerçekleştirebildiğini göstermiştir [4]. Bu çalışma, AKIS Proto ve Trace ajanlarının test çalıştırma ve kod düzenleme gibi araç tabanlı işlemlerine bilimsel arka plan oluşturmaktadır.

Li vd. (2023) *CAMEL* çalışması, LLM ajanlarının farklı rollere ayrılarak birlikte hedef odaklı çalışabildiğini göstermiştir [5]. Bu çalışma, AKIS platformundaki ajanlar arası etkileşim, görev devri ve çoklu ajan senaryoları için önemli bir referans niteliğindedir.

### 2.3 LLM Tabanlı Otomatik Dokümantasyon Üretimi

Otomatik dokümantasyon üretimi, yazılım mühendisliğinde LLM'lerin en hızlı değer yaratan kullanım alanlarından biridir.

Khan ve Uddin (2023), GPT-3 tabanlı otomatik kod dokümantasyonu yaklaşımını incelemiş ve modelin fonksiyon seviyesinde tutarlı açıklamalar üretebildiğini göstermiştir [6]. Bu çalışma, AKIS Scribe ajanının kod tabanlı dokümantasyon üretme yeteneği için erken dönem bir temel sunmaktadır.

Dvivedi vd. (2024), büyük dil modellerinin (GPT-4, PaLM, LLaMA vb.) dokümantasyon üretimindeki kalite farklarını karşılaştırmış ve farklı modellerin okunabilirlik, doğruluk ve kapsam açısından değişken performans gösterdiğini ortaya koymuştur [7]. Bu sonuçlar, AKIS Scribe'ın model seçimi ve kalite değerlendirme yaklaşımını desteklemektedir.

Yang vd. (2025) *DocAgent* çalışması, ACL 2025 Demo Track kapsamında sunulmuş ve çoklu ajan yapısında kod dokümantasyonu oluşturmanın dokümantasyon kalitesini yükselttiğini göstermiştir [8]. DocAgent, AKIS Scribe'ın çoklu ajan tasarımına birebir paralel bir sistem olarak literatürdeki en yakın çalışma niteliğindedir.

### 2.4 LLM Tabanlı Test Üretimi ve Hata Giderme

LLM tabanlı test otomasyonu son yıllarda önemli bir araştırma alanı hâline gelmiştir.

Wang vd. (2024) IEEE TSE'de yayımlanan kapsamlı incelemesi, LLM'lerin test senaryosu oluşturma, sınır durumu keşfetme, hata tahmini ve test veri üretme gibi görevlerde giderek artan doğrulukla kullanılabildiğini göstermektedir [9]. Bu çalışma, AKIS Trace'ın test oluşturma ve doğrulama adımlarının bilimsel temelini oluşturmaktadır.

Bhatia vd. (2024), farklı LLM araçlarının ürettiği birim testlerin performansını karşılaştırarak üretken test araçlarının doğruluk, kapsam ve çalıştırılabilirlik bakımından önemli farklar gösterdiğini ortaya koymuştur [10]. Bu çalışma, Trace ajanının ürettiği testleri değerlendirme süreci için önemli bir referanstır.

Tony vd. (2023) *LLMSecEval* çalışması, doğal dil prompt'larından oluşan güvenlik değerlendirme veri seti sunmakta ve LLM tabanlı araçların güvenlik odaklı davranışlarını anlamayı amaçlamaktadır [11]. Bu çalışma, AKIS platformunda güvenilirlik ve guardrail mekanizmaları açısından önemli bir katkı sağlar.

Mündler vd. (2024) *SWT-Bench* çalışması, LLM tabanlı kod ajanlarının gerçek dünyadaki hata düzeltme işlemlerini test etmek için tasarlanmıştır [12]. Bu çalışma, AKIS Proto'nun hata düzeltme ve doğrulama döngüsüne doğrudan paralel olması nedeniyle literatürdeki en güçlü benzetimli karşılaştırmalardan biridir.

Geleneksel arama tabanlı yazılım testi (SBST) araçları — EvoSuite (Fraser & Arcuri, 2011) ve Randoop (Pacheco & Ernst, 2007) gibi — genetik algoritmalar veya rastgele test üretimi ile yapısal kapsam sağlarken, LLM tabanlı yaklaşımlar semantik anlam ve iş gereksinimlerini de kapsayan testler üretebilmektedir [16]. AKIS Trace ajanı, bu dönüşümü gerçekleştirerek gereksinimlerden anlamlı test planları çıkarmayı hedefler.

### 2.5 LLM Tabanlı Akıl Yürütme Stratejileri

LLM tabanlı ajanların karar verme, görev planlama ve araç kullanma yeteneklerinin temelinde çeşitli akıl yürütme (reasoning) stratejileri yer almaktadır.

**ReAct (Reason+Act):** Yao vd. (2023), dil modellerinin düşünme adımlarını (reasoning traces) eylemlerle birleştirerek çevrimiçi karar almasını sağlayan bir yapı sunmuştur [13]. Bu yaklaşım, çok adımlı görevlerde modelin bağlamı daha etkili değerlendirmesine olanak tanır ve AKIS ajanlarının planlama–yürütme döngüsünün temelini oluşturur.

**Chain-of-Thought (CoT) ve Self-Consistency:** Wang vd. (2023), LLM'lerin karmaşık akıl yürütme görevlerinde daha tutarlı ve güvenilir sonuçlar üretmesini sağlayan self-consistency tekniğini sunmuştur [14]. Bu teknik, AKIS ajanlarının planlama aşamasında çıktı kalitesini artırmak için uygulanmaktadır.

**Tree-of-Thoughts (ToT):** Yao vd. (2023), çoklu akıl yürütme yollarını keşfederek problem çözme sürecini dallanma-arama stratejileriyle genişleten bir yöntem önermiştir [15]. Bu yaklaşım, Proto ajanının karmaşık prototipleme görevlerinde daha yüksek başarı oranı elde etmesini sağlamak için değerlendirilmektedir.

Bu yaklaşımlar, AKIS platformundaki ajanların görev planlama, durum analizi ve araç etkileşimi bileşenlerine teorik bir çerçeve sunmakta ve sistemin çok adımlı görevlerde daha kararlı çalışmasına katkıda bulunmaktadır.

### 2.6 Temel Modeller ve Yazılım Mühendisliği Altyapısı

Modern yapay zekâ destekli yazılım mühendisliği sistemleri, ortak bir mimari desen paylaşır: genel zekâ sağlayan bir **temel model katmanı** (GPT-4, Claude, Gemini, Llama) ve bu zekâyı belirli yazılım mühendisliği görevlerine yönlendiren bir **mühendislik orkestrasyon katmanı** [17].

Chen vd. (2021) Codex çalışması, LLM'lerin doğal dil tanımlamalarından programlama problemlerini çözebildiğini ilk kez göstermiş ve HumanEval benchmark metodolojisini oluşturmuştur [18]. DeepSeek-Coder (Guo vd., 2024), açık kaynaklı kod LLM'lerinin kapalı modellerin performansına yaklaştığını göstermiştir [19]. StarCoder2 (Lozhkov vd., 2024), veri kalitesi ve lisanslama şeffaflığının üretim dağıtımı için önemini ortaya koymuştur [20].

Bu katmanlı ayrım, güçlü bir özellik yaratır: **temel modeller geliştikçe, orkestrasyon katmanı mimari değişiklik olmaksızın otomatik olarak faydalanır**. AKIS Platformu, OpenRouter üzerinden çoklu model desteği ile bu provider-agnostic mimariyi benimser.

Schick vd. (2023) *Toolformer* çalışması, LLM'lerin harici API'leri çağırmayı ve sonuçları yorumlamayı öğrenebildiğini göstermiştir [21]. Patil vd. (2023) *Gorilla* çalışması ise, LLM'lerin API çağrılarında halüsinasyonu azaltmak için dokümantasyon-farkında eğitimin etkisini ortaya koymuştur [22]. Bu çalışmalar, AKIS'in MCP adaptör katmanı üzerinden araç kullanımı tasarımını destekler.

### 2.7 Ajan UI/UX: Şeffaflık, Güven Kalibrasyonu ve Gerçek Zamanlı Arayüzler

Modern yapay zekâ ajanları karmaşık çok adımlı görevleri otonom olarak yürütürken, iç mekanizmaları kullanıcılar için opak kalmaktadır. Bu durum kritik bir kullanıcı deneyimi sorunu yaratır: kullanıcıya ajanın **ne yaptığı**, **neden belirli kararlar aldığı** ve **ne kadar güvenilir olduğu** gerçek zamanlı ve aşırı bilgi yükü olmadan nasıl gösterilir?

Lee vd. (2022) *CoAuthor* çalışması, LLM üretim sürecini kullanıcılara görünür kılan ve ortak yazarlık metaforu kullanan bir arayüz sunmuştur. CHI düzeyindeki bu çalışma, süreç şeffaflığının kullanıcı güvenini artırdığını ve aşırı güven (overtrust) riskini azalttığını göstermiştir [23].

Vasconcelos vd. (2023), yapay zekâ sistemlerinde açıklama kalitesinin kullanıcı güven kalibrasyonu üzerindeki etkisini incelemiştir. Bulgular, **kötü açıklamaların** açıklama olmamasından daha tehlikeli olabileceğini göstermektedir [24]. Bu sonuç, AKIS'in Live Agent Canvas tasarımında "açıklama kalitesi > açıklama miktarı" prensibini benimsemesine yol açmıştır.

Jiang vd. (2023) *GenLine* ve *GenForm* çalışmaları, generatif yapay zekâ arayüzlerinde sohbet tabanlı etkileşim yerine doğrudan manipülasyon paradigmalarının daha verimli olabileceğini göstermiştir [25]. AKIS'in ajan konsol ekranları, bu prensipleri görev izleme panelleri ve yapılandırma çekmecelerine uygular.

### 2.8 Bilgi Edinimi, Doğrulama ve Atıf Farkındalığı

Yazılım artefaktları (dokümantasyon, test planı, kod iskeleti) üreten yapay zekâ ajanları, temel bir güvenilirlik sorunuyla karşı karşıyadır: çıktılarına gömülü bilginin **doğru, güncel ve meşru kaynaklara izlenebilir** olması gerekmektedir.

Gao vd. (2023) *ALCE* çalışması, üretimsel dil modellerinde atıf kalitesini değerlendirmek için kapsamlı bir benchmark sunmuştur [26]. Lewis vd. (2020) *RAG (Retrieval-Augmented Generation)* çalışması, bilgi-yoğun görevlerde harici bilgi kaynakları ile üretimi birleştiren mimariyi tanıtmıştır [27]. Bu yaklaşımlar, AKIS'in bağlam paketleri (Context Packs) mekanizmasının — sürümlü, seçilebilir ve denetlenebilir bilgi paketleri — tasarım temelini oluşturur.

EU DSM Direktifi (2019/790) ve Türk KVKK (6698 sayılı Kanun) kapsamındaki yasal çerçeve, bilgi edinimi sistemlerinin kaynak izleme (provenance), robots.txt/TDM başlık kontrolü, atıf üretimi ve denetim izi gereksinimleri belirlemiştir. AKIS'in bağlam paketleri, bu gereksinimleri `packId`, `packVersion`, `profile` ve `source` metadata alanları ile karşılar.

### 2.9 Karşılaştırmalı Analiz ve AKIS'in Katkısı

İncelenen çalışmalar bütüncül olarak değerlendirildiğinde, mevcut yaklaşımların büyük çoğunluğunun tekil görev odaklı olduğu görülmektedir: RepairAgent yalnızca hata düzeltme [2], DocAgent yalnızca dokümantasyon oluşturma [8], SWE-Agent belirli senaryolarda tek ajan yürütme [4] üzerine yoğunlaşmıştır.

**Tablo 2.2:** Karşılaştırmalı analiz — AKIS vs. mevcut yaklaşımlar

| Özellik | SWE-Agent | RepairAgent | DocAgent | CAMEL | AKIS |
|---------|-----------|-------------|----------|-------|------|
| Çoklu ajan desteği | Hayır | Hayır | Evet | Evet | **Evet (3 ajan)** |
| Dokümantasyon üretimi | Hayır | Hayır | Evet | Hayır | **Evet (Scribe)** |
| Test üretimi | Kısmi | Hayır | Hayır | Hayır | **Evet (Trace)** |
| Prototipleme | Hayır | Hayır | Hayır | Hayır | **Evet (Proto)** |
| Plan-Execute-Reflect | Kısmi | Evet | Hayır | Hayır | **Evet** |
| Gerçek araç entegrasyonu | GitHub | GitHub | Hayır | Hayır | **GitHub/Jira/Confluence (MCP)** |
| Denetlenebilir iz kaydı | Kısmi | Kısmi | Hayır | Hayır | **Tam (job_traces)** |
| Canlı UI görselleştirme | Hayır | Hayır | Hayır | Hayır | **Evet (Live Agent Canvas)** |
| Güven puanlama | Hayır | Hayır | Hayır | Hayır | **Evet (TrustScoring)** |
| Kaynak kısıtlı dağıtım | Hayır | Hayır | Hayır | Hayır | **Evet (OCI Free Tier)** |

AKIS platformu, literatürdeki tekil çözümlerden farklı olarak dokümantasyon, test, prototipleme, araç entegrasyonu, agent orchestration, gerçek zamanlı UI görselleştirmesi ve kalite kontrolünü tek bir sistemde birleştirerek çok yönlü bir katkı sunmaktadır.

### 2.10 Literatürdeki Boşluk

Literatür incelemesi sonucunda şu boşluklar tespit edilmiştir:

1. **Uçtan uca SDLC kapsayan çok ajanlı LLM sistemi eksiktir.** Mevcut çalışmalar ya sadece kod üretimi [4], ya sadece dokümantasyon [6, 8] ya da sadece hata giderme [2] odaklıdır. Tam bir yazılım yaşam döngüsünü kontrol eden bütünleşik bir mimari sunulmamıştır.

2. **Dokümantasyon–test–prototipleme üçlüsünü entegre eden bir platform bulunmamaktadır.** Literatürde test otomasyonu [9, 10] ve dokümantasyon [6, 7] ayrı başlıklarda güçlüdür ancak bu araçların birlikte çalıştığı bir yapı yoktur.

3. **Kurumsal araçlarla (GitHub, Jira, Confluence) entegre çalışan bir LLM ajan mimarisi eksiktir.** Çoğu çalışma laboratuvar ortamı veya sentetik benchmark'lardan oluşmakta, gerçek proje ortamını ele almamaktadır.

4. **Ajan yürütme sürecini gerçek zamanlı olarak görselleştiren ve güven kalibrasyonu sağlayan ajan arayüzleri yetersizdir.** Mevcut araştırma, ajan iç durumunun kullanıcıya şeffaf iletilmesi konusunda sınırlı kalmaktadır.

5. **Kaynak kısıtlı ortamlarda (OCI Free Tier gibi) çalışabilen, akademik değerlendirmeye uygun bir LLM ajan platformu mevcut değildir.**

Bu eksiklikler, AKIS'in tasarımını haklı kılmakta ve sunulan platformun literatüre katkısını açıkça göstermektedir.

---

## 3. ÇÖZÜM YÖNTEMLERİ

### 3.1 Genel Mimari Bakış

AKIS Platformu, tek repo içinde modüler monolit bir backend ve bağımsız bir SPA frontend yaklaşımıyla tasarlanmıştır. Backend; API katmanı, çekirdek orkestrasyon (AgentOrchestrator), ajan implementasyonları ve servis/adaptör katmanları olarak ayrıştırılmıştır. Frontend; kullanıcı onboarding akışları, ajan konfigürasyonu, job çalıştırma/izleme ekranları ve gerçek zamanlı ajan yürütme görselleştirmesinden oluşur.

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite SPA)            │
│  Auth Wizard │ Dashboard │ Agent Consoles │ Job Detail   │
│  Live Agent Canvas │ Settings │ Feedback │ Docs          │
├─────────────────────────────────────────────────────────┤
│                REST API + SSE (Fastify)                   │
├─────────────────────────────────────────────────────────┤
│                 BACKEND (Modüler Monolit)                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │  Auth    │ │ Agent    │ │ Services │ │ Events   │    │
│ │ Service  │ │Orchestr. │ │ (AI,MCP) │ │ (SSE)    │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Scribe   │ │ Trace    │ │ Proto    │ │ Quality  │    │
│ │ Agent    │ │ Agent    │ │ Agent    │ │ Scoring  │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────┤
│              PostgreSQL (Drizzle ORM)                     │
│ users │ jobs │ job_traces │ job_artifacts │ agent_configs │
│ job_plans │ oauth_accounts │ email_verification_tokens    │
│ conversation_threads │ plan_candidates │ trust_snapshots  │
└─────────────────────────────────────────────────────────┘
         │
┌────────┴────────────────┐
│    MCP Gateway           │
│ ┌─────┐ ┌─────┐ ┌─────┐│
│ │GitHub│ │Jira │ │Confl.││
│ │Adapt.│ │Adapt│ │Adapt.││
│ └─────┘ └─────┘ └─────┘│
└─────────────────────────┘
```

**Şekil 3.1:** AKIS Platformu genel mimari bileşenleri

**Tablo 3.5:** Teknoloji yığını ve seçim gerekçeleri

| Kategori | Teknoloji | Seçim Gerekçesi |
|----------|-----------|-----------------|
| Çalışma Ortamı | Node.js 20.x | ARM64 desteği, verimli asenkron G/Ç |
| Backend | Fastify + TypeScript | Minimal yük, Express'ten ~2× hızlı, eklenti mimarisi |
| Veritabanı | PostgreSQL 16 | Güçlü ilişkisel veritabanı, aynı VM'de çalışabilir |
| ORM | Drizzle | TypeScript-native, 1.5MB (Prisma'nın 6.5MB'ına karşı) |
| Frontend | React 18+ (Vite SPA) | Hızlı geliştirme, optimize edilmiş üretim build'leri |
| Stil | Tailwind CSS | Utility-first, minimal çalışma zamanı yükü |
| Entegrasyon | MCP Adaptörleri | Standart protokol, vendor bağımlılığı ortadan kaldırır |
| AI Sağlayıcı | OpenRouter API | Tek API üzerinden çoklu ücretsiz LLM modeli erişimi |
| Doğrulama | Zod | Çalışma zamanı tip güvenliği, API girdi doğrulama |
| Loglama | Pino | Hafif, hızlı JSON logger |
| Paket Yöneticisi | pnpm | Verimli disk kullanımı, workspace desteği |
| Hosting | OCI Free Tier | ARM 4 OCPU, 24 GB RAM, ücretsiz |

### 3.2 Yapay Zekâ Ajanı İş Akışı Motoru

İş Akışı Motoru, platformun otonom ajan yürütmesini sağlayan temel mimari bileşenidir.

#### 3.2.1 Düzenleyici Deseni (Orchestrator Pattern)

Merkezi düzenleyici (AgentOrchestrator), ajan yaşam döngüsü yönetiminin tek sahibidir. İş akışı taleplerini alır, bir fabrika deseni (AgentFactory) aracılığıyla uygun ajanları başlatır, her yürütme için durum makinelerini yönetir ve araç enjeksiyonunu (MCP adaptörleri, AIService) koordine eder. Ajanlar **birbirini asla doğrudan çağırmaz**; tüm iletişim orchestrator üzerinden gerçekleşir.

Bu merkezi yaklaşım:
- Kaynak verimliliği sağlar (süreçler arası iletişim yükünü ortadan kaldırır)
- Merkezi durum yönetimi ve yönetişim (governance) imkânı tanır
- Hata izolasyonu ve kontrollü geri dönüş (rollback) destekler

#### 3.2.2 Ajan Fabrikası ve Kayıt Defteri

AgentFactory, ajan örneklemesi için fabrika deseni uygular. Ajanlar türe göre ("scribe", "trace", "proto") kaydedilir ve talep üzerine bağımlılıkları enjekte edilerek oluşturulur. Bu desen, modüler monolit mimarisiyle uyumlu, eklenti benzeri genişletilebilirlik sağlar.

#### 3.2.3 Ajan Durum Makinesi (FSM)

Her ajan yürütme işlemi bir sonlu durum makinesi (FSM) tarafından yönetilir:

```
pending → running → completed
                  → failed
                  → awaiting_approval → completed
                                      → failed
```

**Şekil 3.2:** Job yaşam döngüsü durum makinesi

FSM, geçerli durum geçişlerini zorunlu kılar ve tüm geçişleri `job_traces` tablosuna denetim izi olarak kaydeder. `StaleJobWatchdog` mekanizması, belirli süre içinde tamamlanmayan işleri tespit ederek `failed` durumuna taşır.

#### 3.2.4 Planla-Yürüt-Değerlendir (Plan-Execute-Reflect) Pipeline

Karmaşık ajanlar, üç aşamalı bir yürütme hattı kullanır:

1. **Planlama Aşaması (Plan):** Ajan, PlanGenerator AI aracıyla görevi analiz eder ve adımları içeren yapılandırılmış bir plan oluşturur. Plan, `job_plans` tablosunda Markdown ve JSON formatında saklanır.

2. **Yürütme Aşaması (Execute):** Ajan, enjekte edilen MCP araçlarını kullanarak planı adım adım çalıştırır. Her adım, `job_traces` tablosuna iz kaydı olarak eklenir.

3. **Değerlendirme Aşaması (Reflect):** Bir değerlendirici AI aracı, yürütme çıktısını eleştirir, sorunları tanımlar ve önerilerde bulunur. Kritik yollarda bu eleştiri/iyileştirme adımı zorunludur.

**Şekil 3.3:** PER pipeline akışı

#### 3.2.5 Ajan Tanımları

**AKIS Scribe — Otomatik Dokümantasyon Üretimi:**
- **Girdi:** GitHub deposu + branch + isteğe bağlı dosya desenleri
- **Çıktı:** Üretilen dokümantasyon dosyaları (Markdown), yeni branch'e commit
- **Golden Path:** Kullanıcı depo seçer → branch seçer → "Run Scribe" → ajan kodu analiz eder → dokümantasyon üretir → PR oluşturur
- **AGT-8 Derin Analiz:** 10 fazlı uygulama — recursive repo scan (3 seviye, 150 dosya), auto-detect doc pack, granular chat events, DocScope/DocDepth UI

**AKIS Trace — Test Planı ve Otomasyon Üretimi:**
- **Girdi:** GitHub deposu + branch + hedef modül/dizin + kullanıcı tercihleri (testDepth, authScope, browserTarget, strictness)
- **Çıktı:** Test planı dokümanı (Markdown), test senaryoları, kapsam matrisi ve otomasyon önerileri
- **TraceAutomationRunner:** Gerçek Playwright yürütme motoru + JSON reporter parse ile feature-bazlı sonuç hesaplama

**AKIS Proto — Hızlı Prototipleme:**
- **Girdi:** GitHub deposu + branch + spesifikasyon/fikir açıklaması
- **Çıktı:** Prototip kod iskeleti, yeni branch'e commit
- **Golden Path:** Kullanıcı depo seçer → branch seçer → prototipi tanımlar → "Run Proto" → ajan iskelet üretir → PR oluşturur

### 3.3 Ajan Sözleşmeleri ve İş Şablonları

#### 3.3.1 İş Şablonları (Playbooks)

Bir iş şablonu (AgentPlaybook), bir ajanın yürütme sırasında izlemesi gereken eylem sırasını tanımlar. Strateji (Strategy) ve Komut (Command) desenlerini uygulayarak, adım tanımlarını, yeniden deneme mantığını ve yürütme sırasını kapsüller. Playbook determinizmi için `temp=0` ve sabit prompt sabitleri (`prompt-constants.ts`) kullanılır.

#### 3.3.2 Sözleşmeler (Contracts)

Ajan sözleşmeleri (AgentContract), ajan yürütmesi için girdi/çıktı şemalarını ve doğrulama kurallarını tanımlar. Çalışma zamanında tip güvenliğini zorlamak için Zod şemalarını kullanır. FACET-style şema doğrulama ile geçersiz çıktılar reddedilir ve yeniden deneme mekanizması tetiklenir.

#### 3.3.3 Yönetişim ve Korkuluklar

Orchestrator, ajan girdilerini sözleşmelere göre doğrular, iş şablonu adımlarını zorunlu kılar ve sözleşme şemalarını ihlal eden ajan çıktılarını reddeder. Bu model, H5 (yüksek güvenlik, kalite güvencesi ve yönetişim standartları) hedefiyle uyumludur.

### 3.4 MCP Entegrasyon Stratejisi

Harici sistem entegrasyonları, MCP (Model Context Protocol) adaptör katmanı üzerinden standartlaştırılmıştır. Bu yaklaşım:

- Farklı sağlayıcılar ile etkileşimde protokol çeşitliliğini tek bir sözleşme altında toplar
- Ajanın araç kullanımını daha güvenli ve izlenebilir hale getirir
- Vendor değişimlerine karşı dayanıklılığı artırır

**Şekil 3.4:** MCP Gateway ve adaptör mimarisi

MCP Gateway; harici sistemlerle (GitHub, Jira, Confluence) konuşan adaptörleri tek bir giriş noktası altında toplar. AgentOrchestrator, ajan adımlarında ihtiyaç duyduğu 'tool' çağrılarını bu gateway'e iletir; gateway ise ilgili adaptöre yönlendirerek standart bir yanıt formatı döndürür.

Mevcut adaptörler:
- **GitHubMCPService:** Depo erişimi, dosya okuma/yazma, commit/PR işlemleri
- **JiraMCPService:** Bilet ve gereksinim verisi çekme
- **ConfluenceMCPService:** Dokümantasyon sayfası okuma ve güncelleme

Entegrasyon anahtarları ve erişim belirteçleri çevresel değişkenler üzerinden yönetilir; log/iz kayıtlarında gizli değerlerin maskelemesi sağlanır.

### 3.5 Veri Modeli Tasarımı

**Tablo 3.3:** Veritabanı tabloları ve amaçları

| Tablo | Amaç |
|-------|------|
| `users` | Kullanıcı hesabı, doğrulama ve tercih alanları |
| `email_verification_tokens` | 6 haneli doğrulama kodları ve süre/kullanım durumu |
| `oauth_accounts` | OAuth sağlayıcı hesapları ve tokenları |
| `agent_configs` | Ajan başına kullanıcı konfigürasyonu (runtime profil, sıcaklık, komut seviyesi dahil) |
| `jobs` | Ajan işleri için ana kayıt; durum, tip, meta veriler, onay/ret bilgileri |
| `job_plans` | Planner çıktısı — Markdown ve JSON formatında plan adımları |
| `job_traces` | Ajan çalışma izleri, olay tipleri, süreler, araç kullanım detayları |
| `job_artifacts` | Üretilen dosyalar/çıktılar, SHA-256 hash, diff önizleme |
| `conversation_threads` | Çok turlu ajan konuşma oturumları |
| `conversation_messages` | Konuşma mesajları (kullanıcı + ajan) |
| `plan_candidates` | Ajan tarafından önerilen plan alternatifleri |
| `plan_candidate_builds` | Plan adaylarının derleme/test sonuçları |
| `thread_trust_snapshots` | Konuşma bazlı güven metrikleri anlık görüntüsü |
| `studio_sessions` | Agent Studio IDE oturumları |
| `feedback` | Kullanıcı geri bildirimleri |

Veri modeli; kullanıcı kimliği ve oturum yönetimi, ajan konfigürasyonlarının saklanması ve ajan job yürütmelerinin denetlenebilir şekilde kaydedilmesi üzerine kuruludur. Job kayıtları; plan, iz kaydı (trace), artefakt ve denetim (audit) varlıklarıyla ilişkili olarak tasarlanmıştır.

### 3.6 Kimlik Doğrulama ve Onboarding Akışları

Kimlik doğrulama iki ana kanal üzerinden sağlanır:

1. **E-posta + Şifre (Çok Adımlı):**
   - Kayıt: 5 adım (e-posta → şifre → ad → doğrulama → hoşgeldin)
   - Giriş: 2 adım (e-posta → şifre)
   - 6 haneli doğrulama kodu, 15 dakika süre, bcrypt hash, oran sınırlama

2. **OAuth (GitHub + Google):**
   - OAuth callback'leri staging alanında çalışır
   - Yeni OAuth kullanıcılarına hoşgeldin e-postası gönderilir

Oturum, HTTP-only cookie içinde stateless JWT ile yönetilir (`akis_session`, 7 gün). E-posta gönderimi Resend.com üzerinden sağlanır (`noreply@akisflow.com`, DKIM+SPF+DMARC doğrulanmış).

**Tablo 3.4:** API uç noktaları özeti

| Method | Path | Amaç |
|--------|------|------|
| GET | `/health`, `/ready`, `/version` | Sağlık kontrolleri ve sürüm |
| POST | `/auth/signup/start`, `/auth/signup/password`, `/auth/verify-email` | Kayıt ve doğrulama |
| POST | `/auth/login/start`, `/auth/login/complete`, `/auth/logout` | Giriş ve çıkış |
| GET | `/auth/me` | Mevcut kullanıcı oturumu |
| GET | `/auth/oauth/github/callback`, `/auth/oauth/google/callback` | OAuth callback'leri |
| POST/GET | `/api/agents/jobs` | Job oluşturma ve listeleme |
| GET | `/api/agents/jobs/:id` | Job detay (durum, plan, iz, artefakt) |
| GET | `/api/agents/jobs/:id/stream` | SSE olay akışı |
| POST | `/api/feedback` | Kullanıcı geri bildirimi |
| CRUD | `/api/conversations/*` | Konuşma thread yönetimi |

### 3.7 Frontend Tasarımı

Frontend, React + Vite tabanlı SPA olarak geliştirilmiş ve aşağıdaki ana ekranları içermektedir:

- **Kimlik Doğrulama Sihirbazı:** Çok adımlı kayıt, iki adımlı giriş, gizlilik onayı
- **Dashboard:** Getting Started kartı, ajan seçimi, hızlı erişim
- **Agent Consoles (Scribe/Trace/Proto):** Konfigürasyon paneli, depo seçimi, job başlatma
- **Agents Hub:** Kalıcı konuşma thread'leri, tür etiketi+ikon, AI kısa başlık üretimi
- **Job Detail:** Durum, plan, iz kayıtları, artefaktlar, kalite puanı, revizyon bilgisi
- **Live Agent Canvas:** Gerçek zamanlı ajan yürütme görselleştirmesi (PhaseProgressBanner, InnerMonologue, PhaseActivityCards, ExpandingFileTree)
- **Agent Studio:** Kod düzenleme ve patch önerisi arayüzü (MVP)
- **Settings:** Runtime profil, sıcaklık, komut seviyesi ayarları
- **Docs:** i18n tabanlı (TR/EN) dokümantasyon sayfaları

Tema: GitHub-style light theme tokenları + dark mode desteği. Tüm UI metinleri i18n (Türkçe + İngilizce) ile yönetilir.

### 3.8 Test Planı ve Kalite Stratejisi

Kalite güvencesi yaklaşımı, erken test (shift-left) ve sözleşme doğrulaması üzerine kuruludur:

- **Birim testleri:** Orkestrasyon akışları, validasyonlar, servis katmanı, MCP adaptörleri
- **Sözleşme testleri:** Ajan girdi/çıktı şemalarının Zod ile doğrulanması, FACET-style reject+retry
- **Entegrasyon testleri:** MCP adaptörlerinin protokol uyumluluğu ve hata senaryoları
- **Golden Path testleri:** Scribe (12), Trace (10), Proto (12) ajanları için uçtan uca doğrulama
- **E2E testler:** Kritik kullanıcı akışları (kayıt, giriş, job oluşturma, izleme)
- **Webhook testleri:** HMAC-SHA256 doğrulama + trigger şema kontrat testleri

CI/CD pipeline (GitHub Actions):
1. `pnpm -r typecheck` — tip kontrolü
2. `pnpm -r lint` — linting
3. `pnpm -r build` — derleme doğrulama
4. `pnpm -r test` — tüm testler

**DoD (Definition of Done) kontrol listesi:**
- Kod, tüm linting ve tip kontrollerinden geçer
- Tüm testler geçer ve build başarılı
- Mimari uyumluluk doğrulanmış (Fastify, Drizzle, MCP — yasaklı teknolojiler yok)
- Dokümantasyon güncellendi
- Güvenlik hususları ele alındı
- i18n anahtarları TR/EN paritesi doğrulandı

### 3.9 Dağıtım ve İşletim

Dağıtım, OCI Ücretsiz Sürüm üzerinde tek VM (ARM64, 4 OCPU, 24 GB RAM) mimarisi ile gerçekleştirilmiştir:

```
Internet → Caddy (auto-HTTPS) → Docker Compose
                                   ├── backend (Fastify)
                                   ├── postgres
                                   └── mcp-gateway
                                 Frontend: static build (Caddy serve)
```

**Şekil 3.7:** OCI dağıtım topolojisi

- **Caddy:** Edge proxy, otomatik HTTPS (Let's Encrypt), SPA fallback
- **Docker Compose:** Backend, PostgreSQL, MCP Gateway konteynerleri
- **Staging URL:** `staging.akisflow.com`
- **Sağlık uçları:** `/health` → `{ "status": "ok" }`, `/ready` → diagnostik bilgi (MCP durumu, encryption, OAuth), `/version` → semver
- **E-posta:** Resend.com (`noreply@akisflow.com`, domain verified)
- **Smoke test:** `scripts/staging_smoke.sh` — 12 otomatik kontrol

### 3.10 Geliştirme Metodolojisi

Proje, **Dual-Track Agile** (Çift Hatlı Çevik) metodolojisi ile yürütülmüştür:

- **Keşif Hattı (Discovery Track):** Mimari tasarım, teknoloji değerlendirmesi, OCI kısıtlarına uyum araştırması, literatür taraması
- **Teslimat Hattı (Delivery Track):** Uygulama, test, entegrasyon ve dağıtım

**Rolling-Wave Planning** ile detaylı planlama sadece yakın vadeli işler için yapılırken, üst düzey kilometre taşları uzun vadeli yönlendirmeyi sağlamıştır. İş önceliklendirmesi **WSJF (Weighted Shortest Job First)** yöntemiyle yapılmıştır.

Sprint yapısı: 2 haftalık iterasyonlar, Sprint Planlama, Günlük Toplantılar, Sprint Review ve Retrospektif. Proje yönetimi; GitHub Issues, Conventional Commits, PR-tabanlı code review ve squash merge ile yürütülmüştür.

---

## 4. BULGULAR VE TARTIŞMA

### 4.1 Tamamlanan Görevler ve Ara Çıktılar

Proje kapsamında aşağıdaki temel iş paketleri tamamlanmıştır:

**Dönem I (BLM401 — Kasım 2025 – Ocak 2026):**

1. **Faz 0.1–0.3:** Repo iskeleti, mimari tanımlama, çekirdek motor iskelesi oluşturuldu.
2. **Faz 0.4:** Web shell + temel motor; Fastify backend, PostgreSQL + Drizzle veri erişim katmanı, çekirdek tablo seti kuruldu.
3. **Faz 1:** Scribe/Trace/Proto erken erişim; AgentOrchestrator çekirdeği, FSM durum yönetimi ve temel job yaşam döngüsü kurgulandı.
4. **Faz 1.5:** Loglama + gözlemlenebilirlik katmanı; TraceRecorder, JobEventBus → SSE, StaleJobWatchdog.
5. Kimlik doğrulama akışları (çok adımlı kayıt/giriş, e-posta doğrulama, JWT oturumu) geliştirildi.
6. MCP adaptör katmanı için entegrasyon çerçevesi ve ilk bağlantı senaryoları hazırlandı.

**Dönem II (BLM402 — Ocak 2026 – Şubat 2026):**

7. **Faz 2 (S2.0):** Cursor-Esinli UI + Scribe Konsolu; dashboard, ajan konsolları, job detay ekranları.
8. **S0.5 Faz A (7-9 Şub):** Staging düzeltmeleri — base URL, trust-proxy, OAuth callbacks, smoke test. 8/8 görev tamamlandı.
9. **S0.5 Faz B (10-16 Şub):** Pilot erişim + UX — davet stratejisi, onboarding akışı, geri bildirim yakalama, konsol sayfaları, Getting Started kartı. 11/11 görev tamamlandı.
10. **S0.5 Faz C (14-21 Şub):** Agent güvenilirliği — sözleşme dokümantasyonu, playbook determinizm, 3 ajan golden path doğrulama, hata işleme standardizasyonu, Scribe explicit skill contracts. 7/7 görev tamamlandı.
11. **S0.5 Faz D (17-23 Şub):** RAG — bağlam paketleri araştırma, mekanizma doğrulama, versiyonlu contract. 3/3 görev tamamlandı.
12. **S0.5 Faz E (24-28 Şub):** KG + M1 Pilot Demo — regresyon kontrol listesi, demo senaryosu, KG kanıt dokümanı, tez hazırlık notu, Live Agent Canvas, güven puanlama, webhook doğrulama, sesli komut, çoklu UX iyileştirmesi. 30+ görev tamamlandı.

### 4.2 Güncel Durum Tablosu

**Tablo 4.1:** Proje fazları ve tamamlanma durumu

| Faz | Odak | Durum | Tarih |
|-----|------|-------|-------|
| Faz 0.1 | Repo iskeleti ve temel proje kurulumu | Tamamlandı | Kasım 2025 |
| Faz 0.2 | Backend API altyapısı (Fastify) ve sağlık uçları | Tamamlandı | Kasım 2025 |
| Faz 0.3 | Veritabanı şeması ve Drizzle erişim katmanı | Tamamlandı | Kasım 2025 |
| Faz 0.4 | Web Shell + Temel Motor | Tamamlandı | Aralık 2025 |
| Faz 1 | Scribe/Trace/Proto Erken Erişim | Tamamlandı | Aralık 2025 |
| Faz 1.5 | Loglama + Gözlemlenebilirlik | Tamamlandı | Ocak 2026 |
| Faz 2 | Cursor-Esinli UI + Scribe Konsolu | Tamamlandı | Ocak 2026 |
| S0.5-A | Staging Düzeltmeleri (P0 Engelleyici) | Tamamlandı | 7-9 Şub 2026 |
| S0.5-B | Pilot Erişim + UX | Tamamlandı | 10-16 Şub 2026 |
| S0.5-C | Agent Güvenilirliği | Tamamlandı | 14-21 Şub 2026 |
| S0.5-D | RAG (Bağlam Paketleri) | Tamamlandı | 17-23 Şub 2026 |
| S0.5-E | KG + M1 Pilot Demo | Tamamlandı | 24-28 Şub 2026 |

### 4.3 Test Sonuçları ve Metrikleri

**Tablo 4.2:** Test metrikleri özeti

| Metrik | Değer |
|--------|-------|
| **Toplam Test Sayısı** | **1.391** |
| Backend Test Sayısı | 842 |
| Frontend Test Sayısı | 549 |
| Scribe Golden Path Testleri | 12 E2E |
| Trace Golden Path Testleri | 10 E2E |
| Proto Golden Path Testleri | 12 E2E |
| Hata İşleme Testleri | 39 birim |
| Sözleşme/Determinizm Testleri | 17 birim |
| Bağlam Paketi Testleri | 19 doğrulama |
| Webhook HMAC Testleri | 16 birim |
| TrustScoring Testleri | 11 birim |
| Studio Testleri | 24 birim |
| Geri Bildirim Testleri | 16 birim |
| Staging Smoke Testleri | 12/12 geçti |

Test süitinin kapsamı; birim testler, entegrasyon testleri, sözleşme testleri, golden path E2E testleri ve staging smoke testlerini içermektedir. CI/CD pipeline'ı tüm testleri her PR'da otomatik çalıştırır.

### 4.4 Staging Ortamı ve Demo Sonuçları

**Tablo 4.3:** M1 tamamlanma kriterleri ve durumları

| Kriter | Durum |
|--------|-------|
| Staging'de localhost referansı sıfır | ✅ Tamamlandı |
| `/health`, `/ready`, `/version` 200 dönüyor | ✅ Tamamlandı |
| `/ready` MCP durumu gösteriyor | ✅ Tamamlandı |
| Agent yönlendirme `/agents/*` kanonik | ✅ Tamamlandı |
| E-posta/şifre kayıt + giriş çalışıyor | ✅ Tamamlandı |
| OAuth yönlendirmeleri (GitHub + Google) çalışıyor | ✅ Tamamlandı |
| Scribe golden path staging'de çalışıyor | ✅ Tamamlandı |
| Trace golden path staging'de çalışıyor | ✅ Tamamlandı |
| Proto golden path staging'de çalışıyor | ✅ Tamamlandı |
| Hata durumlarında anlaşılır mesaj | ✅ Tamamlandı |
| Pilot katılım akışı çalışıyor | ✅ Tamamlandı |
| Demo senaryosu yazılmış | ✅ Tamamlandı |
| KG kanıt dokümanı mevcut | ✅ Tamamlandı |

Staging ortamı `staging.akisflow.com` adresinde canlı olarak çalışmakta ve 12/12 smoke testi geçmektedir. Deploy edilen commit: `43b86e7` (2026-02-12).

### 4.5 Ajan Performans Değerlendirmesi

**Scribe Ajanı:**
- AGT-8 derin analiz iyileştirmesi ile recursive repo scan (3 seviye, 150 dosya) desteği eklendi
- DocPack/ReleaseNotes/Checklist olmak üzere 3 farklı skill contract'ı tanımlandı
- Kalite metrikleri: `targetsProduced`, `documentsRead`, `filesProduced` izleniyor
- FACET-style şema doğrulama ile geçersiz çıktılar reddediliyor ve yeniden deneniyor

**Trace Ajanı:**
- TraceAutomationRunner: Gerçek Playwright yürütme motoru entegre edildi
- Feature-bazlı sonuç hesaplama (executed/passed/failed/passRate/featureCoverage)
- Kullanıcı tercihleri: testDepth, authScope, browserTarget, strictness parametreleri

**Proto Ajanı:**
- Gereksinim → analiz → tasarım → kod → test pipeline'ı uçtan uca çalışıyor
- Üretilen artefaktlar: kod iskeleti, test dosyaları, yapılandırma dosyaları
- Reflection/critique adımı ile çıktı kalitesi değerlendirilmektedir

**Güven Puanlama (TrustScoringService):**
- 4 metrik: Reliability, Hallucination Risk, Task Success, Tool Health
- Pure computation (harici bağımlılık yok), 11 birim test ile doğrulanmış

### 4.6 Tartışma

AKIS Platformu, proje hedeflerinin (H1–H6) büyük çoğunluğunu karşılamış durumdadır. Özellikle:

**Başarılar:**
- Modüler monolit mimarisi, OCI Free Tier'da stabil çalışıyor (H1)
- MCP adaptörleri ile GitHub entegrasyonu staging'de doğrulanmış (H2)
- Üç ajanın golden path akışları staging'de tamamlanmış (H3)
- İz kaydı, kalite puanlama ve güven metrikleri altyapısı kurulmuş (H4)
- DoD, sözleşme doğrulama ve CI/CD pipeline ile yönetişim sağlanmış (H5)
- Çalışan prototip, demo senaryosu ve KG kanıt dokümanı hazır (H6)

**Kısıtlamalar ve Zorluklar:**
- Ücretsiz LLM modellerinin (OpenRouter) çıktı kalitesi görev karmaşıklığına göre değişkenlik göstermektedir. Prompt mühendisliği ve PER pipeline ile bu etki azaltılmıştır.
- MCP protokolünün görece yeni olması, entegrasyon geliştirme süresini artırmıştır. Mock sunucu yaklaşımı ile test güvenilirliği sağlanmıştır.
- İki kişilik ekip kısıtı, paralel iş kapasitesini sınırlamıştır. WSJF önceliklendirmesi ile kritik görevlere odaklanılmıştır.
- OCI Free Tier kaynak kısıtları, eşzamanlı ajan çalıştırma kapasitesini sınırlamaktadır. Job kuyruk mekanizması ile kaynak rekabeti yönetilmektedir.

**Literatür ile Karşılaştırma:**
- AKIS, literatürdeki tekil çözümlerden (SWE-Agent, RepairAgent, DocAgent) farklı olarak dokümantasyon–test–prototipleme üçlüsünü tek bir orkestrasyon çekirdeği altında birleştiren ilk açık kaynaklı akademik prototiptir.
- Live Agent Canvas ile gerçek zamanlı ajan yürütme görselleştirmesi, mevcut araştırma arayüzlerinin ötesinde bir şeffaflık seviyesi sunmaktadır.
- Güven puanlama ve bağlam paketleri mekanizmaları, denetlenebilirlik ve bilgi doğrulama konularında literatürdeki boşlukları doldurmaktadır.

---

## 5. SONUÇ VE GELECEK ÇALIŞMALAR

### 5.1 Sonuçlar

Bu çalışmada, yazılım geliştirme yaşam döngüsündeki tekrarlayan ve düşük katma değerli görevleri otomatikleştirmek amacıyla AKIS Platformu geliştirilmiştir. Platform; dokümantasyon güncelleme (Scribe), test otomasyonu üretimi (Trace) ve gereksinimlerden prototip çıkarma (Proto) fonksiyonlarını LLM tabanlı otonom ajanlar aracılığıyla tek bir orkestrasyon çekirdeği altında birleştiren modüler bir çözüm sunmaktadır.

Proje süresince elde edilen temel çıktılar:

1. **Çalışan Web Tabanlı Prototip:** `staging.akisflow.com` adresinde canlı, OCI Free Tier üzerinde çalışan platform. 3/3 ajan golden path'i staging'de doğrulanmış.

2. **Kapsamlı Test Altyapısı:** 1.391 test senaryosu (842 backend + 549 frontend), CI/CD pipeline'da otomatik çalıştırma, 12/12 staging smoke testi.

3. **Gerçek Zamanlı Ajan Deneyimi:** Live Agent Canvas ile ajan yürütme sürecinin adım adım görselleştirilmesi, güven puanlama ve sesli komut desteği.

4. **Güvenli ve Denetlenebilir Mimari:** JWT oturum yönetimi, çok adımlı kimlik doğrulama, MCP adaptörleri ile standart entegrasyon, iz kaydı ve artefakt kalıcılığı.

5. **Akademik Dokümantasyon:** Kapsamlı literatür araştırması (4 tematik bölüm, 40+ referans), teknik tasarım dokümanları, demo senaryosu ve KG kanıt dokümanı.

### 5.2 Hedefler ile Elde Edilen Sonuçların Karşılaştırılması

**Tablo 5.1:** Hedefler (H1–H6) ile elde edilen sonuçlar

| Hedef | Açıklama | Durum | Kanıt |
|-------|----------|-------|-------|
| **H1** | Modüler sistem altyapısı ve web arayüzü | ✅ Tamamlandı | Fastify + React SPA + Agent Consoles + Dashboard + Agents Hub |
| **H2** | Güvenli API bağlantıları (GitHub, Jira, Confluence) | ✅ Tamamlandı | MCP adaptörleri + staging doğrulanmış GitHub entegrasyonu |
| **H3** | Üç otonom ajan (Scribe, Trace, Proto) | ✅ Tamamlandı | 3/3 golden path staging'de `completed`, AGT-8 derin analiz |
| **H4** | İzleme altyapısı (iz kaydı, kalite puanlama, güven metrikleri) | ✅ Tamamlandı | TraceRecorder + QualityScoring + TrustScoringService + Live Agent Canvas |
| **H5** | Güvenlik, kalite güvencesi ve yönetişim | ✅ Tamamlandı | DoD + CI/CD + sözleşme doğrulama + oran sınırlama + user isolation |
| **H6** | Çalışan prototip, dokümantasyon, demo | ✅ Tamamlandı | staging.akisflow.com + 15dk demo senaryosu + KG kanıt dokümanı + final rapor |

### 5.3 Yaygın Etki

**Ekonomik Etki:**
- Dokümantasyon bakım maliyetlerinin azaltılması (Scribe ile otomatikleştirme)
- Test otomasyon geliştirme süresinin kısaltılması (Trace ile %60-80 azalma hedefi)
- MVP prototipleme süresinin haftalardan saatlere/günlere indirilmesi (Proto)

**Sosyal Etki:**
- Geliştirici tükenmişliğinin (burnout) azaltılması
- Teknik bilginin güncel ve erişilebilir tutulması
- Yazılım mühendisliği eğitimi için modern mimari desen örnekleri

**Sürdürülebilirlik:**
- OCI Free Tier üzerinde minimum kaynakla çalışabilirlik
- Tek süreçli modüler monolit: mikroservislere göre %60-70 daha düşük enerji tüketimi potansiyeli

**Etik ve Yönetişim:**
- Şeffaf ajan davranışı (iz kaydı, plan görünürlüğü)
- İnsan gözetimi (onay mekanizması, yapılandırma kontrolü)
- Sorumlu AI uygulamaları (guardrails, sözleşme doğrulama)

### 5.4 Gelecek Çalışmalar

Projenin devamında planlanan çalışmalar aşağıda özetlenmiştir:

**M2: Stabilizasyon (Mart 2026):**
- Pilot kullanıcı geri bildirimlerinin toplanması ve sınıflandırılması
- P0/P1 hataların sıfırlanması
- Golden path başarı oranının %90+ hedefi
- pg_trgm retrieval prototip (PostgreSQL tabanlı metin arama)
- Tez taslağı tamamlanması (giriş + literatür + yöntem)
- Demo videosunun kaydedilmesi (5-10 dakika)

**M3: Mezuniyet (Nisan-Mayıs 2026):**
- Final raporunun tamamlanması ve onaylanması
- Sunum slaytları hazırlanması (15-20 slayt)
- Demo videosunun final versiyonu
- Canlı demo en az 2 kez prova edilmesi
- Teslim paketi: kod + dokümanlar + video + sunum + poster

**Uzun Vadeli Vizyon:**
- Social platform taslağı (feed, marketplace, showcase) — M2/M3 kapsamında değerlendirilecek
- Ek ajan türleri (code review, refactoring) — kapsam dışı, gelecek faz
- Gelişmiş RAG stratejileri (vector DB entegrasyonu) — Mart sonrası
- Çok katmanlı RBAC ve ekip yönetimi — kurumsal kullanım senaryosu
- Webhook tabanlı otomatik tetikleme (CI/CD entegrasyonu)
- Mobile companion uygulaması

---

## KAYNAKLAR

[1] Suri, S., Das, S. N., Singi, K., Dey, K., Sharma, V. S., & Kaulgud, V. (2023). Software engineering using autonomous agents: Are we there yet?. In *2023 38th IEEE/ACM International Conference on Automated Software Engineering (ASE)* (pp. 1855-1857). IEEE.

[2] Bouzenia, I., Devanbu, P., & Pradel, M. (2025). RepairAgent: An autonomous, LLM-based agent for program repair. In *IEEE/ACM 47th International Conference on Software Engineering (ICSE '25)* (pp. 2188–2200). IEEE Press.

[3] He, J., Treude, C., & Lo, D. (2025). LLM-based multi-agent systems for software engineering: Literature review, vision, and the road ahead. *ACM Transactions on Software Engineering and Methodology*, 34(5), Article 124.

[4] Yang, J., Jimenez, C. E., Wettig, A., Lieret, K., Yao, S., Narasimhan, K., & Press, O. (2024). SWE-agent: Agent-computer interfaces enable automated software engineering. In *Advances in Neural Information Processing Systems (NeurIPS 2024)*.

[5] Li, G., Hammoud, H. A. K., Itani, H., Khizbullin, D., & Ghanem, B. (2023). CAMEL: Communicative agents for "mind" exploration of large language model society. In *Advances in Neural Information Processing Systems (NeurIPS 2023)*.

[6] Khan, J. Y., & Uddin, G. (2023). Automatic code documentation generation using GPT-3. In *Proceedings of the 37th IEEE/ACM International Conference on Automated Software Engineering (ASE '22)* (Article 174, pp. 1–6). ACM.

[7] Dvivedi, S. S., Vijay, V., Pujari, S. L. R., Lodh, S., & Kumar, D. (2024). A comparative analysis of large language models for code documentation generation. In *Proceedings of the 1st ACM International Conference on AI-Powered Software (AIware 2024)* (pp. 65–73). ACM.

[8] Yang, D., Simoulin, A., Qian, X., Liu, X., Cao, Y., Teng, Z., & Yang, G. (2025). DocAgent: A multi-agent system for automated code documentation generation. In *Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (Volume 3: System Demonstrations)* (pp. 460–471). ACL.

[9] Wang, J., Huang, Y., Chen, C., Liu, Z., Wang, S., & Wang, Q. (2024). Software testing with large language models: Survey, landscape, and vision. *IEEE Transactions on Software Engineering*, 50(4), 911–936.

[10] Bhatia, S., Gandhi, T., Kumar, D., & Jalote, P. (2024). Unit test generation using generative AI: A comparative performance analysis of autogeneration tools. In *Proceedings of the 1st International Workshop on Large Language Models for Code (LLM4Code '24)* (pp. 54–61). ACM.

[11] Tony, C., Mutas, M., Díaz Ferreyra, N. E., & Scandariato, R. (2023). LLMSecEval: A dataset of natural language prompts for security evaluations. In *Proceedings of the 2023 IEEE/ACM 20th International Conference on Mining Software Repositories (MSR '23)* (pp. 588–592). IEEE.

[12] Mündler, N., Müller, M. N., He, J., & Vechev, M. (2024). SWT-Bench: Testing and validating real-world bug-fixes with code agents. In *Advances in Neural Information Processing Systems (NeurIPS 2024)*.

[13] Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. In *Proceedings of the International Conference on Learning Representations (ICLR 2023)*.

[14] Wang, X., Wei, J., Schuurmans, D., Le, Q. V., Chi, E. H., Narang, S., Chowdhery, A., & Zhou, D. (2023). Self-consistency improves chain-of-thought reasoning in language models. In *Proceedings of the International Conference on Learning Representations (ICLR 2023)*.

[15] Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., Cao, Y., & Narasimhan, K. (2023). Tree of thoughts: Deliberate problem solving with large language models. In *Advances in Neural Information Processing Systems (NeurIPS 2023)*.

[16] Fraser, G. & Arcuri, A. (2011). EvoSuite: Automatic test suite generation for object-oriented software. In *Proceedings of the 19th ACM SIGSOFT Symposium and the 13th European Conference on Foundations of Software Engineering (ESEC/FSE '11)* (pp. 416–419). ACM.

[17] Brown, T. B., et al. (2020). Language models are few-shot learners. In *Advances in Neural Information Processing Systems (NeurIPS 2020)*.

[18] Chen, M., et al. (2021). Evaluating large language models trained on code. *arXiv preprint arXiv:2107.03374*.

[19] Guo, D., et al. (2024). DeepSeek-Coder: When the large language model meets programming. *arXiv preprint arXiv:2401.14196*.

[20] Lozhkov, A., et al. (2024). StarCoder 2 and The Stack v2: The next generation. *arXiv preprint arXiv:2402.19173*.

[21] Schick, T., et al. (2023). Toolformer: Language models can teach themselves to use tools. In *Advances in Neural Information Processing Systems (NeurIPS 2023)*.

[22] Patil, S. G., et al. (2023). Gorilla: Large language model connected with massive APIs. *arXiv preprint arXiv:2305.15334*.

[23] Lee, M., Liang, P., & Yang, Q. (2022). CoAuthor: Designing a human-AI collaborative writing dataset for exploring language model capabilities. In *Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems (CHI '22)*. ACM.

[24] Vasconcelos, H., et al. (2023). Explanations can reduce overreliance on AI systems during decision-making. *Proceedings of the ACM on Human-Computer Interaction*, 7(CSCW1).

[25] Jiang, E., et al. (2023). GenLine and GenForm: Two tools for interacting with generative language models in a code editor. In *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology (UIST '23)*. ACM.

[26] Gao, T., Yen, H., Yu, J., & Chen, D. (2023). Enabling large language models to generate text with citations. In *Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing (EMNLP 2023)*. ACL.

[27] Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. In *Advances in Neural Information Processing Systems (NeurIPS 2020)*.

---

## EKLER

### Ek A: İş-Zaman Çizelgesi

| İP No | Adı | Sorumlu | Ay 1 | Ay 2 | Ay 3 | Ay 4 | Ay 5 | Ay 6 | Ay 7 | Ay 8 | Ay 9 | Ay 10 |
|-------|-----|---------|------|------|------|------|------|------|------|------|------|-------|
| İP1 | Proje Başlangıcı ve Tanımlama | Ömer, Ayşe | ✓ | ✓ | ✓ | | | | | | | |
| İP2 | Platform Çekirdeği Geliştirme | Ömer | | ✓ | ✓ | ✓ | | | | | | |
| İP3 | MCP Entegrasyonları | Ömer | | ✓ | ✓ | ✓ | | | | | | |
| İP4 | Frontend Geliştirme | Ayşe | | ✓ | ✓ | ✓ | | | | | | |
| İP5 | Temel Ajan Geliştirme (Scribe, Trace) | Ömer | | | ✓ | ✓ | ✓ | | | | | |
| İP6 | Dönem I Teslimatları | Ömer, Ayşe | | | | ✓ | | | | | | |
| İP7 | Gelişmiş Ajan Geliştirme (Proto) | Ömer | | | | | ✓ | ✓ | ✓ | | | |
| İP8 | Frontend İyileştirmeleri | Ayşe | | | | | | ✓ | ✓ | | | |
| İP9 | E2E Testler, OCI Dağıtımı | Ömer, Ayşe | | | | | | | ✓ | ✓ | | |
| İP10 | Dönem II Teslimatları (Final Rapor, Poster) | Ömer, Ayşe | | | | | | | | ✓ | ✓ | |

### Ek B: Risk Yönetimi Tablosu

| Risk | Açıklama | Önlem |
|------|----------|-------|
| R1 — MCP Entegrasyon Karmaşıklığı | Protokolün yeni olması, sınırlı dokümantasyon | Erken PoC, mock sunucu, fallback olarak REST adapter |
| R2 — OCI Performans Yetersizliği | Free Tier kaynak kısıtları | Fastify/Drizzle seçimi, job kuyruk mekanizması, DB tuning |
| R3 — AI Model Kalitesi ve Tutarsızlığı | Ücretsiz model çıktı kalitesi | PER pipeline, model esnekliği (OpenRouter), prompt mühendisliği |
| R4 — Kapsam Kayması | Yeni özellik baskısı | Katı kapsam yönetimi, WSJF önceliklendirme, fikir dondurma |
| R5 — Teknik Borç Yığılması | Demo baskısıyla aceleye gelen kod | DoD zorunluluğu, code review, CI/CD kalite kapıları |
| R6 — Akademik Raporlama Yükü | Kodlama vs. dokümantasyon dengesi | Dual-Track Agile, sprint'lere dokümantasyon görevleri |

### Ek C: Fonksiyonel Gereksinimler (Detay)

| Kod | Açıklama | Durum |
|-----|----------|-------|
| FR1 | Kullanıcı kayıt ve giriş akışları (çok adımlı + OAuth) | ✅ Tamamlandı |
| FR2 | Kullanıcı, ajan konfigürasyonunu UI üzerinden oluşturup kaydedebilecek | ✅ Tamamlandı |
| FR3 | Kullanıcı, bir ajan işi (job) başlatabilecek ve durumunu izleyebilecek | ✅ Tamamlandı |
| FR4 | Scribe ajanı; kaynak depodaki değişikliği analiz edip dokümantasyon çıktısı üretecek | ✅ Tamamlandı |
| FR5 | Trace ajanı; gereksinim ve kabul kriterlerinden test senaryosu ve otomasyon çıktısı üretecek | ✅ Tamamlandı |
| FR6 | Proto ajanı; gereksinim girdisinden analiz-tasarım-prototip akışını yürüterek artefaktlar üretecek | ✅ Tamamlandı |
| FR7 | Harici sistemlere erişim, MCP adaptörleri üzerinden standartlaştırılmış şekilde sağlanacak | ✅ Tamamlandı |

### Ek D: Fonksiyonel Olmayan Gereksinimler (Detay)

| Kod | Açıklama | Durum |
|-----|----------|-------|
| NFR1 | Sistem, OCI Free Tier kaynaklarında çalışacak şekilde tasarlanacak | ✅ Tamamlandı |
| NFR2 | Kimlik doğrulama, HTTP-only cookie içinde stateless JWT ile sağlanacak | ✅ Tamamlandı |
| NFR3 | Girdi doğrulama ve sözleşme uyumluluğu çalışma zamanında doğrulanacak | ✅ Tamamlandı |
| NFR4 | İş yürütme adımları ve durum değişimleri denetlenebilir kayıtlarla saklanacak | ✅ Tamamlandı |
| NFR5 | Harici entegrasyonlar MCP adaptör katmanı ile yapılacak | ✅ Tamamlandı |
| NFR6 | Sistem; hata yönetimi, zaman aşımı ve yeniden deneme stratejileri ile kararlı çalışacak | ✅ Tamamlandı |

### Ek E: Staging Smoke Test Kontrol Listesi

| # | Kontrol | Beklenen |
|---|---------|----------|
| 1 | GET /health | `{ "status": "ok" }` |
| 2 | GET /ready | `{ "ready": true }` + MCP diagnostik |
| 3 | GET /version | Geçerli semver |
| 4 | Frontend yükleme | 200 + HTML content |
| 5 | Kayıt akışı | 201 Created |
| 6 | Giriş akışı | 200 + JWT cookie |
| 7 | OAuth callback URL doğrulama | Doğru callback URL'leri |
| 8 | Scribe golden path | Job completed |
| 9 | Trace golden path | Job completed |
| 10 | Proto golden path | Job completed |
| 11 | localhost sızıntı kontrolü | Sıfır referans |
| 12 | SSL sertifika kontrolü | Geçerli Let's Encrypt |

---

*Bu rapor, AKIS Platformu Lisans Bitirme Projesi kapsamında hazırlanmıştır.*
*Son güncelleme: Şubat 2026*
