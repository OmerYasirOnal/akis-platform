# AKIS IDE — Literatür Taraması: AI-Entegre Geliştirme Ortamları

**Hazırlayan:** AKIS Platform Ekibi  
**Tarih:** 13 Şubat 2026  
**Kapsam:** VS Code Extension mimarisinde AI agent entegrasyonu, kod indeksleme, semantik arama ve proaktif geliştirici asistanları  
**İlişkili Dokümanlar:**  
- [AGENT_THINKING_VISUALIZATION_LITERATURE_REVIEW.md](./AGENT_THINKING_VISUALIZATION_LITERATURE_REVIEW.md)  
- [AGENT_UI_UX_LITERATURE_REVIEW.md](./AGENT_UI_UX_LITERATURE_REVIEW.md)  
- [LLM_INTEGRATION_SOFTWARE_ENGINEERING_LITERATURE_REVIEW.md](./LLM_INTEGRATION_SOFTWARE_ENGINEERING_LITERATURE_REVIEW.md)

---

## 1. Giriş ve Motivasyon

Bu literatür taraması, AKIS Platform'un VS Code Extension olarak geliştirilen IDE bileşeni için teorik temeli oluşturmaktadır. AKIS IDE, kullanıcıların terminal üzerinden komut çalıştırabildiği, dosya sistemini görüntüleyebildiği, workspace'i indeksleyebildiği ve AI agent'larıyla doğrudan IDE içinden etkileşim kurabildiği bir geliştirme ortamı sunmayı hedeflemektedir.

Tarama, dört ana eksende yapılmıştır:
1. **AI-Entegre IDE Mimarileri** — Yeni nesil akıllı geliştirme ortamları
2. **Kod İndeksleme ve Semantik Arama** — Codebase anlama ve retrieval
3. **Proaktif AI Asistanları** — Bağlam-farkındalıklı öneriler
4. **Altyapı: LSP ve tree-sitter** — Dil desteği ve artımlı parsing

---

## 2. AI-Entegre IDE Mimarileri

### 2.1 Yeni Nesil Akıllı Geliştirme Ortamları

**Marron, M. (2024).** *A New Generation of Intelligent Development Environments.* IDE Workshop @ ICSE'24, Lisbon, Portugal. ACM. [arXiv:2406.09577](https://arxiv.org/abs/2406.09577)

Marron, geleneksel IDE'lerin "insan-klavye başında" paradigmasından **"insan-proje yöneticisi"** paradigmasına geçişini savunmaktadır. Bu yeni modelde:

- **Geliştirici**, AI agent'larını ve otomasyonları yöneten bir küratör/yöneticidir
- **IDE**, iki temel rol üstlenir:
  1. İnsan ile AI agent'ları arasındaki iletişimi kolaylaştırmak
  2. Gereksinimlerden dağıtıma kadar iş akışını organize etmek

Bu vizyon, AKIS Platform'un agent orkestrasyon mimarisıyla doğrudan örtüşmektedir: Scribe, Trace, Proto ve Piri agent'ları görev-spesifik uzmanlıklarını sunarken, IDE kullanıcının bu agent'ları yönetmesini sağlar.

**AKIS için çıkarım:** AKIS IDE, kullanıcıyı "proje yöneticisi" konumuna yerleştirmeli; agent chat, job monitoring ve artifact review tek bir yüzey üzerinden sunulmalıdır.

---

### 2.2 LLM'ler IDE'ler için Evrensel Arayüz

**Zharov, Y., Khudyakov, A., Fedotova, A., Grigorenko, G., & Bogomolov, E. (2024).** *Tool-Augmented LLMs as a Universal Interface for IDEs.* IDE Workshop @ ICSE'24. ACM. [arXiv:2402.11635](https://arxiv.org/abs/2402.11635)

Zharov ve ark., LLM'lerin IDE fonksiyonlarına **evrensel sarmalayıcı (universal wrapper)** olarak hizmet edebileceğini öne sürmektedir. Modern IDE'lerdeki binlerce özellik karmaşık menüler ve kısayollar arkasında gizlenirken, tool-augmented LLM'ler doğal dil komutlarıyla çok adımlı aksiyonları gerçekleştirebilir.

**Temel kavramlar:**
- LLM, IDE tool'larını çağırarak görevleri tamamlar (tool-calling)
- Kullanıcı niyetini anlar ve uygun IDE aksiyonlarını orkestre eder
- Menü/arama sürtünmesini ortadan kaldırır

**AKIS için çıkarım:** AKIS IDE'deki agent chat paneli, VS Code komutlarını çağırabilecek tool-calling yeteneklerine sahip olmalıdır (dosya açma, terminal komutu çalıştırma, search yapma).

---

### 2.3 ChatLSP: AI ve Dil Sunucuları Entegrasyonu

