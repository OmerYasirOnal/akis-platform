# 📝 Documentation Agent - Kullanım Rehberi

## Genel Bakış

Documentation Agent, GitHub repository'lerini analiz eden, dokümantasyon eksikliklerini tespit eden ve otomatik olarak iyileştirme önerileri sunan bir AI agent sistemidir.

### Özellikler

✅ **Repository Analizi:** Teknoloji stack'i, paketler, script'ler, mevcut dokümanları tespit eder
✅ **Boşluk Analizi:** Eksik/eski dokümantasyonu, kırık linkleri, çalışmayan komutları bulur
✅ **Doküman Üretimi:** README, CHANGELOG ve diğer dokümanlar için iyileştirilmiş taslaklar oluşturur
✅ **Kalite Metrikleri:** DAS (Documentation Agent Score) ile dokümantasyon kalitesini ölçer
✅ **Otomatik PR:** Branch oluşturur, değişiklikleri commit eder ve draft PR açar
✅ **Kanıt Yükümlülüğü:** Her iddiayı kaynak, dosya yolu veya komut çıktısı ile destekler

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                   Documentation Agent                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Repository Summary                                  │
│  ├─ Detect tech stack, package manager                      │
│  ├─ Find entry points, scripts                              │
│  └─ List existing documentation                             │
│                                                               │
│  Step 2: Documentation Gap Analysis                          │
│  ├─ Check coverage (README, CHANGELOG, etc.)                │
│  ├─ Analyze README content                                  │
│  └─ Identify issues & suggestions (WSJF prioritized)        │
│                                                               │
│  Step 3: Generate Proposals                                  │
│  ├─ Create README.proposed.md                               │
│  ├─ Create CHANGELOG.proposed.md                            │
│  └─ Use AI to generate high-quality content                 │
│                                                               │
│  Step 4: Validate Documentation (DAS)                        │
│  ├─ RefCoverage: References exist in repo?                  │
│  ├─ Consistency: Links & commands work?                     │
│  └─ SpotCheck: Human-friendly checklist                     │
│                                                               │
│  Step 5: Create Branch & PR                                  │
│  ├─ Create branch: docs/<repo>-<date>-<scope>              │
│  ├─ Commit changes with evidence                            │
│  └─ Open draft PR with metrics & proofs                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Dosya Yapısı

```
devagents/
├── src/
│   ├── lib/agents/
│   │   ├── playbooks/
│   │   │   └── documentation-agent-playbook.ts    # Agent playbook (mission, rules, capabilities)
│   │   ├── utils/
│   │   │   └── github-utils.ts                    # GitHub API yardımcı fonksiyonları
│   │   ├── documentation-agent.ts                  # Ana agent sınıfı
│   │   └── documentation-agent-types.ts           # Type tanımları
│   │
│   ├── app/api/agent/documentation/
│   │   ├── analyze/route.ts                       # POST /api/agent/documentation/analyze
│   │   └── info/route.ts                          # GET /api/agent/documentation/info
│   │
│   └── components/
│       └── DocumentationAgentUI.tsx               # React UI component
│
└── .github/
    └── pull_request_template.md                   # PR şablonu
```

## Kurulum ve Çalıştırma

### 1. GitHub OAuth Ayarları

Documentation Agent'ın GitHub API'sine erişebilmesi için GitHub OAuth token gereklidir.

