# MLX-LM Gateway — Yerel LLM Servisi

**Konum:** `jarvis/services/mlx-llm/`
**Port:** 11435
**API:** OpenAI-uyumlu `/v1/chat/completions`
**Platform:** Apple Silicon only (M1/M2/M3/M4)

---

## Genel Bakış

MLX-LM Gateway, AKIS Platform için Apple Silicon üzerinde çalışan yerel LLM inference servisidir. Ollama yerine **MLX framework** kullanır — unified memory avantajıyla daha verimli çalışır.

### Neden Ollama Değil?

| Özellik | Ollama | MLX-LM |
|---------|--------|--------|
| Metal GPU | Kısmen | Tam optimizasyon |
| Unified Memory | Standart | Tam kullanım |
| Quantization | GGUF | Native MLX + GGUF |
| LoRA Fine-tune | Yok | Dahili destek |
| Chat Template | Model bağımlı | HF tokenizer native |
| Python API | Yok (CLI/HTTP) | Tam Python API |

---

## Kurulum

### Gereksinimler

- Apple Silicon Mac (M1+)
- Python >= 3.10
- macOS 13.5+

### Adımlar

```bash
cd services/mlx-llm

# Sanal ortam + bağımlılıklar
make install

# Hızlı CLI test (sunucu gerektirmez)
make test-cli

# Sunucu başlat
make run

# Sağlık kontrolü (başka terminal)
make health

# Test
make test
```

---

## API

### POST /v1/chat/completions

```bash
curl -s http://127.0.0.1:11435/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "Sen yardımcı bir asistansın."},
      {"role": "user", "content": "Merhaba"}
    ],
    "max_tokens": 256,
    "temperature": 0.2,
    "top_p": 0.95
  }'
```

### GET /v1/models

```bash
curl -s http://127.0.0.1:11435/v1/models
```

### GET /health

```bash
curl -s http://127.0.0.1:11435/health
```

---

## Model Profilleri

Jarvis SPEC'teki profil tanımlarına uygun:

| Profil | Model | RAM | Hız | Kullanım |
|--------|-------|-----|-----|----------|
| **FAST** | Qwen3-4B-4bit | 2.3 GB | 88 tok/s | Hızlı komutlar, basit Q&A |
| **BALANCED** | Qwen3-8B-4bit | 4.7 GB | 52 tok/s | Genel amaçlı (varsayılan) |
| **QUALITY** | DeepSeek-R1-14B-4bit | 8.4 GB | 27 tok/s | Karmaşık reasoning |
| **MAX** | DeepSeek-R1-32B-4bit | 18.5 GB | 2.3 tok/s | Araştırma (yavaş) |

Model değiştirme:

```bash
# Env ile
MLX_MODEL=mlx-community/DeepSeek-R1-Distill-Qwen-14B-4bit make run

# HTTP istek içinde
{"model": "mlx-community/DeepSeek-R1-Distill-Qwen-14B-4bit", "messages": [...]}
```

---

## Teknik Detaylar

### server.py Yapısı

```python
# Anahtar importlar
from mlx_lm import generate, load
from mlx_lm.models.cache import make_prompt_cache
from mlx_lm.sample_utils import make_sampler  # v0.30+ API

# Model uygulama başlangıcında yüklenir (tek sefer)
model, tokenizer = load(DEFAULT_MODEL)
prompt_cache = make_prompt_cache(model)

# Her istekte sampler oluşturulur
sampler = make_sampler(temp=temperature, top_p=top_p)
text = generate(model, tokenizer, prompt=prompt, sampler=sampler, ...)
```

### Önemli API Notları (mlx-lm v0.30+)

- `temp` / `top_p` doğrudan `generate()`'e geçmez
- `make_sampler()` ile sampler oluşturup `sampler=` parametresi olarak verilir
- KV cache quantization: `kv_bits=4` (büyük modellerde RAM tasarrufu)
- `max_kv_size` ile `kv_bits` birlikte kullanılamaz (RotatingKVCache NYI)

### Büyük Model Notları (32B)

24 GB RAM ile 32B model çalışır ama:
- Peak memory: 18.5 GB (24 GB sınırında)
- Generation: ~2.3 tok/s (swapping)
- `kv_bits=4` ile KV cache sıkıştırması gerekir
- Pratik günlük kullanım için 8B veya 14B önerilir

---

## Quantization & Convert

### HF modelini MLX formatına çevirme

```bash
# Basit (otomatik 4-bit)
mlx_lm.convert --model Qwen/Qwen3-4B-Instruct-2507 -q

# Detaylı kontrol
mlx_lm.convert --hf-path "mistralai/Mistral-7B-Instruct-v0.3" \
  --mlx-path "./mistral-7b-v0.3-4bit" \
  --dtype float16 --quantize --q-bits 4 --q-group-size 64
```

---

## LoRA Fine-Tune (Tool-Use)

Jarvis'e tool-use davranışı kazandırmak için:

```bash
pip install "mlx-lm[train]"

mlx_lm.lora --model mlx-community/Qwen3-4B-Instruct-2507-4bit \
  --train --data ./data --iters 600 --batch-size 1 --mask-prompt
```

---

## Bağımlılıklar

```
mlx-lm          # MLX inference + quantization + LoRA
fastapi          # HTTP framework
uvicorn[standard] # ASGI server
pydantic         # Veri doğrulama
hf_transfer      # Hızlı HF indirme (opsiyonel)
```
