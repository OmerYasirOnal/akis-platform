import { useState } from 'react';
import { cn } from '../../../utils/cn';

interface StepPreferencesProps {
  currentLocale: string;
  onComplete: (locale: string) => void;
}

export function StepPreferences({ currentLocale, onComplete }: StepPreferencesProps) {
  const [locale, setLocale] = useState(currentLocale || 'tr');

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ak-text-primary">Tercihler</h2>
        <p className="text-xs text-ak-text-tertiary mt-1">Deneyiminizi özelleştirin</p>
      </div>

      {/* Language selector */}
      <div>
        <label className="block text-xs font-medium text-ak-text-secondary mb-2">Dil</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLocale('tr')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-sm font-medium transition-all',
              locale === 'tr'
                ? 'border-ak-primary/40 bg-ak-primary/5 text-ak-primary'
                : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2',
            )}
          >
            <span className="text-lg">🇹🇷</span> Türkçe
          </button>
          <button
            onClick={() => setLocale('en')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-sm font-medium transition-all',
              locale === 'en'
                ? 'border-ak-primary/40 bg-ak-primary/5 text-ak-primary'
                : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2',
            )}
          >
            <span className="text-lg">🇬🇧</span> English
          </button>
        </div>
      </div>

      {/* Complete button */}
      <button
        onClick={() => onComplete(locale)}
        className={cn(
          'w-full rounded-xl bg-ak-primary py-3 text-sm font-semibold text-[color:var(--ak-on-primary)]',
          'hover:brightness-110 active:brightness-95 transition-all shadow-ak-glow mt-4',
        )}
      >
        Kurulumu Tamamla
      </button>
    </div>
  );
}
