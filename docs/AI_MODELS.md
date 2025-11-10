# AKIS OpenRouter Model Rehberi

Bu dokümantasyon, AKIS Platform’un OpenRouter entegrasyonunda kullanılan model katalogunu, seçim mantığını ve gizlilik kontrollerini özetler.

## Desteklenen Modeller (Allow-list)

Platform yalnızca aşağıdaki modelleri çalıştırır; allow-list dışında bir `modelId` talebi sunucu tarafında `MODEL_NOT_ALLOWED` hatası üretir.

| Kimlik | Plan | Sağlayıcı | Bağlam | Context Sınıfı | Tool Use | Önerildiği Agent’lar | Gizlilik Notu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `deepseek/deepseek-r1:free` | Free | DeepSeek · OpenRouter | 163 840 | Large | Hayır | Scribe | Prompts kaydedilmez; dokümantasyon akışı için optimize. |
| `qwen/qwen3-coder:free` | Free | Qwen · OpenRouter | 262 144 | Ultra | Evet | Trace, Proto | Alibaba Cloud kayıt politikaları geçerli; hassas girdiler maskelenmeli. |
| `mistralai/mistral-nemo:free` | Free | Mistral · OpenRouter | 128 000 | Large | Hayır | Scribe, Trace, Proto | Deterministik fallback; hızlı yanıt, düşük maliyet. |
| `anthropic/claude-3.5-sonnet` | Premium | Anthropic · OpenRouter | 200 000 | Large | Evet | Scribe, Trace, Proto | Anthropic kötüye kullanım denetimi için promptları geçici kaydedebilir. |
| `openai/gpt-4.1` | Premium | OpenAI · OpenRouter | 128 000 | Large | Evet | Proto | OpenAI güvenlik log’ları devrede; bilgilendirilmiş onay zorunlu. |

## Varsayılan Modeller (Free)

`.env` dosyasında aşağıdaki anahtarlarla free plan varsayılanları güncellenebilir:

- `AKIS_MODEL_DEFAULT_SCRIBE=deepseek/deepseek-r1:free`
- `AKIS_MODEL_DEFAULT_TRACE=qwen/qwen3-coder:free`
- `AKIS_MODEL_DEFAULT_PROTO=qwen/qwen3-coder:free`

## UI Davranışı

- Model seçici iki sekmeden oluşur: **Önerilen (Ücretsiz)** ve **Premium**. Sekme değiştirildiğinde, önceki seçim korunur.
- Önerilen modeller `recommendedFor` alanına göre etiketlenir (sarı “Önerilen” rozeti).
- Premium sekmesinde model seçmek, onay modalı tetikler. Kullanıcı onay vermeden istek gönderilmez.
- Her model kartı; bağlam sınıfı, Tool Use desteği, sağlayıcı ve gizlilik notunu gösterir.

## Token Ön Uyarısı ve Otomatik Segmentasyon

- UI tarafında yaklaşık token değeri `len / 4` formülüyle hesaplanır ve model bağlam penceresiyle karşılaştırılır.
- %80 eşiği aşıldığında sarı uyarı gösterilir; bağlam sınırının aşılması halinde kullanıcıya “Otomatik segmentasyonu etkinleştir” seçeneği sunulur.
- Otomatik segmentasyon aktifse, backend aynı mantığı doğrular ve uzun girdileri bağlam limiti içinde kalacak şekilde parçalayarak işlendiğini notlara ekler.
- Otomatik segmentasyon kapalıyken bağlam sınırı aşılırsa istek 422 hatasıyla reddedilir.

## Fallback Merdiveni

`ModelRouter` aşağıdaki sırayla fallback uygular; her adım başarısızlık veya bağlam aşımı durumunda run notlarına kayıt edilir:

1. Kullanıcının seçtiği model
2. `deepseek/deepseek-r1:free` (free default)
3. `mistralai/mistral-nemo:free` (nihai fallback)

Premium modeller için fallback öncelikle free muadillere yönlenir (ör. `anthropic/claude-3.5-sonnet` ⇒ `deepseek/deepseek-r1:free` ⇒ `mistralai/mistral-nemo:free`).

## Premium Modeller ve Onay Süreci

- Premium modeller UI’da varsayılan olarak görünür, ancak çalıştırma aşamasında kullanıcıdan açık onay alınır.
- Onay, `/api/agents/run` isteğinde `consent.premium=true` parametresiyle sunucuya iletilir ve `agent_runs.notes` alanına kaydedilir.
- Onay verilmezse istek 412 kodu ile engellenir.

## OpenRouter Attribution ve Gizlilik

- Tüm OpenRouter çağrılarında aşağıdaki başlıklar sunucu tarafında zorunlu olarak eklenir:
  - `HTTP-Referer=${OPENROUTER_APP_REFERER}`
  - `X-Title=${OPENROUTER_APP_TITLE}`
- `OPENROUTER_APP_REFERER` ve `OPENROUTER_APP_TITLE` değerleri `.env` dosyasında set edilmelidir; aksi durumda varsayılan (“https://akis.local”, “AKIS Platform”) kullanılır.

## Run Notları

- Fallback, otomatik segmentasyon veya mock moda düşüş gibi durumlar `agent_runs.notes` alanında saklanır ve dashboard’da görüntülenir.
- Bu alan, kullanıcıya hangi modelin çalıştığını veya neden farklı bir modele düşüldüğünü açıklamak için kullanılır.


