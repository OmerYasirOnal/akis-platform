import { useState, useMemo, type FormEvent } from 'react';
import { cn } from '../../utils/cn';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (repoName: string, displayName: string, visibility: 'public' | 'private') => void;
  loading?: boolean;
}

/* ── Türkçe → ASCII repo slug ────────────────────── */

const TR_CHAR_MAP: Record<string, string> = {
  'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S',
  'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
  'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
};

function toRepoSlug(input: string): string {
  return input
    .trim()
    .split('')
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function NewConversationModal({ open, onClose, onCreate, loading }: NewConversationModalProps) {
  const [projectName, setProjectName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const repoSlug = useMemo(() => toRepoSlug(projectName), [projectName]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!repoSlug) return;
    onCreate(repoSlug, projectName.trim(), visibility);
    setProjectName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-ak-border bg-ak-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ak-text-primary">Yeni Sohbet</h2>
        <p className="mt-1 text-xs text-ak-text-tertiary">
          Projenize bir isim verin. AKIS bu isimle bir GitHub deposu oluşturacak.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="mb-1.5 block text-xs font-medium text-ak-text-secondary">
              Proje Adı
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Todo Uygulaması"
              autoFocus
              className={cn(
                'w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary',
                'placeholder:text-ak-text-tertiary',
                'focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30',
              )}
            />
            {/* Auto-generated repo slug */}
            {repoSlug && (
              <p className="mt-1.5 text-[11px] text-ak-text-tertiary">
                GitHub deposu: <span className="rounded bg-ak-surface-2 px-1.5 py-0.5 font-mono text-ak-text-secondary">{repoSlug}</span>
              </p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ak-text-secondary">Görünürlük</span>
            <div className="flex gap-2">
              {(['private', 'public'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    visibility === v
                      ? 'border-ak-primary bg-ak-primary/10 text-ak-primary'
                      : 'border-ak-border text-ak-text-secondary hover:border-ak-primary/50',
                  )}
                >
                  {v === 'private' ? '🔒 Private' : '🌐 Public'}
                </button>
              ))}
            </div>
            {visibility === 'private' && (
              <p className="mt-2 text-[10px] text-yellow-400/80">
                Private repo. GitHub Actions aylık 2000 dk limiti var. Testler bir kez çalıştırılacak.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-ak-border px-4 py-2.5 text-sm font-medium text-ak-text-secondary hover:text-ak-text-primary transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!repoSlug || loading}
              className={cn(
                'flex-1 rounded-lg bg-ak-primary px-4 py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary)]',
                'hover:brightness-110 active:brightness-95 transition-all duration-150',
                (!repoSlug || loading) && 'cursor-not-allowed opacity-50',
              )}
            >
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
