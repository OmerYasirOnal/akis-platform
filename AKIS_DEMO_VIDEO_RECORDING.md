# AKIS — TEZ DEMO VİDEO KAYIT PLANI

.env dosyalarına ASLA dokunma. Servisleri kendin başlat, kendin test et.

---

## AMAÇ

Playwright E2E testleri ile AKIS'in tam demo videosunu otomatik olarak çek. Her test senaryosu kendi videosunu kaydeder + kritik anlarda screenshot alır. Çıktılar tez raporuna ve sunuma direkt eklenebilir.

**Çıktılar:**
- `demo-videos/` klasöründe her senaryo için .webm video dosyaları
- `demo-screenshots/` klasöründe adlandırılmış PNG screenshot'lar
- Her video 720p, yavaşlatılmış (gerçek kullanıcı gibi görünmesi için)

---

## YASAK KURALLAR

- .env dosyalarına DOKUNMA
- Mevcut backend/frontend kodunu DEĞİŞTİRME
- Mevcut testleri BOZMA
- Yeni npm paketi EKLEME (Playwright zaten var)

---

## ADIM 0 — PLAYWRIGHT KURULUMU

```bash
# Proje root'unda
cd /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents

# Playwright zaten var mı kontrol et
cat package.json | grep -i playwright

# Yoksa kur
npm install -D @playwright/test
npx playwright install chromium

# Demo çıktı klasörlerini oluştur
mkdir -p demo-videos demo-screenshots
```

---

## ADIM 1 — PLAYWRIGHT CONFIG

Proje root'unda `playwright.demo.config.ts` oluştur:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-demo',
  timeout: 300_000, // 5dk per test (pipeline uzun sürebilir)
  expect: { timeout: 30_000 },
  
  use: {
    baseURL: 'http://localhost:5173',
    
    // Video kayıt ayarları
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
    
    // Screenshot ayarları
    screenshot: 'on',
    
    // Gerçek kullanıcı gibi görünsün
    viewport: { width: 1280, height: 720 },
    
    // Yavaşlat — demo için daha iyi görünür
    launchOptions: {
      slowMo: 300, // 300ms gecikme her aksiyonda
    },
    
    // Trace — hata ayıklama için
    trace: 'on',
  },
  
  // Tek browser yeterli
  projects: [
    {
      name: 'demo',
      use: { channel: 'chromium' },
    },
  ],
  
  // Çıktı klasörü
  outputDir: './demo-videos/',
  
  // Sıralı çalıştır (paralel değil)
  workers: 1,
  fullyParallel: false,
});
```

---

## ADIM 2 — TEST DOSYALARI

`e2e-demo/` klasörü oluştur ve içine test dosyalarını yaz:

### 2.1 Helper: Ortak Fonksiyonlar

`e2e-demo/helpers.ts`:

```typescript
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'demo-screenshots');

// Klasör yoksa oluştur
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Adlandırılmış screenshot al — tez raporuna direkt eklenebilir
 */
export async function takeNamedScreenshot(page: Page, name: string) {
  const filename = `${name}.png`;
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false,
  });
  console.log(`📸 Screenshot: ${filename}`);
}

/**
 * Tam sayfa screenshot
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
  const filename = `${name}_full.png`;
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
  console.log(`📸 Full screenshot: ${filename}`);
}

/**
 * Gerçek kullanıcı gibi yaz (karakter karakter)
 */
export async function typeSlowly(page: Page, selector: string, text: string) {
  await page.click(selector);
  await page.fill(selector, ''); // Temizle
  for (const char of text) {
    await page.keyboard.type(char, { delay: 50 });
  }
}

/**
 * Belirli bir süre bekle (video'da görünsün diye)
 */
export async function pause(ms: number = 2000) {
  await new Promise(r => setTimeout(r, ms));
}

