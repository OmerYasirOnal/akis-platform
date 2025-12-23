# Çözüm Tasarımı ve Teknik Analiz (Solution Design & Technical Analysis)

**Doküman Kodu:** D2  
**Proje Adı:** AKIS Platform — Yapay Zekâ Ajanı İş Akışı Motoru (AI Agent Workflow Engine)  
**Bölüm:** Bilgisayar Mühendisliği  
**Öğrenci:** Ömer Yasir ÖNAL (2221221562)  
**Danışman:** Dr. Öğr. Üyesi Nazlı DOĞAN  
**Hazırlanma Tarihi:** 23 Aralık 2025  
**Sürüm:** 1.0

---

## İçindekiler

1. [Giriş (Introduction)](#1-giriş-introduction)
   - 1.1 [Problem Tanımı ve Motivasyon (Problem Description and Motivation)](#11-problem-tanımı-ve-motivasyon-problem-description-and-motivation)
   - 1.2 [Projenin Kapsamı (Scope)](#12-projenin-kapsamı-scope)
2. [İlgili Çalışmalar / Literatür Araştırması (Related Work / Literature Survey)](#2-İlgili-çalışmalar--literatür-araştırması-related-work--literature-survey)
3. [Proje Gereksinimleri (Project Requirements)](#3-proje-gereksinimleri-project-requirements)
4. [Sistem Tasarımı (System Design)](#4-sistem-tasarımı-system-design)
5. [Tamamlanan Görevler (Tasks Accomplished)](#5-tamamlanan-görevler-tasks-accomplished)
6. [Kaynakça (Bibliography)](#6-kaynakça-bibliography)
7. [Ekler (Appendices)](#7-ekler-appendices)

---

## 1. Giriş (Introduction)

### 1.1 Problem Tanımı ve Motivasyon (Problem Description and Motivation)

#### 1.1.1 Bağlam

Günümüz yazılım geliştirme süreçleri (Software Development Life Cycle – SDLC) artan kod karmaşıklığı, sürekli değişen gereksinimler ve hızlanan pazara çıkış beklentileri nedeniyle ekipler için önemli operasyonel zorluklar barındırmaktadır. Yazılım ekipleri, kodlama ve tasarım gibi yüksek katma değerli faaliyetlerin yanı sıra, tekrarlayan ve zaman alıcı görevlerle de uğraşmak zorunda kalmaktadır. Bu durum, hem geliştirici verimliliğini düşürmekte hem de projelerin toplam maliyetini artırmaktadır.

#### 1.1.2 Tanımlanan Problemler

Bu projede, yazılım ekiplerinin verimliliğini düşüren ve maliyetlerini artıran üç ana problem alanı tanımlanmıştır:

**Problem 1: Eskimiş Dokümantasyon**

Yazılım projelerinde kod tabanı dinamik olarak değişirken, bu değişikliklerin teknik dokümantasyona (örneğin Confluence sayfalarına) yansıtılması manuel bir süreçtir ve sıklıkla gecikmektedir. Bu durum, dokümanların hızla güncelliğini yitirmesine, bilgi güvenilirliğinin azalmasına ve özellikle ekibe yeni katılan geliştiricilerin adaptasyon sürecinin (onboarding) uzamasına yol açmaktadır. Araştırmalar, geliştiricilerin zamanlarının önemli bir kısmını güncel olmayan dokümantasyonla mücadele ederek harcadığını göstermektedir.

**Problem 2: Yüksek Test Otomasyon Maliyeti**

Kalite güvencesi (Quality Assurance – QA) süreçlerinde, manuel olarak hazırlanan test senaryolarının otomasyon kodlarına (örneğin Cucumber, Selenium) dönüştürülmesi yoğun zaman ve efor gerektirir. Bu yüksek maliyet, test kapsamının daralmasına, test döngüsü süresinin uzamasına ve nihayetinde yazılımın güvenilirliğinin azalmasına neden olmaktadır. Özellikle çevik (Agile) metodolojilerde, her sprint sonunda test otomasyonunun güncellenmesi ciddi bir darboğaz oluşturmaktadır.

**Problem 3: Yavaş MVP Prototipleme**

Yeni iş fikirleri veya özelliklerin, en temel çalışan prototipe (Minimum Viable Product – MVP) dönüştürülmesi; analiz, tasarım, kodlama ve test süreçlerinin manuel yürütülmesi nedeniyle günler hatta haftalar sürebilmektedir. Bu yavaşlık, kurumların pazara yenilikleri hızlı sunma ve kullanıcı geri bildirimi alma yeteneğini azaltmakta; sonuç olarak rekabet gücü düşmektedir.

#### 1.1.3 Motivasyon ve Akademik Katkı

Bu projenin motivasyonu; yazılım geliştirme süreçlerindeki tekrarlayan, düşük katma değerli görevlerin otomasyona aktarılmasıyla ekiplerin yaratıcı ve stratejik işlere odaklanabilmelerini sağlamaktır. Akademik ve uygulamalı düzeyde bu çalışma şu katkıları hedeflemektedir:

- Büyük Dil Modeli (LLM – Large Language Model) tabanlı otonom ajanların yazılım mühendisliği süreçlerine uygulanması ve bu ajanların "iş şablonları" (playbooks) ile "tasarım/kabul sözleşmeleri" (design/acceptance contracts) biçiminde yapılandırılması.
- Ekiplerin mevcut iş akışlarına minimum müdahale ile entegre çalışabilen, modüler ve izlenebilir bir otomasyon platformunun geliştirilmesi.
- Geliştirici verimliliğini artırarak operasyonel maliyetleri düşürmek ve yazılım üretim sürecine "değer ekonomisi" (value economy) bağlamında katkıda bulunmak.

#### 1.1.4 Projenin Amacı

Bu projenin amacı, yazılım geliştirme ekiplerine tekrarlayan görevlerden kurtulma imkânı sağlayarak zamanı geri kazandırmak ve ekiplerin yüksek katma değerli işlere odaklanmasına imkân tanımaktır. Bu doğrultuda, "AKIS Platform" adı verilen ve bir Yapay Zekâ Ajanı İş Akışı Motoru (AI Agent Workflow Engine) üzerine kurulu sistem geliştirilmektedir. Platform, dokümantasyon güncelleme, test otomasyonu üretimi ve MVP prototipleme süreçlerini otomatikleştirecektir. Bu sayede hem kalite güvence edilir hem de süreçlerin çevikliği artırılır.

---

### 1.2 Projenin Kapsamı (Scope)

#### 1.2.1 Kapsam Tanımı

AKIS Platform, yazılım geliştirme süreçlerinde (SDLC) sıklıkla karşılaşılan dokümantasyon güncelleme, test otomasyonu üretimi ve MVP prototipleme görevlerindeki verimsizlikleri azaltmayı amaçlamaktadır. Platform, modüler olarak tasarlanmış bir Yapay Zekâ Ajanı İş Akışı Motoru temelinde geliştirilmektedir.

#### 1.2.2 Kapsama Dahil Olanlar (In-Scope)

**A. Platform Çekirdeği ve Temel Özellikler**

- **A1. Kullanıcı Yönetimi ve Kimlik Doğrulama:** Kullanıcıların sistemde güvenli şekilde oturum açmaları ve profillerini yönetebilmeleri. Çok adımlı e-posta doğrulamalı kayıt/giriş sistemi uygulanmaktadır.
- **A2. Web Tabanlı Yönetim Arayüzü:** Kullanıcının dashboard üzerinden GitHub deposu listeleme, ajan görev geçmişi görüntüleme ve ayarlarını yapılandırabilmesi.
- **A3. Ajan Görev İzleme Modülü:** Çalıştırılan ajanların durumları (başarılı, başarısız, beklemede) ve log kayıtlarının erişilebilir olması.
- **A4. Ajan Ayarları Paneli:** Kullanıcıların, projede yer alan ajanların (Scribe, Trace, Proto) temel parametrelerini belirleyebilmesi.

**B. Otonom Ajanlar**

- **B1. AKIS Scribe:** Kod değişikliklerini analiz ederek ilgili teknik dokümantasyonu güncelleyen ajan.
- **B2. AKIS Trace:** Jira biletlerinden kabul kriterlerini çıkararak test senaryoları üretip otomasyon test koduna dönüştüren ajan.
- **B3. AKIS Proto:** Bir fikir ya da gereksinim girişinden yola çıkarak, analiz-tasarım-kod-test adımlarını yöneten ve çalışan bir prototip ortaya çıkaran ajan.

**C. Entegrasyonlar**

- GitHub API entegrasyonu: Depolara erişim, commit/PR verilerinin işlenmesi
- Jira API entegrasyonu: Gereksinim ve bilet verilerinin okunması
- Confluence API entegrasyonu: Dokümantasyon sayfalarının okunması ve güncellenmesi

**D. Akademik Çıktılar**

- D1: Proje Kapsamı ve Gereksinimler Dokümanı
- D2: Çözüm Tasarımı ve Teknik Analiz Dokümanı (bu belge)
- D3: Final Raporu, demo videosu ve kullanıcı dokümantasyonu

#### 1.2.3 Kapsam Dışı Olanlar (Out-of-Scope)

Projenin başarıyla tamamlanabilmesi ve kaynak/zaman kısıtlarının yönetilebilir olması için aşağıdaki unsurlar bilinçli olarak kapsam dışı bırakılmıştır:

1. Kullanıcıların kendi ajanlarını kodlama veya no-code/low-code ajan oluşturma sihirbazı
2. Tam kurumsal yönetim özellikleri: Rol bazlı erişim kontrolü (RBAC), takım yönetimi, on-premise dağıtım
3. Slack, Microsoft Teams, VS Code gibi araçlarla derin çift yönlü entegrasyonlar
4. Ücretli LLM modelleri veya yüksek kaynak gerektiren AI servislerinin sürekli kullanımına yönelik optimizasyon
5. Kod inceleme (code review) veya kod yeniden yapılandırma (refactoring) ajanları
6. Otomatik dağıtım (deployment) veya CI/CD pipeline entegrasyonlarının tam üretim düzeyinde ele alınması
7. Karmaşık SaaS faturalandırma, abonelik yönetimi veya çok katmanlı abonelik modelleri

#### 1.2.4 Kısıtlar ve Varsayımlar

- **Zaman:** Proje akademik takvime bağlıdır; ilk dönem demo teslimi için 26 Ocak, final için 22 Mayıs son tarihleri geçerlidir.
- **Kaynak/Ekip:** Ekip iki kişiden oluşmaktadır (Ömer Yasir ÖNAL, Ayşe Serra GÜMÜŞ).
- **Maliyet:** Bütçe sıfıra yakın olup; tüm bulut hizmetleri, API'ler ve araçlar ücretsiz veya öğrenci lisanslarıyla kullanılacaktır.
- **Altyapı:** Platform barındırılması için Oracle Cloud Infrastructure (OCI) Free Tier kullanılacaktır (4 OCPU, 24 GB RAM, ARM mimarisi).
- **Değişim Yönetimi:** Kapsam kaymasını (scope creep) önlemek amacıyla herhangi bir ek özellik ancak resmi değişim süreci ile değerlendirilecektir.

---

## 2. İlgili Çalışmalar / Literatür Araştırması (Related Work / Literature Survey)

### 2.1 Model Context Protocol (MCP) ve Entegrasyon Standartları

Model Context Protocol (MCP), Anthropic tarafından 2024 yılında açık kaynak olarak tanıtılan bir entegrasyon standardıdır. MCP, büyük dil modelleri (LLM) ile harici veri kaynakları ve araçlar arasında standart bir iletişim protokolü sağlamayı amaçlamaktadır. "USB-C for AI" olarak da nitelendirilen bu protokol, farklı sistemler arasındaki entegrasyon karmaşıklığını azaltmaktadır.

MCP'nin temel özellikleri şunlardır:
- JSON-RPC 2.0 tabanlı mesajlaşma formatı
- Araç (tool), kaynak (resource) ve prompt tanımlama yetenekleri
- Oturum bazlı veya oturumsuz (stateless) iletişim desteği
- Yetkilendirme için Bearer token mekanizması

AKIS Platform, GitHub entegrasyonu için MCP protokolünü kullanmaktadır. Bu yaklaşım, doğrudan GitHub REST API veya GraphQL API kullanmaya kıyasla daha standart ve genişletilebilir bir entegrasyon katmanı sağlamaktadır. GitHub'ın resmi MCP sunucusu, depo işlemleri, branch yönetimi, dosya commit ve pull request operasyonları için JSON-RPC tabanlı bir arayüz sunmaktadır.

### 2.2 Ajan Orkestrasyon Mimarileri

Otonom yazılım ajanlarının koordinasyonu için literatürde çeşitli mimari yaklaşımlar bulunmaktadır:

**Çoklu Ajan Sistemleri (Multi-Agent Systems – MAS):** Birden fazla otonom ajanın etkileşimde bulunduğu sistemlerdir. Merkezi veya merkezi olmayan koordinasyon modelleri mevcuttur. JADE, SPADE gibi çerçeveler, ajan yaşam döngüsü ve mesajlaşma altyapısı sağlar; ancak küçük ölçekli sistemler için fazla karmaşık olabilmektedir.

**BDI (Belief-Desire-Intention) Mimarisi:** İnsan benzeri akıl yürütmeyi modelleyen deliberatif bir ajan mimarisidir. Ajanlar; inançlar (beliefs), arzular (desires) ve niyetler (intentions) olmak üzere üç temel bileşenle çalışır. Bu mimari, hedef odaklı davranış için güçlü bir çerçeve sunar; ancak kaynak yoğun olabilmektedir.

**Orchestrator/Controller Deseni:** Merkezi bir orkestratör bileşeninin birden fazla ajanı (işçi) yönettiği merkezileştirilmiş bir koordinasyon yaklaşımıdır. Bu desen, tasarımı basitleştirir ve kaynak kısıtlı ortamlar için uygundur.

**Sonlu Durum Makineleri (Finite-State Machines – FSM):** Her ajanın davranışının durumlar (örneğin: Idle, Running, Completed, Failed) ve geçişlerle tanımlandığı hafif bir tasarım desenidir.

AKIS Platform için **Modüler Monolit + Merkezi Orkestratör** mimarisi tercih edilmiştir. Bu seçimin temel gerekçeleri şunlardır:
- OCI Free Tier kısıtlarına uyumluluk (tek Node.js işlemi ile düşük kaynak tüketimi)
- Servisler arası iletişim yükünden kaçınma
- Ajan ekleme/çıkarmanın kolaylığı (plugin benzeri modüler yapı)
- Merkezi yönetişim ve hata yönetimi kolaylığı

### 2.3 Teknoloji Yığını Seçimi Gerekçeleri

**Fastify Web Framework**

Fastify, Node.js için yüksek performanslı bir web framework'üdür. Express.js'e kıyasla önemli ölçüde daha yüksek throughput ve daha düşük bellek kullanımı sunmaktadır. Fastify'ın plugin mimarisi, modüler ajan kaydı için avantaj sağlamaktadır. ARM mimarisi ile tam uyumlu olması, OCI Free Tier ARM VM'leri için kritik önem taşımaktadır.

**Drizzle ORM**

Drizzle, TypeScript-native bir ORM/query builder'dır. Prisma gibi alternatiflere kıyasla önemli avantajlar sunmaktadır:
- İkili (binary) motor gerektirmez; tamamen TypeScript/JavaScript tabanlıdır
- Çok daha küçük paket boyutu (yaklaşık 1.5 MB vs Prisma'nın 6.5+ MB)
- Derleme zamanı tip güvenliği
- Doğrudan SQL üretimi ile daha öngörülebilir sorgular

**PostgreSQL Veritabanı**

PostgreSQL, açık kaynaklı, güçlü ve olgun bir ilişkisel veritabanı yönetim sistemidir. JSON desteği, tam metin arama ve güçlü indeksleme yetenekleri sunmaktadır. OCI Free Tier üzerinde çalıştırılabilir ve Drizzle ORM ile tam uyumludur.

**React ve Vite (Frontend)**

React, bileşen tabanlı kullanıcı arayüzü geliştirme için endüstri standardıdır. Vite, modern JavaScript için hızlı geliştirme sunucusu ve build aracı olarak tercih edilmiştir. Next.js'e kıyasla daha hafif bir çözüm sunmakta ve backend ile ayrışmış (decoupled) bir mimariye olanak tanımaktadır.

### 2.4 LLM Tabanlı Yazılım Mühendisliği Otomasyonu

Son yıllarda, LLM'lerin yazılım mühendisliği görevlerinde kullanımı hızla artmaktadır. GitHub Copilot, kod tamamlama ve öneri konusunda öncü bir rol üstlenmiştir. Aider, Claude Dev ve benzeri araçlar, daha kapsamlı kod üretimi ve düzenleme yetenekleri sunmaktadır.

AKIS Platform, bu araçlardan farklı olarak spesifik iş akışlarına (dokümantasyon, test, prototipleme) odaklanmakta ve otonom ajan paradigmasını benimsemektedir. Her ajan, tanımlı bir "sözleşme" (contract) ve iş şablonu (playbook) ile çalışmakta; bu da çıktıların tutarlılığını ve izlenebilirliğini artırmaktadır.

---

## 3. Proje Gereksinimleri (Project Requirements)

### 3.1 Fonksiyonel Gereksinimler (Functional Requirements)

#### FR-01: Kullanıcı Kimlik Doğrulama ve Yönetimi

**Açıklama:** Sistem, kullanıcıların güvenli bir şekilde kayıt olmasını, oturum açmasını ve profil yönetimi yapmasını sağlamalıdır. Çok adımlı e-posta doğrulama akışı uygulanmalıdır.

**Alt Gereksinimler:**
- FR-01.1: Kullanıcı ad, e-posta ve şifre ile kayıt olabilmelidir.
- FR-01.2: E-posta doğrulama için 6 haneli kod gönderilmelidir.
- FR-01.3: Kullanıcı oturumu JWT tabanlı olarak yönetilmelidir.
- FR-01.4: Veri paylaşım onayı alınmalıdır.

**Doğrulama Yaklaşımı:** Entegrasyon testleri ile tüm kimlik doğrulama akışlarının (kayıt, giriş, doğrulama) uçtan uca test edilmesi. Manuel QA ile kullanıcı arayüzü doğrulaması.

---

#### FR-02: Dashboard ve Ajan Yönetimi Arayüzü

**Açıklama:** Kullanıcılar, web tabanlı bir dashboard üzerinden ajanları yapılandırabilmeli, görev geçmişini görüntüleyebilmeli ve GitHub depolarını yönetebilmelidir.

**Alt Gereksinimler:**
- FR-02.1: GitHub organizasyon ve depo listesi görüntülenebilmelidir.
- FR-02.2: Ajan konfigürasyonu için adım adım sihirbaz sunulmalıdır.
- FR-02.3: Görev geçmişi tablo formatında listelenmelidir.
- FR-02.4: Görev detayları (zaman çizelgesi, okunan dokümanlar, üretilen dosyalar) görüntülenebilmelidir.

**Doğrulama Yaklaşımı:** Frontend birim testleri (Vitest), bileşen testleri (Testing Library) ve manuel kullanıcı kabul testleri.

---

#### FR-03: AKIS Scribe Ajanı

**Açıklama:** Scribe ajanı, belirtilen bir GitHub deposundaki kod değişikliklerini analiz ederek ilgili teknik dokümantasyonu otomatik olarak güncelleyebilmelidir.

**Alt Gereksinimler:**
- FR-03.1: Kullanıcı, hedef depo, branch ve platform seçebilmelidir.
- FR-03.2: Ajan, dry-run modunda önizleme sunabilmelidir.
- FR-03.3: Ajan, write modunda branch oluşturma, dosya commit ve PR açma işlemlerini gerçekleştirebilmelidir.
- FR-03.4: Ajan çalışma durumu (pending, running, completed, failed) takip edilebilmelidir.

**Doğrulama Yaklaşımı:** Backend entegrasyon testleri, MCP gateway mock testleri, dry-run ile işlevsellik doğrulaması.

---

#### FR-04: AKIS Trace Ajanı

**Açıklama:** Trace ajanı, Jira biletlerinden kabul kriterlerini çıkararak test senaryoları üretebilmeli ve otomasyon test koduna dönüştürebilmelidir.

**Alt Gereksinimler:**
- FR-04.1: Jira bilet anahtarı ile bilet detayları alınabilmelidir.
- FR-04.2: Kabul kriterleri ayrıştırılabilmelidir.
- FR-04.3: BDD formatında test senaryoları üretilebilmelidir (Gherkin).

**Doğrulama Yaklaşımı:** Birim testleri ile ayrıştırma (parsing) doğrulaması, örnek biletler ile manuel doğrulama.

---

#### FR-05: AKIS Proto Ajanı

**Açıklama:** Proto ajanı, verilen gereksinimlerden yola çıkarak çalışan bir MVP prototip üretebilmelidir.

**Alt Gereksinimler:**
- FR-05.1: Kullanıcı, doğal dilde gereksinim girebilmelidir.
- FR-05.2: Ajan, analiz, tasarım, kod üretimi ve test adımlarını sırayla gerçekleştirmelidir.
- FR-05.3: Üretilen kod çıktısı görüntülenebilmelidir.

**Doğrulama Yaklaşımı:** Örnek gereksinimler ile uçtan uca test, üretilen kodun derleme/çalışma kontrolü.

---

#### FR-06: GitHub Entegrasyonu

**Açıklama:** Sistem, GitHub API ile entegre çalışarak depo verilerine erişebilmeli ve değişiklik yapabilmelidir.

**Alt Gereksinimler:**
- FR-06.1: OAuth ile GitHub hesabı bağlanabilmelidir.
- FR-06.2: Kullanıcının organizasyonları ve depoları listelenebilmelidir.
- FR-06.3: Branch oluşturma, dosya commit ve PR açma işlemleri yapılabilmelidir.

**Doğrulama Yaklaşımı:** MCP gateway smoke testi, entegrasyon testleri, gerçek GitHub API ile manuel doğrulama.

---

#### FR-07: Görev İzleme ve Gözlemlenebilirlik (Observability)

**Açıklama:** Ajan görevleri detaylı şekilde izlenebilmeli ve hata ayıklama için yeterli bilgi sağlanmalıdır.

**Alt Gereksinimler:**
- FR-07.1: Görev zaman çizelgesi (timeline) adım adım görüntülenebilmelidir.
- FR-07.2: Okunan dokümanlar ve üretilen dosyalar listelenebilmelidir.
- FR-07.3: Hata durumlarında yapılandırılmış hata kodları ve öneriler sunulmalıdır.
- FR-07.4: Korelasyon kimliği (correlation ID) ile log takibi yapılabilmelidir.

**Doğrulama Yaklaşımı:** Manuel test senaryoları ile hata durumlarının doğrulanması, log çıktılarının incelenmesi.

---

### 3.2 Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements)

#### NFR-01: Performans

**Açıklama:** Sistem, OCI Free Tier kısıtları dahilinde kabul edilebilir performans göstermelidir.

**Kriterler:**
- API yanıt süresi: Ortalama < 500ms (veritabanı sorguları dahil)
- Ajan başlatma süresi: < 2 saniye
- Eşzamanlı kullanıcı desteği: En az 10 kullanıcı

**Doğrulama Yaklaşımı:** Yük testleri (load testing), yanıt süresi ölçümleri.

---

#### NFR-02: Güvenlik

**Açıklama:** Sistem, kullanıcı verilerini ve entegrasyon kimlik bilgilerini güvenli bir şekilde yönetmelidir.

**Kriterler:**
- Şifreler bcrypt ile hash'lenmelidir (minimum 12 round).
- JWT tokenları HTTP-only çerezlerde saklanmalıdır.
- Harici API tokenları şifreli olarak saklanmalıdır.
- Hassas bilgiler (secrets) log ve hata çıktılarından maskelenmelidir (secret redaction).
- E-posta doğrulama kodları için hız sınırlaması (rate limiting) uygulanmalıdır.

**Doğrulama Yaklaşımı:** Güvenlik denetimi (security audit), kod incelemesi, penetrasyon testi (scope dahilinde).

---

#### NFR-03: Kullanılabilirlik

**Açıklama:** Sistem arayüzü, teknik bilgisi olan kullanıcılar için anlaşılır ve kullanımı kolay olmalıdır.

**Kriterler:**
- Türkçe ve İngilizce dil desteği (i18n)
- Açık ve anlaşılır hata mesajları
- Mobil uyumlu (responsive) tasarım

**Doğrulama Yaklaşımı:** Kullanıcı kabul testleri, kullanılabilirlik değerlendirmesi.

---

#### NFR-04: Bakım Kolaylığı

**Açıklama:** Kod tabanı, modüler ve bakımı kolay bir yapıda olmalıdır.

**Kriterler:**
- TypeScript kullanımı ile tip güvenliği
- Tutarlı kod stili (ESLint, Prettier)
- Kapsamlı dokümantasyon
- Birim ve entegrasyon testleri

**Doğrulama Yaklaşımı:** Kod incelemesi, CI/CD pipeline başarı oranları, test kapsam raporları.

---

#### NFR-05: Ölçeklenebilirlik

**Açıklama:** Mimari, gelecekte yeni ajanlar ve entegrasyonlar eklenebilecek şekilde genişletilebilir olmalıdır.

**Kriterler:**
- Plugin benzeri ajan mimarisi
- MCP tabanlı entegrasyon deseni
- Servis katmanı ayrımı

**Doğrulama Yaklaşımı:** Mimari inceleme, yeni ajan ekleme senaryosu ile kavram kanıtı.

---

## 4. Sistem Tasarımı (System Design)

### 4.1 Üst Düzey Mimari (High-Level Architecture)

AKIS Platform, **Modüler Monolit** mimarisine dayanan bir yapıda tasarlanmıştır. Bu yaklaşım, OCI Free Tier kaynak kısıtları göz önünde bulundurularak seçilmiştir. Sistem, üç ana katmandan oluşmaktadır:

**Sunum Katmanı (Presentation Layer):** React ve Vite tabanlı tek sayfa uygulaması (SPA) olarak geliştirilen kullanıcı arayüzü, Tailwind CSS ile stillendirilmektedir. Bu katman, backend API'lerini çağırarak veri alışverişi yapar.

**İş Mantığı Katmanı (Business Logic Layer):** Fastify framework üzerinde çalışan Node.js backend, REST API uç noktalarını sunar. Merkezi Orkestratör bileşeni, ajan yaşam döngüsünü yönetir. Her ajan (Scribe, Trace, Proto) bağımsız bir modül olarak bu katmanda yer alır.

**Veri Katmanı (Data Layer):** PostgreSQL veritabanı, Drizzle ORM aracılığıyla erişilir. Kullanıcı bilgileri, ajan konfigürasyonları, görev kayıtları ve entegrasyon kimlik bilgileri bu katmanda saklanır.

**Harici Servis Katmanı (External Services Layer):** MCP adaptörleri aracılığıyla GitHub, Jira ve Confluence sistemleri ile iletişim kurulur. LLM çağrıları, OpenRouter veya benzeri API sağlayıcıları üzerinden gerçekleştirilir.

### 4.2 Ajan Motoru Kavramları (Core Agent Engine Concepts)

#### 4.2.1 Merkezi Orkestratör (Central Orchestrator)

Orkestratör, ajan iş akışlarının koordinasyonundan sorumlu merkezi bileşendir. Temel sorumlulukları şunlardır:

- İş akışı isteklerini alarak uygun ajanı başlatmak
- Ajan yaşam döngüsünü yönetmek (başlatma, izleme, sonlandırma)
- Kaynak kullanımını kontrol altında tutmak (eşzamanlı ajan limitleri)
- Hatları yakalamak ve uygun şekilde işlemek
- Gözlemlenebilirlik verilerini toplamak ve kaydetmek

#### 4.2.2 Ajan Rolleri

**AKIS Scribe:** Dokümantasyon güncelleme ajanıdır. Kod değişikliklerini analiz ederek teknik dökümanları otomatik olarak günceller. GitHub entegrasyonu üzerinden branch oluşturma, dosya değişikliği ve PR açma işlemlerini gerçekleştirir.

**AKIS Trace:** Test otomasyonu üretim ajanıdır. Jira biletlerinden kabul kriterlerini çıkarır ve BDD formatında (Gherkin) test senaryoları üretir. İleriki aşamalarda otomasyon kodu üretimi de hedeflenmektedir.

**AKIS Proto:** MVP prototipleme ajanıdır. Doğal dilde verilen gereksinimleri analiz ederek, tasarım, kod üretimi ve test adımlarını sırayla gerçekleştirir. Çalışan bir prototip çıktısı üretmeyi hedefler.

#### 4.2.3 Görev Yaşam Döngüsü (Job Lifecycle)

Her ajan görevi, tanımlı durumlar arasında geçiş yapar:

- **Pending (Beklemede):** Görev oluşturuldu, henüz başlamadı
- **Running (Çalışıyor):** Ajan aktif olarak çalışıyor
- **Completed (Tamamlandı):** Görev başarıyla tamamlandı
- **Failed (Başarısız):** Görev bir hata ile sonlandı

Bu durum makinesi (FSM) yaklaşımı, görev ilerlemesinin tutarlı bir şekilde takip edilmesini sağlar.

#### 4.2.4 Gözlemlenebilirlik Artefaktları (Observability Artifacts)

Her görev için aşağıdaki gözlemlenebilirlik verileri toplanır ve saklanır:

- **Timeline (Zaman Çizelgesi):** Adım adım yürütme kaydı, her adımın başlangıç/bitiş zamanları ve süresi
- **Documents (Dokümanlar):** Ajan tarafından okunan dosyalar ve dokümanlar
- **Files (Dosyalar):** Üretilen veya değiştirilen dosyalar
- **Plan (Plan):** Ajanın uygulamayı planladığı adımlar
- **Audit (Denetim):** Detaylı denetim kaydı

Bunlara ek olarak, kullanıcı arayüzünde ham (raw) veri görüntüleme ve hata durumlarında yapılandırılmış hata kodları ile öneriler sunulmaktadır.

### 4.3 Temel Veri Akışları (Key Data Flows)

#### 4.3.1 Kimlik Doğrulama Akışı (Authentication Flow)

AKIS Platform, çok adımlı kimlik doğrulama akışı uygulamaktadır:

**Kayıt Süreci:**
1. Kullanıcı ad ve e-posta girer; sistem 6 haneli doğrulama kodu gönderir
2. Kullanıcı şifre oluşturur
3. E-posta doğrulama kodu girilir ve doğrulanır; JWT oturum çerezi oluşturulur
4. Beta hoşgeldin ekranı gösterilir
5. Veri paylaşım onayı alınır

**Giriş Süreci:**
1. Kullanıcı e-posta girer; hesap varlığı ve doğrulanmış durumu kontrol edilir
2. Şifre girilir ve doğrulanır; JWT oturum çerezi oluşturulur

JWT tokenları, HTTP-only, secure ve SameSite=Lax özellikleriyle çerezlerde saklanır. Şifreler bcrypt ile hash'lenir (12 round). E-posta doğrulama kodları 15 dakika geçerlidir ve hız sınırlaması uygulanır.

#### 4.3.2 Görev Oluşturma ve Yürütme Akışı (Job Creation and Execution Flow)

1. Kullanıcı, dashboard üzerinden ajan konfigürasyonunu tamamlar
2. Frontend, ajan tipi ve parametreler ile POST isteği gönderir
3. Backend, görev kaydını oluşturur (pending durumunda)
4. Orkestratör, uygun ajanı başlatır (running durumuna geçiş)
5. Ajan, gerekli MCP çağrılarını ve LLM isteklerini gerçekleştirir
6. Her adım, gözlemlenebilirlik verileri olarak kaydedilir
7. Görev tamamlandığında (completed) veya başarısız olduğunda (failed) durum güncellenir
8. Kullanıcı, görev detaylarını görüntüleyebilir

#### 4.3.3 MCP Gateway Kullanımı (MCP Gateway Usage)

AKIS Platform, GitHub entegrasyonu için yerel bir MCP Gateway kullanmaktadır:

1. MCP Gateway, Docker Compose ile başlatılır
2. Backend, HTTP üzerinden Gateway'e JSON-RPC istekleri gönderir
3. Gateway, bu istekleri GitHub MCP Server'a (stdio tabanlı) iletir
4. GitHub MCP Server, GitHub REST API'yi kullanarak işlemleri gerçekleştirir
5. Yanıt, ters yönde backend'e döner

Bu mimari, doğrudan GitHub API kullanımına kıyasla standart bir entegrasyon katmanı sağlar ve gelecekte başka MCP sunucularının eklenmesini kolaylaştırır.

#### 4.3.4 GitHub Entegrasyon Akışı (GitHub Integration Flow)

1. Kullanıcı, GitHub OAuth ile hesabını bağlar
2. Sistem, erişim tokenını güvenli bir şekilde saklar
3. Dashboard, kullanıcının organizasyonlarını ve depolarını listeler
4. Scribe ajanı çalıştırıldığında, MCP Gateway üzerinden GitHub operasyonları gerçekleştirilir:
   - Branch oluşturma
   - Dosya içeriği okuma/yazma
   - Commit oluşturma
   - Pull Request açma (write modunda)

### 4.4 Güvenlik ve Yönetişim Değerlendirmeleri (Security & Governance Considerations)

#### 4.4.1 Gizli Bilgi Maskeleme (Secret Redaction)

Sistem, hassas bilgilerin yanlışlıkla ifşa edilmesini önlemek için kapsamlı maskeleme mekanizmaları içermektedir:
- GitHub tokenları (ghp_, gho_, ghs_, ghr_, ghu_, github_pat_ önekleri)
- npm tokenları (npm_ öneki)
- JWT tokenları ve Authorization başlıkları
- Ortam değişkenlerindeki hassas değerler

Bu bilgiler, log çıktılarında, hata mesajlarında ve kullanıcı arayüzünde otomatik olarak maskelenir.

#### 4.4.2 Hız Sınırlaması (Rate Limiting)

- E-posta doğrulama: 15 dakikada en fazla 3 deneme
- Genel API: Dakikada 100 istek (yapılandırılabilir)
- Ajan çalıştırma: Eşzamanlı ajan limitleri

#### 4.4.3 Oturum ve JWT Güvenliği (Session/JWT Cookie Approach)

- HTTP-only: JavaScript erişimi engellenir (XSS koruması)
- Secure: Yalnızca HTTPS üzerinden gönderilir (prodüksiyonda)
- SameSite=Lax: CSRF saldırılarına karşı koruma
- 7 gün geçerlilik süresi

#### 4.4.4 Yönetişim (Governance)

- Merkezi orkestratör, tüm ajan aktivitelerini denetler
- Ajan sözleşmeleri (contracts) ve iş şablonları (playbooks) kuralları tanımlar
- Gözlemlenebilirlik verileri, denetim izi (audit trail) oluşturur
- Definition of Done (DoD) kontrol listeleri, çıktı kalitesini garanti eder

---

## 5. Tamamlanan Görevler (Tasks Accomplished)

### 5.1 Faz ve Sprint Özeti

AKIS Platform geliştirmesi, tanımlı fazlar ve sprintler halinde ilerlemektedir. Bu bölüm, raporun hazırlandığı tarih (23 Aralık 2025) itibarıyla tamamlanan çalışmaları özetlemektedir.

| Faz | Durum | Açıklama |
|-----|-------|----------|
| 0.1 – 0.3 | ✅ Tamamlandı | Temeller, Mimari, Çekirdek Motor |
| 0.4 | 🔄 Devam Ediyor | Web Shell + Basit Motor (S0.4.6 mevcut sprint) |
| 0.5 | 📋 Planlandı | Motor + GitHub Entegrasyonu |
| 1.0 | 📋 Planlandı | Scribe • Trace • Proto – Early Access |

### 5.2 Tamamlanan Teslimatlar (Deliverables Completed)

#### 5.2.1 Kullanıcı Arayüzü (UI)

- ✅ Dashboard ana yapısı ve navigasyon
- ✅ Çok adımlı kayıt ve giriş akışları (Cursor tarzı UX)
- ✅ Scribe ajan konfigürasyon sihirbazı (Step 1-2 tamamlandı)
- ✅ Görev listesi ve detay görünümü
- ✅ Görev detayları için sekmeli arayüz (Overview, Timeline, Documents, Files, Plan, Audit, Raw)
- ✅ Türkçe/İngilizce dil desteği (i18n)
- ✅ Koyu/Açık tema desteği

#### 5.2.2 Backend ve Orkestratör

- ✅ Fastify tabanlı REST API sunucusu
- ✅ Drizzle ORM ile veritabanı katmanı
- ✅ JWT tabanlı kimlik doğrulama sistemi
- ✅ E-posta doğrulama servisi
- ✅ Merkezi orkestratör iskeleti
- ✅ Scribe ajanı temel implementasyonu
- ✅ Görev durum yönetimi (FSM)

#### 5.2.3 MCP Gateway

- ✅ HTTP-to-stdio köprüsü (JSON-RPC)
- ✅ Docker Compose yapılandırması
- ✅ Otomatik kurulum scripti (mcp-doctor.sh)
- ✅ Yapılandırılmış hata kodları (MCP_UNREACHABLE, MCP_TIMEOUT, MCP_CONFIG_MISSING vb.)
- ✅ Korelasyon kimliği (correlation ID) takibi
- ✅ Smoke test scripti

#### 5.2.4 CI/CD ve Otomasyon

- ✅ GitHub Actions workflow (backend ve frontend ayrı job'lar)
- ✅ PostgreSQL 16 test servisi
- ✅ Drizzle migration otomasyonu
- ✅ Typecheck, lint ve test adımları
- ✅ PR otomasyon scripti (akis-pr-autoflow.sh)

#### 5.2.5 Test ve Kalite Güvencesi

- ✅ Backend: 133 test, tamamı geçiyor
- ✅ Frontend: Stabil test suite, deterministik polling
- ✅ Lint/Typecheck: Sıfır hata
- ✅ Güvenlik: Otomatik token tarama, hassas bilgi maskeleme

### 5.3 Mevcut Sprint Durumu: S0.4.6

Mevcut sprint (S0.4.6), Scribe Config Dashboard geliştirmesine odaklanmaktadır:

| Adım | Açıklama | Durum |
|------|----------|-------|
| Step 1 | Pre-flight checks (GitHub connection) | ✅ Tamamlandı |
| Step 2 | SearchableSelect for Owner/Repo/Branch | ✅ Tamamlandı |
| Step 3 | Target platform configuration | 🔄 Devam Ediyor |
| Step 4 | Advanced options | 📋 Bekliyor |
| Step 5 | Review and save | 📋 Bekliyor |

### 5.4 Yaklaşan Kilometre Taşları

| Kilometre Taşı | Tarih | Sorumlu | Durum |
|----------------|-------|---------|-------|
| Phase 1 Functional Complete | 2025-12-25 | Yasir | 📋 Yaklaşıyor |
| SDTA Dokümanı (D2) | 2025-12-26 | Ayşe | ✅ Bu doküman |
| Demo Teslimi | 2026-01-26 | Ekip | 📋 Planlandı |

---

## 6. Kaynakça (Bibliography)

1. Anthropic. (2024). *Model Context Protocol Specification*. https://modelcontextprotocol.io/

2. GitHub. (2024). *GitHub MCP Server Documentation*. https://github.com/github/github-mcp-server

3. Fastify. (2024). *Fastify Documentation*. https://fastify.dev/

4. Drizzle Team. (2024). *Drizzle ORM Documentation*. https://orm.drizzle.team/

5. React Team. (2024). *React Documentation*. https://react.dev/

6. Vite. (2024). *Vite Documentation*. https://vitejs.dev/

7. Oracle. (2024). *Oracle Cloud Infrastructure Free Tier*. https://www.oracle.com/cloud/free/

8. Wooldridge, M. (2009). *An Introduction to MultiAgent Systems*. John Wiley & Sons.

9. Rao, A. S., & Georgeff, M. P. (1995). BDI agents: From theory to practice. *Proceedings of the First International Conference on Multi-Agent Systems*, 312-319.

10. PostgreSQL Global Development Group. (2024). *PostgreSQL Documentation*. https://www.postgresql.org/docs/

11. Tailwind Labs. (2024). *Tailwind CSS Documentation*. https://tailwindcss.com/docs

12. Auth0. (2024). *JSON Web Token Introduction*. https://jwt.io/introduction

---

## 7. Ekler (Appendices)

### Appendix A: Olgular ve Değişmezler (Facts & Invariants)

Bu bölüm, D1 (Proje Kapsamı ve Gereksinimler) dokümanından ve kanonik proje belgelerinden türetilen, sabit kalması gereken temel ifadeleri içermektedir.

#### A.1 Problem Tanımı (Sabit)

1. Yazılım projelerinde teknik dokümantasyon, kod değişiklikleri karşısında güncel tutulamamaktadır.
2. Test otomasyonu üretimi, yoğun zaman ve efor gerektirmektedir.
3. MVP prototipleme süreci, günler veya haftalar sürebilmektedir.

#### A.2 Proje Hedefleri (Sabit)

- H1: Otonom ajanların görev akışlarını koordine eden modüler sistem altyapısı
- H2: Mevcut araçlarla (GitHub, Jira, Confluence) güvenli API entegrasyonu
- H3: Üç otonom ajan: AKIS Scribe, AKIS Trace, AKIS Proto
- H4: North Star Metric olarak "kazanılan zaman" ve alt metrikler
- H5: Güvenlik, kalite güvencesi ve yönetişim standartları
- H6: Akademik çıktılar: prototip, dokümantasyon, demo videosu, rapor

#### A.3 Kapsam Sınırları (Sabit)

**Dahil:**
- Kullanıcı yönetimi ve çok adımlı kimlik doğrulama
- Web tabanlı dashboard
- Üç otonom ajan (Scribe, Trace, Proto)
- GitHub, Jira, Confluence entegrasyonları

**Hariç:**
- No-code ajan oluşturma sihirbazı
- Tam kurumsal RBAC
- Slack, Teams, VS Code entegrasyonları
- Ücretli LLM optimizasyonu
- Code review/refactoring ajanları
- Karmaşık SaaS faturalandırma

#### A.4 Teknik Kısıtlar (Sabit)

- **Altyapı:** OCI Free Tier (4 OCPU, 24 GB RAM, ARM)
- **Bütçe:** Sıfıra yakın
- **Ekip:** 2 kişi
- **Takvim:** Demo: 26 Ocak, Final: 22 Mayıs

#### A.5 Teknoloji Stack (Kanonik)

- **Backend:** Node.js (≥20), Fastify, TypeScript
- **ORM:** Drizzle (Prisma değil)
- **Veritabanı:** PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS
- **Şifre Hash:** bcrypt (12 round)
- **Auth:** JWT, HTTP-only cookie

---

### Appendix B: Tutarlılık Kontrol Listesi (Consistency Checklist)

Bu bölüm, SDTA dokümanının D1 ve kanonik proje dokümanları ile çelişmediğini doğrulayan kontrolleri içermektedir.

| # | Kontrol Maddesi | D1 Referansı | SDTA Tutarlılığı | Durum |
|---|-----------------|--------------|------------------|-------|
| 1 | Problem tanımı 3 ana alan içeriyor (dokümantasyon, test, prototipleme) | D1 §1.2 | Evet, §1.1.2'de aynı 3 problem | ✅ GEÇER |
| 2 | Hedefler H1-H6 korunuyor | D1 §1.5 | Evet, §1.1.4 ve Appendix A.2'de aynı | ✅ GEÇER |
| 3 | Kapsam dahil/hariç listesi uyumlu | D1 §2.2, §2.3 | Evet, §1.2.2 ve §1.2.3 aynı | ✅ GEÇER |
| 4 | Üç ajan: Scribe, Trace, Proto | D1 §B.1-B.3 | Evet, §3.1 FR-03, FR-04, FR-05 | ✅ GEÇER |
| 5 | Entegrasyonlar: GitHub, Jira, Confluence | D1 §C | Evet, §3.1 FR-06 ve §4.3.4 | ✅ GEÇER |
| 6 | OCI Free Tier altyapı kısıtı | D1 §2.4 | Evet, §4.1 ve Appendix A.4 | ✅ GEÇER |
| 7 | Ekip 2 kişi | D1 §2.4 | Evet, §1.2.4 ve Appendix A.4 | ✅ GEÇER |
| 8 | Bütçe sıfıra yakın | D1 §2.4 | Evet, §1.2.4 | ✅ GEÇER |
| 9 | Teknoloji stack: Fastify (Next.js değil) | CONTEXT_ARCHITECTURE | Evet, §4.1 Fastify | ✅ GEÇER |
| 10 | ORM: Drizzle (Prisma değil) | CONTEXT_ARCHITECTURE | Evet, §4.1 Drizzle | ✅ GEÇER |
| 11 | Şifre hash: bcrypt 12 round | D1 §A1, CONTEXT_ARCHITECTURE §7.1 | Evet, §4.4.1 bcrypt 12 round | ✅ GEÇER |
| 12 | JWT HTTP-only cookie | D1 §A1, CONTEXT_ARCHITECTURE §7.4 | Evet, §4.3.1 ve §4.4.3 | ✅ GEÇER |
| 13 | Çok adımlı auth (5 kayıt, 2 giriş adımı) | D1 §A1 | Evet, §4.3.1 aynı akış | ✅ GEÇER |
| 14 | E-posta doğrulama 6 haneli kod | D1 §A1 | Evet, §4.3.1 | ✅ GEÇER |
| 15 | Rate limiting doğrulama | D1 §A1 (15 dk, 3 deneme) | Evet, §4.4.2 | ✅ GEÇER |
| 16 | MCP entegrasyon deseni | CONTEXT_ARCHITECTURE §3 | Evet, §4.3.3 ve §2.1 | ✅ GEÇER |
| 17 | Modüler Monolit + Orchestrator mimarisi | CONTEXT_ARCHITECTURE §1 | Evet, §4.1 ve §4.2.1 | ✅ GEÇER |
| 18 | MVP hedefi (not no-code wizard) | D1 §2.3 | Evet, §1.2.3 kapsam dışı | ✅ GEÇER |
| 19 | Akademik çıktılar D1, D2, D3 | D1 §D | Evet, §1.2.2 D | ✅ GEÇER |
| 20 | Demo deadline 26 Ocak | D1 §2.4 | Evet, §5.4 | ✅ GEÇER |

---

**Tutarlılık Kontrolü Sonucu: ✅ GEÇER (20/20)**

Bu doküman (D2: Çözüm Tasarımı ve Teknik Analiz), D1 (Proje Kapsamı ve Gereksinimler) dokümanı ve kanonik proje belgeleri (CONTEXT_SCOPE.md, CONTEXT_ARCHITECTURE.md) ile tam tutarlıdır. Hiçbir çelişki tespit edilmemiştir.

---

### Revizyon Notları (v1.2)

Bu bölüm, SDTA dokümanında yapılan güncellemeleri özetlemektedir:

| Sürüm | Tarih | Değişiklik |
|-------|-------|------------|
| 1.0 | 23 Aralık 2025 | İlk sürüm oluşturuldu |
| 1.2 | 23 Aralık 2025 | D1 tutarlılık kontrolü, ajan durumları doğrulandı |

**v1.2 Değişiklikleri:**
- OAuth backend implementasyonu doğrulandı (auth.oauth.ts tam işlevsel)
- Scribe ajanı aktif geliştirme aşamasında (S0.4.6)
- Trace ve Proto ajanları iskelet olarak tanımlandı, Phase 1'de planlandı
- D1 ile tutarlılık kontrol listesi (20 madde) doğrulandı

---

**Doküman Sonu**

*Bu doküman, AKIS Platform bitirme projesi için hazırlanmıştır.*  
*Sürüm: 1.2 | Son Güncelleme: 23 Aralık 2025*

