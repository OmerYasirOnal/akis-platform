# AKIS — FLOATING ACTIVITY TOAST

.env dosyalarına ASLA dokunma.

---

## TEK İŞ

Mevcut SSE activity stream'i chat'in içine gömülü göstermek yerine, ekranın üst ortasında **şeffaf, havada yüzen, animasyonlu bir toast** olarak göster.

---

## TASARIM

```
            ┌─────────────────────────────────────────┐
            │  ◉ Scribe · Kabul kriterleri yazılıyor   │  ← şeffaf arka plan
            │  ████████████░░░░░  72%                  │  ← ince progress bar
            └─────────────────────────────────────────┘
                        ↑ ekranın üst ortası, fixed
```

**Görsel özellikler:**
- `position: fixed`, `top: 20px`, ortalanmış
- `backdrop-filter: blur(12px)` — arkası bulanık cam efekti (glassmorphism)
- `background: rgba(255,255,255,0.75)` light theme / `rgba(15,15,15,0.75)` dark
- `border: 1px solid rgba(0,0,0,0.08)`
- `border-radius: 16px`
- `box-shadow: 0 8px 32px rgba(0,0,0,0.08)`
- `padding: 12px 20px`
- `z-index: 9999`
- `min-width: 320px`, `max-width: 480px`
- Giriş animasyonu: yukarıdan kayarak gelir (`translateY(-20px) → 0`, `opacity: 0 → 1`, 300ms ease-out)
- Çıkış animasyonu: yukarı kayarak kaybolur (300ms)
- Agent renkleri: Scribe mavi dot, Proto amber dot, Trace mor dot

**İçerik:**
- Sol: Renkli dot (agent rengi) + pulse animasyonu
- Orta: Agent adı + "·" + aktif adım mesajı (tek satır, taşarsa truncate)
- Alt: İnce progress bar (agent rengi, animasyonlu)
- Pipeline idle/completed iken: toast GIZLI (render edilmez)

**Davranış:**
- Pipeline running iken görünür
- Her yeni SSE activity'de mesaj güncellenir (fade transition ile)
- Stage değişince agent rengi değişir (smooth color transition)
- Pipeline completed/failed olunca 2 saniye "✓ Tamamlandı" gösterip kaybolur
- Kullanıcı tıklayınca workflow detail'e git (eğer başka sayfadaysa)
- Küçük ✕ butonu ile manuel kapatılabilir

---

## ADIM 0 — OKU

```bash
cat frontend/src/hooks/usePipelineStream.ts
cat frontend/src/components/workflow/WorkflowChatView.tsx | head -80
cat frontend/src/pages/dashboard/WorkflowDetailPage.tsx | head -50
cat frontend/src/components/layout/DashboardLayout.tsx
```

---

## ADIM 1 — FloatingActivityToast bileşeni

`frontend/src/components/pipeline/FloatingActivityToast.tsx` oluştur:

