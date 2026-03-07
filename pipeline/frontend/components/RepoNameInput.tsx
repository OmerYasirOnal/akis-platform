import { useState } from 'react';

interface Props {
  defaultName?: string;
  onSubmit: (repoName: string, visibility: 'public' | 'private') => void;
  disabled?: boolean;
}

export function RepoNameInput({ defaultName = '', onSubmit, disabled }: Props) {
  const [repoName, setRepoName] = useState(defaultName);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const isValid = /^[a-zA-Z0-9._-]+$/.test(repoName) && repoName.length > 0;

  return (
    <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-5">
      <h3 className="text-sm font-medium text-ak-text-primary mb-4">Proje Ayarları</h3>

      <div className="space-y-4">
        {/* Repo Name */}
        <div>
          <label className="block text-xs text-ak-text-secondary mb-1.5">Repository Adı</label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '-'))}
            placeholder="my-project"
            className="w-full bg-ak-surface border border-ak-border rounded-xl px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:outline-none focus:border-ak-primary/40 font-mono"
          />
          {repoName && !isValid && (
            <p className="text-xs text-ak-danger mt-1">Sadece harf, rakam, nokta, tire ve alt tire kullanılabilir.</p>
          )}
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs text-ak-text-secondary mb-1.5">Görünürlük</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 px-4 py-2.5 text-sm rounded-xl border transition-colors ${
                visibility === 'private'
                  ? 'border-ak-primary/40 bg-ak-primary/10 text-ak-primary'
                  : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:border-ak-text-secondary/30'
              }`}
            >
              Private
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex-1 px-4 py-2.5 text-sm rounded-xl border transition-colors ${
                visibility === 'public'
                  ? 'border-ak-primary/40 bg-ak-primary/10 text-ak-primary'
                  : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:border-ak-text-secondary/30'
              }`}
            >
              Public
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => onSubmit(repoName, visibility)}
          disabled={disabled || !isValid}
          className="w-full px-5 py-2.5 text-sm rounded-xl bg-ak-primary text-ak-bg font-medium hover:bg-ak-primary/90 shadow-ak-glow-sm disabled:opacity-50 transition-all"
        >
          Onayla ve Oluştur
        </button>
      </div>
    </div>
  );
}
