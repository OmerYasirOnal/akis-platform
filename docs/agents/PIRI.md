# Piri Agent — RAG + Web Search Motoru

**Versiyon:** 3.0.0 | **Ortam:** Standalone (FastAPI, port 8000)

---

## Genel Bakış

Piri, AKIS Platform ekosisteminin bilgi tabanı ve web araması motorudur. Adını Piri Reis'ten alır — bilinmeyen sularda harita çıkaran kartograf gibi, Piri de sorulara cevap bulmak için bilgi tabanında ve internette arama yapar.

| Özellik | Açıklama |
|---------|----------|
| **RAG Pipeline** | FAISS + multilingual-e5-small + cross-encoder reranking |
| **Web Search** | Wikipedia (TR öncelikli) + DuckDuckGo hibrit |
| **Sorgu Genişletme** | fsm → Fatih Sultan Mehmet vb. kısaltma çözümleme |
| **Relevance Filter** | Sadece pozitif skorlu kaynaklar |
| **LLM** | Qwen2.5-0.5B (lokal) veya GPT-4o-mini (OpenAI API) |

---

## Kurulum

Piri, `devagents/piri` altında **submodule** olarak yer alır.

```bash
# Submodule güncellemesi
cd devagents && git submodule update --init --recursive piri

# Piri kurulumu
cd piri
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python ingest.py   # İlk kez: knowledge base indeksle
```

---

## Çalıştırma

```bash
cd piri
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

- **Web UI:** http://localhost:8000
- **API Info:** http://localhost:8000/api/info

---

## API Özeti

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/rag/query` | POST | RAG soru-cevap |
| `/rag/search` | POST | Semantik arama (üretim yok) |
| `/rag/web-search` | POST | Web arama + öğrenme |
| `/rag/evaluate` | POST | 5 boyutlu kalite değerlendirmesi |
| `/rag/learn` | POST | Metin ile bilgi tabanına ekleme |
| `/rag/upload` | POST | Dosya yükleme |
| `/generate` | POST | Serbest metin üretimi |

---

## AKIS Entegrasyonu

- **IDE:** vscode-akis extension'da Piri agent tipi tanımlı (`type: 'piri'`)
- **RAG M2 Plan:** M2-RAG-1 Python RAG Microservice — Piri v3 ile tamamlandı
- **Bağlantı:** Piri standalone servis olarak çalışır; AKIS backend ile HTTP entegrasyonu M2-RAG-5'te planlanıyor

---

## İlgili Dokümanlar

- [piri/README.md](../../piri/README.md) — Tam dokümantasyon
- [ENV_SETUP.md](../ENV_SETUP.md#piri-rag-engine-v3) — Ortam değişkenleri
- [INDEX.md](../INDEX.md) — Docs indeksi
