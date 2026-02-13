# Jarvis Agent — Yerel Sesli AI Asistan

**Agent ID:** `jarvis-v1`
**Kaynak:** `devagents/jarvis/` (bağımsız repo: `~/jarvis`)
**Versiyon:** S0.5 → v2 geçiş aşamasında
**Platform:** macOS (Apple Silicon, M4 Pro)

---

## 1. Jarvis Nedir?

Jarvis, AKIS Platform'un **yerel sesli AI asistanıdır**. macOS üzerinde always-on-top floating avatar olarak çalışır. "Hey Jarvis" wake word ile aktive olur, Türkçe sesli komutları anlayıp yerel LLM ile yanıt üretir.

Diğer AKIS agentlarından (Scribe, Trace, Proto) farklı olarak Jarvis **kullanıcının masaüstünde** yaşar ve doğrudan sesli etkileşim sağlar.

| Özellik | Detay |
|---------|-------|
| **Wake Word** | "Hey Jarvis" (OpenWakeWord, offline) |
| **STT** | Whisper Large v3 Turbo (MLX, Türkçe optimize) |
| **LLM** | MLX-LM Gateway (Apple Silicon unified memory) |
| **TTS** | macOS `say` komutu |
| **Araçlar** | 35+ tool (app açma, URL, sistem, notlar, medya, hesaplama) |
| **UI** | SwiftUI floating avatar (MINI/ACTIVE/SLEEP) |

---

## 2. Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    JARVIS DAEMON (Python)                    │
├─────────────────────────────────────────────────────────────┤
│  WakeWord (OpenWakeWord) → STT (Whisper) → Intent Router    │
│         ↓                                     ↓             │
│    debounce/cooldown              deterministic / LLM       │
│                                           ↓                 │
│  Audio Lock (mutex)  ←────────→  Tool Executor (35+)        │
│  Recording ↔ TTS                          ↓                 │
│                                    TTS (macOS say)          │
│                                           ↓                 │
│                              WebSocket → SwiftUI UI         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  HTTP (localhost:11435)
┌─────────────────────────────────────────────────────────────┐
│              MLX-LM Gateway (FastAPI + Uvicorn)             │
│  • OpenAI-uyumlu /v1/chat/completions                       │
│  • Model: Qwen3-8B-4bit (varsayılan)                        │
│  • Prompt cache, chat template, unified memory              │
└─────────────────────────────────────────────────────────────┘
```

### Durum Makinesi (FSM)

```
IDLE ──wake──► WAKE_DETECTED ──0.6s──► LISTENING ──stt──► THINKING
                                            ▲                  │
                                            │                  ▼
                                       FOLLOWUP ◄────── SPEAKING
                                            │
                                      5s sessizlik
                                            ▼
                                          IDLE
```

---

## 3. LLM Katmanı — MLX-LM Gateway

Jarvis, Ollama yerine **MLX-LM** kullanır. Apple Silicon'da unified memory avantajıyla çok daha verimli çalışır.

### Gateway Servisi

| Özellik | Değer |
|---------|-------|
| **Konum** | `services/mlx-llm/server.py` |
| **Port** | 11435 |
| **API** | OpenAI-uyumlu `/v1/chat/completions` |
| **Framework** | FastAPI + Uvicorn |
| **Varsayılan Model** | `mlx-community/Qwen3-8B-4bit` |

### Test Edilen Modeller (M4 Pro, 24GB)

| Model | Parametre | RAM | Gen tok/s | Durum |
|-------|-----------|-----|-----------|-------|
| Qwen3-4B-4bit | 4B | 2.3 GB | 88.5 | ✅ Mükemmel hız |
| **Qwen3-8B-4bit** | 8B | 4.7 GB | **52.2** | ✅ **Önerilen** |
| DeepSeek-R1-14B-4bit | 14B | 8.4 GB | 27.5 | ✅ Reasoning için |
| DeepSeek-R1-32B-4bit | 32B | 18.5 GB | 2.3 | ⚠️ Çalışır ama yavaş |

### Quantization (4-bit) Açıklaması

Model ağırlıkları 32-bit (4 byte/param) yerine 4-bit (0.5 byte/param) olarak saklanır. Bu sayede:
- 32B model: 64 GB → **~18 GB** (8x küçültme)
- Kalite kaybı: ~%2-5 (günlük kullanımda fark edilmez)
- 24 GB M4 Pro'da 32B'ye kadar modeller sığar

---

## 4. Hybrid LLM Routing

| Kategori | Model Seçimi |
|----------|-------------|
| **Hızlı Komutlar** | Deterministik regex veya Qwen3-4B |
| **Genel Sohbet** | Qwen3-8B (varsayılan) |
| **Reasoning/Analiz** | DeepSeek-R1-14B |
| **Gizlilik Hassas** | HER ZAMAN YEREL |
| **Web Gerektiren** | Piri RAG + web search |

---

## 5. Piri Entegrasyonu

Jarvis, bilgi tabanı sorguları için **Piri RAG**'a HTTP üzerinden bağlanır:

```
Jarvis LLM Router → Piri RAG (localhost:8000)
                         ↓
                   FAISS + Web Search
                         ↓
                   Grounded Response
```

---

## 6. Dosya Yapısı

```
jarvis/
├── services/mlx-llm/     # MLX-LM Gateway
│   ├── server.py          # FastAPI endpoint
│   ├── requirements.txt
│   ├── Makefile
│   └── README.md
├── core/                  # Python daemon
├── config/                # Ayarlar
├── JarvisUI/              # SwiftUI uygulaması
├── tools/                 # Tool tanımları
├── memory/                # Bellek sistemi
├── tests/                 # Test suite
└── docs/                  # Proje dokümanları
```

---

## 7. Kurulum & Çalıştırma

```bash
# MLX-LM Gateway kurulumu
cd jarvis/services/mlx-llm
make install
make run

# Jarvis daemon
cd jarvis
./start_jarvis.sh
```

---

## 8. Sonraki Adımlar (v2 Yol Haritası)

- [ ] AKIS `devagents/jarvis/` olarak entegrasyon
- [ ] Piri RAG bağlantısı (bilgi tabanı sorguları)
- [ ] Streaming SSE desteği
- [ ] Tool-use LoRA fine-tune
- [ ] mlx-audio ile STT/TTS (Whisper + TTS tamamen MLX)
- [ ] Web agent (Brave Search + web scraper)
- [ ] Kullanıcı profili ve öğrenme sistemi