**Adımlar:**
1. [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. "New OAuth App" oluştur:
   - Application name: `DevAgents Documentation`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/integrations/github/callback`
3. Client ID ve Secret'ı `.env.local`'e ekle:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

### 2. OpenRouter API Key

AI modeli için OpenRouter kullanılıyor:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

[OpenRouter](https://openrouter.ai/) üzerinden ücretsiz API key alabilirsiniz.

### 3. Sunucuyu Başlat

```bash
npm install
npm run dev
```

## Kullanım

### A. Dashboard Üzerinden (Önerilen)

1. `http://localhost:3000/login` adresinden giriş yapın
2. `http://localhost:3000/profile` sayfasından GitHub'ı bağlayın
3. `http://localhost:3000/dashboard` sayfasına gidin
4. "Documentation Agent" bölümünde:
   - Repository URL'sini girin (örn: `https://github.com/vercel/next.js`)
   - Branch seçin (varsayılan: `main`)
   - Aksiyon seçin:
     - **🚀 Tam İş Akışı:** Tüm adımları çalıştır + PR aç (önerilir)
     - **📊 Repository Özeti:** Sadece analiz
     - **🔍 Boşluk Analizi:** Eksikleri tespit et
     - **📝 Doküman Taslağı:** README/CHANGELOG üret
     - **✅ Doğrulama:** DAS metriklerini hesapla
     - **🌿 Branch & PR:** Branch oluştur ve PR aç
   - Kapsam seçin (`all`, `readme`, `changelog`, vb.)
5. "Agent'ı Çalıştır" butonuna tıklayın
6. Sonuçları inceleyin ve PR linkine tıklayarak GitHub'da görüntüleyin

### B. API Üzerinden

```bash
# Repository analizi yap
curl -X POST http://localhost:3000/api/agent/documentation/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -d '{
    "repoUrl": "https://github.com/username/repo",
    "action": "full_workflow",
    "branch": "main",
    "scope": "all"
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "step": "create_branch_pr",
    "repoSummary": { ... },
    "gapAnalysis": { ... },
    "proposedDocs": [ ... ],
    "validation": {
      "das": 85,
      "refCoverage": { "score": 90, ... },
      "consistency": { "score": 85, ... },
      "spotCheck": { "score": 80, ... }
    },
    "branchPR": {
      "branchName": "docs/repo-20250127-documentation-update",
      "prUrl": "https://github.com/username/repo/pull/123",
      "prNumber": 123
    },
    "artifacts": {
      "REPO_SUMMARY": "...",
      "DOC_REPORT": "...",
      "README.proposed": "...",
      "DAS_REPORT": "..."
    }
  }
}
```

### C. Programatik Kullanım

```typescript
import { documentationAgent } from '@/lib/agents/documentation-agent';

const result = await documentationAgent.execute({
  action: 'full_workflow',
  repoUrl: 'https://github.com/username/repo',
  branch: 'main',
  scope: 'all',
  accessToken: 'ghp_your_github_token',
  options: {
    maxFilesToScan: 200,
    maxRunTime: 180,
  },
});

console.log('DAS Score:', result.validation?.das);
console.log('PR URL:', result.branchPR?.prUrl);
```

## DAS Metrikleri (Documentation Agent Score)

Documentation Agent, dokümantasyon kalitesini 3 metrikle ölçer:

### 1. RefCoverage (Referans Kapsama) - %40

Dokümanda bahsedilen dosya yolları, fonksiyonlar vb. gerçekten repo'da var mı?

**Hesaplama:**
```
RefCoverage = (Bulunan Referanslar / Toplam Referanslar) × 100
```

**Örnek:**
- README'de `src/app/page.tsx` deniliyor → ✅ Dosya var
- README'de `config/db.ts` deniliyor → ❌ Dosya yok
- Skor: 1/2 = 50%

### 2. Consistency (Tutarlılık) - %40

Linkler çalışıyor mu? Komutlar geçerli mi?

**Hesaplama:**
```
Consistency = (
  (Çalışan Linkler / Toplam Linkler) × 50 +
  (Geçerli Komutlar / Toplam Komutlar) × 50
)
```

**Örnek:**
- Link: `https://example.com` → ✅ 200 OK
- Link: `https://broken.link` → ❌ 404
- Komut: `npm run build` → ✅ Valid
- Skor: (1/2 × 50) + (1/1 × 50) = 75%

### 3. SpotCheck (İnsan Kontrolü) - %20

5 maddelik checklist:

- [ ] README quickstart bölümü var mı?
- [ ] Kurulum adımları net mi?
- [ ] Environment variable'lar dokümante mi?
- [ ] Script'ler listelenmiş mi?
- [ ] Lisans bilgisi var mı?

**Örnek:** 4/5 geçti = 80%

### DAS Formülü

```
DAS = (0.4 × RefCoverage) + (0.4 × Consistency) + (0.2 × SpotCheck)
```

**Kabul Kriterleri:**
- **DAS ≥ 70:** ✅ APPROVE (Onaylanabilir)
- **50 ≤ DAS < 70:** ⚠️ NEEDS CHANGES (İyileştirme gerekli)
- **DAS < 50:** ❌ REJECT (Ciddi sorunlar var)

## Guardrails (Güvenlik Kuralları)

Documentation Agent şu kurallara uyar:

1. **Kanıt Yükümlülüğü:** Her teknik iddiayı kaynak gösterir
2. **Uydurma Yasak:** Repoda olmayan bilgileri asla eklemez
3. **Direkt Main'e Yazma Yasak:** Her zaman branch + PR kullanır
4. **İnsan Onayı Şart:** PR'lar draft olarak açılır
5. **Gizlilik:** Token/şifre asla dokümana yazılmaz
6. **Link Doğrulama:** Tüm linkler HTTP kontrolünden geçer
7. **Komut Doğrulama:** Quickstart komutları dry-run ile test edilir

## Çıktılar (Artifacts)

Her çalıştırmada 5 ana artefakt üretilir:

### 1. REPO_SUMMARY.md
Repository özeti: stack, paketler, script'ler, mevcut dokümanlar

### 2. DOC_REPORT.md
Mevcut durum → sorunlar → öneriler (WSJF öncelikli)

### 3. README.proposed.md
Tam README taslağı (tüm gerekli bölümler dahil)

### 4. CHANGELOG.proposed.md
Semantik versiyonlama standardına uygun CHANGELOG

### 5. PR_DESCRIPTION.md
Pull Request açıklaması (kanıtlar, metrikler, riskler dahil)

## Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Proje İçin Doküman Oluştur

```bash
# Input
{
  "repoUrl": "https://github.com/myorg/new-project",
  "action": "full_workflow",
  "scope": "all"
}

# Output
- README.md (sıfırdan oluşturuldu)
- CHANGELOG.md (oluşturuldu)
- .env.example (öneriler listelendi)
- PR: docs/new-project-20250127-initial-docs
- DAS: 75% ✅
```

### Senaryo 2: Mevcut README'yi İyileştir

```bash
# Input
{
  "repoUrl": "https://github.com/myorg/old-project",
  "action": "full_workflow",
  "scope": "readme"
}

# Output
- README.md (güncellenmiş versiyon)
- Eksikler: quickstart, env variables
- PR: docs/old-project-20250127-readme-refresh
- DAS: 82% ✅
```

### Senaryo 3: Dokümantasyon Denetimi (Sadece Analiz)

```bash
# Input
{
  "repoUrl": "https://github.com/external/audit-me",
  "action": "validate_docs"
}

# Output
- DAS: 45% ❌
- Sorunlar: 3 kırık link, 2 çalışmayan komut, eksik .env
- PR oluşturulmadı (sadece rapor)
```

## Troubleshooting

### "GitHub access token gerekli" Hatası

**Çözüm:** Profile sayfasından GitHub'ı bağlayın. Token client-side'dan gönderilir.

### "Branch oluşturulamadı" Hatası

**Olası Nedenler:**
- GitHub token'ının `repo` scope'u yok
- Branch zaten mevcut
- Yazma izni yok

**Çözüm:** GitHub OAuth App ayarlarından scope'ları kontrol edin.

### DAS Skoru Düşük (< 70)

**Olası Nedenler:**
- Çok fazla eksik referans
- Kırık linkler
- Çalışmayan komutlar

**Çözüm:** 
1. DOC_REPORT.md'deki önerileri inceleyin
2. Manuel düzeltmeler yapın
3. Agent'ı tekrar çalıştırın

### "Rate limit exceeded" Hatası

**Çözüm:** GitHub API rate limit'i aşıldı. Authenticated requests için 5000/saat limit vardır. Birkaç dakika bekleyin.

## Roadmap

- [ ] Multi-language support (EN/TR otomatik tespit)
- [ ] Custom playbook upload
- [ ] Confluence/Notion entegrasyonu
- [ ] PR review bot (otomatik merge)
- [ ] Screenshot/diagram generation
- [ ] API documentation auto-generation (OpenAPI/Swagger)

## Katkıda Bulunma

Documentation Agent açık kaynak bir projedir. Katkılarınızı bekliyoruz!

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**🤖 Documentation Agent v1.0.0**

*"Güvenilir dokümantasyon için kanıta dayalı, geri alınabilir, insan-onaylı yaklaşım."*