/**
 * Scroll ile görünür yap
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await pause(500);
}
```

---

### 2.2 Senaryo 1: Dashboard Genel Bakış

`e2e-demo/01-dashboard-overview.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, pause } from './helpers';

test.describe('Senaryo 1: Dashboard Genel Bakış', () => {
  
  test('Dashboard ana sayfayı göster', async ({ page }) => {
    // 1. Dashboard'a git
    await page.goto('/dashboard');
    await pause(2000);
    await takeNamedScreenshot(page, '01_dashboard_overview');
    
    // 2. Sidebar navigasyonu göster
    // Overview aktif olmalı
    await expect(page.locator('text=Overview').first()).toBeVisible();
    await pause(1000);
    
    // 3. Workflows sayfasına git
    await page.click('text=Workflows');
    await pause(1500);
    await takeNamedScreenshot(page, '02_workflows_list');
    
    // 4. Agents sayfasına git
    await page.click('text=Agents');
    await pause(1500);
    await takeNamedScreenshot(page, '03_agents_page');
    
    // 5. Settings sayfasına git
    await page.click('text=Settings');
    await pause(1500);
    await takeNamedScreenshot(page, '04_settings_page');
    
    // 6. Tekrar Overview'a dön
    await page.click('text=Overview');
    await pause(1500);
    await takeNamedScreenshot(page, '05_dashboard_final');
  });
});
```

---

### 2.3 Senaryo 2: Tam Pipeline Akışı (Ana Demo)

`e2e-demo/02-full-pipeline.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, typeSlowly, pause, scrollToElement } from './helpers';

test.describe('Senaryo 2: Tam Pipeline Akışı', () => {
  
  test('Fikir → Scribe → Onay → Proto → Trace', async ({ page }) => {
    // ═══ ADIM 1: Yeni Workflow Başlat ═══
    await page.goto('/dashboard');
    await pause(2000);
    
    // "New Workflow" butonuna tıkla
    // Buton farklı yerlerde olabilir — en uygun locator'ı bul
    const newWorkflowBtn = page.locator('text=New Workflow').or(page.locator('text=Yeni İş Akışı')).or(page.locator('[data-testid="new-workflow"]')).first();
    
    if (await newWorkflowBtn.isVisible()) {
      await newWorkflowBtn.click();
    } else {
      // Workflows sayfasından dene
      await page.goto('/dashboard/workflows/new');
    }
    await pause(2000);
    await takeNamedScreenshot(page, '10_new_workflow_form');
    
    // ═══ ADIM 2: Fikri Yaz ═══
    // Textarea'yı bul
    const ideaInput = page.locator('textarea').first();
    await ideaInput.click();
    await pause(500);
    
    const ideaText = 'Kişisel bütçe takip uygulaması. Kullanıcı gelir ve gider ekleyebilsin, kategorilere ayırabilsin, aylık özet görebilsin ve bütçe limiti belirleyebilsin.';
    
    // Yavaş yaz — video'da görünsün
    await typeSlowly(page, 'textarea', ideaText);
    await pause(1500);
    await takeNamedScreenshot(page, '11_idea_written');
    
    // ═══ ADIM 3: Pipeline'ı Başlat ═══
    // Start/Submit butonunu bul ve tıkla
    const startBtn = page.locator('button:has-text("Start")').or(page.locator('button:has-text("Başlat")').or(page.locator('button:has-text("Workflow")'))).first();
    await startBtn.click();
    await pause(3000);
    await takeNamedScreenshot(page, '12_pipeline_started');
    
    // ═══ ADIM 4: Scribe Çalışıyor ═══
    // Scribe'ın çalışmasını bekle (activity stream, progress indicator)
    // Running/çalışıyor göstergesi
    await pause(5000);
    await takeNamedScreenshot(page, '13_scribe_running');
    
    // Scribe tamamlanana kadar bekle (max 3dk)
    try {
      await page.waitForSelector('text=Approve', { timeout: 180_000 }).catch(() => null);
      // Veya
      await page.waitForSelector('text=Onayla', { timeout: 5_000 }).catch(() => null);
    } catch {
      // Timeout olursa polling ile bekle
      for (let i = 0; i < 90; i++) {
        const hasApprove = await page.locator('text=Approve').or(page.locator('text=Onayla')).first().isVisible().catch(() => false);
        if (hasApprove) break;
        await pause(2000);
      }
    }
    
    await pause(2000);
    await takeNamedScreenshot(page, '14_scribe_completed_spec');
    await takeFullPageScreenshot(page, '14_scribe_completed_spec');
    
    // ═══ ADIM 5: Spec İnceleme ═══
    // Spec bileşenlerini göster (Problem Statement, User Stories, AC)
    // Expandable bölümleri aç
    const specSections = page.locator('[class*="spec"], [class*="Spec"], [data-testid*="spec"]');
    if (await specSections.first().isVisible().catch(() => false)) {
      await pause(1000);
      await takeNamedScreenshot(page, '15_spec_detail');
    }
    
    // ═══ ADIM 6: Spec'i Onayla ═══
    const approveBtn = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("Onayla")')).first();
    await approveBtn.scrollIntoViewIfNeeded();
    await pause(1000);
    await takeNamedScreenshot(page, '16_before_approve');
    
    await approveBtn.click();
    await pause(3000);
    await takeNamedScreenshot(page, '17_approved_proto_starting');
    
    // ═══ ADIM 7: Proto Çalışıyor ═══
    await pause(5000);
    await takeNamedScreenshot(page, '18_proto_running');
    
    // Proto + Trace tamamlanana kadar bekle (max 5dk)
    for (let i = 0; i < 150; i++) {
      const isCompleted = await page.locator('text=Completed').or(page.locator('text=Tamamlandı')).first().isVisible().catch(() => false);
      const hasDevBtn = await page.locator('text=Geliştirmeye Devam').or(page.locator('text=Dev Mode')).first().isVisible().catch(() => false);
      if (isCompleted || hasDevBtn) break;
      await pause(2000);
    }
    
    await pause(3000);
    await takeNamedScreenshot(page, '19_pipeline_completed');
    await takeFullPageScreenshot(page, '19_pipeline_completed');
    
    // ═══ ADIM 8: Sonuç Kartını Göster ═══
    // GitHub linki, dosya sayısı, test sayısı
    await pause(2000);
    await takeNamedScreenshot(page, '20_result_card');
    
    // Pipeline completed kartındaki GitHub linkini göster
    const githubLink = page.locator('a:has-text("GitHub")').first();
    if (await githubLink.isVisible().catch(() => false)) {
      await githubLink.scrollIntoViewIfNeeded();
      await takeNamedScreenshot(page, '21_github_link');
    }
  });
});
```

---

### 2.4 Senaryo 3: Dev Mode (Iteratif Geliştirme)

`e2e-demo/03-dev-mode.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, typeSlowly, pause } from './helpers';

test.describe('Senaryo 3: Dev Mode — Iteratif Geliştirme', () => {
  
  test('Dev Mode başlat ve dosya değişikliği yap', async ({ page }) => {
    // Mevcut tamamlanmış bir pipeline'a git
    // Önce pipeline listesini kontrol et
    await page.goto('/dashboard/workflows');
    await pause(2000);
    await takeNamedScreenshot(page, '30_workflows_for_dev');
    
    // İlk tamamlanmış workflow'a tıkla
    const completedWorkflow = page.locator('text=Completed').or(page.locator('text=Tamamlandı')).first();
    if (await completedWorkflow.isVisible().catch(() => false)) {
      await completedWorkflow.click();
      await pause(2000);
    } else {
      // Doğrudan bir workflow detail sayfasına git
      // Backend'den completed pipeline ID'sini al
      const response = await page.request.get('/api/pipeline');
      const data = await response.json();
      const pipelines = data.pipelines || data;
      const completed = pipelines.find((p: any) => 
        p.status === 'completed' || p.status === 'completed_partial'
      );
      
      if (completed) {
        await page.goto(`/dashboard/workflows/${completed.id}`);
        await pause(2000);
      }
    }
    
    await takeNamedScreenshot(page, '31_workflow_detail');
    
    // ═══ Dev Tab'a Tıkla ═══
    // Dev Mode tab'ı veya butonu bul
    const devTab = page.locator('[data-tab="dev"]')
      .or(page.locator('button:has-text("Dev")'))
      .or(page.locator('[title*="Dev"]'))
      .first();
    
    if (await devTab.isVisible().catch(() => false)) {
      await devTab.click();
      await pause(1500);
    }
    
    await takeNamedScreenshot(page, '32_dev_tab_active');
    
    // ═══ "Geliştirmeye Devam Et" Butonuna Tıkla ═══
    const startDevBtn = page.locator('button:has-text("Geliştirmeye Devam")')
      .or(page.locator('button:has-text("Dev Mode")'))
      .first();
    
    if (await startDevBtn.isVisible().catch(() => false)) {
      await startDevBtn.click();
      await pause(3000);
      await takeNamedScreenshot(page, '33_dev_session_started');
    }
    
    // ═══ Chat Mesajı Yaz ═══
    const chatInput = page.locator('input[placeholder*="geliştirmek"]')
      .or(page.locator('input[placeholder*="develop"]'))
      .or(page.locator('#dev-chat-panel input'))
      .or(page.locator('[class*="dev"] input[type="text"]'))
      .first();
    
    if (await chatInput.isVisible().catch(() => false)) {
      await typeSlowly(page, chatInput, 'Ana sayfaya bir karanlık mod (dark mode) toggle butonu ekle');
      await pause(1500);
      await takeNamedScreenshot(page, '34_dev_message_typed');
      
      // Gönder butonuna tıkla
      const sendBtn = page.locator('button:has-text("Gönder")')
        .or(page.locator('button:has-text("Send")'))
        .first();
      
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await pause(2000);
        await takeNamedScreenshot(page, '35_dev_message_sent');
        
        // Agent yanıtını bekle (max 2dk)
        for (let i = 0; i < 60; i++) {
          const hasResponse = await page.locator('text=Push to GitHub')
            .or(page.locator('text=dosya değişikliği'))
            .or(page.locator('[class*="file-change"]'))
            .first().isVisible().catch(() => false);
          if (hasResponse) break;
          await pause(2000);
        }
        
        await pause(2000);
        await takeNamedScreenshot(page, '36_dev_agent_response');
        
        // Push butonunu göster (tıklama — opsiyonel)
        const pushBtn = page.locator('button:has-text("Push to GitHub")').first();
        if (await pushBtn.isVisible().catch(() => false)) {
          await pushBtn.scrollIntoViewIfNeeded();
          await takeNamedScreenshot(page, '37_push_button_visible');
          
          // Push'a tıkla
          await pushBtn.click();
          await pause(3000);
          await takeNamedScreenshot(page, '38_push_completed');
        }
      }
    }
  });
});
```

---

### 2.5 Senaryo 4: Ajan Doğrulama Zinciri (Tez Teması)

`e2e-demo/04-verification-chain.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, pause, scrollToElement } from './helpers';

test.describe('Senaryo 4: Ajan Doğrulama Zinciri', () => {
  
  test('Agents sayfası ve doğrulama zincirini göster', async ({ page }) => {
    // ═══ Agents Sayfası ═══
    await page.goto('/dashboard/agents');
    await pause(2000);
    await takeNamedScreenshot(page, '40_agents_overview');
    await takeFullPageScreenshot(page, '40_agents_overview');
    
    // 3 ajan kartını göster
    // Scribe kartı
    const scribeCard = page.locator('text=Scribe').first();
    if (await scribeCard.isVisible().catch(() => false)) {
      await scribeCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '41_scribe_agent_card');
    }
    
    // Proto kartı
    const protoCard = page.locator('text=Proto').first();
    if (await protoCard.isVisible().catch(() => false)) {
      await protoCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '42_proto_agent_card');
    }
    
    // Trace kartı
    const traceCard = page.locator('text=Trace').first();
    if (await traceCard.isVisible().catch(() => false)) {
      await traceCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '43_trace_agent_card');
    }
    
    // ═══ Tamamlanmış Workflow Detayı ═══
    // Doğrulama zincirini görmek için completed workflow'a git
    await page.goto('/dashboard/workflows');
    await pause(1500);
    
    // İlk completed workflow'a tıkla
    const completedRow = page.locator('[class*="workflow"]').or(page.locator('tr, [class*="row"]')).filter({ hasText: /[Cc]ompleted|Tamamlandı/ }).first();
    
    if (await completedRow.isVisible().catch(() => false)) {
      await completedRow.click();
      await pause(2000);
    }
    
    // Stage timeline'ı göster
    await takeNamedScreenshot(page, '44_stage_timeline');
    
    // Scribe stage'ini expand et (confidence göster)
    const scribeStage = page.locator('text=Scribe').first();
    if (await scribeStage.isVisible().catch(() => false)) {
      await scribeStage.click();
      await pause(1500);
      await takeNamedScreenshot(page, '45_scribe_confidence');
    }
    
    // Human Gate'i göster
    const humanGate = page.locator('text=Human').or(page.locator('text=Onay')).first();
    if (await humanGate.isVisible().catch(() => false)) {
      await humanGate.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '46_human_gate_approved');
    }
    
    // Proto stage'ini göster (dosya listesi, branch)
    const protoStage = page.locator('text=Proto').first();
    if (await protoStage.isVisible().catch(() => false)) {
      await protoStage.click();
      await pause(1500);
      await takeNamedScreenshot(page, '47_proto_output');
    }
    
    // Trace stage'ini göster (test sayısı)
    const traceStage = page.locator('text=Trace').first();
    if (await traceStage.isVisible().catch(() => false)) {
      await traceStage.click();
      await pause(1500);
      await takeNamedScreenshot(page, '48_trace_output');
    }
    
    // Tam sayfa final screenshot
    await takeFullPageScreenshot(page, '49_verification_chain_complete');
  });
});
```

---

## ADIM 3 — SERVİSLERİ BAŞLAT VE ÇALIŞTIR

### 3.1 Backend + Frontend Başlat

```bash
# Portları temizle
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# DB
docker ps | grep postgres || docker compose -f docker-compose.dev.yml up -d 2>/dev/null
sleep 3

# Backend
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5
curl -sf http://localhost:3000/health && echo "✓ Backend" || echo "✗ Backend failed"

# Frontend
cd ../frontend
nohup npm run dev > /tmp/akis-frontend.log 2>&1 &
sleep 3
echo "✓ Frontend"
```

### 3.2 Demo Testlerini Çalıştır

```bash
# Tüm demo testlerini sırayla çalıştır
npx playwright test --config=playwright.demo.config.ts --reporter=list

# Veya tek tek:
# Senaryo 1: Dashboard
npx playwright test --config=playwright.demo.config.ts e2e-demo/01-dashboard-overview.spec.ts

# Senaryo 2: Tam Pipeline (EN UZUN — 5-10dk)
npx playwright test --config=playwright.demo.config.ts e2e-demo/02-full-pipeline.spec.ts

# Senaryo 3: Dev Mode
npx playwright test --config=playwright.demo.config.ts e2e-demo/03-dev-mode.spec.ts

# Senaryo 4: Doğrulama Zinciri
npx playwright test --config=playwright.demo.config.ts e2e-demo/04-verification-chain.spec.ts
```

### 3.3 Çıktıları Kontrol Et

```bash
# Videoları listele
echo "=== DEMO VİDEOLAR ==="
find demo-videos -name "*.webm" -type f | sort
echo ""

# Screenshot'ları listele
echo "=== DEMO SCREENSHOT'LAR ==="
ls -la demo-screenshots/*.png | sort
echo ""

# Dosya boyutlarını göster
echo "=== BOYUTLAR ==="
du -sh demo-videos/ demo-screenshots/
```

---

## ADIM 4 — VİDEO POST-PROCESSING (Opsiyonel)

### 4.1 WebM → MP4 Dönüştürme

```bash
# ffmpeg yüklü mü kontrol et
which ffmpeg || brew install ffmpeg

# Tüm webm'leri mp4'e dönüştür
for f in demo-videos/**/*.webm; do
  output="${f%.webm}.mp4"
  ffmpeg -i "$f" -c:v libx264 -preset slow -crf 22 "$output" -y
  echo "✓ $output"