```typescript
import { useState, useEffect, useRef } from 'react';

interface FloatingActivityToastProps {
  activity: {
    stage: 'scribe' | 'proto' | 'trace';
    message: string;
    progress?: number;
    step?: string;
  } | null;
  isActive: boolean;
  pipelineStatus?: string;
  onClickNavigate?: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  scribe: '#3b82f6',  // blue-500
  proto: '#f59e0b',   // amber-500
  trace: '#8b5cf6',   // violet-500
};

const AGENT_LABELS: Record<string, string> = {
  scribe: 'Scribe',
  proto: 'Proto',
  trace: 'Trace',
};

export function FloatingActivityToast({ activity, isActive, pipelineStatus, onClickNavigate }: FloatingActivityToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Göster/gizle mantığı
  useEffect(() => {
    if (isActive && activity && !dismissed) {
      setVisible(true);
      setExiting(false);
    } else if (!isActive && visible) {
      // Pipeline bitti — 2sn sonra kaybolsun
      timeoutRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 300);
      }, 2000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isActive, activity, dismissed]);

  // Pipeline değişince dismissed reset
  useEffect(() => {
    setDismissed(false);
  }, [pipelineStatus]);

  if (!visible) return null;

  const color = activity ? AGENT_COLORS[activity.stage] || '#10b981' : '#10b981';
  const label = activity ? AGENT_LABELS[activity.stage] || activity.stage : '';
  const message = activity?.message || (pipelineStatus === 'completed' ? '✓ Pipeline tamamlandı' : 'Çalışıyor...');
  const progress = activity?.progress || 0;
  const isComplete = activity?.step === 'complete' || activity?.step === 'pipeline_complete';

  return (
    <div
      onClick={onClickNavigate}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: `translateX(-50%) translateY(${exiting ? '-20px' : '0'})`,
        opacity: exiting ? 0 : 1,
        transition: 'all 0.3s ease-out',
        zIndex: 9999,
        minWidth: 320,
        maxWidth: 480,
        padding: '12px 20px',
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        cursor: onClickNavigate ? 'pointer' : 'default',
        // Giriş animasyonu CSS ile handle edilir
        animation: !exiting ? 'floatIn 0.3s ease-out' : undefined,
      }}
    >
      {/* Dismiss butonu */}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); setExiting(true); setTimeout(() => setVisible(false), 300); }}
        style={{
          position: 'absolute', top: 6, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, opacity: 0.3, lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Üst satır: agent dot + isim + mesaj */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Pulse dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}60`,
          animation: isComplete ? 'none' : 'pulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }} />

        {/* Agent adı */}
        <span style={{ fontWeight: 600, fontSize: 13, color: color, flexShrink: 0 }}>
          {label}
        </span>

        <span style={{ opacity: 0.3, fontSize: 13 }}>·</span>

        {/* Mesaj */}
        <span style={{
          fontSize: 13, color: '#374151', opacity: 0.85,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1,
        }}>
          {isComplete ? '✓ Tamamlandı' : message}
        </span>
      </div>

      {/* Progress bar */}
      {progress > 0 && !isComplete && (
        <div style={{
          marginTop: 8, height: 3, borderRadius: 2,
          background: 'rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            width: `${Math.min(progress, 100)}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      )}

      {/* CSS animation keyframes — inline */}
      <style>{`
        @keyframes floatIn {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
```

---

## ADIM 2 — DashboardLayout'a entegre et

Toast'u layout seviyesine ekle ki tüm sayfalarda görünsün:

```bash
cat frontend/src/components/layout/DashboardLayout.tsx
```

```typescript
// DashboardLayout'a ekle:
import { FloatingActivityToast } from '../pipeline/FloatingActivityToast';
import { usePipelineStream } from '../../hooks/usePipelineStream';

// Layout içinde — aktif running pipeline'ı bul
// (Bu bilgi OverviewPage'den veya global state'ten gelebilir)
// Basit yaklaşım: son running pipeline'ı poll et

const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

// Her 5sn'de running pipeline var mı kontrol et
useEffect(() => {
  const check = async () => {
    try {
      const resp = await fetch('/api/pipelines');
      const data = await resp.json();
      const pipelines = data.pipelines || data || [];
      const running = pipelines.find((p: any) => 
        ['scribe_clarifying', 'scribe_generating', 'proto_building', 'trace_testing', 'awaiting_approval'].includes(p.status)
      );
      setActivePipelineId(running?.id || null);
    } catch {}
  };
  check();
  const interval = setInterval(check, 5000);
  return () => clearInterval(interval);
}, []);

const { activities, currentStep, isConnected, progressByStage } = usePipelineStream(
  activePipelineId,
  !!activePipelineId
);

const currentActivity = currentStep ? {
  stage: currentStep.stage as 'scribe' | 'proto' | 'trace',
  message: currentStep.message,
  progress: progressByStage?.[currentStep.stage] || currentStep.progress,
  step: currentStep.step,
} : null;

// Render'da, Outlet'in ÜSTÜNDE:
<FloatingActivityToast
  activity={currentActivity}
  isActive={!!activePipelineId}
  pipelineStatus={activePipelineId ? 'running' : undefined}
  onClickNavigate={activePipelineId ? () => navigate(`/dashboard/workflows/${activePipelineId}`) : undefined}
/>
```

**ÖNEMLİ:** `usePipelineStream` hook'u zaten mevcut. Eğer hook farklı bir API'ye sahipse, mevcut API'ye göre adapt et.

---

## ADIM 3 — WorkflowChatView'daki SSE gösterimini düzelt

Chat view'da da SSE activity'leri gösteriliyor. İki yerde aynı bilgiyi göstermeye gerek yok.

**Kural:** FloatingActivityToast = kısa özet (tüm sayfalarda). Chat view'daki detaylı activity log = sadece workflow detail'da, detaylı.

Chat view'daki SSE gösterimi KALSIN ama toast ile çakışmasın. Toast tek satır özet, chat view detaylı log.

---

## ADIM 4 — BUILD VE TEST

```bash
cd frontend && npx tsc --noEmit && npm run build
```

Test:
1. Running pipeline varken toast ekranın üst ortasında görünüyor mu?
2. Şeffaf glassmorphism efekti var mı?
3. Agent rengi doğru mu? (Scribe mavi, Proto amber, Trace mor)
4. Progress bar ilerliyor mu?
5. Pipeline tamamlandığında "✓ Tamamlandı" gösterip kayboluyor mu?
6. ✕ ile kapatılabiliyor mu?
7. Toast'a tıklayınca workflow detail'e gidiyor mu?
8. Dashboard, Workflows, Agents, Settings sayfalarında da görünüyor mu?
9. Workflow detail'da hem toast hem chat activity log birlikte düzgün çalışıyor mu?

```
## Toast Report
- Glassmorphism render: ✓/✗
- Agent color + pulse: ✓/✗
- Progress bar: ✓/✗
- Entry/exit animation: ✓/✗
- Dismiss button: ✓/✗
- Click to navigate: ✓/✗
- Auto-hide on complete: ✓/✗
- Build: ✓/✗
```
