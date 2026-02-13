# Yerel LLM Benchmark Raporu

**Tarih:** 2026-02-13
**Donanım:** MacBook Pro M4 Pro, 24 GB Unified Memory
**Yazılım:** mlx-lm v0.30.7, MLX v0.30.6, Python 3.12
**Mod:** High Power Mode

---

## Özet

Apple Silicon M4 Pro (24 GB) üzerinde MLX-LM framework ile 4 farklı model test edildi. Amaç: Jarvis asistanı ve AKIS Platform için en uygun yerel LLM profillerini belirlemek.

---

## Test Sonuçları

### 1. Qwen3-4B-Instruct-2507-4bit

| Metrik | Değer |
|--------|-------|
| **Parametre** | 4 milyar |
| **Quantization** | 4-bit |
| **Dosya Boyutu** | 2.1 GB |
| **Peak RAM** | 2.3 GB |
| **Prompt hızı** | 22.9 tok/s |
| **Generation hızı** | **88.5 tok/s** |
| **İlk token süresi** | ~1s |
| **Türkçe kalitesi** | Basit ama anlaşılır |
| **Profil** | FAST |

**Çıktı örneği:**
> "Merhaba Jarvis! Nasıl bisa? 😊"

**Yorum:** Çok hızlı, basit komutlar ve kısa Q&A için ideal. Karmaşık reasoning yapamaz.

---

### 2. Qwen3-8B-4bit ⭐ ÖNERİLEN

| Metrik | Değer |
|--------|-------|
| **Parametre** | 8 milyar |
| **Quantization** | 4-bit |
| **Dosya Boyutu** | 4.3 GB |
| **Peak RAM** | 4.7 GB |
| **Prompt hızı** | 48.1 tok/s |
| **Generation hızı** | **52.2 tok/s** |
| **İlk token süresi** | ~0.6s |
| **Türkçe kalitesi** | Çok iyi |
| **Profil** | BALANCED |

**Çıktı örneği:**
> "Merhaba, ben Qwen, Alibaba Cloud tarafından geliştirilen büyük bir yapay zeka modeli. Türkçe konuşabiliyorum ve sana çeşitli konularda yardımcı olabiliyorum. Sorduğun herhangi bir soruya detaylı ve akıllıca cevap verebilirim."

**Yorum:** En iyi hız/kalite dengesi. Türkçe çok iyi. Günlük Jarvis kullanımı için ideal. RAM'in sadece %20'sini kullanıyor.

---

### 3. DeepSeek-R1-Distill-Qwen-14B-4bit

| Metrik | Değer |
|--------|-------|
| **Parametre** | 14 milyar |
| **Quantization** | 4-bit |
| **Dosya Boyutu** | 7.8 GB |
| **Peak RAM** | 8.4 GB |
| **Prompt hızı** | 7.2 tok/s |
| **Generation hızı** | **27.5 tok/s** |
| **İlk token süresi** | ~2.5s |
| **Türkçe kalitesi** | İyi (reasoning İngilizce) |
| **Profil** | QUALITY |

**Çıktı örneği:**
> `<think>` İngilizce reasoning chain `</think>` → Türkçe yanıt

**Yorum:** Chain-of-thought reasoning gücü yüksek. Düşünme süreci İngilizce çıkıyor ama final yanıt Türkçe. Analiz ve karmaşık görevler için iyi.

---

### 4. DeepSeek-R1-Distill-Qwen-32B-4bit

| Metrik | Değer |
|--------|-------|
| **Parametre** | 32 milyar |
| **Quantization** | 4-bit |
| **Dosya Boyutu** | 17.2 GB |
| **Peak RAM** | 18.5 GB |
| **Prompt hızı** | 0.3 tok/s |
| **Generation hızı** | **2.3 tok/s** |
| **İlk token süresi** | ~70s |
| **Türkçe kalitesi** | Çok iyi |
| **Profil** | MAX (araştırma) |
| **Gerekli** | `kv_bits=4` |

**Yorum:** 24 GB'da çalışıyor ama sınırda — 18.5 GB peak memory, yoğun swapping. Gerçek zamanlı kullanım için uygun değil. Offline araştırma/analiz görevlerinde değerli.

---

## Karşılaştırma Tablosu

| Model | Param | RAM | Gen tok/s | Profil | Tavsiye |
|-------|-------|-----|-----------|--------|---------|
| Qwen3-4B | 4B | 2.3 GB | 88.5 | FAST | Hızlı komutlar |
| **Qwen3-8B** | **8B** | **4.7 GB** | **52.2** | **BALANCED** | **Varsayılan** |
| DeepSeek-R1-14B | 14B | 8.4 GB | 27.5 | QUALITY | Reasoning |
| DeepSeek-R1-32B | 32B | 18.5 GB | 2.3 | MAX | Offline analiz |

---

## RAM Bütçesi (24 GB)

```
24 GB Toplam Unified Memory
├── macOS + Sistem:    ~4 GB
├── LLM Model:         4.7 GB (Qwen3-8B) — veya 8.4 GB (14B)
├── Whisper STT:       1.5 GB
├── Piri RAG:          ~1 GB
├── Jarvis Daemon:     ~0.5 GB
├── SwiftUI UI:        ~0.3 GB
└── Boş:              ~12 GB (8B ile) veya ~8 GB (14B ile)
```

**Not:** 8B modelle 12 GB boş kalıyor — diğer uygulamalar rahat çalışır. 14B'ye geçince 8 GB boş kalır — hâlâ iyi. 32B'de sistem yoğun swapping yapar.

---

## Quantization Açıklaması

| Format | Param başına | 32B Model RAM | Kalite Kaybı |
|--------|-------------|---------------|-------------|
| FP32 (32-bit) | 4 byte | ~128 GB | Orijinal |
| FP16 (16-bit) | 2 byte | ~64 GB | ~%0 |
| 8-bit | 1 byte | ~32 GB | ~%1 |
| **4-bit** | **0.5 byte** | **~18 GB** | **~%2-5** |
| 2-bit | 0.25 byte | ~8 GB | ~%10+ |

4-bit = en iyi boyut/kalite dengesi. 24 GB makinede pratik olarak kullanılabilir en büyük modeller.

---

## Sonuç & Öneri

1. **Günlük Jarvis kullanımı:** Qwen3-8B-4bit (52 tok/s, 4.7 GB)
2. **Reasoning görevleri:** DeepSeek-R1-14B-4bit (27 tok/s, 8.4 GB)
3. **Araştırma:** DeepSeek-R1-32B-4bit (2.3 tok/s, yavaş ama güçlü)
4. **Hızlı komutlar:** Qwen3-4B-4bit (88 tok/s, deterministik fallback)

Gateway `server.py` istek bazında model değiştirebilir — bu sayede Jarvis LLM Router görevin karmaşıklığına göre profil seçer.