done
```

### 4.2 Videoları Birleştir (Tek Demo Video)

```bash
# Dosya listesi oluştur
find demo-videos -name "*.mp4" | sort > /tmp/video-list.txt

# Concat format
while read f; do echo "file '$f'"; done < /tmp/video-list.txt > /tmp/concat-list.txt

# Birleştir
ffmpeg -f concat -safe 0 -i /tmp/concat-list.txt -c copy demo-videos/AKIS_Full_Demo.mp4 -y
echo "✓ Full demo video: demo-videos/AKIS_Full_Demo.mp4"
```

---

## ADIM 5 — DOĞRULAMA

### 5.1 Kontrol Listesi

```
Screenshot'lar (en az):
✓/✗  01_dashboard_overview.png
✓/✗  02_workflows_list.png
✓/✗  03_agents_page.png
✓/✗  10_new_workflow_form.png
✓/✗  11_idea_written.png
✓/✗  14_scribe_completed_spec.png
✓/✗  16_before_approve.png
✓/✗  19_pipeline_completed.png
✓/✗  33_dev_session_started.png
✓/✗  36_dev_agent_response.png
✓/✗  37_push_button_visible.png
✓/✗  40_agents_overview.png

Videolar (en az):
✓/✗  Senaryo 1 — Dashboard tour
✓/✗  Senaryo 2 — Tam pipeline
✓/✗  Senaryo 3 — Dev Mode
✓/✗  Senaryo 4 — Doğrulama zinciri
```

### 5.2 Locator Adaptasyonu

**ÖNEMLİ:** Frontend bileşenlerinin gerçek class adları ve data-testid'leri bu plandaki tahminlerden farklı olabilir. Testleri çalıştırmadan ÖNCE:

1. `http://localhost:5173/dashboard` aç
2. DevTools → Elements ile gerçek DOM yapısını incele
3. Buton ve input selector'larını gerçek DOM'a göre güncelle

Her test dosyasındaki locator'lar (.locator(), .getByText() vs.) MUTLAKA gerçek UI'a göre uyarlanmalıdır. Plan, muhtemel locator'ları verir; gerçek DOM'a sen uyarla.

---

## GENEL KURALLAR

- .env dosyalarına ASLA dokunma
- Testler sıralı çalışsın (workers: 1)
- Her test kendi bağımsız durumunda çalışabilmeli
- Locator bulunamazsa test skip etsin, crash etmesin (try/catch kullan)
- Video kayıt süresini minimize et — gereksiz bekleme koyma
- Screenshot isimleri sıralı ve açıklayıcı olsun (tez raporuna eklenmek üzere)
- Hata çıkarsa düzelt ve tekrar çalıştır
