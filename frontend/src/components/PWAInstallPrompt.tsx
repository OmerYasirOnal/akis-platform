import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm"
      style={{
        backgroundColor: 'var(--ak-surface, #1f2937)',
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: '340px',
        width: 'calc(100% - 32px)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ak-text-primary">AKIS'i yukle</div>
        <div className="text-xs text-ak-text-tertiary">Ana ekrana ekle</div>
      </div>
      <button
        onClick={async () => {
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') setDeferredPrompt(null);
          else setDismissed(true);
        }}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
        style={{ backgroundColor: 'var(--ak-primary, #07D1AF)' }}
      >
        Yukle
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-ak-text-tertiary hover:text-ak-text-secondary text-lg leading-none"
      >
        &times;
      </button>
    </div>
  );
}
