# Akıllı Otomasyonlar (Smart Automations)

RSS kaynaklarından günlük içerik toplayıp AI ile LinkedIn taslağı üreten otomasyon sistemi.

## Genel Bakış

Smart Automations, kullanıcıların:
- Birden fazla RSS kaynağını takip etmesine
- Belirlenen saatte otomatik içerik toplamasına
- AI ile LinkedIn post taslağı oluşturmasına
- Slack/in-app bildirim almasına

olanak tanır.

## Veri Modeli

### Tablolar

#### `smart_automations`
Otomasyon tanımlarını saklar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| user_id | UUID | Sahip kullanıcı |
| name | VARCHAR(255) | Otomasyon adı |
| topics | JSONB | Konu/anahtar kelimeler (string[]) |
| sources | JSONB | RSS kaynakları ({url, type}[]) |
| schedule_time | VARCHAR(5) | HH:MM formatında çalışma saati |
| timezone | VARCHAR(50) | IANA timezone (Europe/Istanbul) |
| output_language | VARCHAR(10) | tr veya en |
| style | VARCHAR(50) | linkedin |
| delivery_in_app | BOOLEAN | Uygulama içi bildirim |
| delivery_slack | BOOLEAN | Slack bildirimi |
| slack_channel | VARCHAR(100) | Slack kanal ID |
| enabled | BOOLEAN | Aktif/pasif durumu |
| mode | VARCHAR(50) | draft_only (MVP) |
| next_run_at | TIMESTAMP | Sonraki planlı çalışma |
| last_run_at | TIMESTAMP | Son çalışma zamanı |

#### `smart_automation_runs`
Her çalıştırma kaydı.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| automation_id | UUID | İlişkili otomasyon |
| status | ENUM | pending, running, success, failed |
| output | TEXT | Oluşturulan LinkedIn taslağı |
| summary | TEXT | AI özeti |
| item_count | INTEGER | İşlenen içerik sayısı |
| error | TEXT | Hata mesajı |
| slack_message_ts | VARCHAR(50) | Slack mesaj timestamp |
| slack_sent | BOOLEAN | Slack gönderildi mi |

#### `smart_automation_items`
Seçilen içerikler (dedupe için).

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| run_id | UUID | İlişkili run |
| title | VARCHAR(500) | İçerik başlığı |
| link | VARCHAR(2000) | Kaynak URL |
| link_hash | VARCHAR(64) | SHA-256 hash (dedupe) |
| excerpt | TEXT | Özet/açıklama |
| published_at | TIMESTAMP | Yayın tarihi |
| source | VARCHAR(255) | Kaynak adı |

## API Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/smart-automations` | Yeni otomasyon oluştur |
| GET | `/api/smart-automations` | Kullanıcının otomasyonlarını listele |
| GET | `/api/smart-automations/:id` | Detay + son run'lar |
| PATCH | `/api/smart-automations/:id` | Güncelle |
| DELETE | `/api/smart-automations/:id` | Sil |
| POST | `/api/smart-automations/:id/run` | Manuel çalıştır |
| GET | `/api/smart-automations/:id/runs/:runId` | Run detayı + items |
| POST | `/api/smart-automations/:id/runs/:runId/resend-slack` | Slack'e tekrar gönder |

### Request/Response Örnekleri

#### Otomasyon Oluşturma
```json
POST /api/smart-automations
{
  "name": "Günlük AI Haberleri",
  "topics": ["yapay zeka", "machine learning", "LLM"],
  "sources": [
    { "url": "https://news.ycombinator.com/rss", "type": "rss" },
    { "url": "https://techcrunch.com/feed/", "type": "rss" }
  ],
  "scheduleTime": "09:00",
  "timezone": "Europe/Istanbul",
  "outputLanguage": "tr",
  "deliveryInApp": true,
  "deliverySlack": true,
  "slackChannel": "#ai-news"
}
```

#### Manuel Çalıştırma
```json
POST /api/smart-automations/:id/run

Response:
{
  "success": true,
  "runId": "uuid",
  "itemCount": 5
}
```

## Scheduler

Sistem, her 60 saniyede bir `next_run_at <= NOW()` olan otomasyonları kontrol eder ve çalıştırır.

### Çalışma Akışı

1. **RSS Fetch**: Tüm kaynaklardan son 24 saatteki içerikler çekilir
2. **Dedupe**: Link hash ile son 7 gündeki tekrar içerikler filtrelenir
3. **Aggregation**: Topic relevance'a göre en iyi 3-7 içerik seçilir
4. **AI Generation**: AIService ile LinkedIn taslağı oluşturulur
5. **Persist**: Run ve items DB'ye kaydedilir
6. **Notify**: Slack/in-app bildirim gönderilir
7. **Schedule**: `next_run_at` bir sonraki güne güncellenir

## Environment Variables

```bash
# Slack Bot Token (xoxb-xxx formatında)
SLACK_BOT_TOKEN=xoxb-your-bot-token

# Varsayılan Slack kanalı (C0123456789 veya #channel-name)
SLACK_DEFAULT_CHANNEL=C0123456789
```

### Slack Bot Oluşturma

1. https://api.slack.com/apps adresine gidin
2. "Create New App" → "From scratch"
3. Bot Token Scopes ekleyin:
   - `chat:write`
   - `chat:write.public`
4. "Install to Workspace" yapın
5. "Bot User OAuth Token" (xoxb-...) kopyalayın

## Telif ve Uyum Notları

**ÖNEMLİ**: Sistem, kaynak içeriklerin tam metnini KOPYALAMAZ. Sadece:

- Başlık
- 1-2 cümlelik özet
- Kaynak linki ve atıf

kullanılır. Reuters vb. haber ajanslarının telif haklarına uyum için bu kısıtlama zorunludur.

## Local Development

### Database Migration

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2" pnpm db:migrate
```

### Servis Başlatma

```bash
# Backend
cd backend
pnpm dev

# Frontend
cd frontend
pnpm dev
```

### Test

```bash
# UI'dan test
1. http://localhost:5173/agents adresine gidin
2. "Akıllı Otomasyonlar" kartına tıklayın
3. "Yeni Otomasyon" ile oluşturun
4. "Şimdi Çalıştır" ile test edin

# Manual API test
curl -X POST http://localhost:3000/api/smart-automations \
  -H "Content-Type: application/json" \
  -H "Cookie: akis_sid=..." \
  -d '{
    "name": "Test",
    "topics": ["test"],
    "sources": [{"url": "https://news.ycombinator.com/rss", "type": "rss"}]
  }'
```

## Troubleshooting

### RSS Fetch Başarısız

- URL'nin geçerli bir RSS feed olduğunu kontrol edin
- Rate limiting olabilir, birkaç dakika bekleyin
- Konsol loglarını kontrol edin: `[RSSFetcher]`

### AI Generation Başarısız

- AI_PROVIDER ve AI_API_KEY ayarlarını kontrol edin
- Token limiti aşılmış olabilir
- Konsol loglarını kontrol edin: `[LinkedInDraftGenerator]`

### Slack Bildirimi Gönderilmedi

- SLACK_BOT_TOKEN'ın doğru olduğunu kontrol edin
- Bot'un kanala eklendiğini kontrol edin
- Slack API rate limiti olabilir

## Gelecek Geliştirmeler

- [ ] LinkedIn OAuth + Otomatik paylaşım
- [ ] Webpage-to-RSS desteği
- [ ] Çoklu dil desteği (çeviri)
- [ ] Özel prompt şablonları
- [ ] Analytics dashboard
