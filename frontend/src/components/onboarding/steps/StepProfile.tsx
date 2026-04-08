import { useState } from 'react';
import { cn } from '../../../utils/cn';

interface StepProfileProps {
  initialName: string;
  onSave: (name: string) => Promise<void>;
}

export function StepProfile({ initialName, onSave }: StepProfileProps) {
  const parts = initialName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(parts[0] || '');
  const [lastName, setLastName] = useState(parts.slice(1).join(' ') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const valid = firstName.trim().length >= 2;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(fullName);
    } catch {
      setError('Profil kaydedilemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ak-text-primary">Profil Bilgileri</h2>
        <p className="text-xs text-ak-text-tertiary mt-1">Kendinizi tanıtın</p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ak-primary/20 text-xl font-bold text-ak-primary">
          {firstName[0]?.toUpperCase() ?? '?'}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-ak-text-secondary mb-1.5">Ad *</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Ad"
            autoFocus
            className={cn(
              'w-full rounded-xl border border-ak-border bg-ak-surface-2 px-3.5 py-2.5 text-sm text-ak-text-primary',
              'placeholder:text-ak-text-tertiary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30',
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ak-text-secondary mb-1.5">Soyad</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Soyad"
            className={cn(
              'w-full rounded-xl border border-ak-border bg-ak-surface-2 px-3.5 py-2.5 text-sm text-ak-text-primary',
              'placeholder:text-ak-text-tertiary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30',
            )}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!valid || saving}
        className={cn(
          'w-full rounded-xl bg-ak-primary py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary)]',
          'hover:brightness-110 active:brightness-95 transition-all',
          (!valid || saving) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam'}
      </button>
    </div>
  );
}
