# 🚀 Documentation Agent - Tek Tık Kullanım Promptu

Bu promptu kopyalayıp Cursor AI'a yapıştırarak Documentation Agent'ı tetikleyebilirsiniz.

---

## Prompt Template

```
Görev: Aşağıdaki GitHub repository için Documentation Agent Playbook'unu uygula, dokümanları analiz et, iyileştir ve Pull Request (draft) aç.

Repository: [REPO_URL]
Branch: [BRANCH] (varsayılan: main)
Scope: [SCOPE] (readme, changelog, getting-started, api, all)

Constraints:
- max-files-to-scan: 200
- max-run-time: 180 saniye
- GitHub token: Profile'dan alınacak (client-side)

Adımlar:
1. REPO_SUMMARY üret ve paylaş
2. DOC_REPORT hazırla (eksikler, kırık linkler, komut sorunları; WSJF öncelikli)
3. README.proposed.md ve CHANGELOG.proposed.md oluştur
4. DAS_REPORT hesapla (RefCoverage, Consistency, SpotCheck)
5. Branch oluştur, commit et, PR'ı draft olarak aç
6. PR_DESCRIPTION.md'i kullan, kanıtlarla birlikte

Lütfen sadece planı değil, TÜM ARTEFAKTLARın içeriklerini de yanıtta göster.
```

---

## Örnek Kullanımlar

### 1. Vercel Next.js Repository Analizi

```
Görev: Aşağıdaki GitHub repository için Documentation Agent Playbook'unu uygula.

Repository: https://github.com/vercel/next.js
Branch: canary
Scope: readme

Lütfen:
1. REPO_SUMMARY oluştur
2. README.md'yi analiz et ve eksiklikleri tespit et
3. İyileştirilmiş README.proposed.md oluştur
4. DAS skorunu hesapla

NOT: PR açma, sadece analiz ve öneri sun.
```

### 2. Kendi Projeniz İçin Tam İş Akışı

```
Görev: Aşağıdaki repository için Documentation Agent Playbook'unu TAM OLARAK uygula.

Repository: https://github.com/[KULLANICI_ADI]/[REPO_ADI]
Branch: main
Scope: all

Adımlar:
1. Repository'yi tara (stack, paketler, script'ler, mevcut dokümanlar)
2. Dokümantasyon boşluklarını tespit et
3. README.md, CHANGELOG.md ve .env.example öner
4. DAS metriklerini hesapla (hedef: ≥70%)
5. Branch oluştur: docs/[repo]-[date]-documentation-update
6. Tüm değişiklikleri commit et
7. Draft PR aç

GitHub Token: [YOUR_TOKEN] (veya Profile'dan otomatik al)

Sonuçta şunları göster:
- REPO_SUMMARY.md
- DOC_REPORT.md
- README.proposed.md
- CHANGELOG.proposed.md
- DAS_REPORT.md
- PR linki
```

### 3. Sadece Dokümantasyon Denetimi (Analiz Only)

```
Görev: Aşağıdaki repository'nin dokümantasyonunu denetle.

Repository: https://github.com/facebook/react
Branch: main
Scope: all

Sadece analiz yap:
1. REPO_SUMMARY
2. DOC_REPORT (sorunlar ve öneriler)
3. DAS skorunu hesapla

PR açma, sadece mevcut durumu raporla.
```

---

## API Kullanım Örneği (cURL)

```bash
# GitHub token'ınızı buraya yazın
GITHUB_TOKEN="ghp_your_github_personal_access_token"
REPO_URL="https://github.com/username/repo"

curl -X POST http://localhost:3000/api/agent/documentation/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d "{
    \"repoUrl\": \"$REPO_URL\",
    \"action\": \"full_workflow\",
    \"branch\": \"main\",
    \"scope\": \"all\",
    \"options\": {
      \"maxFilesToScan\": 200,
      \"maxRunTime\": 180
    }
  }"
```

---

## JavaScript/TypeScript Kullanım Örneği

```typescript
// Frontend'den (GitHub token context'ten alınır)
const response = await fetch('/api/agent/documentation/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${githubToken}`,
  },
  body: JSON.stringify({
    repoUrl: 'https://github.com/username/repo',
    action: 'full_workflow',
    branch: 'main',
    scope: 'all',
    options: {
      maxFilesToScan: 200,
      maxRunTime: 180,
    },
  }),
});

const data = await response.json();

if (data.success) {
  console.log('DAS Score:', data.result.validation?.das);
  console.log('PR URL:', data.result.branchPR?.prUrl);
  console.log('Artifacts:', data.result.artifacts);
} else {
  console.error('Error:', data.error);
}
```

---

## Dashboard UI Kullanım Adımları

1. **Giriş Yap:**
   ```
   http://localhost:3000/login
   ```

2. **GitHub Bağla:**
   ```
   http://localhost:3000/profile → "GitHub'ı Bağla"
   ```

3. **Documentation Agent'ı Çalıştır:**
   ```
   http://localhost:3000/dashboard
   → "Documentation Agent" bölümüne git
   → Repository URL gir: https://github.com/username/repo
   → Aksiyon seç: "Tam İş Akışı"
   → "Agent'ı Çalıştır" butonuna tıkla
   ```

4. **Sonuçları İncele:**
   - DAS skorunu gör
   - Artefaktları oku (REPO_SUMMARY, DOC_REPORT, vb.)
   - PR linkine tıkla ve GitHub'da görüntüle

5. **PR'ı Onayla:**
   - GitHub'da PR'ı incele
   - Değişiklikleri gözden geçir
   - "Ready for Review" yap
   - Merge et

---

## Hızlı Test (Örnek Public Repo)

```
Görev: Aşağıdaki örnek repository için Documentation Agent'ı çalıştır.

Repository: https://github.com/microsoft/TypeScript
Branch: main
Scope: readme

Adımlar:
1. REPO_SUMMARY üret
2. README.md'yi analiz et
3. DAS skorunu hesapla

Sonuç olarak:
- Tech stack nedir?
- Mevcut dokümantasyon kalitesi nedir (DAS)?
- Hangi iyileştirmeler önerilebilir?

NOT: Bu public repo, PR açmaya gerek yok.
```

---

## İpuçları

### ✅ İyi Pratikler

1. **İlk önce analiz yap:** `action: "repo_summary"` ile başla, repoyu tanı
2. **Scope'u daralt:** Tüm dokümanlar yerine önce `scope: "readme"` ile test et
3. **DAS hedefini belirle:** Minimum %70 hedefle
4. **Draft PR kullan:** Her zaman draft olarak aç, insan onayı al

### ❌ Kaçınılması Gerekenler

1. **Direkt main'e yazma:** Agent zaten yapmaz ama manuel yapma
2. **Token paylaşma:** GitHub token'ı asla dokümana veya PR'a yazma
3. **Blind merge:** PR'ı incelemeden merge etme
4. **Rate limit'i aşma:** Çok sık çalıştırma (5000 req/hour limit var)

---

## Destek

Sorun yaşarsanız:

1. **Log'ları kontrol edin:** Browser console veya terminal
2. **GitHub token'ı kontrol edin:** Scope'ları doğru mu? (`repo`, `user`)
3. **Rate limit'i kontrol edin:** GitHub API limitleri
4. **Rehbere bakın:** `DOCUMENTATION_AGENT_GUIDE.md`

---

**🎯 Hedef:** %100 otomatik, %100 güvenilir, %100 geri alınabilir dokümantasyon!

**🤖 Documentation Agent v1.0.0**

