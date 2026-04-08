import { useState } from 'react';
import { cn } from '../../utils/cn';

interface ProfileSetupBannerProps {
  missingSteps: string[];
  onSetup: () => void;
}

const stepLabels: Record<string, string> = {
  profile: 'Profil',
  github: 'GitHub',
  'ai-provider': 'AI Sağlayıcı',
};

export function ProfileSetupBanner({ missingSteps, onSetup }: ProfileSetupBannerProps) {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem('akis-profile-banner-dismissed') === 'true',
  );

  if (dismissed || missingSteps.length === 0) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('akis-profile-banner-dismissed', 'true');
    setDismissed(true);
  };

  const labels = missingSteps.map(s => stepLabels[s] ?? s).join(', ');

  return (
    <div className={cn(
      'flex items-center gap-3 border-b border-ak-primary/20 bg-ak-primary/5 px-4 py-2.5',
      'animate-slide-in-right',
    )}>
      <svg className="h-4 w-4 flex-shrink-0 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <p className="flex-1 text-xs text-ak-text-secondary">
        Profilinizi tamamlayın: <span className="font-medium text-ak-primary">{labels}</span>
      </p>
      <button
        onClick={onSetup}
        className="rounded-lg bg-ak-primary/10 px-3 py-1 text-[11px] font-medium text-ak-primary hover:bg-ak-primary/20 transition-colors"
      >
        Tamamla
      </button>
      <button
        onClick={handleDismiss}
        className="text-ak-text-tertiary hover:text-ak-text-secondary transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