**Omar, C. et al. (2024).** *ChatLSP: A Conservative Extension of the Language Server Protocol for AI-Assisted Code Completion.* OOPSLA 2024. [PDF](https://hazel.org/papers/chatlsp-oopsla2024.pdf)

Bu makale, Language Server Protocol'ün (LSP) AI kod tamamlama sistemleriyle entegrasyonu için ChatLSP uzantısını sunmaktadır. Temel bulgu: **tip bağlamsallaştırması (type contextualization)** LLM halüsinasyonlarını önemli ölçüde azaltmaktadır.

**Anahtar tez:** "AI'ların da IDE'lere ihtiyacı var" — AI-destekli geliştirme, dil sunucularının sağladığı statik analiz yeteneklerini gerektirir.

**AKIS için çıkarım:** AKIS IDE'nin kod indeksleme sistemi, tip ve binding bilgisini agent'lara bağlam olarak sağlamalıdır.

---

### 2.4 OpenDevin/OpenHands: Açık Platform AI Geliştiriciler

**Wang, X., Li, B. et al. (2024).** *OpenDevin: An Open Platform for AI Software Developers as Generalist Agents.* [arXiv:2407.16741](https://arxiv.org/abs/2407.16741)

OpenDevin (şimdi OpenHands), AI agent'larının genel amaçlı yazılım geliştiricileri olarak işlev görmesini sağlayan bir platform sunmaktadır:
- Kod yazma, CLI kullanma, web tarama
- Sandboxed code execution
- Multi-agent koordinasyon
- 15+ benchmark üzerinde değerlendirme

**AKIS için çıkarım:** Terminal entegrasyonu ve sandboxed execution, IDE'nin temel gereksinimleridir. AKIS'in mevcut agent orkestrasyon sistemi (FSM tabanlı) bu mimariye uyumludur.

---

### 2.5 Ölçeklenebilir Agent Scaffolding

**"Confucius Code Agent: Scalable Agent Scaffolding" (2025).** arXiv.

Büyük repo'larda çalışan agent'lar için:
- **Context management:** Büyük codebase'lerde ilgili bağlamın seçimi
- **Persistent notes:** Oturumlar arası öğrenme
- **Modüler uzantılar:** Pluggable araçlar
- **Meta-agent'lar:** Build → test → improve döngüsü

**AKIS için çıkarım:** Workspace indeksleme ve context pack mekanizması (mevcut RAG planı) ile uyumlu.

---

## 3. Kod İndeksleme ve Semantik Arama

### 3.1 NS3: Neuro-Symbolic Semantic Code Search

**Arakelyan, S., Hakhverdyan, A., Allamanis, M., Garcia, L., Hauser, C., & Ren, X. (2022).** *NS3: Neuro-Symbolic Semantic Code Search.* NeurIPS 2022. [Proceedings](https://proceedings.neurips.cc/paper_files/paper/2022/hash/43f5f6c5cb333115914c8448b8506411-Abstract-Conference.html)

NS3, semantik kod arama görevinde **Neural Module Network** mimarisi kullanarak sorguları alt adımlara ayrıştırır:

| Yaklaşım | NDCG Skoru | Karmaşık Sorgu Desteği |
|-----------|-----------|----------------------|
| CodeBERT | 0.31 | Düşük |
| GraphCodeBERT | 0.33 | Orta |
| **NS3** | **0.38** | **Yüksek** |

**Temel yenilik:** Bileşik sorguların (ör. "authentication fonksiyonu database bağlantısı ile") modüler ayrıştırılması ve çok adımlı akıl yürütme.

**AKIS için çıkarım:** M3'te semantic code search için bi-encoder + cross-encoder pipeline (Piri'de zaten mevcut) VS Code'a taşınabilir.

---

### 3.2 CodeSearchNet Benchmark

**Husain, H. et al. (2019).** *CodeSearchNet Challenge: Evaluating the State of Semantic Code Search.* [arXiv:1909.09436](https://arxiv.org/abs/1909.09436)

Temel benchmark:
- **6 milyon fonksiyon** (Go, Java, JavaScript, PHP, Python, Ruby)
- **99 doğal dil sorgusu** + 4.000+ uzman relevanslık notasyonu
- Bi-encoder, cross-encoder ve poly-encoder değerlendirmeleri

**AKIS için çıkarım:** Kod arama kalitesini değerlendirmek için CodeSearchNet metrikleri referans alınabilir.

---

### 3.3 Endüstriyel Kod İndeksleme Araçları

| Araç | Yaklaşım | Özellikler |
|------|----------|------------|
| **Cursor** | Özel embedding modeli | Codebase indeksleme, context-aware completions |
| **Probe** | ripgrep + tree-sitter | Lokal semantik arama, çoklu dil, CLI + MCP |
| **Scotch** | IDE-internal search | IDE içi semantik arama |
| **Sourcegraph** | Universal code search | Cross-repo arama, LSIF indeksleme |

**AKIS IDE MVP stratejisi:** Önce ripgrep + tree-sitter (P1), sonra embedding + FAISS (M3).

---

## 4. Proaktif AI Asistanları

### 4.1 Proaktif Tasarım Desenleri

**Chen, G. et al. (2024).** *Need Help? Designing Proactive AI Assistants for Programming.* CHI 2025. [arXiv:2410.04596](https://arxiv.org/abs/2410.04596)

Randomize deneysel çalışma, proaktif chat-tabanlı asistanların programcı üretkenliğini artırdığını bulmuştur:
- Otomatik öneri üretimi
- Kod entegrasyonu
- **Zamanlama ve yerleşim** kritik tasarım faktörleri

---

### 4.2 Asistan mı Kesinti mi?

**Pu, Z. et al. (2025).** *Assistance or Disruption? Exploring and Evaluating the Design and Trade-offs of Proactive AI Programming Support.* [arXiv:2502.18658](https://arxiv.org/abs/2502.18658)

Within-subject çalışma (N=18), üç arayüz varyantını karşılaştırmıştır:

| Varyant | Verimlilik | Kesinti | Kontrol |
|---------|-----------|---------|---------|
| Prompt-only | Temel | Düşük | Yüksek |
| Proactive agent | +%23 | Orta | Düşük |
| **Proactive + presence indicators** | **+%19** | **Düşük** | **Orta** |

**Temel bulgu:** Proaktif agent'lar verimliliği artırır ama **varlık göstergeleri (presence indicators)** ve **etkileşim bağlamı** olmadan iş akışını bozar.

**AKIS için çıkarım:** AKIS IDE'deki agent önerileri:
1. Status bar'da aktif agent durumu gösterilmeli (presence indicator)
2. Context-aware olmalı (kullanıcının ne yaptığını anlama)
3. İsteğe bağlı müdahale (opt-in, push değil)

---

### 4.3 CodingGenie

**CodingGenie (2025).** *A Proactive LLM-Powered Programming Assistant.* FSE Demo 2025. [arXiv:2503.14724](https://arxiv.org/abs/2503.14724)

Editöre entegre proaktif asistan:
- Kod bağlamından otomatik öneri (bug fix, unit test, refactor)
- Kullanıcı tercihleri ile özelleştirilebilir
- Açık kaynak

---

## 5. Altyapı: LSP ve tree-sitter

### 5.1 Language Server Protocol (LSP)

**Microsoft (2016–günümüz).** *Language Server Protocol Specification v3.17.* [microsoft.github.io](https://microsoft.github.io/language-server-protocol/)

LSP, IDE'ler ve dil sunucuları arasındaki iletişimi JSON-RPC ile standartlaştırır:

| Yetenek | Açıklama |
|---------|----------|
| Completion | Kod tamamlama önerileri |
| Diagnostics | Hata ve uyarı raporlama |
| Hover | Tip bilgisi gösterimi |
| Go to Definition | Tanıma gitme |
| References | Referans bulma |
| Formatting | Kod formatlama |
| Refactoring | Yeniden yapılandırma |

**AKIS IDE'de kullanım:** LSP, mevcut dil sunucularından (TypeScript, Python vb.) gelen bilgiyi agent'lara bağlam olarak sağlamak için kullanılacaktır. Extension, VS Code'un yerleşik LSP istemcisinden faydalanır.

---

### 5.2 tree-sitter: Artımlı Parsing Sistemi

**Brunsfeld, M. (2018).** *Tree-sitter: A New Parsing System for Programming Tools.* Strange Loop 2018. [GitHub](https://github.com/tree-sitter)

tree-sitter, kod anlama araçları için yüksek performanslı artımlı parser'dır:

**Teknik özellikler:**
- **LR tabanlı** parser generator
- **Artımlı parsing:** Kaynak değişikliklerinde sadece değişen kısımları yeniden parse eder
- **Hata toleransı:** Sözdizimi hatalarına rağmen parsing devam eder
- **Somut sözdizimi ağaçları (CST):** Tüm metin bilgisi korunur
- **C core:** Python, Rust, JavaScript, Go bağlamaları

**Kullanım alanları:** GitHub.com, Neovim, Emacs, Helix, Zed

**AKIS IDE'de kullanım:**
- Workspace indekslemede fonksiyon/sınıf/import çıkarımı
- AST düzeyinde kod anlama
- Agent'lara yapısal bağlam sağlama (ör. "bu fonksiyonun parametreleri ve dönüş tipi")

---

## 6. AKIS IDE Mimari Çıkarımları

Literatür taramasından çıkarılan mimari prensipler:

### 6.1 Tasarım İlkeleri

| # | İlke | Kaynak |
|---|------|--------|
| 1 | İnsan = proje yöneticisi, IDE = iletişim kolaylaştırıcı | Marron (2024) |
| 2 | LLM, IDE feature'larına evrensel arayüz olarak hizmet eder | Zharov et al. (2024) |
| 3 | Tip ve binding bağlamı LLM halüsinasyonlarını azaltır | Omar et al. (2024) |
| 4 | Proaktif öneriler varlık göstergeleriyle sunulmalı | Pu et al. (2025) |
| 5 | Kod arama: bi-encoder → cross-encoder iki aşamalı pipeline | Arakelyan et al. (2022) |
| 6 | Artımlı parsing ile gerçek zamanlı AST güncelleme | Brunsfeld (2018) |

### 6.2 Mimari Kararlar

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| Platform | VS Code Extension | Hızlı MVP, mevcut API'ler, LSP desteği |
| Chat UI | WebView (React) | Mevcut AKIS frontend bileşenleri yeniden kullanılabilir |
| Kod parsing | tree-sitter | Artımlı, hata toleranslı, çoklu dil |
| Text search | ripgrep wrapper | Hızlı, VS Code'da yerleşik |
| Semantic search | Embedding + FAISS (M3) | Piri'nin mevcut pipeline'ı taşınabilir |
| Backend bağlantısı | AKIS REST API + SSE | Mevcut altyapı, ek geliştirme gerektirmez |
| Auth | API Token (VS Code Settings) | Cookie-based auth IDE'de pratik değil |

### 6.3 Kademeli Geliştirme Yol Haritası

```
M2 MVP (Mart 2026)
├── Sidebar: Agent listesi + job durumu (TreeView)
├── Chat: Agent konuşma (WebView + SSE)
├── Terminal: Komut çalıştırma + çıktı agent'a gönderme
├── Status Bar: Aktif job göstergesi
└── File indexing: tree-sitter + ripgrep (P1)

M3 Full (Mayıs 2026)
├── Semantic search: Embedding + FAISS (lokal)
├── Multi-agent crew: IDE'den crew run başlatma
├── Code diff preview: Agent önerisi vs mevcut kod
├── Inline annotations: Agent önerileri satır içi
└── Context packs: Workspace bağlamını agent'lara gönderme
```

---

## 7. Referanslar

### Q1/Q2 Akademik Yayınlar

1. **Marron, M. (2024).** *A New Generation of Intelligent Development Environments.* IDE Workshop @ ICSE'24. ACM. DOI: 10.1145/3643796.3648452
2. **Zharov, Y., Khudyakov, A., Fedotova, A., Grigorenko, G., & Bogomolov, E. (2024).** *Tool-Augmented LLMs as a Universal Interface for IDEs.* IDE Workshop @ ICSE'24. ACM. arXiv:2402.11635
3. **Omar, C. et al. (2024).** *ChatLSP: A Conservative Extension of the Language Server Protocol for AI-Assisted Code Completion.* OOPSLA 2024.
4. **Arakelyan, S., Hakhverdyan, A., Allamanis, M., Garcia, L., Hauser, C., & Ren, X. (2022).** *NS3: Neuro-Symbolic Semantic Code Search.* NeurIPS 2022.
5. **Husain, H. et al. (2019).** *CodeSearchNet Challenge: Evaluating the State of Semantic Code Search.* arXiv:1909.09436
6. **Wang, X., Li, B. et al. (2024).** *OpenDevin: An Open Platform for AI Software Developers as Generalist Agents.* arXiv:2407.16741
7. **Chen, G. et al. (2024).** *Need Help? Designing Proactive AI Assistants for Programming.* CHI 2025. arXiv:2410.04596
8. **Pu, Z. et al. (2025).** *Assistance or Disruption? Exploring the Design and Trade-offs of Proactive AI Programming Support.* arXiv:2502.18658
9. **CodingGenie (2025).** *A Proactive LLM-Powered Programming Assistant.* FSE Demo 2025. arXiv:2503.14724

### Teknik Standartlar ve Araçlar

10. **Microsoft (2016–günümüz).** *Language Server Protocol Specification v3.17.* https://microsoft.github.io/language-server-protocol/
11. **Brunsfeld, M. (2018).** *Tree-sitter: A New Parsing System for Programming Tools.* Strange Loop 2018. https://github.com/tree-sitter
12. **Nghiem, H., Nguyen, T., & Bui, N. (2024).** *Envisioning the Next-Generation AI Coding Assistants.* arXiv (cs.SE).

---

*Bu doküman, AKIS Platform'un VS Code Extension (AKIS IDE) bileşeni için teorik temeli oluşturmaktadır. M2 Sprint planıyla birlikte okunmalıdır.*
