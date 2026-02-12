# AKIS Platform — Social & Community Vision (M2/M3+)

> **Version:** 1.0.0  
> **Date:** 2026-02-12  
> **Status:** Planning — Out of S0.5 scope  
> **Target:** M2 (Stabilizasyon) / M3 (Mezuniyet sonrası) ve mezuniyet sonrası iterasyonlar

---

## Özet

AKIS Platform, pilot demo sonrası **topluluk odaklı** bir geliştirici platformuna evrilebilir. Kullanıcılar agent'ları paylaşabilir, birlikte çalışabilir, içerik üretebilir ve platformu bir **uygulama / marketplace** alanına taşıyabilir. Bu doküman M2–M3 ve sonrası için vizyon ve kapsam taslağıdır.

**S0.5 kapsam dışı:** Scope freeze (21 Şubat) nedeniyle bu doküman sadece planlama amaçlıdır; implementasyon M2+ ile başlar.

---

## Katmanlar

| Katman | Kapsam | Hedef Faz |
|--------|--------|-----------|
| **A** | Light tema (GitHub-style) | S0.5 (scope freeze öncesi) — **✅ Tamamlandı** |
| **B** | Social platform (profil, feed, paylaşım) | M2–M3 |
| **C** | Blog + içerik yönetimi | M3+ / mezuniyet sonrası |

---

## Katman B: Social Platform — Vizyon Bileşenleri

### 1. Agent Marketplace

- Kullanıcılar kendi playbook/config varyantlarını paylaşabilir
- "Featured" ve "Community" kategorileri
- Rating ve kullanım istatistikleri
- Fork / remix akışı

### 2. Developer Profilleri

- Genişletilmiş profil: bio, avatar, sosyal linkler, showcase projeleri
- Profil sayfası: `/u/{username}` veya `/profile/{id}`
- İstatistikler: toplam job sayısı, paylaşılan agent sayısı, takipçi/takip edilen

### 3. Activity Feed

- Kişisel feed: kendi job'ları, paylaşımları, yorumları
- Global / keşfet feed: popüler agent'lar, trend paylaşımlar
- Takip edilen kullanıcıların aktiviteleri

### 4. Showcases

- Başarılı job çıktıları (izin verilmiş) paylaşılabilir
- Ekran görüntüsü, artifact önizleme, açıklama
- Like ve yorum

### 5. Collaboration

- Takımlar (teams): ortak workspace, paylaşılan agent config
- Takım üyeleri rol bazlı (admin, member, viewer)
- Invite link ve e-posta davetleri

### 6. Gamification (Opsiyonel)

- Badge’ler: ilk job, 10 job, ilk paylaşım, topluluk katkısı
- Liderlik tablosu (opsiyonel, gizlilik hassasiyeti)

---

## Veritabanı Taslağı

Aşağıdaki tablolar **öneri** niteliğindedir; implementasyonda Drizzle schema ile uyumlu olmalı.

| Tablo | Amaç |
|-------|------|
| `user_profiles` | `users.id` FK; bio, avatar_url, website, github_url, linkedin_url |
| `posts` | Paylaşım türü (showcase, agent_config, blog_draft); content JSONB; user_id |
| `follows` | follower_id, following_id (user → user) |
| `likes` | user_id, target_type (post, comment, agent), target_id |
| `comments` | user_id, target_type, target_id, parent_id (nested), body |
| `teams` | name, slug, description, avatar_url, created_by |
| `team_members` | team_id, user_id, role (admin, member, viewer) |

Mevcut `users` tablosuna dokunulmaz; `user_profiles` 1:1 ilişki.

---

## API Endpoint Taslağı

| Endpoint | Method | Amaç |
|----------|--------|------|
| `/api/profiles/:userId` | GET | Profil detayı |
| `/api/profiles/:userId` | PATCH | Kendi profilini güncelle (auth) |
| `/api/feed` | GET | Activity feed (pagination) |
| `/api/posts` | GET, POST | Paylaşımlar listesi / yeni paylaşım |
| `/api/posts/:id` | GET, PATCH, DELETE | Tek paylaşım |
| `/api/posts/:id/like` | POST, DELETE | Beğen / beğeniyi kaldır |
| `/api/posts/:id/comments` | GET, POST | Yorumlar |
| `/api/follows` | GET, POST, DELETE | Takip et / takibi bırak |
| `/api/teams` | GET, POST | Takımlar listesi / oluştur |
| `/api/teams/:id` | GET, PATCH, DELETE | Takım detayı (rol kontrolü) |
| `/api/teams/:id/members` | GET, POST, DELETE | Üye yönetimi |
| `/api/marketplace/agents` | GET | Community agent listesi |

Tüm yeni endpoint'ler mevcut auth (JWT, cookie) ile korunmalı; public read için rate limit uygulanmalı.

---

## Frontend Sayfa Mimarisi Taslağı

| Rota | Amaç |
|------|------|
| `/feed` | Activity feed ana sayfası |
| `/u/:username` | Public profil sayfası |
| `/settings/profile` | Profil düzenleme (mevcut settings altında) |
| `/showcase/:id` | Tek showcase detayı |
| `/teams` | Takım listesi + oluşturma |
| `/teams/:slug` | Takım detayı, üyeler, shared config |
| `/marketplace` | Agent marketplace ana sayfası |
| `/marketplace/agent/:id` | Agent detayı, fork, kullan |

Mevcut `/dashboard`, `/agents`, `/settings` yapısı korunur; yeni rotalar layout ile entegre edilir.

---

## Bağımlılıklar ve Sıra

1. **M1 Pilot Demo** tamamlanmalı (28 Şubat)
2. **M2 Stabilizasyon** sırasında:
   - `user_profiles` tablosu ve temel profil API (küçük adım)
   - Feed ve post yapısı için DB migrasyonları
3. **M3** veya mezuniyet sonrası:
   - Activity feed UI
   - Showcase paylaşım akışı
   - Takım (teams) MVP

---

## Riskler ve Notlar

- **Gizlilik:** Job çıktıları ve artifact'lar paylaşılmadan önce açık onay gerektirir
- **Moderasyon:** İlk aşamada basit report/flag; detaylı modasyon M3+ olabilir
- **Ölçek:** OCI Free Tier sınırları; feed ve search için basit pagination ile başlanmalı
- **Tez kapsamı:** Social özellikler tez savunmasında "gelecek çalışma" olarak sunulabilir; M1 demo sadece core agent'ları kapsar

---

## İlgili Dokümanlar

- [ROADMAP.md](../ROADMAP.md) — M2/M3 kilometre taşları
- [DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) — Mevcut S0.5 kapsam
